const mongoose = require('mongoose');

const expedienteSchema = new mongoose.Schema({
  numeroExpediente: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  solicitante: {
    nombres: { type: String, required: true },
    apellidos: { type: String, required: true },
    dni: { type: String, required: true },
    email: { type: String, required: true },
    telefono: { type: String, required: true },
    direccion: String
  },
  proyecto: {
    nombreProyecto: { type: String, required: true },
    direccionProyecto: { type: String, required: true },
    distrito: { type: String, required: true },
    areaTerreno: Number,
    areaConstruccion: { 
      type: Number, 
      max: [120, 'El área de construcción no puede superar los 120 m² (Modalidad A)']
    },
    numeroNiveles: Number,
    usoProyecto: String,
    // Modalidad A - Nuevos campos
    tipoObra: {
      type: String,
      enum: ['CONSTRUCCION_NUEVA', 'AMPLIACION', 'OBRA_MENOR', 'REMODELACION', 'CERCO', 'DEMOLICION', 'MILITAR_POLICIAL']
    },
    esPropietario: { type: String, enum: ['SI', 'NO'], default: 'SI' },
    esPersonaJuridica: { type: String, enum: ['SI', 'NO'], default: 'NO' }
  },
  documentos: {
    // Documentos Administrativos
    formularioUnico: {
      nombre: String,
      ruta: String,
      fechaCarga: Date,
      estado: { 
        type: String, 
        enum: ['PENDIENTE', 'APROBADO', 'OBSERVADO'],
        default: 'PENDIENTE'
      },
      observaciones: String
    },
    certificadoLiteral: {
      nombre: String,
      ruta: String,
      fechaCarga: Date,
      estado: { 
        type: String, 
        enum: ['PENDIENTE', 'APROBADO', 'OBSERVADO'],
        default: 'PENDIENTE'
      },
      observaciones: String
    },
    declaracionJurada: {
      nombre: String,
      ruta: String,
      fechaCarga: Date,
      estado: { 
        type: String, 
        enum: ['PENDIENTE', 'APROBADO', 'OBSERVADO'],
        default: 'PENDIENTE'
      },
      observaciones: String
    },
    documentoDerecho: {
      nombre: String,
      ruta: String,
      fechaCarga: Date,
      estado: { 
        type: String, 
        enum: ['PENDIENTE', 'APROBADO', 'OBSERVADO'],
        default: 'PENDIENTE'
      },
      observaciones: String
    },
    vigenciaPoder: {
      nombre: String,
      ruta: String,
      fechaCarga: Date,
      estado: { 
        type: String, 
        enum: ['PENDIENTE', 'APROBADO', 'OBSERVADO'],
        default: 'PENDIENTE'
      },
      observaciones: String
    },
    licenciaAnterior: {
      nombre: String,
      ruta: String,
      fechaCarga: Date,
      estado: { 
        type: String, 
        enum: ['PENDIENTE', 'APROBADO', 'OBSERVADO'],
        default: 'PENDIENTE'
      },
      observaciones: String
    },
    // Documentación Técnica
    planoUbicacion: {
      nombre: String,
      ruta: String,
      fechaCarga: Date,
      estado: { 
        type: String, 
        enum: ['PENDIENTE', 'APROBADO', 'OBSERVADO'],
        default: 'PENDIENTE'
      },
      observaciones: String
    },
    planosArquitectura: {
      nombre: String,
      ruta: String,
      fechaCarga: Date,
      estado: { 
        type: String, 
        enum: ['PENDIENTE', 'APROBADO', 'OBSERVADO'],
        default: 'PENDIENTE'
      },
      observaciones: String
    },
    planosEspecialidades: {
      nombre: String,
      ruta: String,
      fechaCarga: Date,
      estado: { 
        type: String, 
        enum: ['PENDIENTE', 'APROBADO', 'OBSERVADO'],
        default: 'PENDIENTE'
      },
      observaciones: String
    },
    planoSenalizacion: {
      nombre: String,
      ruta: String,
      fechaCarga: Date,
      estado: { 
        type: String, 
        enum: ['PENDIENTE', 'APROBADO', 'OBSERVADO'],
        default: 'PENDIENTE'
      },
      observaciones: String
    },
    cartaSeguridad: {
      nombre: String,
      ruta: String,
      fechaCarga: Date,
      estado: { 
        type: String, 
        enum: ['PENDIENTE', 'APROBADO', 'OBSERVADO'],
        default: 'PENDIENTE'
      },
      observaciones: String
    }
  },
  documentosAdministrativos: [{
    tipo: { 
      type: String, 
      enum: ['FUE', 'CERTIFICADO_ZONIFICACION', 'DECLARACION_JURADA', 'PODER', 'OTRO'],
      required: true 
    },
    nombre: String,
    url: String,
    fechaCarga: { type: Date, default: Date.now },
    estado: { 
      type: String, 
      enum: ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'OBSERVADO'],
      default: 'PENDIENTE'
    },
    observaciones: String
  }],
  planosTecnicos: [{
    tipo: { 
      type: String, 
      enum: ['ARQUITECTURA', 'ESTRUCTURAS', 'INSTALACIONES_SANITARIAS', 'INSTALACIONES_ELECTRICAS'],
      required: true 
    },
    nombre: String,
    url: String,
    fechaCarga: { type: Date, default: Date.now },
    estado: { 
      type: String, 
      enum: ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'OBSERVADO'],
      default: 'PENDIENTE'
    },
    observaciones: String
  }],
  asignaciones: {
    mesaPartes: {
      usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
      fechaAsignacion: Date,
      fechaCompletado: Date,
      tiempoAtencion: Number, // en minutos
      estado: { 
        type: String, 
        enum: ['PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'DEVUELTO'],
        default: 'PENDIENTE'
      }
    },
    tecnico: {
      usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
      fechaAsignacion: Date,
      fechaCompletado: Date,
      tiempoAtencion: Number,
      estado: { 
        type: String, 
        enum: ['PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'DEVUELTO'],
        default: 'PENDIENTE'
      }
    },
    inspector: {
      usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
      fechaAsignacion: Date,
      fechaCompletado: Date,
      tiempoAtencion: Number,
      estado: { 
        type: String, 
        enum: ['PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'DEVUELTO'],
        default: 'PENDIENTE'
      }
    },
    gerente: {
      usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
      fechaAsignacion: Date,
      fechaCompletado: Date,
      tiempoAtencion: Number,
      estado: { 
        type: String, 
        enum: ['PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'DEVUELTO'],
        default: 'PENDIENTE'
      }
    }
  },
  departamentoActual: {
    type: String,
    enum: ['MESA_PARTES', 'REVISION_TECNICA', 'INSPECCION', 'GERENCIA', 'FINALIZADO', 'ARCHIVADO'],
    default: 'MESA_PARTES'
  },
  estado: {
    type: String,
    enum: [
      // Mesa de Partes
      'REGISTRADO',
      'VERIFICACION_DOCUMENTARIA',
      'DOCUMENTOS_INCOMPLETOS',
      
      // Técnico
      'REVISION_TECNICA',
      'OBSERVADO_TECNICO',
      'APROBADO_TECNICO',
      
      // Inspector
      'PROGRAMACION_INSPECCION',
      'EN_INSPECCION',
      'OBSERVADO_INSPECCION',
      'APROBADO_INSPECCION',
      
      // Gerencia
      'REVISION_GERENCIA',
      'PENDIENTE_PAGO',
      'PAGO_VERIFICADO',
      
      // Finales
      'APROBADO',
      'RECHAZADO',
      'LICENCIA_EMITIDA',
      'ARCHIVADO'
    ],
    default: 'REGISTRADO'
  },
  pago: {
    monto: Number,
    comprobante: String,
    numeroOperacion: String,
    fechaOperacion: Date,
    fechaPago: Date,
    metodoPago: { type: String, default: 'BANCO_NACION' },
    estado: { 
      type: String, 
      enum: ['PENDIENTE', 'PAGADO', 'VERIFICADO'],
      default: 'PENDIENTE'
    }
  },
  inspecciones: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inspeccion'
  }],
  historial: [{
    accion: String,
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    fecha: { type: Date, default: Date.now },
    detalles: String,
    estadoAnterior: String,
    estadoNuevo: String,
    departamento: String,
    tipoAccion: {
      type: String,
      enum: ['ASIGNACION', 'CAMBIO_ESTADO', 'OBSERVACION', 'APROBACION', 'RECHAZO', 'COMENTARIO']
    }
  }],
  plazos: {
    mesaPartes: {
      inicio: Date,
      fin: Date,
      diasLimite: { type: Number, default: 2 }, // 2 días hábiles
      vencido: { type: Boolean, default: false }
    },
    tecnico: {
      inicio: Date,
      fin: Date,
      diasLimite: { type: Number, default: 5 }, // 5 días hábiles
      vencido: { type: Boolean, default: false }
    },
    inspector: {
      inicio: Date,
      fin: Date,
      diasLimite: { type: Number, default: 3 }, // 3 días hábiles
      vencido: { type: Boolean, default: false }
    },
    gerente: {
      inicio: Date,
      fin: Date,
      diasLimite: { type: Number, default: 2 }, // 2 días hábiles
      vencido: { type: Boolean, default: false }
    }
  },
  prioridad: {
    type: String,
    enum: ['BAJA', 'NORMAL', 'ALTA', 'URGENTE'],
    default: 'NORMAL'
  },
  revisorAdministrativo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  revisorTecnico: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  resolucionFinal: {
    numero: String,
    fecha: Date,
    documento: String,
    observaciones: String
  },
  licenciaFinal: {
    nombre: String,
    ruta: String,
    fechaCarga: Date,
    enviadaAlUsuario: { type: Boolean, default: false },
    fechaEnvio: Date,
    generadaAutomaticamente: { type: Boolean, default: false }
  },
  fechaCreacion: { type: Date, default: Date.now },
  fechaActualizacion: { type: Date, default: Date.now }
}, { timestamps: true });

// Middleware para actualizar fecha de actualización
expedienteSchema.pre('save', function(next) {
  this.fechaActualizacion = Date.now();
  next();
});

// Generar número de expediente único
expedienteSchema.statics.generarNumeroExpediente = async function() {
  const año = new Date().getFullYear();
  const ultimoExpediente = await this.findOne({
    numeroExpediente: new RegExp(`^EXP-${año}-`)
  }).sort({ numeroExpediente: -1 });
  
  let numero = 1;
  if (ultimoExpediente) {
    const partes = ultimoExpediente.numeroExpediente.split('-');
    numero = parseInt(partes[2]) + 1;
  }
  
  return `EXP-${año}-${String(numero).padStart(6, '0')}`;
};

module.exports = mongoose.model('Expediente', expedienteSchema);
