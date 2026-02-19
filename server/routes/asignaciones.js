const express = require('express');
const router = express.Router();
const Expediente = require('../models/Expediente');
const Usuario = require('../models/Usuario');
const Notificacion = require('../models/Notificacion');
const { auth } = require('../middleware/auth');
const { verificarRol, verificarPermiso } = require('../middleware/permisos');
const { enviarNotificacion } = require('../utils/notificaciones');
const { registrarHistorial } = require('../utils/historial');

// Asignar expediente a un usuario específico
router.post('/:expedienteId/asignar', 
  auth, 
  verificarRol('MESA_PARTES', 'GERENTE', 'TECNICO'),
  async (req, res) => {
    try {
      const { expedienteId } = req.params;
      const { usuarioId, departamento, prioridad } = req.body;

      const expediente = await Expediente.findById(expedienteId);
      if (!expediente) {
        return res.status(404).json({ mensaje: 'Expediente no encontrado' });
      }

      const usuarioAsignado = await Usuario.findById(usuarioId);
      if (!usuarioAsignado) {
        return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      }

      // Verificar que el usuario tenga el rol correcto para el departamento
      const rolesPermitidos = {
        'MESA_PARTES': 'MESA_PARTES',
        'REVISION_TECNICA': 'TECNICO',
        'INSPECCION': 'INSPECTOR',
        'GERENCIA': 'GERENTE'
      };

      if (usuarioAsignado.rol !== rolesPermitidos[departamento]) {
        return res.status(400).json({ 
          mensaje: `El usuario debe tener rol ${rolesPermitidos[departamento]} para este departamento` 
        });
      }

      // Asignar según departamento
      const fechaAsignacion = new Date();
      let estadoNuevo;
      let campoAsignacion;

      switch (departamento) {
        case 'MESA_PARTES':
          expediente.asignaciones.mesaPartes = {
            usuario: usuarioId,
            fechaAsignacion,
            estado: 'EN_PROCESO'
          };
          expediente.plazos.mesaPartes.inicio = fechaAsignacion;
          estadoNuevo = 'VERIFICACION_DOCUMENTARIA';
          campoAsignacion = 'mesaPartes';
          break;

        case 'REVISION_TECNICA':
          expediente.asignaciones.tecnico = {
            usuario: usuarioId,
            fechaAsignacion,
            estado: 'EN_PROCESO'
          };
          expediente.plazos.tecnico.inicio = fechaAsignacion;
          estadoNuevo = 'REVISION_TECNICA';
          campoAsignacion = 'tecnico';
          break;

        case 'INSPECCION':
          expediente.asignaciones.inspector = {
            usuario: usuarioId,
            fechaAsignacion,
            estado: 'EN_PROCESO'
          };
          expediente.plazos.inspector.inicio = fechaAsignacion;
          estadoNuevo = 'PROGRAMACION_INSPECCION';
          campoAsignacion = 'inspector';
          break;

        case 'GERENCIA':
          expediente.asignaciones.gerente = {
            usuario: usuarioId,
            fechaAsignacion,
            estado: 'EN_PROCESO'
          };
          expediente.plazos.gerente.inicio = fechaAsignacion;
          estadoNuevo = 'REVISION_GERENCIA';
          campoAsignacion = 'gerente';
          break;
      }

      const estadoAnterior = expediente.estado;
      expediente.estado = estadoNuevo;
      expediente.departamentoActual = departamento;
      
      if (prioridad) {
        expediente.prioridad = prioridad;
      }

      await expediente.save();

      // Registrar en historial
      await registrarHistorial(expedienteId, {
        accion: `Expediente asignado a ${usuarioAsignado.nombres} ${usuarioAsignado.apellidos}`,
        usuario: req.usuario._id,
        detalles: `Asignado al departamento: ${departamento}`,
        estadoAnterior,
        estadoNuevo,
        departamento,
        tipoAccion: 'ASIGNACION'
      });

      // Actualizar estadísticas del usuario
      usuarioAsignado.estadisticas.expedientesAsignados += 1;
      await usuarioAsignado.save();

      // Notificar al usuario asignado
      await enviarNotificacion({
        destinatario: usuarioAsignado.email,
        usuarioId: usuarioId,
        tipo: 'ASIGNACION',
        asunto: '📋 Nuevo expediente asignado',
        mensaje: `Se te ha asignado el expediente ${expediente.numeroExpediente} para revisión técnica`,
        expedienteId: expedienteId,
        prioridad: prioridad || 'NORMAL'
      });

      const expedienteActualizado = await Expediente.findById(expedienteId)
        .populate('asignaciones.mesaPartes.usuario', 'nombres apellidos email rol')
        .populate('asignaciones.tecnico.usuario', 'nombres apellidos email rol')
        .populate('asignaciones.inspector.usuario', 'nombres apellidos email rol')
        .populate('asignaciones.gerente.usuario', 'nombres apellidos email rol');

      res.json({
        mensaje: 'Expediente asignado correctamente',
        expediente: expedienteActualizado
      });

    } catch (error) {
      console.error('Error al asignar expediente:', error);
      res.status(500).json({ 
        mensaje: 'Error al asignar expediente', 
        error: error.message 
      });
    }
  }
);

