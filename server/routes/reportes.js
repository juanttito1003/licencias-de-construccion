const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Expediente = require('../models/Expediente');
const { auth, requiereRol } = require('../middleware/auth');

// Generar reporte de expedientes (RF15)
router.get('/expedientes', auth, requiereRol('GERENTE', 'MESA_PARTES'), async (req, res) => {
  try {
    const { formato = 'json', fechaInicio, fechaFin, estado } = req.query;

    let query = {};

    if (fechaInicio && fechaFin) {
      query.fechaCreacion = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }

    if (estado) {
      query.estado = estado;
    }

    const expedientes = await Expediente.find(query)
      .populate('revisorAdministrativo revisorTecnico', 'nombres apellidos')
      .sort({ fechaCreacion: -1 });

    if (formato === 'pdf') {
      const doc = new PDFDocument();
      const filename = `reporte-expedientes-${Date.now()}.pdf`;
      const filepath = path.join(__dirname, '../../uploads/reportes', filename);

      // Crear directorio si no existe
      if (!fs.existsSync(path.dirname(filepath))) {
        fs.mkdirSync(path.dirname(filepath), { recursive: true });
      }

      doc.pipe(fs.createWriteStream(filepath));

      // Encabezado
      doc.fontSize(18).text('Reporte de Expedientes', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Fecha de generación: ${new Date().toLocaleDateString()}`);
      doc.text(`Total de expedientes: ${expedientes.length}`);
      doc.moveDown();

      // Contenido
      expedientes.forEach((exp, index) => {
        doc.fontSize(10)
           .text(`${index + 1}. ${exp.numeroExpediente}`, { continued: true })
           .text(` - ${exp.solicitante.nombres} ${exp.solicitante.apellidos}`)
           .text(`   Estado: ${exp.estado}`)
           .text(`   Proyecto: ${exp.proyecto.nombreProyecto}`)
           .text(`   Fecha: ${exp.fechaCreacion.toLocaleDateString()}`)
           .moveDown(0.5);
      });

      doc.end();

      res.json({ 
        mensaje: 'Reporte generado exitosamente',
        archivo: `/uploads/reportes/${filename}`
      });
    } else if (formato === 'csv') {
      let csv = 'Número Expediente,Solicitante,DNI,Email,Proyecto,Estado,Fecha Creación\n';
      
      expedientes.forEach(exp => {
        csv += `"${exp.numeroExpediente}","${exp.solicitante.nombres} ${exp.solicitante.apellidos}","${exp.solicitante.dni}","${exp.solicitante.email}","${exp.proyecto.nombreProyecto}","${exp.estado}","${exp.fechaCreacion.toLocaleDateString()}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="reporte-expedientes-${Date.now()}.csv"`);
      res.send(csv);
    } else {
      res.json({ 
        total: expedientes.length,
        expedientes 
      });
    }
  } catch (error) {
    console.error('Error al generar reporte:', error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

// Estadísticas del sistema
router.get('/estadisticas', auth, requiereRol('GERENTE'), async (req, res) => {
  try {
    const totalExpedientes = await Expediente.countDocuments();
    
    const porEstado = await Expediente.aggregate([
      {
        $group: {
          _id: '$estado',
          count: { $sum: 1 }
        }
      }
    ]);

    const tiempoPromedio = await Expediente.aggregate([
      {
        $match: {
          estado: { $in: ['APROBADO', 'LICENCIA_EMITIDA'] }
        }
      },
      {
        $project: {
          dias: {
            $divide: [
              { $subtract: ['$fechaActualizacion', '$fechaCreacion'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          promedio: { $avg: '$dias' }
        }
      }
    ]);

    res.json({
      totalExpedientes,
      porEstado,
      tiempoPromedioAprobacion: tiempoPromedio[0]?.promedio || 0
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

module.exports = router;
