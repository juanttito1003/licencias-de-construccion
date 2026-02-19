const express = require('express');
const router = express.Router();
const Inspeccion = require('../models/Inspeccion');
const Expediente = require('../models/Expediente');
const { auth, requiereRol } = require('../middleware/auth');
const { registrarHistorial } = require('../utils/historial');
const { enviarNotificacion } = require('../utils/notificaciones');

// Programar inspección (RF07)
router.post('/', auth, requiereRol('INSPECTOR', 'GERENTE', 'MESA_PARTES'), async (req, res) => {
  try {
    const { expedienteId, fechaProgramada, tipo } = req.body;

    console.log('📋 Programando inspección:', { expedienteId, fechaProgramada, tipo, inspector: req.usuario._id });

    if (!expedienteId) {
      return res.status(400).json({ error: 'El ID del expediente es requerido' });
    }

    if (!fechaProgramada) {
      return res.status(400).json({ error: 'La fecha programada es requerida' });
    }

    const expediente = await Expediente.findById(expedienteId);
    if (!expediente) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    const inspeccion = new Inspeccion({
      expediente: expedienteId,
      inspector: req.usuario._id,
      fechaProgramada,
      tipo: tipo || 'INICIAL',
      estado: 'PROGRAMADA'
    });

    await inspeccion.save();

    expediente.inspecciones.push(inspeccion._id);
    expediente.estado = 'EN_INSPECCION'; // Cambiar estado del expediente
    await expediente.save();

    await registrarHistorial(expedienteId, {
      accion: 'INSPECCION_PROGRAMADA',
      usuario: req.usuario._id,
      detalles: `Inspección programada para ${new Date(fechaProgramada).toLocaleDateString()}`,
      estadoAnterior: expediente.estado,
      estadoNuevo: 'EN_INSPECCION'
    });

    // Buscar usuario solicitante para notificar
    const Usuario = require('../models/Usuario');
    const usuarioSolicitante = await Usuario.findOne({ email: expediente.solicitante.email });

    await enviarNotificacion({
      destinatario: expediente.solicitante.email,
      usuarioId: usuarioSolicitante?._id,
      tipo: 'INSPECCION',
      asunto: 'Inspección Programada',
      mensaje: `Se ha programado una inspección para el ${new Date(fechaProgramada).toLocaleDateString()} a las ${new Date(fechaProgramada).toLocaleTimeString()}`,
      expedienteId: expedienteId,
      prioridad: 'ALTA'
    });

    console.log('✅ Inspección programada exitosamente:', inspeccion._id);

    res.status(201).json({
      mensaje: 'Inspección programada exitosamente',
      inspeccion
    });
  } catch (error) {
    console.error('❌ Error al programar inspección:', error);
    res.status(500).json({ error: error.message || 'Error al programar inspección' });
  }
});

// Obtener inspecciones asignadas (RF07)
router.get('/mis-inspecciones', auth, requiereRol('INSPECTOR'), async (req, res) => {
  try {
    const { estado, fecha } = req.query;
    
    let query = { inspector: req.usuario._id };

    if (estado) {
      query.estado = estado;
    }

    if (fecha) {
      const fechaInicio = new Date(fecha);
      fechaInicio.setHours(0, 0, 0, 0);
      const fechaFin = new Date(fecha);
      fechaFin.setHours(23, 59, 59, 999);
      
      query.fechaProgramada = {
        $gte: fechaInicio,
        $lte: fechaFin
      };
    }

    const inspecciones = await Inspeccion.find(query)
      .populate('expediente')
      .populate('inspector', 'nombres apellidos')
      .sort({ fechaProgramada: 1 });

    res.json({ inspecciones });
  } catch (error) {
    console.error('Error al obtener inspecciones:', error);
    res.status(500).json({ error: 'Error al obtener inspecciones' });
  }
});

// Registrar observaciones de inspección (RF08)
router.post('/:id/observaciones', auth, requiereRol('INSPECTOR'), async (req, res) => {
  try {
    const { descripcion, tipo, fotos } = req.body;
    
    const inspeccion = await Inspeccion.findById(req.params.id);
    if (!inspeccion) {
      return res.status(404).json({ error: 'Inspección no encontrada' });
    }

    // Verificar que el inspector sea el asignado
    if (inspeccion.inspector.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta inspección' });
    }

    inspeccion.observaciones.push({
      descripcion,
      tipo,
      fotos: fotos || []
    });

    if (inspeccion.estado === 'PROGRAMADA') {
      inspeccion.estado = 'EN_CURSO';
    }

    await inspeccion.save();

    await registrarHistorial(inspeccion.expediente, {
      accion: 'OBSERVACION_INSPECCION',
      usuario: req.usuario._id,
      detalles: `Observación registrada: ${tipo}`
    });

    res.json({
      mensaje: 'Observación registrada exitosamente',
      inspeccion
    });
  } catch (error) {
    console.error('Error al registrar observación:', error);
    res.status(500).json({ error: 'Error al registrar observación' });
  }
});