// Obtener mis expedientes asignados
router.get('/mis-asignaciones', auth, async (req, res) => {
  try {
    const { rol } = req.usuario;
    const { estado, prioridad } = req.query;

    let query = {};
    let campoAsignacion;

    // Determinar el campo de asignación según el rol
    switch (rol) {
      case 'MESA_PARTES':
        // Mesa de Partes ve TODOS los expedientes del sistema
        // No se aplica filtro de asignación
        break;
      case 'GERENTE':
        // Gerente también ve TODOS los expedientes
        break;
      case 'TECNICO':
        campoAsignacion = 'asignaciones.tecnico.usuario';
        break;
      case 'INSPECTOR':
        campoAsignacion = 'asignaciones.inspector.usuario';
        break;
      case 'USUARIO_EXTERNO':
        query['solicitante.email'] = req.usuario.email;
        break;
      default:
        return res.status(403).json({ mensaje: 'Rol no válido' });
    }

    if (campoAsignacion) {
      query[campoAsignacion] = req.usuario._id;
    }

    if (estado) {
      query.estado = estado;
    }

    if (prioridad) {
      query.prioridad = prioridad;
    }

    const expedientes = await Expediente.find(query)
      .populate('asignaciones.mesaPartes.usuario', 'nombres apellidos email')
      .populate('asignaciones.tecnico.usuario', 'nombres apellidos email')
      .populate('asignaciones.inspector.usuario', 'nombres apellidos email')
      .populate('asignaciones.gerente.usuario', 'nombres apellidos email')
      .populate('inspecciones')
      .sort({ 'prioridad': -1, 'fechaCreacion': -1 });

    // Calcular estadísticas
    const estadisticas = {
      total: expedientes.length,
      porEstado: {},
      porPrioridad: {},
      vencidos: 0
    };

    expedientes.forEach(exp => {
      // Contar por estado
      estadisticas.porEstado[exp.estado] = (estadisticas.porEstado[exp.estado] || 0) + 1;
      
      // Contar por prioridad
      estadisticas.porPrioridad[exp.prioridad] = (estadisticas.porPrioridad[exp.prioridad] || 0) + 1;
      
      // Verificar vencidos según el departamento actual
      let plazo;
      switch (exp.departamentoActual) {
        case 'MESA_PARTES':
          plazo = exp.plazos.mesaPartes;
          break;
        case 'REVISION_TECNICA':
          plazo = exp.plazos.tecnico;
          break;
        case 'INSPECCION':
          plazo = exp.plazos.inspector;
          break;
        case 'GERENCIA':
          plazo = exp.plazos.gerente;
          break;
      }
      
      if (plazo && plazo.vencido) {
        estadisticas.vencidos++;
      }
    });

    res.json({
      expedientes,
      estadisticas
    });

  } catch (error) {
    console.error('Error al obtener asignaciones:', error);
    res.status(500).json({ 
      mensaje: 'Error al obtener asignaciones', 
      error: error.message 
    });
  }
});

