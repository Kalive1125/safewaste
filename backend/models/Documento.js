const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Documento = sequelize.define('Documento', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tipo: {
    type: DataTypes.STRING, // 'PGRSS', 'Alvará Sanitário', 'Licença Ambiental', 'Contrato Coletora', 'Certificado de Destinação', 'Outros'
    allowNull: false
  },
  obrigatorio: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  dataEmissao: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  dataValidade: {
    type: DataTypes.DATEONLY,
    allowNull: true // Se for documento sem validade expira=null
  },
  arquivoNomeOriginal: {
    type: DataTypes.STRING,
    allowNull: false
  },
  arquivoPath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tamanhoBytes: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  clinicaNome: {
    type: DataTypes.STRING,
    defaultValue: 'Clínica OdontoLife'
  },
  status: {
    type: DataTypes.ENUM('valido', 'vencendo', 'vencido'),
    defaultValue: 'valido'
  }
});

module.exports = Documento;
