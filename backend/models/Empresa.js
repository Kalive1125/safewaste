const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Empresa = sequelize.define('Empresa', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tipo: {
    type: DataTypes.ENUM('geradora', 'coletora'),
    allowNull: false,
    defaultValue: 'geradora'
  },
  razaoSocial: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  nomeFantasia: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  cnpj: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  inscricaoEstadual: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  cnae: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  endereco: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  cidade: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'Salvador'
  },
  uf: {
    type: DataTypes.STRING(2),
    allowNull: true,
    defaultValue: 'BA'
  },
  telefone: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  responsavelTecnicoNome: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  responsavelTecnicoCpf: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  responsavelTecnicoRegistro: {
    type: DataTypes.STRING(50),
    allowNull: false // Ex: CRBM 19481/BA, CRM, etc.
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'empresas',
  timestamps: true,
  underscored: true
});

module.exports = Empresa;
