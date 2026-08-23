const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sequelize = require('./config/database');
const apiRoutes = require('./routes/apiRoutes');

const ResiduoLog = require('./models/ResiduoLog');
const StatusResiduo = require('./models/StatusResiduo');
const Documento = require('./models/Documento');
const AuditLog = require('./models/AuditLog');
const Empresa = require('./models/Empresa');
const DestinadorFinal = require('./models/DestinadorFinal');
const Profissional = require('./models/Profissional');
const User = require('./models/User');
const ConfiguracaoSistema = require('./models/ConfiguracaoSistema');

// Relacionamentos
ResiduoLog.hasMany(StatusResiduo, { foreignKey: 'residuoLogId', as: 'historico', onDelete: 'CASCADE' });
StatusResiduo.belongsTo(ResiduoLog, { foreignKey: 'residuoLogId' });

require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos de upload estaticamente (somente leitura)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Servir frontend estático caso acesse diretamente a porta do backend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Rotas da API
app.use('/api/v1', apiRoutes);

// Middleware centralizado de tratamento de erros
app.use((err, req, res, next) => {
  console.error('[SafeWaste Error Handler]:', err.stack || err);
  res.status(err.status || 500).json({
    sucesso: false,
    erro: err.message || 'Ocorreu um erro interno no servidor.'
  });
});

const PORT = process.env.PORT || 3001;

const pdfGenerator = require('./utils/pdfGenerator');

