const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(120),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true
  },
  cpf: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  perfil: {
    type: DataTypes.ENUM('clinica', 'coletora', 'admin'),
    allowNull: false,
    defaultValue: 'clinica'
  },
  cargo: {
    type: DataTypes.STRING(80),
    allowNull: true
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'usuarios',
  timestamps: true,
  underscored: true
});

module.exports = User;
