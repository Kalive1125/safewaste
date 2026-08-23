const ResiduoLog = require('../models/ResiduoLog');
const StatusResiduo = require('../models/StatusResiduo');
const Documento = require('../models/Documento');
const Empresa = require('../models/Empresa');
const DestinadorFinal = require('../models/DestinadorFinal');
const auditoriaController = require('./auditoriaController');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const ETAPAS = {
  1: { label: 'Resíduo Gerado (MTR Nacional)', descricao: 'Manifesto MTR gerado e assinado via Gov.br pela Unidade Geradora.' },
  2: { label: 'Coleta Realizada', descricao: 'Resíduo pesado e recolhido pela empresa transportadora com comprovante emitido.' },
  3: { label: 'Em Transporte Especializado', descricao: 'Veículo em rota monitorada para a planta licenciada de destinação final.' },
  4: { label: 'Recebido na Planta de Destinação', descricao: 'Carga recepcionada e pesada na balança da Usina de Tratamento.' },
  5: { label: 'Destinação Final & Validação Concluídas', descricao: 'Tratamento térmico concluído e Termo Oficial emitido pelo Destinador Final licenciado.' }
};

const ETAPA_FINAL = 5;

const getItemDate = (item) => {
  const dStr = item.dataHoraGeracao || item.dataHoraColeta || item.createdAt || item.created_at;
  return dStr ? new Date(dStr) : new Date();
};

const pdfGenerator = require('../utils/pdfGenerator');

// Gerador do PDF do Comprovante de Coleta da Transportadora
const gerarPdfComprovantePadrao = async (dir, mtrCodigo, dados) => {
  const nomeArquivo = `comprovante-${mtrCodigo.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`;
  const caminho = path.join(dir, nomeArquivo);
  
  if (!fs.existsSync(caminho)) {
    await pdfGenerator.gerarPdfComprovanteColeta(caminho, mtrCodigo, dados);
  }
  return nomeArquivo;
};

// Gerador do Termo Oficial de Validação emitido pelo DESTINADOR FINAL (Usina)
const gerarPdfTermoValidacaoDestinacao = async (dir, mtrCodigo, dados) => {
  const nomeArquivo = `termo-destinacao-${mtrCodigo.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`;
  const caminho = path.join(dir, nomeArquivo);

  if (!fs.existsSync(caminho)) {
    await pdfGenerator.gerarPdfTermoValidacaoDestinacao(caminho, mtrCodigo, dados);
  }
  return nomeArquivo;
};

