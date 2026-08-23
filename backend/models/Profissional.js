const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Profissional = sequelize.define('Profissional', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(120),
    allowNull: false
  },
  cpf: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  conselhoRegistro: {
    type: DataTypes.STRING(50),
    allowNull: false // Ex: CRBM 19481/BA
  },
  cargo: {
    type: DataTypes.STRING(80),
    allowNull: false,
    defaultValue: 'Responsável Técnico (RT)'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  telefone: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'profissionais',
  timestamps: true,
  underscored: true
});

module.exports = Profissional;