// Actualizar inspección (usado por frontend para registrar resultado)
router.patch('/:id', auth, requiereRol('INSPECTOR', 'GERENTE', 'MESA_PARTES'), async (req, res) => {
  try {
    const { estado, observaciones, resultado } = req.body;
    
    console.log('📋 Actualizando inspección:', req.params.id, { estado, resultado });
    
    const inspeccion = await Inspeccion.findById(req.params.id).populate('expediente');
    if (!inspeccion) {
      return res.status(404).json({ error: 'Inspección no encontrada' });
    }

    // Verificar que el inspector sea el asignado (excepto gerente y mesa de partes)
    if (req.usuario.rol === 'INSPECTOR' && inspeccion.inspector.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta inspección' });
    }

    // Actualizar campos
    if (estado) inspeccion.estado = estado;
    if (resultado) inspeccion.resultado = resultado;
    if (observaciones) {
      inspeccion.observaciones.push({
        descripcion: observaciones,
        tipo: resultado === 'CONFORME' ? 'CONFORME' : (resultado === 'NO_CONFORME' ? 'NO_CONFORME' : 'OBSERVACION'),
        fecha: new Date()
      });
    }
    
    if (estado === 'COMPLETADA') {
      inspeccion.fechaRealizada = Date.now();
    }

    await inspeccion.save();

    // Actualizar estado del expediente si la inspección se completó
    if (estado === 'COMPLETADA') {
      const expediente = await Expediente.findById(inspeccion.expediente._id);
      const Usuario = require('../models/Usuario');
      
      if (resultado === 'CONFORME') {
        expediente.estado = 'APROBADO_INSPECCION';
        expediente.departamentoActual = 'GERENCIA';
        
        // Completar asignación de inspector
        if (expediente.asignaciones.inspector) {
          expediente.asignaciones.inspector.estado = 'COMPLETADO';
          expediente.asignaciones.inspector.fechaCompletado = new Date();
          const tiempoAtencion = Math.floor((new Date() - expediente.asignaciones.inspector.fechaAsignacion) / (1000 * 60));
          expediente.asignaciones.inspector.tiempoAtencion = tiempoAtencion;
        }
        
        // Buscar un gerente disponible
        const gerente = await Usuario.findOne({ rol: 'GERENTE', activo: true });
        
        if (gerente) {
          // Asignar al gerente
          expediente.asignaciones.gerente = {
            usuario: gerente._id,
            fechaAsignacion: new Date(),
            estado: 'EN_PROCESO'
          };
          
          // Notificar al gerente
          await enviarNotificacion({
            destinatario: gerente.email,
            usuarioId: gerente._id,
            tipo: 'ASIGNACION',
            asunto: 'Nuevo Expediente Asignado',
            mensaje: `Se te ha asignado el expediente ${expediente.numeroExpediente} para revisión final`,
            expedienteId: expediente._id,
            prioridad: 'ALTA'
          });
        }
      } else {
        expediente.estado = 'OBSERVADO_INSPECCION';
      }
      await expediente.save();

      await registrarHistorial(inspeccion.expediente._id, {
        accion: 'INSPECCION_COMPLETADA',
        usuario: req.usuario._id,
        detalles: `Inspección completada con resultado: ${resultado}`,
        estadoAnterior: 'EN_INSPECCION',
        estadoNuevo: expediente.estado
      });

      // Notificar al usuario solicitante
      const usuarioSolicitante = await Usuario.findOne({ email: expediente.solicitante.email });
      
      await enviarNotificacion({
        destinatario: expediente.solicitante.email,
        usuarioId: usuarioSolicitante?._id,
        tipo: 'INSPECCION',
        asunto: 'Inspección Completada',
        mensaje: `La inspección de su expediente ha sido completada con resultado: ${resultado}`,
        expedienteId: inspeccion.expediente._id,
        prioridad: resultado === 'CONFORME' ? 'NORMAL' : 'ALTA'
      });

      console.log('✅ Inspección actualizada:', inspeccion._id);
    }

    res.json({
      mensaje: 'Inspección actualizada exitosamente',
      inspeccion
    });
  } catch (error) {
    console.error('❌ Error al actualizar inspección:', error);
    res.status(500).json({ error: error.message || 'Error al actualizar inspección' });
  }
});

