const User = require('../models/User');
const Empresa = require('../models/Empresa');
const auditoriaController = require('./auditoriaController');

exports.loginMock = async (req, res) => {
  try {
    const { email, perfil } = req.body;
    const user = await User.findOne({ where: { perfil: perfil || 'clinica', ativo: true } });
    
    return res.json({
      sucesso: true,
      mensagem: 'Autenticação realizada com sucesso.',
      token: 'jwt-mock-safewaste-compliance-token',
      usuario: user || {
        nome: perfil === 'coletora' ? 'Operador Coleta' : 'Responsável Técnico',
        perfil: perfil || 'clinica'
      }
    });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};
