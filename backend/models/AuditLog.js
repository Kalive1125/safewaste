const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  acao: {
    type: DataTypes.STRING,
    allowNull: false
  },
  autor: {
    type: DataTypes.STRING,
    allowNull: false
  },
  perfil: {
    type: DataTypes.ENUM('clinica', 'coletora', 'sistema'),
    defaultValue: 'sistema'
  },
  detalhes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  hashImutabilidade: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = AuditLog;
