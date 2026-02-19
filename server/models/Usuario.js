const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  nombres: { type: String, required: true },
  apellidos: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dni: { type: String, required: true, unique: true },
  telefono: String,
  rol: {
    type: String,
    enum: ['USUARIO_EXTERNO', 'MESA_PARTES', 'TECNICO', 'INSPECTOR', 'GERENTE'],
    required: true,
    default: 'USUARIO_EXTERNO'
  },
  departamento: {
    type: String,
    enum: ['MESA_PARTES', 'REVISION_TECNICA', 'INSPECCION', 'GERENCIA', 'NINGUNO'],
    default: 'NINGUNO'
  },
  permisos: {
    puedeAsignar: { type: Boolean, default: false },
    puedeAprobar: { type: Boolean, default: false },
    puedeInspeccionar: { type: Boolean, default: false },
    puedeEmitirLicencias: { type: Boolean, default: false },
    puedeVerTodos: { type: Boolean, default: false }
  },
  estadisticas: {
    expedientesAsignados: { type: Number, default: 0 },
    expedientesCompletados: { type: Number, default: 0 },
    promedioTiempoAtencion: { type: Number, default: 0 }
  },
  activo: { type: Boolean, default: true },
  emailVerificado: { type: Boolean, default: false },
  tokenVerificacion: String,
  tokenVerificacionExpira: Date,
  codigoCambioContrasena: String,
  codigoCambioContrasenaExpira: Date,
  codigoRegistro: String,
  codigoRegistroExpira: Date,
  fechaCreacion: { type: Date, default: Date.now },
  ultimoAcceso: Date
}, { timestamps: true });

// Hash de password antes de guardar
usuarioSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método para comparar passwords
usuarioSchema.methods.compararPassword = async function(passwordIngresado) {
  return await bcrypt.compare(passwordIngresado, this.password);
};

module.exports = mongoose.model('Usuario', usuarioSchema);
