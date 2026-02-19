const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { enviarNotificacion } = require('../utils/notificaciones');
const Notificacion = require('../models/Notificacion');
const Usuario = require('../models/Usuario');

// Obtener notificaciones del usuario autenticado
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, soloNoLeidas = false } = req.query;
    
    const filtro = { usuario: req.usuario.id };
    if (soloNoLeidas === 'true') {
      filtro.leida = false;
    }

    const notificaciones = await Notificacion.find(filtro)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('expediente', 'numeroExpediente')
      .lean();

    const total = await Notificacion.countDocuments(filtro);
    const noLeidas = await Notificacion.contarNoLeidas(req.usuario.id);

    res.json({
      notificaciones,
      paginaActual: page,
      totalPaginas: Math.ceil(total / limit),
      total,
      noLeidas
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

// Contar notificaciones no leídas
router.get('/no-leidas/contador', auth, async (req, res) => {
  try {
    const contador = await Notificacion.contarNoLeidas(req.usuario.id);
    res.json({ contador });
  } catch (error) {
    console.error('Error al contar notificaciones:', error);
    res.status(500).json({ error: 'Error al contar notificaciones' });
  }
});

// Marcar notificación como leída
router.patch('/:id/leer', auth, async (req, res) => {
  try {
    const notificacion = await Notificacion.findOne({
      _id: req.params.id,
      usuario: req.usuario.id
    });

    if (!notificacion) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    await notificacion.marcarComoLeida();
    res.json({ mensaje: 'Notificación marcada como leída', notificacion });
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    res.status(500).json({ error: 'Error al marcar notificación como leída' });
  }
});

// Marcar todas las notificaciones como leídas
router.patch('/leer-todas', auth, async (req, res) => {
  try {
    await Notificacion.updateMany(
      { usuario: req.usuario.id, leida: false },
      { leida: true, fechaLectura: new Date() }
    );

    res.json({ mensaje: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error al marcar todas las notificaciones:', error);
    res.status(500).json({ error: 'Error al marcar todas las notificaciones' });
  }
});

// Eliminar notificación
router.delete('/:id', auth, async (req, res) => {
  try {
    const notificacion = await Notificacion.findOneAndDelete({
      _id: req.params.id,
      usuario: req.usuario.id
    });

    if (!notificacion) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    res.json({ mensaje: 'Notificación eliminada' });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({ error: 'Error al eliminar notificación' });
  }
});

// Enviar notificación manual (solo administrador)
router.post('/', auth, async (req, res) => {
  try {
    const { destinatario, asunto, mensaje, usuarioId, expedienteId, tipo, prioridad } = req.body;

    // Enviar notificación (email y guardar en BD)
    await enviarNotificacion({
      destinatario,
      asunto,
      mensaje,
      usuarioId,
      expedienteId,
      tipo,
      prioridad
    });

    res.json({ mensaje: 'Notificación enviada exitosamente' });
  } catch (error) {
    console.error('Error al enviar notificación:', error);
    res.status(500).json({ error: 'Error al enviar notificación' });
  }
});

module.exports = router;
