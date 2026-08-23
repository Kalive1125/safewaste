const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Configuração resiliente: se houver MySQL configurado e acessível, usa MySQL;
// caso contrário (ou se DB_DIALECT for sqlite), utiliza SQLite com persistência local garantida.
const isSqlite = process.env.DB_DIALECT === 'sqlite' || !process.env.DB_PASS;

let sequelize;

if (isSqlite) {
  const dbPath = path.join(__dirname, '..', 'safewaste.sqlite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false,
    define: {
      timestamps: true,
      underscored: true
    }
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'safewaste_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false,
      define: {
        timestamps: true,
        underscored: true
      },
      retry: {
        max: 2
      }
    }
  );
}

module.exports = sequelize;