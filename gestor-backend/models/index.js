const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Conexión
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
  }
);

// Objeto principal
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Modelos
db.Trabajador = require('./trabajador.model')(sequelize, DataTypes);
db.Horario = require('./horario.model')(sequelize, DataTypes);
db.Externo = require('./externo.model')(sequelize, DataTypes);

// Relaciones
db.Trabajador.hasMany(db.Horario, { foreignKey: 'trabajador_id' });
db.Horario.belongsTo(db.Trabajador, { foreignKey: 'trabajador_id' });

module.exports = db;
