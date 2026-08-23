const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const apiRoutes = require('./routes/apiRoutes');

const ResiduoLog = require('./models/ResiduoLog');
const StatusResiduo = require('./models/StatusResiduo');

// Um resíduo tem vários eventos no rastreio (1 para N)
ResiduoLog.hasMany(StatusResiduo, { foreignKey: 'residuoLogId', as: 'historico' });
StatusResiduo.belongsTo(ResiduoLog, { foreignKey: 'residuoLogId' });

require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1', apiRoutes);

const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true }).then(() => {
  console.log('MySQL Conectado & Tabelas Sincronizadas.');
  app.listen(PORT, () => {
    console.log(`Servidor SafeWaste rodando na porta ${PORT}`);
  });
}).catch(err => {
  console.error('Erro ao conectar com o Banco de Dados:', err);
});