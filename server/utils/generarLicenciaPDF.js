/**
 * Utilidad: Generar Licencia de Construcción en PDF
 * Descripción: Genera automáticamente la licencia aprobada con diseño profesional
 * Autor: Juan Diego Ttito Valenzuela
 * Contacto: 948 225 929
 * © 2026 Todos los derechos reservados
 */

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

/**
 * Genera un PDF profesional de Licencia de Construcción
 * @param {Object} expediente - Datos del expediente
 * @param {String} outputPath - Ruta donde guardar el PDF
 * @returns {Promise<String>} - Ruta del PDF generado
 */
async function generarLicenciaPDF(expediente, outputPath) {
  return new Promise(async (resolve, reject) => {
    try {
      // Crear directorio si no existe
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Crear documento PDF
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      // Stream para guardar el archivo
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // URL de verificación para el QR
      const urlVerificacion = `${process.env.APP_URL || 'http://localhost:3000'}/verificar-licencia/${expediente._id}`;
      
      // Generar código QR
      const qrDataUrl = await QRCode.toDataURL(urlVerificacion);
      const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

      // ============ ENCABEZADO ============
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text('MUNICIPALIDAD DISTRITAL', { align: 'center' })
         .fontSize(16)
         .text('GERENCIA DE DESARROLLO URBANO Y RURAL', { align: 'center' })
         .moveDown(0.5);

      doc.fontSize(14)
         .fillColor('#2c3e50')
         .text('LICENCIA DE CONSTRUCCIÓN', { align: 'center', underline: true })
         .fontSize(12)
         .text('MODALIDAD A', { align: 'center' })
         .moveDown(2);

      // ============ INFORMACIÓN PRINCIPAL ============
      const startY = doc.y;

      doc.fontSize(11)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('N° DE LICENCIA: ', 50, startY, { continued: true })
         .font('Helvetica')
         .text(expediente.numeroExpediente);

      doc.font('Helvetica-Bold')
         .text('FECHA DE EMISIÓN: ', 50, doc.y + 5, { continued: true })
         .font('Helvetica')
         .text(new Date().toLocaleDateString('es-PE', { 
           day: '2-digit', 
           month: 'long', 
           year: 'numeric' 
         }));

      // Código QR en la esquina superior derecha
      doc.image(qrBuffer, 450, startY, { width: 80, height: 80 });
      doc.fontSize(8)
         .fillColor('#666')
         .text('Escanea para', 450, startY + 85, { width: 80, align: 'center' })
         .text('verificar', 450, doc.y, { width: 80, align: 'center' });

      doc.moveDown(2);

      // ============ LÍNEA SEPARADORA ============
      doc.moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .strokeColor('#3498db')
         .lineWidth(2)
         .stroke();

      doc.moveDown(1);

      // ============ DATOS DEL SOLICITANTE ============
      doc.fontSize(12)
         .fillColor('#2c3e50')
         .font('Helvetica-Bold')
         .text('I. DATOS DEL SOLICITANTE', { underline: true })
         .moveDown(0.5);

      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica');

      const solicitante = expediente.solicitante;
      agregarCampo(doc, 'Nombres y Apellidos', `${solicitante.nombres} ${solicitante.apellidos}`);
      agregarCampo(doc, 'DNI', solicitante.dni);
      agregarCampo(doc, 'Correo Electrónico', solicitante.email);
      agregarCampo(doc, 'Teléfono', solicitante.telefono);
      if (solicitante.direccion) {
        agregarCampo(doc, 'Dirección', solicitante.direccion);
      }

      doc.moveDown(1);

      // ============ DATOS DEL PROYECTO ============
      doc.fontSize(12)
         .fillColor('#2c3e50')
         .font('Helvetica-Bold')
         .text('II. DATOS DEL PROYECTO', { underline: true })
         .moveDown(0.5);

      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica');

      const proyecto = expediente.proyecto;
      agregarCampo(doc, 'Nombre del Proyecto', proyecto.nombreProyecto);
      agregarCampo(doc, 'Ubicación', proyecto.direccionProyecto);
      agregarCampo(doc, 'Distrito', proyecto.distrito);
      agregarCampo(doc, 'Área de Terreno', `${proyecto.areaTerreno || 'N/A'} m²`);
      agregarCampo(doc, 'Área de Construcción', `${proyecto.areaConstruccion || 'N/A'} m²`);
      agregarCampo(doc, 'Número de Niveles', proyecto.numeroNiveles || 'N/A');
      agregarCampo(doc, 'Uso del Proyecto', proyecto.usoProyecto || 'N/A');
      agregarCampo(doc, 'Tipo de Obra', formatearTipoObra(proyecto.tipoObra));

      doc.moveDown(1);

      // ============ RESOLUCIÓN ============
      doc.fontSize(12)
         .fillColor('#2c3e50')
         .font('Helvetica-Bold')
         .text('III. RESOLUCIÓN', { underline: true })
         .moveDown(0.5);

      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text(
        `Por medio de la presente, se otorga la LICENCIA DE CONSTRUCCIÓN a favor de ${solicitante.nombres} ${solicitante.apellidos}, ` +
        `identificado con DNI N° ${solicitante.dni}, para ejecutar la obra de construcción denominada "${proyecto.nombreProyecto}", ` +
        `ubicada en ${proyecto.direccionProyecto}, distrito de ${proyecto.distrito}.`,
        { align: 'justify' }
      );

      doc.moveDown(0.5);

      doc.text(
        `La presente licencia autoriza la ejecución de obras de ${formatearTipoObra(proyecto.tipoObra).toLowerCase()} con un área de construcción ` +
        `de ${proyecto.areaConstruccion || 'N/A'} m², en ${proyecto.numeroNiveles || 'N/A'} nivel(es), ` +
        `para uso de ${proyecto.usoProyecto || 'N/A'}.`,
        { align: 'justify' }
      );

      doc.moveDown(1);

      // ============ CONDICIONES ============
      doc.fontSize(12)
         .fillColor('#2c3e50')
         .font('Helvetica-Bold')
         .text('IV. CONDICIONES Y OBSERVACIONES', { underline: true })
         .moveDown(0.5);

      doc.fontSize(9)
         .fillColor('#000000')
         .font('Helvetica');

      const condiciones = [
        'La presente licencia tiene una vigencia de 36 meses calendario.',
        'El titular deberá contar con el Cuaderno de Obra debidamente legalizado.',
        'La obra debe ejecutarse conforme a los planos y especificaciones técnicas aprobadas.',
        'Cualquier modificación sustancial requiere autorización previa.',
        'Se debe comunicar la fecha de inicio de obra a la municipalidad.',
        'Al finalizar la obra, se debe solicitar la Conformidad de Obra.',
        'El incumplimiento de estas condiciones puede dar lugar a sanciones administrativas.'
      ];

      condiciones.forEach((condicion, index) => {
        doc.text(`${index + 1}. ${condicion}`, { indent: 10 });
        doc.moveDown(0.3);
      });

      // ============ PIE DE PÁGINA ============
      // Verificar si hay espacio suficiente, si no, crear nueva página
      if (doc.y > 650) {
        doc.addPage();
      }

      doc.moveDown(2);

      // Línea de firma
      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica');

      const firmaY = doc.y + 40;
      doc.moveTo(180, firmaY)
         .lineTo(430, firmaY)
         .strokeColor('#000000')
         .lineWidth(1)
         .stroke();

      doc.fontSize(9)
         .font('Helvetica-Bold')
         .text('GERENTE DE DESARROLLO URBANO Y RURAL', 50, firmaY + 10, { 
           width: 500, 
           align: 'center' 
         })
         .font('Helvetica')
         .text('Municipalidad Distrital', 50, doc.y, { 
           width: 500, 
           align: 'center' 
         });

      // Pie de página final
      doc.fontSize(8)
         .fillColor('#666')
         .text(
           `Documento generado electrónicamente el ${new Date().toLocaleString('es-PE')}`,
           50,
           750,
           { width: 500, align: 'center' }
         )
         .text(
           `Expediente N° ${expediente.numeroExpediente} | Verificar autenticidad en: ${process.env.APP_URL || 'http://localhost:3000'}`,
           50,
           doc.y,
           { width: 500, align: 'center' }
         );

      // Finalizar documento
      doc.end();

      // Esperar a que termine de escribirse
      stream.on('finish', () => {
        console.log('✓ PDF de licencia generado:', outputPath);
        resolve(outputPath);
      });

      stream.on('error', (error) => {
        console.error('❌ Error al generar PDF:', error);
        reject(error);
      });

    } catch (error) {
      console.error('❌ Error al generar licencia PDF:', error);
      reject(error);
    }
  });
}

// Función auxiliar para agregar campos
function agregarCampo(doc, label, valor) {
  doc.font('Helvetica-Bold')
     .text(`${label}: `, { continued: true })
     .font('Helvetica')
     .text(valor || 'N/A');
}

// Función para formatear tipo de obra
function formatearTipoObra(tipo) {
  const tipos = {
    'CONSTRUCCION_NUEVA': 'Construcción Nueva',
    'AMPLIACION': 'Ampliación',
    'OBRA_MENOR': 'Obra Menor',
    'REMODELACION': 'Remodelación',
    'CERCO': 'Cerco',
    'DEMOLICION': 'Demolición',
    'MILITAR_POLICIAL': 'Militar/Policial'
  };
  return tipos[tipo] || tipo;
}

module.exports = { generarLicenciaPDF };
