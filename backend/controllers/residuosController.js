const ResiduoLog = require('../models/ResiduoLog');
const StatusResiduo = require('../models/StatusResiduo');
const crypto = require('crypto');

// Etapas do percurso do resíduo, da geração até o descarte final.
// A ideia é a mesma de um rastreio de encomenda: cada resíduo avança
// nessa lista, um passo de cada vez, e cada avanço fica registrado.
const ETAPAS = {
  1: { label: 'Resíduo Gerado', descricao: 'Registrado pela clínica geradora.' },
  2: { label: 'Coletado', descricao: 'Retirado da clínica pela empresa coletora.' },
  3: { label: 'Em Transporte', descricao: 'A caminho do destino final.' },
  4: { label: 'Recebido no Destino', descricao: 'Chegou à unidade de tratamento/destinação.' },
  5: { label: 'Descarte Concluído', descricao: 'Tratamento finalizado e CDF emitido.' }
};
const ETAPA_FINAL = Object.keys(ETAPAS).length;

exports.registrarGeracao = async (req, res) => {
  try {
    const { grupoResiduo, descricao, pesoGeradoKg, rtCpf } = req.body;
    const mtrCodigo = `MTR-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // Geração de Hash para Imutabilidade (Audit Trail)
    const payload = `${mtrCodigo}-${grupoResiduo}-${pesoGeradoKg}-${rtCpf}-${Date.now()}`;
    const hashImutabilidade = crypto.createHash('sha256').update(payload).digest('hex');

    const novoLog = await ResiduoLog.create({
      mtrCodigo,
      grupoResiduo,
      descricao: descricao || null,
      pesoGeradoKg,
      rtCpf,
      etapaAtual: 1,
      hashImutabilidade
    });

    // Primeiro evento do rastreio já nasce junto com o registro
    await StatusResiduo.create({
      residuoLogId: novoLog.id,
      etapa: 1,
      observacao: ETAPAS[1].descricao
    });

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Resíduo gerado e registrado no Audit Log com sucesso.',
      data: novoLog
    });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};

exports.listarTodos = async (req, res) => {
  try {
    const registros = await ResiduoLog.findAll({ order: [['created_at', 'DESC']] });
    return res.json({ sucesso: true, data: registros });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};

exports.buscarRastreio = async (req, res) => {
  try {
    const { mtrCodigo } = req.params;

    const residuo = await ResiduoLog.findOne({ where: { mtrCodigo } });
    if (!residuo) {
      return res.status(404).json({ sucesso: false, erro: 'MTR não encontrado.' });
    }

    const historico = await StatusResiduo.findAll({
      where: { residuoLogId: residuo.id },
      order: [['created_at', 'ASC']]
    });

    return res.json({
      sucesso: true,
      data: { residuo, historico, etapas: ETAPAS, etapaFinal: ETAPA_FINAL }
    });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};

exports.avancarEtapa = async (req, res) => {
  try {
    const { mtrCodigo } = req.params;
    const { observacao } = req.body;

    const residuo = await ResiduoLog.findOne({ where: { mtrCodigo } });
    if (!residuo) {
      return res.status(404).json({ sucesso: false, erro: 'MTR não encontrado.' });
    }

    if (residuo.etapaAtual >= ETAPA_FINAL) {
      return res.status(400).json({ sucesso: false, erro: 'Este resíduo já concluiu todo o percurso.' });
    }

    const novaEtapa = residuo.etapaAtual + 1;
    residuo.etapaAtual = novaEtapa;

    // Ao concluir o percurso, emite o CDF (Certificado de Destinação Final)
    if (novaEtapa === ETAPA_FINAL) {
      residuo.cdfCodigo = `CDF-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    await residuo.save();

    await StatusResiduo.create({
      residuoLogId: residuo.id,
      etapa: novaEtapa,
      observacao: observacao || ETAPAS[novaEtapa].descricao
    });

    return res.json({ sucesso: true, data: residuo });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};

exports.simularIntegracaoMTR = async (req, res) => {
  const { mtrCodigo } = req.params;
  return res.json({
    sucesso: true,
    mtrCodigo,
    statusSINIR: 'SINCRONIZADO',
    orgaoAmbiental: 'INEMA/SINIR',
    timestamp: new Date().toISOString()
  });
};