// Completar asignación y pasar al siguiente departamento
router.post('/:expedienteId/completar', auth, async (req, res) => {
  try {
    const { expedienteId } = req.params;
    const { observaciones, aprobado, siguienteDepartamento } = req.body;

    const expediente = await Expediente.findById(expedienteId);
    if (!expediente) {
      return res.status(404).json({ mensaje: 'Expediente no encontrado' });
    }

    const { rol } = req.usuario;
    let campoAsignacion;
    let siguienteEstado;

    // Determinar campo de asignación y siguiente estado
    switch (rol) {
      case 'MESA_PARTES':
        campoAsignacion = 'mesaPartes';
        siguienteEstado = aprobado ? 'REVISION_TECNICA' : 'DOCUMENTOS_INCOMPLETOS';
        break;
      case 'TECNICO':
        campoAsignacion = 'tecnico';
        siguienteEstado = aprobado ? 'APROBADO_TECNICO' : 'OBSERVADO_TECNICO';
        break;
      case 'INSPECTOR':
        campoAsignacion = 'inspector';
        siguienteEstado = aprobado ? 'APROBADO_INSPECCION' : 'OBSERVADO_INSPECCION';
        break;
      case 'GERENTE':
        campoAsignacion = 'gerente';
        siguienteEstado = aprobado ? 'APROBADO' : 'RECHAZADO';
        break;
      default:
        return res.status(403).json({ mensaje: 'No tienes permisos para completar asignaciones' });
    }

    // Verificar que el expediente esté asignado a este usuario
    // EXCEPCIÓN: Mesa de Partes y Gerente pueden procesar sin asignación previa
    if (rol !== 'MESA_PARTES' && rol !== 'GERENTE') {
      if (expediente.asignaciones[campoAsignacion].usuario?.toString() !== req.usuario._id.toString()) {
        return res.status(403).json({ mensaje: 'Este expediente no está asignado a ti' });
      }
    }

    // Completar la asignación
    const fechaCompletado = new Date();
    const fechaAsignacion = expediente.asignaciones[campoAsignacion].fechaAsignacion || new Date();
    const tiempoAtencion = Math.floor((fechaCompletado - fechaAsignacion) / (1000 * 60)); // minutos

    expediente.asignaciones[campoAsignacion].usuario = req.usuario._id;
    expediente.asignaciones[campoAsignacion].estado = 'COMPLETADO';
    expediente.asignaciones[campoAsignacion].fechaCompletado = fechaCompletado;
    expediente.asignaciones[campoAsignacion].tiempoAtencion = tiempoAtencion;
    if (!expediente.asignaciones[campoAsignacion].fechaAsignacion) {
      expediente.asignaciones[campoAsignacion].fechaAsignacion = fechaAsignacion;
    }

    const estadoAnterior = expediente.estado;
    expediente.estado = siguienteEstado;

    // Si está aprobado, mover al siguiente departamento
    if (aprobado && siguienteDepartamento) {
      expediente.departamentoActual = siguienteDepartamento;
    }

    await expediente.save();

    // Registrar en historial
    await registrarHistorial(expedienteId, {
      accion: `${aprobado ? 'Aprobado' : 'Observado'} por ${rol}`,
      usuario: req.usuario._id,
      detalles: observaciones || 'Sin observaciones',
      estadoAnterior,
      estadoNuevo: siguienteEstado,
      departamento: expediente.departamentoActual,
      tipoAccion: aprobado ? 'APROBACION' : 'OBSERVACION'
    });

    // Actualizar estadísticas del usuario
    const usuario = await Usuario.findById(req.usuario._id);
    usuario.estadisticas.expedientesCompletados += 1;
    
    // Actualizar promedio de tiempo de atención
    const totalExpedientes = usuario.estadisticas.expedientesCompletados;
    const promedioActual = usuario.estadisticas.promedioTiempoAtencion;
    usuario.estadisticas.promedioTiempoAtencion = 
      ((promedioActual * (totalExpedientes - 1)) + tiempoAtencion) / totalExpedientes;
    
    await usuario.save();

    // Notificar al solicitante
    const usuarioSolicitante = await Usuario.findOne({ email: expediente.solicitante.email });
    
    await enviarNotificacion({
      destinatario: expediente.solicitante.email,
      usuarioId: usuarioSolicitante?._id,
      tipo: aprobado ? 'APROBACION' : 'OBSERVACION',
      asunto: aprobado ? '✅ Etapa aprobada' : '⚠️ Observaciones en tu expediente',
      mensaje: `Tu expediente ${expediente.numeroExpediente} ha sido ${aprobado ? 'aprobado' : 'observado'} en ${rol}${observaciones ? '. Observaciones: ' + observaciones : ''}`,
      expedienteId: expedienteId,
      prioridad: aprobado ? 'NORMAL' : 'ALTA'
    });

    res.json({
      mensaje: 'Asignación completada correctamente',
      expediente: await Expediente.findById(expedienteId)
        .populate('asignaciones.mesaPartes.usuario', 'nombres apellidos')
        .populate('asignaciones.tecnico.usuario', 'nombres apellidos')
        .populate('asignaciones.inspector.usuario', 'nombres apellidos')
        .populate('asignaciones.gerente.usuario', 'nombres apellidos')
    });

  } catch (error) {
    console.error('Error al completar asignación:', error);
    res.status(500).json({ 
      mensaje: 'Error al completar asignación', 
      error: error.message 
    });
  }
});

