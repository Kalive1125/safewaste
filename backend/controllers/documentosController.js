const Documento = require('../models/Documento');
const ConfiguracaoSistema = require('../models/ConfiguracaoSistema');
const auditoriaController = require('./auditoriaController');
const path = require('path');
const fs = require('fs');

const DOCUMENTOS_OBRIGATORIOS_EXIGIDOS = [
  'PGRSS (Plano de Gerenciamento de Resíduos de Serviços de Saúde)',
  'Alvará Sanitário Vigente',
  'Licença Ambiental de Operação (LAO)',
  'Contrato de Prestação de Serviços de Coleta RSS'
];

const calcularStatusDocumento = (dataValidade) => {
  if (!dataValidade) return 'valido';
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const validade = new Date(dataValidade);
  validade.setHours(0, 0, 0, 0);

  const diffTempo = validade.getTime() - hoje.getTime();
  const diffDias = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

  if (diffDias < 0) return 'vencido';
  if (diffDias <= 30) return 'vencendo';
  return 'valido';
};

exports.listarDocumentos = async (req, res) => {
  try {
    const docs = await Documento.findAll({
      order: [['created_at', 'DESC']]
    });

    const docsAtualizados = await Promise.all(docs.map(async (doc) => {
      const statusCalculado = calcularStatusDocumento(doc.dataValidade);
      if (doc.status !== statusCalculado) {
        doc.status = statusCalculado;
        await doc.save();
      }
      return doc;
    }));

    return res.json({ sucesso: true, data: docsAtualizados });
  } catch (error) {
    console.error('Erro ao listar documentos:', error);
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};

exports.verificarSituacaoDocumental = async (req, res) => {
  try {
    const docs = await Documento.findAll();
    
    // Obter lista de exigências
    let listaObrigatorios = DOCUMENTOS_OBRIGATORIOS_EXIGIDOS;
    const confDocs = await ConfiguracaoSistema.findOne({ where: { chave: 'DOCUMENTOS_OBRIGATORIOS' } });
    if (confDocs && confDocs.valor) {
      try {
        const parsed = JSON.parse(confDocs.valor);
        const obrigatorios = parsed.filter(d => d.obrigatorio).map(d => d.tipo);
        if (obrigatorios.length > 0) listaObrigatorios = obrigatorios;
      } catch (e) {}
    }

    const docsValidos = docs.filter(d => {
      const status = calcularStatusDocumento(d.dataValidade);
      return status !== 'vencido';
    });

    const tiposCadastrados = docsValidos.map(d => d.tipo);

    const pendencias = [];
    listaObrigatorios.forEach(tipoObrigatorio => {
      const existe = tiposCadastrados.some(t => 
        t.toLowerCase() === tipoObrigatorio.toLowerCase() || 
        tipoObrigatorio.toLowerCase().includes(t.toLowerCase()) ||
        t.toLowerCase().includes(tipoObrigatorio.toLowerCase())
      );
      if (!existe) {
        pendencias.push(tipoObrigatorio);
      }
    });

    const vencimentosProximos = docs.filter(d => calcularStatusDocumento(d.dataValidade) === 'vencendo');
    const vencidos = docs.filter(d => calcularStatusDocumento(d.dataValidade) === 'vencido');

    const regular = pendencias.length === 0 && vencidos.length === 0;

    return res.json({
      sucesso: true,
      data: {
        regular,
        statusGeral: regular ? 'REGULAR' : (pendencias.length > 0 ? 'PENDÊNCIA OBRIGATÓRIA' : 'ATENÇÃO (VENCIDO)'),
        totalCadastrados: docs.length,
        totalObrigatoriosExigidos: listaObrigatorios.length,
        totalObrigatoriosValidos: listaObrigatorios.length - pendencias.length,
        pendencias,
        vencimentosProximos,
        vencidos,
        bloqueiaColeta: !regular
      }
    });
  } catch (error) {
    console.error('Erro ao verificar situação documental:', error);
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};

exports.uploadDocumento = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ sucesso: false, erro: 'Nenhum arquivo PDF foi enviado. O anexo é obrigatório.' });
    }

    const { nome, tipo, obrigatorio, dataEmissao, dataValidade, clinicaNome } = req.body;

    if (!nome || !tipo || !dataEmissao) {
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ sucesso: false, erro: 'Preencha todos os campos obrigatórios: Nome do documento, Tipo e Data de Emissão.' });
    }

    // Validação de datas
    if (dataValidade && new Date(dataValidade) < new Date(dataEmissao)) {
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ sucesso: false, erro: 'A data de validade não pode ser anterior à data de emissão do documento.' });
    }

    const status = calcularStatusDocumento(dataValidade);

    const doc = await Documento.create({
      nome,
      tipo,
      obrigatorio: obrigatorio === 'true' || obrigatorio === true,
      dataEmissao,
      dataValidade: dataValidade || null,
      arquivoNomeOriginal: req.file.originalname,
      arquivoPath: req.file.filename,
      tamanhoBytes: req.file.size,
      clinicaNome: clinicaNome || 'Clínica OdontoLife',
      status
    });

    await auditoriaController.registrarAcao(
      `Upload de Documento: ${nome} (${tipo})`,
      'Responsável Técnico / Clínica',
      'clinica',
      { documentoId: doc.id, arquivo: req.file.originalname, validade: dataValidade }
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Documento PDF anexado com sucesso e registrado na trilha de auditoria!',
      data: doc
    });
  } catch (error) {
    console.error('Erro no upload de documento:', error);
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};

exports.downloadDocumento = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Documento.findByPk(id);

    if (!doc) {
      return res.status(404).json({ sucesso: false, erro: 'Documento não encontrado.' });
    }

    const filePath = path.join(__dirname, '..', 'uploads', 'documents', doc.arquivoPath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ sucesso: false, erro: 'Arquivo físico do documento não encontrado no servidor.' });
    }

    await auditoriaController.registrarAcao(
      `Download de Documento: ${doc.nome}`,
      'Usuário do Sistema',
      'clinica',
      { documentoId: doc.id, arquivo: doc.arquivoNomeOriginal }
    );

    return res.download(filePath, doc.arquivoNomeOriginal);
  } catch (error) {
    console.error('Erro no download do documento:', error);
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};

exports.excluirDocumento = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Documento.findByPk(id);

    if (!doc) {
      return res.status(404).json({ sucesso: false, erro: 'Documento não encontrado.' });
    }

    const filePath = path.join(__dirname, '..', 'uploads', 'documents', doc.arquivoPath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    const nomeDoc = doc.nome;
    await doc.destroy();

    await auditoriaController.registrarAcao(
      `Exclusão de Documento: ${nomeDoc}`,
      'Responsável Técnico / Clínica',
      'clinica',
      { documentoId: id }
    );

    return res.json({ sucesso: true, mensagem: 'Documento excluído com sucesso.' });
  } catch (error) {
    console.error('Erro na exclusão do documento:', error);
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};
