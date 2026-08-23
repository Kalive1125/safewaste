const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ConfiguracaoSistema = sequelize.define('ConfiguracaoSistema', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  chave: {
    type: DataTypes.STRING(80),
    allowNull: false,
    unique: true
  },
  valor: {
    type: DataTypes.TEXT,
    allowNull: false // Armazenado como JSON stringificado ou texto
  },
  descricao: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'configuracoes_sistema',
  timestamps: true,
  underscored: true
});

module.exports = ConfiguracaoSistema;
