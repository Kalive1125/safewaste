const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Cada linha aqui representa um "carimbo" no percurso do resíduo,
// igual aos eventos de um rastreio de encomenda (Mercado Livre, Correios etc).
const StatusResiduo = sequelize.define('StatusResiduo', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  etapa: {
    type: DataTypes.INTEGER, // 1 a 5, ver ETAPAS em residuosController.js
    allowNull: false
  },
  observacao: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = StatusResiduo;
