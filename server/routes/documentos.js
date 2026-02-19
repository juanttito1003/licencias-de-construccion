const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Expediente = require('../models/Expediente');
const { auth } = require('../middleware/auth');
const { registrarHistorial } = require('../utils/historial');

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../../uploads', req.params.expedienteId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|jpg|jpeg|png|dwg|dxf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype) || 
                   file.mimetype === 'application/acad' ||
                   file.mimetype === 'application/x-autocad';

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF, imágenes JPG/PNG o planos DWG/DXF'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 }, // 10MB por defecto
  fileFilter: fileFilter
});

// Subir documento administrativo (RF02)
router.post('/:expedienteId/administrativo', auth, upload.single('documento'), async (req, res) => {
  try {
    const { tipo, nombre } = req.body;
    const expediente = await Expediente.findById(req.params.expedienteId);

    if (!expediente) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    // Verificar permisos
    if (req.usuario.rol === 'USUARIO_EXTERNO' && 
        expediente.solicitante.email !== req.usuario.email) {
      return res.status(403).json({ error: 'No tienes permiso para modificar este expediente' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó archivo' });
    }

    const documento = {
      tipo,
      nombre: nombre || req.file.originalname,
      url: `/uploads/${req.params.expedienteId}/${req.file.filename}`,
      estado: 'PENDIENTE'
    };

    expediente.documentosAdministrativos.push(documento);
    await expediente.save();

    await registrarHistorial(expediente._id, {
      accion: 'CARGA_DOCUMENTO',
      usuario: req.usuario._id,
      detalles: `Documento administrativo cargado: ${tipo}`
    });

    res.status(201).json({ 
      mensaje: 'Documento cargado exitosamente',
      documento 
    });
  } catch (error) {
    console.error('Error al subir documento:', error);
    res.status(500).json({ error: error.message || 'Error al subir documento' });
  }
});

// Subir plano técnico (RF03)
router.post('/:expedienteId/plano', auth, upload.single('plano'), async (req, res) => {
  try {
    const { tipo, nombre } = req.body;
    const expediente = await Expediente.findById(req.params.expedienteId);

    if (!expediente) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    // Verificar permisos
    if (req.usuario.rol === 'USUARIO_EXTERNO' && 
        expediente.solicitante.email !== req.usuario.email) {
      return res.status(403).json({ error: 'No tienes permiso para modificar este expediente' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó archivo' });
    }

    const plano = {
      tipo,
      nombre: nombre || req.file.originalname,
      url: `/uploads/${req.params.expedienteId}/${req.file.filename}`,
      estado: 'PENDIENTE'
    };

    expediente.planosTecnicos.push(plano);
    await expediente.save();

    await registrarHistorial(expediente._id, {
      accion: 'CARGA_PLANO',
      usuario: req.usuario._id,
      detalles: `Plano técnico cargado: ${tipo}`
    });

    res.status(201).json({ 
      mensaje: 'Plano cargado exitosamente',
      plano 
    });
  } catch (error) {
    console.error('Error al subir plano:', error);
    res.status(500).json({ error: error.message || 'Error al subir plano' });
  }
});

// Aprobar/Rechazar documento (RF11)
router.patch('/:expedienteId/documento/:documentoId', auth, async (req, res) => {
  try {
    const { estado, observaciones } = req.body;
    const expediente = await Expediente.findById(req.params.expedienteId);

    if (!expediente) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    const documento = expediente.documentosAdministrativos.id(req.params.documentoId);
    if (!documento) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    documento.estado = estado;
    documento.observaciones = observaciones;

    await expediente.save();

    await registrarHistorial(expediente._id, {
      accion: 'REVISION_DOCUMENTO',
      usuario: req.usuario._id,
      detalles: `Documento ${documento.tipo} marcado como ${estado}`
    });

    res.json({ 
      mensaje: 'Documento actualizado exitosamente',
      documento 
    });
  } catch (error) {
    console.error('Error al actualizar documento:', error);
    res.status(500).json({ error: 'Error al actualizar documento' });
  }
});

// Aprobar/Rechazar plano (RF11)
router.patch('/:expedienteId/plano/:planoId', auth, async (req, res) => {
  try {
    const { estado, observaciones } = req.body;
    const expediente = await Expediente.findById(req.params.expedienteId);

    if (!expediente) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    const plano = expediente.planosTecnicos.id(req.params.planoId);
    if (!plano) {
      return res.status(404).json({ error: 'Plano no encontrado' });
    }

    plano.estado = estado;
    plano.observaciones = observaciones;

    await expediente.save();

    await registrarHistorial(expediente._id, {
      accion: 'REVISION_PLANO',
      usuario: req.usuario._id,
      detalles: `Plano ${plano.tipo} marcado como ${estado}`
    });

    res.json({ 
      mensaje: 'Plano actualizado exitosamente',
      plano 
    });
  } catch (error) {
    console.error('Error al actualizar plano:', error);
    res.status(500).json({ error: 'Error al actualizar plano' });
  }
});

// Ruta para que el admin marque documentos como observados o aprobados
router.patch('/:expedienteId/revisar-documento', auth, async (req, res) => {
  try {
    const { tipoDocumento, estado, observaciones } = req.body;
    const expediente = await Expediente.findById(req.params.expedienteId);

    if (!expediente) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    // Verificar que el documento existe
    if (!expediente.documentos[tipoDocumento]) {
      return res.status(404).json({ error: 'Tipo de documento no encontrado' });
    }

    // Actualizar estado y observaciones
    expediente.documentos[tipoDocumento].estado = estado;
    expediente.documentos[tipoDocumento].observaciones = observaciones || '';

    await expediente.save();

    // Registrar en historial
    await registrarHistorial(expediente._id, {
      accion: estado === 'OBSERVADO' ? 'DOCUMENTO_OBSERVADO' : 'DOCUMENTO_APROBADO',
      detalles: `${tipoDocumento}: ${estado}${observaciones ? ' - ' + observaciones : ''}`,
      usuario: req.usuario.id
    });

    // Si está observado, enviar notificación al usuario
    if (estado === 'OBSERVADO') {
      const Usuario = require('../models/Usuario');
      const { enviarNotificacion } = require('../utils/notificaciones');
      
      const usuario = await Usuario.findOne({ email: expediente.solicitante.email });
      if (usuario) {
        await enviarNotificacion({
          destinatario: expediente.solicitante.email,
          asunto: `Documento Observado - Expediente ${expediente.numeroExpediente}`,
          mensaje: `El documento "${tipoDocumento}" requiere corrección.\n\nObservaciones: ${observaciones}\n\nPor favor, suba nuevamente el documento corregido.`,
          usuarioId: usuario._id,
          expedienteId: expediente._id,
          tipo: 'OBSERVACION',
          prioridad: 'ALTA'
        });
      }
    }

    res.json({ 
      mensaje: 'Documento revisado exitosamente',
      documento: expediente.documentos[tipoDocumento]
    });
  } catch (error) {
    console.error('Error al revisar documento:', error);
    res.status(500).json({ error: 'Error al revisar documento' });
  }
});

// Ruta para que el usuario reenvíe un documento observado
router.post('/:expedienteId/reenviar-documento', auth, upload.single('documento'), async (req, res) => {
  try {
    const { tipoDocumento } = req.body;
    const expediente = await Expediente.findById(req.params.expedienteId);

    if (!expediente) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    // Verificar que el usuario sea el solicitante o tenga rol permitido
    const rolesPermitidos = ['GERENTE', 'MESA_PARTES'];
    if (expediente.solicitante.email !== req.usuario.email && !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'No tiene permiso para modificar este documento' });
    }

    // Verificar que el documento exista y esté observado
    if (!expediente.documentos[tipoDocumento]) {
      return res.status(404).json({ error: 'Tipo de documento no encontrado' });
    }

    if (expediente.documentos[tipoDocumento].estado !== 'OBSERVADO') {
      return res.status(400).json({ error: 'Solo se pueden reenviar documentos observados' });
    }

    // Eliminar archivo anterior si existe
    if (expediente.documentos[tipoDocumento].ruta) {
      const rutaAnterior = path.join(__dirname, '../../', expediente.documentos[tipoDocumento].ruta);
      if (fs.existsSync(rutaAnterior)) {
        fs.unlinkSync(rutaAnterior);
      }
    }

    // Guardar nuevo archivo
    const rutaRelativa = `uploads/${req.params.expedienteId}/${req.file.filename}`;
    expediente.documentos[tipoDocumento] = {
      nombre: req.file.originalname,
      ruta: rutaRelativa,
      fechaCarga: new Date(),
      estado: 'PENDIENTE',
      observaciones: ''
    };

    await expediente.save();

    // Registrar en historial
    await registrarHistorial(expediente._id, {
      accion: 'DOCUMENTO_REENVIADO',
      detalles: `Documento reenviado: ${tipoDocumento}`,
      usuario: req.usuario.id
    });

    // Notificar a gerente y mesa de partes
    const Usuario = require('../models/Usuario');
    const { enviarNotificacion } = require('../utils/notificaciones');
    
    const responsables = await Usuario.find({ rol: { $in: ['GERENTE', 'MESA_PARTES'] } });
    for (const responsable of responsables) {
      await enviarNotificacion({
        destinatario: responsable.email,
        asunto: `Documento Reenviado - Expediente ${expediente.numeroExpediente}`,
        mensaje: `El usuario ${expediente.solicitante.nombres} ${expediente.solicitante.apellidos} ha reenviado el documento "${tipoDocumento}" que estaba observado.`,
        usuarioId: responsable._id,
        expedienteId: expediente._id,
        tipo: 'INFO',
        prioridad: 'NORMAL'
      });
    }

    res.json({ 
      mensaje: 'Documento reenviado exitosamente',
      documento: expediente.documentos[tipoDocumento]
    });
  } catch (error) {
    console.error('Error al reenviar documento:', error);
    res.status(500).json({ error: 'Error al reenviar documento' });
  }
});

module.exports = router;
