const Empresa = require('../models/Empresa');
const auditoriaController = require('./auditoriaController');

exports.obterEmpresas = async (req, res) => {
  try {
    const empresas = await Empresa.findAll({
      where: { ativo: true }
    });
    return res.json({ sucesso: true, data: empresas });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};

exports.obterPerfil = async (req, res) => {
  try {
    const { tipo } = req.params; // 'geradora' (ou 'clinica') ou 'coletora'
    const tipoNormalizado = (tipo === 'clinica' || tipo === 'geradora') ? 'geradora' : 'coletora';

    let empresa = await Empresa.findOne({
      where: { tipo: tipoNormalizado, ativo: true }
    });

    if (!empresa) {
      return res.status(404).json({ sucesso: false, erro: `Empresa do tipo ${tipoNormalizado} não encontrada.` });
    }

    return res.json({ sucesso: true, data: empresa });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};

exports.atualizarPerfil = async (req, res) => {
  try {
    const { id } = req.params;
    const { razaoSocial, nomeFantasia, cnpj, responsavelTecnicoNome, responsavelTecnicoCpf, responsavelTecnicoRegistro, telefone, email, endereco } = req.body;

    const empresa = await Empresa.findByPk(id);
    if (!empresa) {
      return res.status(404).json({ sucesso: false, erro: 'Empresa não encontrada.' });
    }

    if (razaoSocial) empresa.razaoSocial = razaoSocial;
    if (nomeFantasia) empresa.nomeFantasia = nomeFantasia;
    if (cnpj) empresa.cnpj = cnpj;
    if (responsavelTecnicoNome) empresa.responsavelTecnicoNome = responsavelTecnicoNome;
    if (responsavelTecnicoCpf) empresa.responsavelTecnicoCpf = responsavelTecnicoCpf;
    if (responsavelTecnicoRegistro) empresa.responsavelTecnicoRegistro = responsavelTecnicoRegistro;
    if (telefone) empresa.telefone = telefone;
    if (email) empresa.email = email;
    if (endereco) empresa.endereco = endereco;

    await empresa.save();

    await auditoriaController.registrarAcao(
      `Atualização Cadastral: ${empresa.nomeFantasia}`,
      empresa.responsavelTecnicoNome || 'Administrador',
      empresa.tipo === 'geradora' ? 'clinica' : 'coletora',
      { empresaId: empresa.id, cnpj: empresa.cnpj }
    );

    return res.json({ sucesso: true, mensagem: 'Dados da empresa atualizados com sucesso.', data: empresa });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};