// Obtener usuarios disponibles por departamento
router.get('/usuarios-disponibles/:departamento', 
  auth,
  verificarRol('MESA_PARTES', 'GERENTE', 'TECNICO'),
  async (req, res) => {
    try {
      const { departamento } = req.params;

      const rolesMap = {
        'MESA_PARTES': 'MESA_PARTES',
        'REVISION_TECNICA': 'TECNICO',
        'INSPECCION': 'INSPECTOR',
        'GERENCIA': 'GERENTE'
      };

      const rol = rolesMap[departamento];
      if (!rol) {
        return res.status(400).json({ mensaje: 'Departamento no válido' });
      }

      const usuarios = await Usuario.find({ 
        rol, 
        activo: true 
      }).select('nombres apellidos email estadisticas departamento');

      res.json({ usuarios });

    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({ 
        mensaje: 'Error al obtener usuarios', 
        error: error.message 
      });
    }
  }
);

// Estadísticas de asignaciones (para gerentes)
router.get('/estadisticas', 
  auth,
  verificarRol('GERENTE', 'MESA_PARTES'),
  async (req, res) => {
    try {
      const { fechaInicio, fechaFin } = req.query;

      let query = {};
      if (fechaInicio && fechaFin) {
        query.fechaCreacion = {
          $gte: new Date(fechaInicio),
          $lte: new Date(fechaFin)
        };
      }

      const expedientes = await Expediente.find(query);

      const estadisticas = {
        totalExpedientes: expedientes.length,
        porDepartamento: {
          MESA_PARTES: 0,
          REVISION_TECNICA: 0,
          INSPECCION: 0,
          GERENCIA: 0,
          FINALIZADO: 0
        },
        porEstado: {},
        promedioTiempos: {
          mesaPartes: 0,
          tecnico: 0,
          inspector: 0,
          gerente: 0
        },
        vencidos: 0
      };

      let tiemposMesaPartes = [];
      let tiemposTecnico = [];
      let tiemposInspector = [];
      let tiemposGerente = [];

      expedientes.forEach(exp => {
        // Contar por departamento
        estadisticas.porDepartamento[exp.departamentoActual]++;

        // Contar por estado
        estadisticas.porEstado[exp.estado] = (estadisticas.porEstado[exp.estado] || 0) + 1;

        // Recopilar tiempos
        if (exp.asignaciones.mesaPartes.tiempoAtencion) {
          tiemposMesaPartes.push(exp.asignaciones.mesaPartes.tiempoAtencion);
        }
        if (exp.asignaciones.tecnico.tiempoAtencion) {
          tiemposTecnico.push(exp.asignaciones.tecnico.tiempoAtencion);
        }
        if (exp.asignaciones.inspector.tiempoAtencion) {
          tiemposInspector.push(exp.asignaciones.inspector.tiempoAtencion);
        }
        if (exp.asignaciones.gerente.tiempoAtencion) {
          tiemposGerente.push(exp.asignaciones.gerente.tiempoAtencion);
        }

        // Contar vencidos
        if (exp.plazos.mesaPartes.vencido || exp.plazos.tecnico.vencido || 
            exp.plazos.inspector.vencido || exp.plazos.gerente.vencido) {
          estadisticas.vencidos++;
        }
      });

      // Calcular promedios
      estadisticas.promedioTiempos.mesaPartes = 
        tiemposMesaPartes.length > 0 ? 
        tiemposMesaPartes.reduce((a, b) => a + b, 0) / tiemposMesaPartes.length : 0;

      estadisticas.promedioTiempos.tecnico = 
        tiemposTecnico.length > 0 ? 
        tiemposTecnico.reduce((a, b) => a + b, 0) / tiemposTecnico.length : 0;

      estadisticas.promedioTiempos.inspector = 
        tiemposInspector.length > 0 ? 
        tiemposInspector.reduce((a, b) => a + b, 0) / tiemposInspector.length : 0;

      estadisticas.promedioTiempos.gerente = 
        tiemposGerente.length > 0 ? 
        tiemposGerente.reduce((a, b) => a + b, 0) / tiemposGerente.length : 0;

      res.json({ estadisticas });

    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ 
        mensaje: 'Error al obtener estadísticas', 
        error: error.message 
      });
    }
  }
);

module.exports = router;
