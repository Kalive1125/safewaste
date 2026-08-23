const express = require('express');
const router = express.Router();
const residuosController = require('../controllers/residuosController');

router.get('/', residuosController.listarTodos);
router.post('/gerar', residuosController.registrarGeracao);
router.get('/:mtrCodigo/rastreio', residuosController.buscarRastreio);

module.exports = router;
