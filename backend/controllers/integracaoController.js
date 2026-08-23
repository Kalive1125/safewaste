const ResiduoLog = require('../models/ResiduoLog');
const Documento = require('../models/Documento');

// Endpoint para integração com sistemas externos (ex: SINIR / INEMA / Vigilância Sanitária)
exports.exportarDadosSinir = async (req, res) => {
  try {
    const residuos = await ResiduoLog.findAll();
    const payloadSinir = residuos.map(r => ({
      numeroMTR: r.mtrCodigo,
      numeroCDF: r.cdfCodigo,
      classe: r.grupoResiduo,
      quantidadeKg: r.pesoColetadoKg || r.pesoGeradoKg,
      geradorCpfCnpj: r.rtCpf,
      transportador: r.coletoraNome,
      dataDestinacao: r.dataHoraColeta,
      situacao: r.statusColeta
    }));

    return res.json({
      sucesso: true,
      sistemaOrigem: 'SafeWaste Compliance RSS',
      padrao: 'SINIR/MTR Nacional - Portaria MMA 280/2020',
      totalRegistros: payloadSinir.length,
      data: payloadSinir
    });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};
