const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DestinadorFinal = sequelize.define('DestinadorFinal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  licencaOperacaoLao: {
    type: DataTypes.STRING(80),
    allowNull: false // Ex: INEMA LAO nº 2024-0012/BA
  },
  orgaoLicenciador: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'INEMA / Secretaria Estadual do Meio Ambiente'
  },
  metodoTratamento: {
    type: DataTypes.STRING(150),
    allowNull: false,
    defaultValue: 'Descontaminação Térmica por Autoclavagem e Trituração (RDC 222/2018)'
  },
  endereco: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  cidade: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Camaçari'
  },
  uf: {
    type: DataTypes.STRING(2),
    allowNull: false,
    defaultValue: 'BA'
  },
  responsavelTecnicoNome: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  responsavelTecnicoRegistro: {
    type: DataTypes.STRING(50),
    allowNull: false // Ex: CRQ-VII 07201948
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'destinadores_finais',
  timestamps: true,
  underscored: true
});

module.exports = DestinadorFinal;
