const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ResiduoLog = sequelize.define('ResiduoLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  mtrCodigo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  cdfCodigo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  grupoResiduo: {
    type: DataTypes.ENUM('A', 'B', 'C', 'D', 'E'),
    allowNull: false
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pesoGeradoKg: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  pesoColetadoKg: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  etapaAtual: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false
  },
  rtCpf: {
    type: DataTypes.STRING,
    allowNull: false
  },
  coletoraCnpj: {
    type: DataTypes.STRING,
    allowNull: true
  },
  destinoFinalCnpj: {
    type: DataTypes.STRING,
    allowNull: true
  },
  hashImutabilidade: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = ResiduoLog;