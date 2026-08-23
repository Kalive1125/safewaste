const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const residuosController = require('../controllers/residuosController');
const documentosController = require('../controllers/documentosController');
const auditoriaController = require('../controllers/auditoriaController');
const relatoriosController = require('../controllers/relatoriosController');
const configController = require('../controllers/configController');
const empresaController = require('../controllers/empresaController');
const govbrController = require('../controllers/govbrController');

// Garantir que as pastas de upload existam
const uploadDocsDir = path.join(__dirname, '..', 'uploads', 'documents');
const uploadComprovantesDir = path.join(__dirname, '..', 'uploads', 'comprovantes');
const uploadDestinacaoDir = path.join(__dirname, '..', 'uploads', 'destinacao');
if (!fs.existsSync(uploadDocsDir)) fs.mkdirSync(uploadDocsDir, { recursive: true });
if (!fs.existsSync(uploadComprovantesDir)) fs.mkdirSync(uploadComprovantesDir, { recursive: true });
if (!fs.existsSync(uploadDestinacaoDir)) fs.mkdirSync(uploadDestinacaoDir, { recursive: true });

// Validador estrito de PDF
const pdfFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.pdf' || (file.mimetype && file.mimetype !== 'application/pdf' && file.mimetype !== 'application/x-pdf')) {
    return cb(new Error('Formato de arquivo incompatível. Apenas arquivos PDF (.pdf) são permitidos para conformidade legal.'), false);
  }
  cb(null, true);
};

// Storage para Documentos Gerais (PGRSS, Alvará, LAO, etc)
const storageDocs = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDocsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `doc-${uniqueSuffix}.pdf`);
  }
});

// Storage para Comprovantes de Coleta
const storageComprovantes = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadComprovantesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `comprovante-${uniqueSuffix}.pdf`);
  }
});

const uploadDocs = multer({
  storage: storageDocs,
  fileFilter: pdfFilter,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB max
});

const uploadComprovante = multer({
  storage: storageComprovantes,
  fileFilter: pdfFilter,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB max
});

const handleUploadError = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ sucesso: false, erro: 'O arquivo PDF excede o limite máximo permitido de 15MB.' });
      }
      return res.status(400).json({ sucesso: false, erro: `Erro no upload: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ sucesso: false, erro: err.message });
    }
    next();
  });
};

// --- ROTAS DE AUTENTICAÇÃO GOV.BR & CONFIABILIDADES V3 ---
router.post('/auth/govbr/login', govbrController.loginGovBr);
router.get('/auth/govbr/confiabilidades/:cpf', govbrController.obterConfiabilidades);
router.get('/auth/govbr/categorias/:cpf', govbrController.obterCategorias);
router.get('/auth/govbr/niveis/:cpf', govbrController.obterNiveis);
router.get('/auth/govbr/validar-vinculo-mtr', govbrController.validarVinculoMTR);

// --- ROTAS DE CONFIGURAÇÃO & METADADOS DO SISTEMA ---
router.get('/config/metadados', configController.obterMetadados);

// --- ROTAS DE EMPRESAS & CADASTROS ---
router.get('/empresas', empresaController.obterEmpresas);
router.get('/empresas/perfil/:tipo', empresaController.obterPerfil);
router.put('/empresas/:id', empresaController.atualizarPerfil);

// --- ROTAS DE RESÍDUOS, RASTREABILIDADE & DESTINAÇÃO FINAL ---
router.post('/residuos/gerar', residuosController.registrarGeracao);
router.get('/residuos', residuosController.listarTodos);
router.get('/residuos/:mtrCodigo/rastreio', residuosController.buscarRastreio);
router.post('/residuos/:mtrCodigo/coletar', handleUploadError(uploadComprovante.single('comprovantePdf')), residuosController.registrarColeta);
router.patch('/residuos/:mtrCodigo/avancar', residuosController.avancarEtapa);
router.get('/residuos/:mtrCodigo/comprovante', residuosController.downloadComprovante);
router.get('/residuos/:mtrCodigo/termo-validacao', residuosController.downloadTermoValidacao);

// --- ROTAS DE DOCUMENTOS E CONFORMIDADE ---
router.get('/documentos', documentosController.listarDocumentos);
router.get('/documentos/situacao', documentosController.verificarSituacaoDocumental);
router.post('/documentos/upload', handleUploadError(uploadDocs.single('arquivoPdf')), documentosController.uploadDocumento);
router.get('/documentos/:id/download', documentosController.downloadDocumento);
router.delete('/documentos/:id', documentosController.excluirDocumento);

// --- ROTAS DE RELATÓRIOS E ESTATÍSTICAS ---
router.get('/relatorios/mensal', relatoriosController.obterEstatisticasMensais);

// --- ROTAS DE AUDITORIA (LOG DE AÇÕES) ---
router.get('/auditoria/logs', auditoriaController.listarLogs);

module.exports = router;