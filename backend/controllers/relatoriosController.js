const ResiduoLog = require('../models/ResiduoLog');
const Documento = require('../models/Documento');
const auditoriaController = require('./auditoriaController');

const getItemDate = (item) => {
  const dStr = item.dataHoraGeracao || item.dataHoraColeta || item.createdAt || item.created_at;
  return dStr ? new Date(dStr) : new Date();
};

exports.obterEstatisticasMensais = async (req, res) => {
  try {
    const { mes, ano } = req.query;
    const anoRef = ano ? parseInt(ano, 10) : new Date().getFullYear();
    const mesRef = mes && mes !== 'todos' ? parseInt(mes, 10) : null;

    const todosResiduos = await ResiduoLog.findAll();
    const todosDocumentos = await Documento.findAll();

    // Filtra resíduos do ano
    const residuosAno = todosResiduos.filter(r => {
      const d = getItemDate(r);
      return d.getFullYear() === anoRef;
    });

    // Filtra pelo mês se especificado
    const residuosFiltrados = mesRef
      ? residuosAno.filter(r => (getItemDate(r).getMonth() + 1) === mesRef)
      : residuosAno;

    // Métricas de Resíduos
    let totalPesoGeradoKg = 0;
    let totalPesoColetadoKg = 0;
    const pesoPorGrupo = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    let coletasRealizadas = 0;
    let coletasPendentes = 0;

    residuosFiltrados.forEach(r => {
      const pesoG = parseFloat(r.pesoGeradoKg || 0);
      const pesoC = parseFloat(r.pesoColetadoKg || 0);
      totalPesoGeradoKg += pesoG;
      totalPesoColetadoKg += pesoC;

      if (pesoPorGrupo[r.grupoResiduo] !== undefined) {
        pesoPorGrupo[r.grupoResiduo] += pesoG;
      }

      if (r.etapaAtual >= 2) {
        coletasRealizadas++;
      } else {
        coletasPendentes++;
      }
    });

    // Histórico mensal do ano para o Gráfico (Jan a Dez)
    const mesesGrafico = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    const historicoMensal = mesesGrafico.map((nomeMes, idx) => {
      const numMes = idx + 1;
      const itensDoMes = residuosAno.filter(r => (getItemDate(r).getMonth() + 1) === numMes);
      const totalKg = itensDoMes.reduce((acc, curr) => acc + parseFloat(curr.pesoGeradoKg || 0), 0);
      const totalColetas = itensDoMes.filter(r => r.etapaAtual >= 2).length;
      return {
        mes: nomeMes,
        mesNum: numMes,
        pesoKg: Number(totalKg.toFixed(1)),
        coletas: totalColetas
      };
    });

    // Métricas de Documentos
    const docsValidos = todosDocumentos.filter(d => d.status === 'valido').length;
    const docsVencendo = todosDocumentos.filter(d => d.status === 'vencendo').length;
    const docsVencidos = todosDocumentos.filter(d => d.status === 'vencido').length;

    return res.json({
      sucesso: true,
      data: {
        periodo: {
          ano: anoRef,
          mes: mesRef ? mesRef : 'Todos os meses'
        },
        resumo: {
          totalPesoGeradoKg: Number(totalPesoGeradoKg.toFixed(2)),
          totalPesoColetadoKg: Number(totalPesoColetadoKg.toFixed(2)),
          totalRegistros: residuosFiltrados.length,
          coletasRealizadas,
          coletasPendentes,
          pesoPorGrupo
        },
        documentos: {
          total: todosDocumentos.length,
          validos: docsValidos,
          vencendo: docsVencendo,
          vencidos: docsVencidos,
          conformidadePercent: todosDocumentos.length > 0 
            ? Math.round((docsValidos / todosDocumentos.length) * 100)
            : 0
        },
        historicoMensal,
        detalhesResiduos: residuosFiltrados
      }
    });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};
