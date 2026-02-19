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
})
.then(() => console.log('✓ Conectado a MongoDB'))
.catch(err => console.error('Error al conectar a MongoDB:', err));

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
app.listen(PORT, () => {
  console.log(`✓ Servidor corriendo en puerto ${PORT}`);
  console.log(`✓ Modo: ${process.env.NODE_ENV}`);
});

module.exports = app;
