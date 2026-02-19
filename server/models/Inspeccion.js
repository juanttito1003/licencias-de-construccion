const mongoose = require('mongoose');

const inspeccionSchema = new mongoose.Schema({
  expediente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expediente',
    required: true
  },
  inspector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  fechaProgramada: { type: Date, required: true },
  fechaRealizada: Date,
  estado: {
    type: String,
    enum: ['PROGRAMADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA', 'REPROGRAMADA'],
    default: 'PROGRAMADA'
  },
  tipo: {
    type: String,
    enum: ['INICIAL', 'SEGUIMIENTO', 'FINAL'],
    required: true
  },
  observaciones: [{
    descripcion: String,
    tipo: { 
      type: String, 
      enum: ['CONFORME', 'OBSERVACION', 'NO_CONFORME'] 
    },
    fecha: { type: Date, default: Date.now },
    fotos: [String]
  }],
  resultado: {
    type: String,
    enum: ['CONFORME', 'OBSERVADO', 'NO_CONFORME', 'PENDIENTE'],
    default: 'PENDIENTE'
  },
  informe: String,
  coordenadas: {
    latitud: Number,
    longitud: Number
  },
  fechaCreacion: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Inspeccion', inspeccionSchema);
