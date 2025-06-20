const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const horarioRoutes = require('./routes/horario.routes');
const authRoutes = require('./routes/auth.routes');
const trabajadorRoutes = require('./routes/trabajador.routes');
const db = require('./models');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
// LOCAL
//✅ CORS: permite llamadas desde frontend en local
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'https://lxherp.es'],
  credentials: true
}));
//PRODUCCION
//✅ CORS: permite llamadas desde frontend en producción
/*app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://lxherp.es',
  credentials: true
})); 
*/

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/trabajadores', trabajadorRoutes);
app.use('/api/horarios', horarioRoutes);

// Conexión y sincronización DB
db.sequelize.authenticate()
  .then(() => {
    console.log('✅ Conectado a la base de datos');
    return db.sequelize.sync();
  })
  .then(() => {
    console.log('🗄️ Base de datos sincronizada');
  })
  .catch(err => {
    console.error('❌ Error al conectar a la base de datos:', err);
  });

// Lanzar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
