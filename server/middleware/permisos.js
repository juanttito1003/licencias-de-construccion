// Middleware de verificación de permisos por rol

const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ 
        mensaje: 'No autenticado' 
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ 
        mensaje: 'No tienes permisos para realizar esta acción',
        rolRequerido: rolesPermitidos,
        rolActual: req.usuario.rol
      });
    }

    next();
  };
};

const verificarPermiso = (permiso) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ mensaje: 'No autenticado' });
    }

    if (!req.usuario.permisos || !req.usuario.permisos[permiso]) {
      return res.status(403).json({ 
        mensaje: `No tienes el permiso: ${permiso}`,
        permisosActuales: req.usuario.permisos
      });
    }

    next();
  };
};

// Permisos específicos por rol
const PERMISOS_ROL = {
  USUARIO_EXTERNO: {
    puedeAsignar: false,
    puedeAprobar: false,
    puedeInspeccionar: false,
    puedeEmitirLicencias: false,
    puedeVerTodos: false
  },
  MESA_PARTES: {
    puedeAsignar: true,
    puedeAprobar: false,
    puedeInspeccionar: false,
    puedeEmitirLicencias: false,
    puedeVerTodos: true
  },
  TECNICO: {
    puedeAsignar: false,
    puedeAprobar: true,
    puedeInspeccionar: false,
    puedeEmitirLicencias: false,
    puedeVerTodos: false
  },
  INSPECTOR: {
    puedeAsignar: false,
    puedeAprobar: true,
    puedeInspeccionar: true,
    puedeEmitirLicencias: false,
    puedeVerTodos: false
  },
  GERENTE: {
    puedeAsignar: true,
    puedeAprobar: true,
    puedeInspeccionar: false,
    puedeEmitirLicencias: true,
    puedeVerTodos: true
  }
};

const verificarAccesoExpediente = async (req, res, next) => {
  try {
    const { rol } = req.usuario;
    const expedienteId = req.params.id || req.params.expedienteId;

    // Roles con acceso completo
    if (rol === 'MESA_PARTES' || rol === 'GERENTE') {
      return next();
    }

    const Expediente = require('../models/Expediente');
    const expediente = await Expediente.findById(expedienteId);

    if (!expediente) {
      return res.status(404).json({ mensaje: 'Expediente no encontrado' });
    }

    // Usuario externo solo ve sus propios expedientes
    if (rol === 'USUARIO_EXTERNO') {
      if (expediente.solicitante.email !== req.usuario.email) {
        return res.status(403).json({ 
          mensaje: 'No puedes acceder a este expediente' 
        });
      }
      return next();
    }

    // Técnico solo ve expedientes asignados a él
    if (rol === 'TECNICO') {
      if (expediente.asignaciones.tecnico.usuario?.toString() !== req.usuario._id.toString()) {
        return res.status(403).json({ 
          mensaje: 'Este expediente no está asignado a ti' 
        });
      }
      return next();
    }

    // Inspector solo ve expedientes asignados a él
    if (rol === 'INSPECTOR') {
      if (expediente.asignaciones.inspector.usuario?.toString() !== req.usuario._id.toString()) {
        return res.status(403).json({ 
          mensaje: 'Este expediente no está asignado a ti' 
        });
      }
      return next();
    }

    next();
  } catch (error) {
    return res.status(500).json({ 
      mensaje: 'Error al verificar acceso', 
      error: error.message 
    });
  }
};

module.exports = {
  verificarRol,
  verificarPermiso,
  verificarAccesoExpediente,
  PERMISOS_ROL
};
