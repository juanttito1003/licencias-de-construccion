/**
 * Modelo: Notificación
 * Descripción: Modelo de notificaciones internas de la aplicación
 * Autor: Juan Diego Ttito Valenzuela
 * Contacto: 948 225 929
 * © 2025 Todos los derechos reservados
 */

const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
    index: true
  },
  tipo: {
    type: String,
    enum: ['MENSAJE', 'INSPECCION', 'OBSERVACION', 'APROBACION', 'RECHAZO', 'ALERTA', 'INFO', 'ASIGNACION'],
    default: 'MENSAJE'
  },
  asunto: {
    type: String,
    required: true
  },
  mensaje: {
    type: String,
    required: true
  },
  expediente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expediente'
  },
  leida: {
    type: Boolean,
    default: false
  },
  fechaLectura: {
    type: Date
  },
  prioridad: {
    type: String,
    enum: ['BAJA', 'NORMAL', 'ALTA', 'URGENTE'],
    default: 'NORMAL'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Índices para mejorar rendimiento
notificacionSchema.index({ usuario: 1, leida: 1 });
notificacionSchema.index({ createdAt: -1 });

// Método para marcar como leída
notificacionSchema.methods.marcarComoLeida = async function() {
  this.leida = true;
  this.fechaLectura = new Date();
  return await this.save();
};

// Método estático para obtener notificaciones no leídas de un usuario
notificacionSchema.statics.obtenerNoLeidas = function(usuarioId) {
  return this.find({ usuario: usuarioId, leida: false })
    .sort({ createdAt: -1 })
    .populate('expediente', 'numeroExpediente');
};

// Método estático para contar notificaciones no leídas
notificacionSchema.statics.contarNoLeidas = function(usuarioId) {
  return this.countDocuments({ usuario: usuarioId, leida: false });
};

module.exports = mongoose.model('Notificacion', notificacionSchema);
