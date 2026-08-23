const AuditLog = require('../models/AuditLog');
const crypto = require('crypto');

exports.registrarAcao = async (acao, autor, perfil, detalhes) => {
  try {
    const timestamp = new Date().toISOString();
    const payload = `${acao}-${autor}-${perfil}-${timestamp}-${JSON.stringify(detalhes || {})}`;
    const hashImutabilidade = crypto.createHash('sha256').update(payload).digest('hex');

    const log = await AuditLog.create({
      acao,
      autor,
      perfil: perfil || 'sistema',
      detalhes: typeof detalhes === 'string' ? detalhes : JSON.stringify(detalhes),
      hashImutabilidade
    });
    return log;
  } catch (error) {
    console.error('Erro ao registrar log de auditoria:', error);
    return null;
  }
};

exports.listarLogs = async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      order: [['created_at', 'DESC']],
      limit: 100
    });
    return res.json({ sucesso: true, data: logs });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};
