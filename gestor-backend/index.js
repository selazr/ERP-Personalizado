const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const horarioRoutes = require('./routes/horario.routes');
const authRoutes = require('./routes/auth.routes');
const trabajadorRoutes = require('./routes/trabajador.routes');
const externoRoutes = require('./routes/externo.routes');
const ocrRoutes = require('./routes/ocr.routes');
const empresaRoutes = require('./routes/empresa.routes');
const autonomoRoutes = require('./routes/autonomo.routes');
const trabajadorAutonomoRoutes = require('./routes/trabajador_autonomo.routes');
const db = require('./models');
const { scheduleCleanup } = require('./services/ocr.service');

dotenv.config();

//CONFIGURACION DE VARIABLES DE ENTORNO
const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);
if (missingEnv.length > 0) {
  console.error(`\u274c Falta configurar las variables de entorno: ${missingEnv.join(', ')}`);
  process.exit(1);
}


const app = express();
const PORT = process.env.PORT || 3001;
// Configuración CORS
// Si se define CORS_ORIGIN se toma dicha lista separada por comas, de lo
// contrario se utilizan dominios habituales de desarrollo y producción.
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://lxherp.es'
    ];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200
  })
);


// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/trabajadores', trabajadorRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/externos', externoRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/empresas', empresaRoutes);
app.use('/api/autonomos', autonomoRoutes);
app.use('/api/trabajadores-autonomos', trabajadorAutonomoRoutes);

// Archivos subidos para previsualización
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Limpieza programada de archivos OCR (mantener 1 semana)
scheduleCleanup();

// Conexión y sincronización DB
db.sequelize.authenticate()
  .then(() => {
    console.log('✅ Conectado a la base de datos');
    return db.sequelize.sync({ alter: true });
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
