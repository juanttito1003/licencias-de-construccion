const Expediente = require('../models/Expediente');

// Función para registrar acciones en el historial (RF14)
const registrarHistorial = async (expedienteId, datos) => {
  try {
    const expediente = await Expediente.findById(expedienteId);
    if (!expediente) return;

    expediente.historial.push({
      accion: datos.accion,
      usuario: datos.usuario,
      fecha: Date.now(),
      detalles: datos.detalles || '',
      estadoAnterior: datos.estadoAnterior || null,
      estadoNuevo: datos.estadoNuevo || null
    });

    await expediente.save();
  } catch (error) {
    console.error('Error al registrar historial:', error);
  }
};

module.exports = { registrarHistorial };