// Finalizar inspección
router.patch('/:id/finalizar', auth, requiereRol('INSPECTOR'), async (req, res) => {
  try {
    const { resultado, informe, coordenadas } = req.body;
    
    console.log('🏁 Finalizando inspección:', req.params.id, { resultado });
    
    const inspeccion = await Inspeccion.findById(req.params.id).populate('expediente');
    if (!inspeccion) {
      return res.status(404).json({ error: 'Inspección no encontrada' });
    }

    // Verificar que el inspector sea el asignado
    if (inspeccion.inspector.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta inspección' });
    }

    // Actualizar inspección
    inspeccion.estado = 'COMPLETADA';
    inspeccion.resultado = resultado;
    inspeccion.informe = informe;
    inspeccion.fechaRealizada = Date.now();
    if (coordenadas) {
      inspeccion.coordenadas = coordenadas;
    }

    await inspeccion.save();
    console.log('✓ Inspección guardada');

    // Actualizar estado del expediente
    const expediente = await Expediente.findById(inspeccion.expediente._id);
    const Usuario = require('../models/Usuario');
    const { enviarNotificacion } = require('../utils/notificaciones');
    
    if (resultado === 'CONFORME') {
      // Inspección aprobada - asignar a gerente
      expediente.estado = 'APROBADO_INSPECCION';
      expediente.departamentoActual = 'GERENCIA';
      
      // Completar asignación de inspector
      if (expediente.asignaciones.inspector) {
        expediente.asignaciones.inspector.estado = 'COMPLETADO';
        expediente.asignaciones.inspector.fechaCompletado = new Date();
        const tiempoAtencion = Math.floor((new Date() - expediente.asignaciones.inspector.fechaAsignacion) / (1000 * 60));
        expediente.asignaciones.inspector.tiempoAtencion = tiempoAtencion;
      }
      
      // Buscar un gerente disponible
      const gerente = await Usuario.findOne({ rol: 'GERENTE', activo: true });
      
      if (gerente) {
        // Asignar al gerente
        expediente.asignaciones.gerente = {
          usuario: gerente._id,
          fechaAsignacion: new Date(),
          estado: 'EN_PROCESO'
        };
        
        console.log('✓ Asignado a gerente:', gerente.email);
        
        // Notificar al gerente
        await enviarNotificacion({
          destinatario: gerente.email,
          usuarioId: gerente._id,
          tipo: 'ASIGNACION',
          asunto: 'Nuevo Expediente Asignado',
          mensaje: `Se te ha asignado el expediente ${expediente.numeroExpediente} para revisión final después de inspección conforme`,
          expedienteId: expediente._id,
          prioridad: 'ALTA'
        });
      }
      
      console.log('✓ Estado expediente: APROBADO_INSPECCION');
      
    } else {
      // Inspección no conforme - observado
      expediente.estado = 'OBSERVADO_INSPECCION';
      expediente.departamentoActual = 'INSPECCION';
      console.log('✓ Estado expediente: OBSERVADO_INSPECCION');
    }
    
    await expediente.save();

    // Registrar en historial
    await registrarHistorial(inspeccion.expediente._id, {
      accion: 'INSPECCION_COMPLETADA',
      usuario: req.usuario._id,
      detalles: `Inspección completada con resultado: ${resultado}. ${informe || ''}`
    });

    // Notificar al solicitante
    const usuarioSolicitante = await Usuario.findOne({ email: expediente.solicitante.email });
    if (usuarioSolicitante) {
      await enviarNotificacion({
        destinatario: expediente.solicitante.email,
        usuarioId: usuarioSolicitante._id,
        tipo: resultado === 'CONFORME' ? 'APROBACION' : 'OBSERVACION',
        asunto: 'Inspección Completada',
        mensaje: resultado === 'CONFORME' 
          ? `La inspección de su expediente ${expediente.numeroExpediente} fue aprobada. Su expediente está en revisión final.`
          : `La inspección de su expediente ${expediente.numeroExpediente} tiene observaciones: ${informe || 'Ver detalles'}`,
        expedienteId: expediente._id,
        prioridad: resultado === 'CONFORME' ? 'NORMAL' : 'ALTA'
      });
    }

    console.log('✓ Inspección finalizada exitosamente');

    res.json({
      mensaje: 'Inspección finalizada exitosamente',
      inspeccion,
      expediente: {
        _id: expediente._id,
        numeroExpediente: expediente.numeroExpediente,
        estado: expediente.estado
      }
    });
  } catch (error) {
    console.error('❌ Error al finalizar inspección:', error);
    res.status(500).json({ 
      error: 'Error al finalizar inspección',
      detalle: error.message 
    });
  }
});

module.exports = router;
