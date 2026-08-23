const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StatusResiduo = sequelize.define('StatusResiduo', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  etapa: {
    type: DataTypes.INTEGER, // 1 a 5
    allowNull: false
  },
  observacao: {
    type: DataTypes.STRING,
    allowNull: true
  },
  responsavel: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dataHora: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = StatusResiduo;
