/**
 * Rutas: Verificación de Licencias
 * Descripción: Rutas públicas para verificar autenticidad de licencias
 * Autor: Juan Diego Ttito Valenzuela
 */

const express = require('express');
const router = express.Router();
const Expediente = require('../models/Expediente');

// Verificar autenticidad de licencia (ruta pública)
router.get('/:id', async (req, res) => {
  try {
    const expediente = await Expediente.findById(req.params.id)
      .select('numeroExpediente estado solicitante proyecto licenciaFinal fechaCreacion updatedAt');

    if (!expediente) {
      return res.status(404).json({ 
        valida: false,
        mensaje: 'Licencia no encontrada en nuestros registros' 
      });
    }

    if (expediente.estado !== 'LICENCIA_EMITIDA' && expediente.estado !== 'APROBADO') {
      return res.status(200).json({
        valida: false,
        mensaje: 'Este expediente no tiene una licencia emitida'
      });
    }

    // Licencia válida
    res.json({
      valida: true,
      mensaje: 'Licencia válida y vigente',
      expediente: {
        numeroExpediente: expediente.numeroExpediente,
        estado: expediente.estado,
        solicitante: {
          nombres: expediente.solicitante.nombres,
          apellidos: expediente.solicitante.apellidos,
          dni: expediente.solicitante.dni
        },
        proyecto: {
          nombreProyecto: expediente.proyecto.nombreProyecto,
          direccion: expediente.proyecto.direccionProyecto,
          distrito: expediente.proyecto.distrito,
          areaConstruccion: expediente.proyecto.areaConstruccion,
          tipoObra: expediente.proyecto.tipoObra
        },
        fechaEmision: expediente.updatedAt
      }
    });

  } catch (error) {
    console.error('Error al verificar licencia:', error);
    res.status(500).json({ 
      valida: false,
      mensaje: 'Error al verificar la licencia' 
    });
  }
});

module.exports = router;