// Seed de dados iniciais para demonstração realista e testes
const semearDadosIniciais = async () => {
  const docsDir = path.join(__dirname, 'uploads', 'documents');
  const compDir = path.join(__dirname, 'uploads', 'comprovantes');
  const destinacaoDir = path.join(__dirname, 'uploads', 'destinacao');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  if (!fs.existsSync(compDir)) fs.mkdirSync(compDir, { recursive: true });
  if (!fs.existsSync(destinacaoDir)) fs.mkdirSync(destinacaoDir, { recursive: true });

  // Gerar ou atualizar arquivos PDF de alta fidelidade regulatória
  await pdfGenerator.gerarPdfPGRSS(path.join(docsDir, 'pgrss-2026.pdf'));
  await pdfGenerator.gerarPdfAlvaraSanitario(path.join(docsDir, 'alvara-sanitario.pdf'));
  await pdfGenerator.gerarPdfLicencaAmbiental(path.join(docsDir, 'licenca-inema.pdf'));
  await pdfGenerator.gerarPdfContratoColeta(path.join(docsDir, 'contrato-coleta.pdf'));
  await pdfGenerator.gerarPdfComprovanteColeta(path.join(compDir, 'comprovante-01.pdf'), 'MTR-2026-7821', {
    clinicaNome: 'Clínica OdontoLife (Odontologia Especializada LTDA)',
    clinicaCnpj: '14.892.410/0001-83',
    coletoraNome: 'EcoResíduos Logística e Tratamento Ambiental S/A',
    motorista: 'Carlos Eduardo Santos',
    veiculo: 'OKL-9214',
    grupoResiduo: 'A',
    descricao: 'Resíduos Biológicos e Luvas Hospitalares',
    peso: 28.5,
    dataHora: new Date('2026-07-15T14:15:00')
  });
  await pdfGenerator.gerarPdfTermoValidacaoDestinacao(path.join(destinacaoDir, 'termo-destinacao-mtr-2026-7821.pdf'), 'MTR-2026-7821', {
    termoCodigo: 'TRM-DEST-2026-8812',
    cdfCodigo: 'CDF-2026-3391',
    clinicaNome: 'Clínica OdontoLife (Odontologia Especializada LTDA)',
    grupoResiduo: 'A',
    destinadorNome: 'Bahia Tratamento e Destinação de Resíduos Especiais S/A',
    destinadorCnpj: '03.882.190/0001-44',
    destinadorLao: 'INEMA LAO nº 2024-0012/BA',
    metodo: 'Descontaminação Térmica por Autoclavagem e Trituração (RDC 222/2018)',
    peso: 28.5
  });

  // 1. Semear Empresas (Geradora e Coletora)
  const totalEmpresas = await Empresa.count();
  if (totalEmpresas === 0) {
    await Empresa.bulkCreate([
      {
        tipo: 'geradora',
        razaoSocial: 'OdontoLife Odontologia Especializada LTDA',
        nomeFantasia: 'Clínica OdontoLife',
        cnpj: '14.892.410/0001-83',
        inscricaoEstadual: '128.940.112',
        cnae: '8630-5/04',
        endereco: 'Av. Tancredo Neves, 1200 - Ed. Empresarial Trade, Sala 804',
        cidade: 'Salvador',
        uf: 'BA',
        telefone: '(71) 3344-9020',
        email: 'contato@odontolife.com.br',
        responsavelTecnicoNome: 'Dra. Camila Silva',
        responsavelTecnicoCpf: '042.891.235-00',
        responsavelTecnicoRegistro: 'CRBM 19481/BA',
        ativo: true
      },
      {
        tipo: 'coletora',
        razaoSocial: 'EcoResíduos Logística e Tratamento Ambiental S/A',
        nomeFantasia: 'EcoResíduos Logística Ambiental',
        cnpj: '07.319.824/0001-55',
        inscricaoEstadual: '098.314.771',
        cnae: '3812-2/00',
        endereco: 'Rodovia CIA-Aeroporto, KM 4.5 - Polo Logístico',
        cidade: 'Simões Filho',
        uf: 'BA',
        telefone: '(71) 3622-7700',
        email: 'operacional@ecoresiduos.com.br',
        responsavelTecnicoNome: 'Carlos Eduardo Santos',
        responsavelTecnicoCpf: '719.442.180-22',
        responsavelTecnicoRegistro: 'CNH 04892189BA',
        ativo: true
      }
    ]);
  }

  // 2. Semear Destinador Final Licenciado
  const totalDestinadores = await DestinadorFinal.count();
  if (totalDestinadores === 0) {
    await DestinadorFinal.create({
      razaoSocial: 'Bahia Tratamento e Destinação de Resíduos Especiais S/A',
      nomeFantasia: 'Bahia Tratamento e Destinação de Resíduos S/A',
      cnpj: '03.882.190/0001-44',
      licencaOperacaoLao: 'INEMA LAO nº 2024-0012/BA',
      orgaoLicenciador: 'INEMA / Secretaria Estadual do Meio Ambiente',
      metodoTratamento: 'Descontaminação Térmica por Autoclavagem e Trituração (RDC 222/2018)',
      endereco: 'Polo Petroquímico de Camaçari, Via Axial, s/n',
      cidade: 'Camaçari',
      uf: 'BA',
      responsavelTecnicoNome: 'Eng. Roberto Vasconcelos',
      responsavelTecnicoRegistro: 'CRQ-VII 07201948',
      ativo: true
    });
  }

  // 3. Semear Documentos de Conformidade
  const totalDocs = await Documento.count();
  if (totalDocs === 0) {
    await Documento.bulkCreate([
      {
        nome: 'PGRSS OdontoLife 2026',
        tipo: 'PGRSS (Plano de Gerenciamento de Resíduos de Serviços de Saúde)',
        obrigatorio: true,
        dataEmissao: '2026-01-10',
        dataValidade: '2027-01-10',
        arquivoNomeOriginal: 'PGRSS_OdontoLife_2026_Assinado.pdf',
        arquivoPath: 'pgrss-2026.pdf',
        tamanhoBytes: 345000,
        status: 'valido'
      },
      {
        nome: 'Alvará Sanitário Municipal',
        tipo: 'Alvará Sanitário Vigente',
        obrigatorio: true,
        dataEmissao: '2025-10-01',
        dataValidade: '2026-10-01',
        arquivoNomeOriginal: 'Alvara_Sanitario_2026.pdf',
        arquivoPath: 'alvara-sanitario.pdf',
        tamanhoBytes: 210000,
        status: 'valido'
      },
      {
        nome: 'Licença Ambiental INEMA/LAO',
        tipo: 'Licença Ambiental de Operação (LAO)',
        obrigatorio: true,
        dataEmissao: '2025-08-15',
        dataValidade: '2026-09-15',
        arquivoNomeOriginal: 'LAO_INEMA_Certificado.pdf',
        arquivoPath: 'licenca-inema.pdf',
        tamanhoBytes: 520000,
        status: 'vencendo'
      },
      {
        nome: 'Contrato de Coleta EcoResíduos',
        tipo: 'Contrato de Prestação de Serviços de Coleta RSS',
        obrigatorio: true,
        dataEmissao: '2026-01-01',
        dataValidade: '2027-01-01',
        arquivoNomeOriginal: 'Contrato_EcoResiduos_2026.pdf',
        arquivoPath: 'contrato-coleta.pdf',
        tamanhoBytes: 680000,
        status: 'valido'
      }
    ]);

    await AuditLog.create({
      acao: 'Inicialização do Sistema e Carga Documental de Compliance',
      autor: 'Sistema SafeWaste',
      perfil: 'sistema',
      detalhes: 'Documentos obrigatórios de conformidade sanitária carregados.',
      hashImutabilidade: '3f78a2e1d09b67489431e5f8a0026e69cb4812a1490218b2bc394a11f26798e1'
    });
  }

  // 4. Semear Resíduos e Histórico com Termo de Destinação
  const totalResiduos = await ResiduoLog.count();
  if (totalResiduos === 0) {

    const res1 = await ResiduoLog.create({
      mtrCodigo: 'MTR-2026-7821',
      cdfCodigo: 'CDF-2026-3391',
      termoValidacaoCodigo: 'TRM-DEST-2026-8812',
      grupoResiduo: 'A',
      descricao: 'Resíduos Biológicos e Luvas Hospitalares',
      pesoGeradoKg: 28.5,
      pesoColetadoKg: 28.5,
      etapaAtual: 5,
      statusColeta: 'concluido',
      rtCpf: '042.891.235-00',
      clinicaNome: 'Clínica OdontoLife',
      coletoraNome: 'EcoResíduos Logística Ambiental',
      destinadorFinalNome: 'Bahia Tratamento e Destinação de Resíduos S/A',
      destinadorFinalCnpj: '03.882.190/0001-44',
      destinadorFinalLao: 'INEMA LAO nº 2024-0012/BA',
      metodoTratamento: 'Autoclavagem com Descontaminação Térmica (RDC 222/2018)',
      dataHoraGeracao: new Date('2026-07-15T09:30:00'),
      dataHoraColeta: new Date('2026-07-15T14:15:00'),
      termoDataEmissao: new Date('2026-07-16T11:00:00'),
      motoristaNome: 'Carlos Eduardo Santos',
      veiculoPlaca: 'OKL-9214',
      comprovantePdfPath: 'comprovante-01.pdf',
      termoValidacaoPdfPath: 'termo-destinacao-mtr-2026-7821.pdf',
      govbrAutenticado: true,
      govbrNivelConta: 'Ouro',
      govbrSeloConfiabilidade: 'Certificado Digital ICP-Brasil (301)',
      hashImutabilidade: '8b1a9953c4611296a827abf8c471286b03c20059e0a0a738d8f7cf5bb145b23a'
    });

    await StatusResiduo.create({
      residuoLogId: res1.id,
      etapa: 1,
      observacao: 'Manifesto MTR gerado e assinado digitalmente via Gov.br.',
      responsavel: 'Dra. Camila Silva (Gov.br Ouro)',
      dataHora: new Date('2026-07-15T09:30:00')
    });
    await StatusResiduo.create({
      residuoLogId: res1.id,
      etapa: 2,
      observacao: 'Coleta realizada por Carlos Eduardo Santos (Placa: OKL-9214). Peso: 28.5kg',
      responsavel: 'EcoResíduos Logística',
      dataHora: new Date('2026-07-15T14:15:00')
    });
    await StatusResiduo.create({
      residuoLogId: res1.id,
      etapa: 3,
      observacao: 'Transporte especializado para a Usina Bahia Tratamento RSS.',
      responsavel: 'EcoResíduos Logística',
      dataHora: new Date('2026-07-15T16:00:00')
    });
    await StatusResiduo.create({
      residuoLogId: res1.id,
      etapa: 4,
      observacao: 'Recebido na usina de tratamento e conferido peso na balança.',
      responsavel: 'Bahia Tratamento RSS',
      dataHora: new Date('2026-07-16T08:30:00')
    });
    await StatusResiduo.create({
      residuoLogId: res1.id,
      etapa: 5,
      observacao: 'Tratamento térmico finalizado e Termo Oficial emitido pelo Destinador Final licenciado.',
      responsavel: 'Bahia Tratamento RSS (RT CRQ-VII 07201948)',
      dataHora: new Date('2026-07-16T11:00:00')
    });
  }
};

sequelize.sync({ alter: true }).then(async () => {
  console.log('SafeWaste Database Conectado & Tabelas Sincronizadas.');
  await semearDadosIniciais();
  app.listen(PORT, () => {
    console.log(`Servidor SafeWaste Full-Stack rodando na porta ${PORT}`);
  });
}).catch(err => {
  console.error('Erro ao conectar com o Banco de Dados:', err);
});