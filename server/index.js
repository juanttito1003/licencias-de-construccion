const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const redisClient = require('./config/redis');

// Cargar variables de entorno
dotenv.config();

const app = express();

// Confiar en proxy de Render para rate limiting
app.set('trust proxy', true);

// Conectar a Redis (con fallback a memoria)
redisClient.connectRedis().catch(err => {
  console.warn('⚠️  Redis no disponible, usando almacenamiento en memoria');
});

// Middleware de seguridad
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de 100 requests por IP
});
app.use('/api/', limiter);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/expedientes', require('./routes/expedientes'));
app.use('/api/documentos', require('./routes/documentos'));
app.use('/api/inspecciones', require('./routes/inspecciones'));
app.use('/api/pagos', require('./routes/pagos'));
app.use('/api/notificaciones', require('./routes/notificaciones'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/asignaciones', require('./routes/asignaciones')); // Nueva ruta de asignaciones
app.use('/api/verificar-licencia', require('./routes/verificar-licencia')); // Ruta pública

// Servir frontend React en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('✓ Conectado a MongoDB'))
.catch(err => {
  console.error('❌ Error al conectar a MongoDB:', err.message);
  console.log('⚠️  El servidor continuará corriendo pero sin base de datos');
});

// Manejar eventos de MongoDB
mongoose.connection.on('error', (err) => {
  console.error('❌ Error de MongoDB:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB desconectado. Intentando reconectar...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✓ MongoDB reconectado exitosamente');
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`✓ Servidor corriendo en puerto ${PORT}`);
  console.log(`✓ Modo: ${process.env.NODE_ENV}`);
});

// Manejar errores de promesas no capturadas
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  // No cerrar el servidor, solo loggear el error
});

// Manejar excepciones no capturadas
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // No cerrar el servidor, solo loggear el error
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM recibido, cerrando servidor gracefully...');
  server.close(() => {
    console.log('✓ Servidor cerrado');
    mongoose.connection.close(false, () => {
      console.log('✓ Conexión MongoDB cerrada');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT recibido, cerrando servidor...');
  server.close(() => {
    console.log('✓ Servidor cerrado');
    mongoose.connection.close(false, () => {
      console.log('✓ Conexión MongoDB cerrada');
      process.exit(0);
    });
  });
});

module.exports = app;
