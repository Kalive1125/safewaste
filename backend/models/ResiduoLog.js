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
  clinicaNome: {
    type: DataTypes.STRING,
    defaultValue: 'Clínica OdontoLife'
  },
  coletoraNome: {
    type: DataTypes.STRING,
    defaultValue: 'EcoResíduos Logística'
  },
  // Dados do Destinador Final (Planta licenciada)
  destinadorFinalNome: {
    type: DataTypes.STRING,
    defaultValue: 'Bahia Tratamento e Destinação de Resíduos S/A'
  },
  destinadorFinalCnpj: {
    type: DataTypes.STRING,
    defaultValue: '03.882.190/0001-44'
  },
  destinadorFinalLao: {
    type: DataTypes.STRING,
    defaultValue: 'INEMA LAO nº 2024-0012/BA'
  },
  metodoTratamento: {
    type: DataTypes.STRING,
    defaultValue: 'Autoclavagem com Descontaminação Térmica (ANVISA RDC 222/2018)'
  },
  // Termo Oficial de Validação de Entrega e Tratamento na Destinação Final
  termoValidacaoCodigo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  termoValidacaoPdfPath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  termoDataEmissao: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Metadados Gov.br Confiabilidades
  govbrAutenticado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  govbrNivelConta: {
    type: DataTypes.STRING,
    defaultValue: 'Ouro'
  },
  govbrSeloConfiabilidade: {
    type: DataTypes.STRING,
    defaultValue: 'Certificado Digital ICP-Brasil / Balcão Presencial (201)'
  },
  dataHoraGeracao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  dataHoraColeta: {
    type: DataTypes.DATE,
    allowNull: true
  },
  motoristaNome: {
    type: DataTypes.STRING,
    allowNull: true
  },
  veiculoPlaca: {
    type: DataTypes.STRING,
    allowNull: true
  },
  comprovantePdfPath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cdfPdfPath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  statusColeta: {
    type: DataTypes.ENUM('aguardando_coleta', 'coletado', 'em_transporte', 'no_destino', 'concluido'),
    defaultValue: 'aguardando_coleta'
  },
  hashImutabilidade: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = ResiduoLog;