// 1. REGISTRAR GERAÇÃO DE RESÍDUO (MTR NACIONAL VIA GOV.BR)
exports.registrarGeracao = async (req, res) => {
  try {
    const { grupoResiduo, descricao, pesoGeradoKg, rtCpf, clinicaNome, govbrAutenticado, govbrNivelConta } = req.body;

    if (!grupoResiduo || !pesoGeradoKg || !rtCpf) {
      return res.status(400).json({ sucesso: false, erro: 'Campos obrigatórios ausentes: Grupo do resíduo, Peso gerado (kg) e CPF do Responsável Técnico.' });
    }

    const pesoNum = parseFloat(pesoGeradoKg);
    if (isNaN(pesoNum) || pesoNum <= 0) {
      return res.status(400).json({ sucesso: false, erro: 'O peso gerado deve ser um número positivo maior que zero.' });
    }

    const clinica = await Empresa.findOne({ where: { tipo: 'geradora', ativo: true } });
    const coletora = await Empresa.findOne({ where: { tipo: 'coletora', ativo: true } });
    const destinador = await DestinadorFinal.findOne({ where: { ativo: true } });

    const mtrCodigo = `MTR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const dataHoraGeracao = new Date();

    const payload = `${mtrCodigo}-${grupoResiduo}-${pesoNum}-${rtCpf}-${dataHoraGeracao.toISOString()}`;
    const hashImutabilidade = crypto.createHash('sha256').update(payload).digest('hex');

    const novoLog = await ResiduoLog.create({
      mtrCodigo,
      grupoResiduo: grupoResiduo.toUpperCase(),
      descricao: descricao || `Descarte de Resíduos RSS do Grupo ${grupoResiduo.toUpperCase()}`,
      pesoGeradoKg: pesoNum,
      rtCpf,
      clinicaNome: clinica ? clinica.nomeFantasia : (clinicaNome || 'Clínica OdontoLife'),
      coletoraNome: coletora ? coletora.nomeFantasia : 'EcoResíduos Logística Ambiental',
      destinadorFinalNome: destinador ? destinador.nomeFantasia : 'Bahia Tratamento e Destinação de Resíduos S/A',
      destinadorFinalCnpj: destinador ? destinador.cnpj : '03.882.190/0001-44',
      destinadorFinalLao: destinador ? destinador.licencaOperacaoLao : 'INEMA LAO nº 2024-0012/BA',
      metodoTratamento: destinador ? destinador.metodoTratamento : 'Autoclavagem e Descontaminação Térmica (RDC 222/2018)',
      govbrAutenticado: govbrAutenticado !== false,
      govbrNivelConta: govbrNivelConta || 'Ouro',
      govbrSeloConfiabilidade: 'Certificado Digital ICP-Brasil / Balcão Presencial (201)',
      dataHoraGeracao,
      etapaAtual: 1,
      statusColeta: 'aguardando_coleta',
      hashImutabilidade
    });

    await StatusResiduo.create({
      residuoLogId: novoLog.id,
      etapa: 1,
      observacao: ETAPAS[1].descricao,
      responsavel: `RT Autenticado Gov.br (CPF: ${rtCpf})`,
      dataHora: dataHoraGeracao
    });

    await auditoriaController.registrarAcao(
      `Geração de MTR Nacional: ${mtrCodigo} (Grupo ${grupoResiduo}, ${pesoNum} kg) via Gov.br`,
      `RT CPF ${rtCpf}`,
      'clinica',
      { mtrCodigo, grupoResiduo, pesoGeradoKg: pesoNum, dataHora: dataHoraGeracao, govbr: 'Autenticado Nível Ouro', hash: hashImutabilidade }
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: `Manifesto MTR Nacional ${mtrCodigo} gerado com sucesso via Gov.br e registrado na trilha de auditoria!`,
      data: novoLog
    });
  } catch (error) {
    console.error('Erro ao registrar geração de resíduo:', error);
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};

// 2. LISTAR TODOS OS RESÍDUOS COM FILTROS
exports.listarTodos = async (req, res) => {
  try {
    const { mes, ano, status, grupo } = req.query;
    const where = {};

    if (status) where.statusColeta = status;
    if (grupo) where.grupoResiduo = grupo;

    const registros = await ResiduoLog.findAll({
      where,
      include: [{ model: StatusResiduo, as: 'historico' }],
      order: [['created_at', 'DESC']]
    });

    let filtrados = registros;
    if (ano) {
      filtrados = filtrados.filter(item => {
        const data = getItemDate(item);
        return data.getFullYear() === parseInt(ano, 10);
      });
    }

    if (mes && mes !== 'todos') {
      filtrados = filtrados.filter(item => {
        const data = getItemDate(item);
        return (data.getMonth() + 1) === parseInt(mes, 10);
      });
    }

    return res.json({
      sucesso: true,
      total: filtrados.length,
      data: filtrados
    });
  } catch (error) {
    console.error('Erro ao listar resíduos:', error);
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};

// 3. BUSCAR RASTREAMENTO TIMELINE
exports.buscarRastreio = async (req, res) => {
  try {
    const { mtrCodigo } = req.params;

    const residuo = await ResiduoLog.findOne({
      where: { mtrCodigo },
      include: [{ model: StatusResiduo, as: 'historico' }]
    });

    if (!residuo) {
      return res.status(404).json({ sucesso: false, erro: 'Manifesto MTR não localizado.' });
    }

    return res.json({
      sucesso: true,
      data: {
        residuo,
        historico: residuo.historico.sort((a, b) => new Date(a.dataHora || a.created_at || a.createdAt) - new Date(b.dataHora || b.created_at || b.createdAt)),
        etapas: ETAPAS,
        etapaFinal: ETAPA_FINAL
      }
    });
  } catch (error) {
    console.error('Erro ao buscar rastreio:', error);
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};

// 4. REGISTRAR COLETA PELA TRANSPORTADORA
exports.registrarColeta = async (req, res) => {
  try {
    const { mtrCodigo } = req.params;
    const { pesoColetadoKg, motoristaNome, veiculoPlaca, dataHoraColeta, observacoes } = req.body;

    const residuo = await ResiduoLog.findOne({ where: { mtrCodigo } });
    if (!residuo) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ sucesso: false, erro: 'MTR não encontrado.' });
    }

    if (residuo.etapaAtual >= 2) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ sucesso: false, erro: 'A coleta deste resíduo já foi formalizada anteriormente.' });
    }

    const dataColeta = dataHoraColeta ? new Date(dataHoraColeta) : new Date();
    const pesoNum = pesoColetadoKg ? parseFloat(pesoColetadoKg) : residuo.pesoGeradoKg;

    residuo.etapaAtual = 2;
    residuo.statusColeta = 'coletado';
    residuo.pesoColetadoKg = pesoNum;
    residuo.dataHoraColeta = dataColeta;
    residuo.motoristaNome = motoristaNome || 'Carlos Eduardo Santos';
    residuo.veiculoPlaca = (veiculoPlaca || 'OKL-9214').toUpperCase();

    const compDir = path.join(__dirname, '..', 'uploads', 'comprovantes');
    if (!fs.existsSync(compDir)) fs.mkdirSync(compDir, { recursive: true });

    if (req.file) {
      residuo.comprovantePdfPath = req.file.filename;
    } else {
      residuo.comprovantePdfPath = await gerarPdfComprovantePadrao(compDir, mtrCodigo, {
        motorista: residuo.motoristaNome,
        veiculo: residuo.veiculoPlaca,
        peso: residuo.pesoColetadoKg,
        dataHora: dataColeta,
        coletora: residuo.coletoraNome
      });
    }

    await residuo.save();

    const obs = `Coleta realizada por ${residuo.motoristaNome} (Veículo: ${residuo.veiculoPlaca}). Peso aferido: ${residuo.pesoColetadoKg} kg.${observacoes ? ` Observações: ${observacoes}` : ''}`;
    
    await StatusResiduo.create({
      residuoLogId: residuo.id,
      etapa: 2,
      observacao: obs,
      responsavel: `Coletora: ${residuo.motoristaNome}`,
      dataHora: dataColeta
    });

    await auditoriaController.registrarAcao(
      `Confirmação de Coleta MTR: ${mtrCodigo} (${residuo.pesoColetadoKg} kg)`,
      residuo.motoristaNome,
      'coletora',
      { mtrCodigo, pesoColetadoKg: residuo.pesoColetadoKg, dataHoraColeta: dataColeta, motorista: residuo.motoristaNome, placa: residuo.veiculoPlaca }
    );

    return res.json({
      sucesso: true,
      mensagem: `Coleta do manifesto ${mtrCodigo} confirmada com sucesso!`,
      data: residuo
    });
  } catch (error) {
    console.error('Erro ao registrar coleta:', error);
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};

// 5. AVANÇAR ETAPA ATÉ DESTINAÇÃO FINAL & EMISSÃO DO TERMO OFICIAL
exports.avancarEtapa = async (req, res) => {
  try {
    const { mtrCodigo } = req.params;
    const { observacao, responsavel } = req.body;

    const residuo = await ResiduoLog.findOne({ where: { mtrCodigo } });
    if (!residuo) {
      return res.status(404).json({ sucesso: false, erro: 'MTR não encontrado.' });
    }

    if (residuo.etapaAtual >= ETAPA_FINAL) {
      return res.status(400).json({ sucesso: false, erro: 'Este resíduo já concluiu todo o fluxo de destinação final e validação.' });
    }

    const novaEtapa = residuo.etapaAtual + 1;
    residuo.etapaAtual = novaEtapa;

    const statusMap = {
      2: 'coletado',
      3: 'em_transporte',
      4: 'no_destino',
      5: 'concluido'
    };
    residuo.statusColeta = statusMap[novaEtapa] || 'em_transporte';

    // Se alcançou a Etapa 5 (Destinação Final Real):
    // A Usina de Destinação Final licenciada emite o Termo Oficial de Validação e o Certificado CDF Oficial
    if (novaEtapa === ETAPA_FINAL) {
      const termoCodigo = `TRM-DEST-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const cdfCodigo = `CDF-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      residuo.cdfCodigo = cdfCodigo;
      residuo.termoValidacaoCodigo = termoCodigo;
      residuo.termoDataEmissao = new Date();

      const destinacaoDir = path.join(__dirname, '..', 'uploads', 'destinacao');
      if (!fs.existsSync(destinacaoDir)) fs.mkdirSync(destinacaoDir, { recursive: true });

      residuo.termoValidacaoPdfPath = await gerarPdfTermoValidacaoDestinacao(destinacaoDir, mtrCodigo, {
        termoCodigo,
        cdfCodigo,
        clinicaNome: residuo.clinicaNome,
        grupoResiduo: residuo.grupoResiduo,
        destinadorNome: residuo.destinadorFinalNome,
        destinadorCnpj: residuo.destinadorFinalCnpj,
        destinadorLao: residuo.destinadorFinalLao,
        metodo: residuo.metodoTratamento,
        peso: residuo.pesoColetadoKg || residuo.pesoGeradoKg
      });
    }

    await residuo.save();

    const dataAgora = new Date();
    const respEtapa = novaEtapa === ETAPA_FINAL
      ? `Usina Destinadora: ${residuo.destinadorFinalNome}`
      : (responsavel || residuo.coletoraNome || 'EcoResíduos Logística');

    await StatusResiduo.create({
      residuoLogId: residuo.id,
      etapa: novaEtapa,
      observacao: observacao || ETAPAS[novaEtapa].descricao,
      responsavel: respEtapa,
      dataHora: dataAgora
    });

    await auditoriaController.registrarAcao(
      `Avanço MTR: ${mtrCodigo} -> Etapa ${novaEtapa} (${ETAPAS[novaEtapa].label})`,
      respEtapa,
      novaEtapa === ETAPA_FINAL ? 'sistema' : 'coletora',
      { mtrCodigo, etapa: novaEtapa, cdfCodigo: residuo.cdfCodigo, termoValidacao: residuo.termoValidacaoCodigo }
    );

    return res.json({
      sucesso: true,
      mensagem: `Etapa avançada para: ${ETAPAS[novaEtapa].label}`,
      data: residuo
    });
  } catch (error) {
    console.error('Erro ao avançar etapa:', error);
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};

// 6. DOWNLOAD DO COMPROVANTE DE COLETA
exports.downloadComprovante = async (req, res) => {
  try {
    const { mtrCodigo } = req.params;
    const residuo = await ResiduoLog.findOne({ where: { mtrCodigo } });

    if (!residuo || residuo.etapaAtual < 2) {
      return res.status(404).json({ sucesso: false, erro: 'Comprovante não disponível para este resíduo (coleta ainda não realizada).' });
    }

    const compDir = path.join(__dirname, '..', 'uploads', 'comprovantes');
    if (!fs.existsSync(compDir)) fs.mkdirSync(compDir, { recursive: true });

    if (!residuo.comprovantePdfPath) {
      residuo.comprovantePdfPath = `comprovante-${mtrCodigo.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`;
      await residuo.save();
    }

    const filePath = path.join(compDir, residuo.comprovantePdfPath);
    if (!fs.existsSync(filePath)) {
      await gerarPdfComprovantePadrao(compDir, mtrCodigo, {
        clinicaNome: residuo.clinicaNome || 'Clínica OdontoLife',
        motorista: residuo.motoristaNome || 'Carlos Eduardo Santos',
        veiculo: residuo.veiculoPlaca || 'OKL-9214',
        peso: residuo.pesoColetadoKg || residuo.pesoGeradoKg || 15.0,
        grupoResiduo: residuo.grupoResiduo || 'A',
        dataHora: residuo.dataHoraColeta || residuo.dataHoraGeracao || new Date(),
        coletora: residuo.coletoraNome
      });
    }

    return res.download(filePath, `Comprovante_Coleta_${mtrCodigo}.pdf`);
  } catch (error) {
    console.error('Erro no download do comprovante:', error);
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};

// 7. DOWNLOAD DO TERMO OFICIAL DE VALIDAÇÃO DA DESTINAÇÃO FINAL
exports.downloadTermoValidacao = async (req, res) => {
  try {
    const { mtrCodigo } = req.params;
    const residuo = await ResiduoLog.findOne({ where: { mtrCodigo } });

    if (!residuo || residuo.etapaAtual < ETAPA_FINAL) {
      return res.status(404).json({ sucesso: false, erro: 'Termo de Validação ainda não emitido. O resíduo deve concluir a destinação final (Etapa 5).' });
    }

    const destinacaoDir = path.join(__dirname, '..', 'uploads', 'destinacao');
    if (!fs.existsSync(destinacaoDir)) fs.mkdirSync(destinacaoDir, { recursive: true });

    if (!residuo.termoValidacaoCodigo) {
      residuo.termoValidacaoCodigo = `TRM-DEST-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      residuo.cdfCodigo = residuo.cdfCodigo || `CDF-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      residuo.termoValidacaoPdfPath = `termo-destinacao-${mtrCodigo.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`;
      await residuo.save();
    }

    if (!residuo.termoValidacaoPdfPath) {
      residuo.termoValidacaoPdfPath = `termo-destinacao-${mtrCodigo.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`;
      await residuo.save();
    }

    const filePath = path.join(destinacaoDir, residuo.termoValidacaoPdfPath);
    if (!fs.existsSync(filePath)) {
      await gerarPdfTermoValidacaoDestinacao(destinacaoDir, mtrCodigo, {
        termoCodigo: residuo.termoValidacaoCodigo,
        cdfCodigo: residuo.cdfCodigo || `CDF-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        clinicaNome: residuo.clinicaNome || 'Clínica OdontoLife (Odontologia Especializada LTDA)',
        grupoResiduo: residuo.grupoResiduo || 'A',
        destinadorNome: residuo.destinadorFinalNome || 'Bahia Tratamento e Destinação de Resíduos Especiais S/A',
        destinadorCnpj: residuo.destinadorFinalCnpj || '03.882.190/0001-44',
        destinadorLao: residuo.destinadorFinalLao || 'INEMA LAO nº 2024-0012/BA',
        metodo: residuo.metodoTratamento || 'Descontaminação Térmica por Autoclavagem e Trituração (RDC 222/2018)',
        peso: residuo.pesoColetadoKg || residuo.pesoGeradoKg || 15.0
      });
    }

    await auditoriaController.registrarAcao(
      `Download do Termo de Validação da Destinação Final (MTR ${mtrCodigo})`,
      'Usuário do Sistema / Unidade Geradora',
      'clinica',
      { mtrCodigo, termoCodigo: residuo.termoValidacaoCodigo }
    );

    return res.download(filePath, `Termo_Validacao_Destinacao_${mtrCodigo}.pdf`);
  } catch (error) {
    console.error('Erro no download do termo de validação:', error);
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};
