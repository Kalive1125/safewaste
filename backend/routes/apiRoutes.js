const express = require('express');
const router = express.Router();
const residuosController = require('../controllers/residuosController');

// Rotas de Rastreabilidade de Resíduos
router.post('/residuos/gerar', residuosController.registrarGeracao);
router.get('/residuos', residuosController.listarTodos);
router.get('/residuos/:mtrCodigo/rastreio', residuosController.buscarRastreio);
router.patch('/residuos/:mtrCodigo/avancar', residuosController.avancarEtapa);
router.get('/mtr/status/:mtrCodigo', residuosController.simularIntegracaoMTR);

module.exports = router;