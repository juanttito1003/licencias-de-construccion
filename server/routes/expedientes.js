const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Expediente = require('../models/Expediente');
const Usuario = require('../models/Usuario');
const { auth, requiereRol } = require('../middleware/auth');
const { registrarHistorial } = require('../utils/historial');
const { enviarNotificacion } = require('../utils/notificaciones');
const { enviarMensajeExpediente, enviarLicenciaAprobada } = require('../utils/email');
const { generarLicenciaPDF } = require('../utils/generarLicenciaPDF');

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/expedientes');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF o imágenes (JPG, PNG)'));
    }
  }
});

// Crear nuevo expediente (RF01, RF05)
router.post('/', auth, upload.fields([
  { name: 'formularioUnico', maxCount: 1 },
  { name: 'certificadoLiteral', maxCount: 1 },
  { name: 'declaracionJurada', maxCount: 1 },
  { name: 'documentoDerecho', maxCount: 1 },
  { name: 'vigenciaPoder', maxCount: 1 },
  { name: 'licenciaAnterior', maxCount: 1 },
  { name: 'planoUbicacion', maxCount: 1 },
  { name: 'planosArquitectura', maxCount: 1 },
  { name: 'planosEspecialidades', maxCount: 1 },
  { name: 'planoSenalizacion', maxCount: 1 },
  { name: 'cartaSeguridad', maxCount: 1 }
]), async (req, res) => {
  try {
    const datos = JSON.parse(req.body.datos);
    const { solicitante, proyecto } = datos;

    // Generar número de expediente único
    const numeroExpediente = await Expediente.generarNumeroExpediente();

    // Construir objeto de documentos cargados
    const documentos = {};
    if (req.files) {
      Object.keys(req.files).forEach(fieldName => {
        if (req.files[fieldName] && req.files[fieldName][0]) {
          // Guardar solo la ruta relativa (uploads/expedientes/archivo.pdf)
          const rutaCompleta = req.files[fieldName][0].path;
          const rutaRelativa = rutaCompleta.replace(/\\/g, '/').split('uploads/')[1];
          
          documentos[fieldName] = {
            nombre: req.files[fieldName][0].originalname,
            ruta: `uploads/${rutaRelativa}`,
            fechaCarga: new Date()
          };
        }
      });
    }

    const expediente = new Expediente({
      numeroExpediente,
      solicitante: {
        ...solicitante,
        email: req.usuario.email
      },
      proyecto,
      documentos,
      estado: 'REGISTRADO'
    });

    await expediente.save();

    // Registrar en historial
    await registrarHistorial(expediente._id, {
      accion: 'CREACION_EXPEDIENTE',
      usuario: req.usuario._id,
      detalles: `Expediente ${numeroExpediente} creado con ${Object.keys(documentos).length} documento(s)`,
      estadoNuevo: 'REGISTRADO'
    });

    // Enviar notificación al usuario que creó el expediente
    await enviarNotificacion({
      destinatario: req.usuario.email,
      usuarioId: req.usuario._id,
      tipo: 'MENSAJE',
      asunto: 'Expediente Registrado',
      mensaje: `Su expediente ${numeroExpediente} ha sido registrado exitosamente y está en revisión.`,
      expedienteId: expediente._id,
      prioridad: 'NORMAL'
    });

    res.status(201).json({ 
      mensaje: 'Expediente creado exitosamente',
      expediente 
    });
  } catch (error) {
    console.error('Error al crear expediente:', error);
    res.status(500).json({ error: error.message || 'Error al crear expediente' });
  }
});

// Obtener todos los expedientes (con filtros)
router.get('/', auth, async (req, res) => {
  try {
    const { estado, search, page = 1, limit = 10 } = req.query;
    
    let query = {};

    // Filtrar según rol
    if (req.usuario.rol === 'USUARIO_EXTERNO') {
      query['solicitante.email'] = req.usuario.email;
    }

    if (estado) {
      query.estado = estado;
    }

    if (search) {
      query.$or = [
        { numeroExpediente: new RegExp(search, 'i') },
        { 'solicitante.nombres': new RegExp(search, 'i') },
        { 'solicitante.apellidos': new RegExp(search, 'i') },
        { 'proyecto.nombreProyecto': new RegExp(search, 'i') }
      ];
    }

    const expedientes = await Expediente.find(query)
      .sort({ fechaCreacion: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('revisorAdministrativo revisorTecnico', 'nombres apellidos');

    const total = await Expediente.countDocuments(query);

    res.json({
      expedientes,
      totalPaginas: Math.ceil(total / limit),
      paginaActual: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error al obtener expedientes:', error);
    res.status(500).json({ error: 'Error al obtener expedientes' });
  }
});

// Obtener expediente por ID (RF09)
router.get('/:id', auth, async (req, res) => {
  try {
    const expediente = await Expediente.findById(req.params.id)
      .populate('revisorAdministrativo revisorTecnico', 'nombres apellidos')
      .populate('inspecciones')
      .populate('historial.usuario', 'nombres apellidos');

    if (!expediente) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    // Verificar permisos
    if (req.usuario.rol === 'USUARIO_EXTERNO' && 
        expediente.solicitante.email !== req.usuario.email) {
      return res.status(403).json({ error: 'No tienes permiso para ver este expediente' });
    }

    res.json(expediente);
  } catch (error) {
    console.error('Error al obtener expediente:', error);
    res.status(500).json({ error: 'Error al obtener expediente' });
  }
});

// Actualizar estado del expediente (RF11, RF12)
router.patch('/:id/estado', auth, requiereRol('GERENTE', 'MESA_PARTES'), async (req, res) => {
  try {
    const { estado, observaciones } = req.body;
    const expediente = await Expediente.findById(req.params.id);

    if (!expediente) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    // Validar permisos por rol
    const esGerente = req.usuario.rol === 'GERENTE';
    const esMesaPartes = req.usuario.rol === 'MESA_PARTES';
    
    // Mesa de Partes solo puede cambiar a estados iniciales
    if (esMesaPartes && !['EN_REVISION', 'OBSERVADO', 'ASIGNADO_TECNICO'].includes(estado)) {
      return res.status(403).json({ 
        error: 'Mesa de Partes solo puede asignar expedientes a técnicos o marcarlos como observados' 
      });
    }

    const estadoAnterior = expediente.estado;
    expediente.estado = estado;

    // Si el estado es APROBADO, generar automáticamente el PDF de la licencia
    if (estado === 'APROBADO' || estado === 'LICENCIA_EMITIDA') {
      console.log('🔄 Generando PDF de licencia automáticamente...');
      
      try {
        // Crear directorio de licencias si no existe
        const licenciasDir = path.join(__dirname, '../../uploads/licencias');
        if (!fs.existsSync(licenciasDir)) {
          fs.mkdirSync(licenciasDir, { recursive: true });
        }

        // Nombre del archivo
        const nombreArchivo = `licencia-${expediente.numeroExpediente}-${Date.now()}.pdf`;
        const rutaCompleta = path.join(licenciasDir, nombreArchivo);
        const rutaRelativa = `uploads/licencias/${nombreArchivo}`;

        // Generar PDF
        await generarLicenciaPDF(expediente, rutaCompleta);

        // Guardar información en el expediente
        expediente.licenciaFinal = {
          nombre: nombreArchivo,
          ruta: rutaRelativa,
          fechaCarga: new Date(),
          generadaAutomaticamente: true
        };

        console.log('✅ PDF de licencia generado:', rutaRelativa);

        // Buscar usuario para enviar notificación
        const usuario = await Usuario.findOne({ email: expediente.solicitante.email });
        
        if (usuario) {
          // Enviar notificación de aprobación
          await enviarNotificacion({
            destinatario: expediente.solicitante.email,
            asunto: `✅ Licencia Aprobada - Expediente N° ${expediente.numeroExpediente}`,
            mensaje: `¡Felicitaciones! Su expediente ha sido APROBADO.\n\nPuede descargar su licencia de construcción desde el sistema.\n\nExpediente: ${expediente.numeroExpediente}\nProyecto: ${expediente.proyecto.nombreProyecto}`,
            usuarioId: usuario._id,
            expedienteId: expediente._id,
            tipo: 'APROBACION',
            prioridad: 'ALTA'
          });
        }

      } catch (pdfError) {
        console.error('❌ Error al generar PDF de licencia:', pdfError);
        // Continuar aunque falle la generación del PDF
      }
    }

    await expediente.save();

    // Registrar en historial
    await registrarHistorial(expediente._id, {
      accion: 'CAMBIO_ESTADO',
      usuario: req.usuario._id,
      detalles: observaciones || `Estado cambiado de ${estadoAnterior} a ${estado}`,
      estadoAnterior,
      estadoNuevo: estado
    });

    // Enviar notificación general para otros cambios de estado
    if (estado !== 'APROBADO' && estado !== 'LICENCIA_EMITIDA') {
      const usuario = await Usuario.findOne({ email: expediente.solicitante.email });
      if (usuario) {
        await enviarNotificacion({
          destinatario: expediente.solicitante.email,
          asunto: `Actualización de Expediente ${expediente.numeroExpediente}`,
          mensaje: `Su expediente ha cambiado de estado a: ${estado}`,
          usuarioId: usuario._id,
          expedienteId: expediente._id,
          tipo: 'INFO',
          prioridad: 'NORMAL'
        });
      }
    }

    res.json({ 
      mensaje: 'Estado actualizado exitosamente',
      licenciaGenerada: expediente.licenciaFinal ? true : false,
      expediente 
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

// Validar documentación completa (RF04)
router.get('/:id/validar', auth, async (req, res) => {
  try {
    const expediente = await Expediente.findById(req.params.id);

    if (!expediente) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    const documentosRequeridos = ['FUE', 'CERTIFICADO_ZONIFICACION', 'DECLARACION_JURADA'];
    const planosRequeridos = ['ARQUITECTURA', 'ESTRUCTURAS', 'INSTALACIONES_SANITARIAS', 'INSTALACIONES_ELECTRICAS'];

    const documentosFaltantes = documentosRequeridos.filter(tipo => 
      !expediente.documentosAdministrativos.some(doc => doc.tipo === tipo)
    );

    const planosFaltantes = planosRequeridos.filter(tipo => 
      !expediente.planosTecnicos.some(plano => plano.tipo === tipo)
    );

    const completo = documentosFaltantes.length === 0 && planosFaltantes.length === 0;

    res.json({
      completo,
      documentosFaltantes,
      planosFaltantes
    });
  } catch (error) {
    console.error('Error al validar documentación:', error);
    res.status(500).json({ error: 'Error al validar documentación' });
  }
});

// Asignar monto de pago (Gerente o Mesa de Partes)
router.put('/:id/pago', auth, requiereRol('GERENTE', 'MESA_PARTES'), async (req, res) => {
  try {
    const { monto } = req.body;
    
    if (!monto || parseFloat(monto) <= 0) {
      return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
    }

    const expediente = await Expediente.findById(req.params.id);
    if (!expediente) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    // Asignar monto
    expediente.pago = {
      monto: parseFloat(monto),
      estado: 'PENDIENTE',
      metodoPago: 'BANCO_NACION'
    };

    await expediente.save();

    // Registrar en historial
    await registrarHistorial(expediente._id, {
      accion: 'ASIGNACION_MONTO',
      usuario: req.usuario._id,
      detalles: `Monto de pago asignado: S/ ${monto}`,
      estadoNuevo: expediente.estado
    });

    // Buscar usuario del solicitante para notificación
    const usuarioSolicitante = await Usuario.findOne({ email: expediente.solicitante.email });

    // Enviar notificación al solicitante
    await enviarNotificacion({
      destinatario: expediente.solicitante.email,
      usuarioId: usuarioSolicitante?._id,
      expedienteId: expediente._id,
      tipo: 'INFO',
      asunto: 'Monto de Pago Asignado',
      mensaje: `Se ha asignado el monto de pago para el expediente ${expediente.numeroExpediente}. Monto: S/ ${monto}. Debe realizar el pago en el Banco de la Nación y subir el voucher.`,
      prioridad: 'ALTA'
    });

    res.json({ 
      mensaje: 'Monto asignado correctamente',
      expediente 
    });
  } catch (error) {
    console.error('Error al asignar monto:', error);
    res.status(500).json({ error: 'Error al asignar monto de pago' });
  }
});

// Subir voucher de pago
router.post('/:id/voucher', auth, upload.single('voucher'), async (req, res) => {
  try {
    const { numeroOperacion, fechaPago } = req.body;
    const expediente = await Expediente.findById(req.params.id);

    if (!expediente) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    // Verificar permisos
    if (req.usuario.rol === 'USUARIO_EXTERNO' && 
        expediente.solicitante.email !== req.usuario.email) {
      return res.status(403).json({ error: 'No tienes permiso para modificar este expediente' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se ha proporcionado ningún archivo' });
    }

    if (!numeroOperacion || !fechaPago) {
      return res.status(400).json({ error: 'Debe proporcionar número de operación y fecha de pago' });
    }

    // Actualizar información de pago con el voucher
    if (!expediente.pago) {
      expediente.pago = {};
    }
    
    // Guardar solo la ruta relativa del voucher
    const rutaCompleta = req.file.path;
    const rutaRelativa = rutaCompleta.replace(/\\/g, '/').split('uploads/')[1];
    
    expediente.pago.comprobante = `uploads/${rutaRelativa}`;
    expediente.pago.numeroOperacion = numeroOperacion;
    expediente.pago.fechaOperacion = new Date(fechaPago);
    expediente.pago.fechaPago = new Date();
    expediente.pago.metodoPago = 'BANCO_NACION';
    expediente.pago.estado = 'PAGADO';

    await expediente.save();

    // Registrar en historial
    await registrarHistorial(expediente._id, {
      accion: 'VOUCHER_SUBIDO',
      usuario: req.usuario._id,
      detalles: `Voucher de pago del Banco de la Nación registrado. N° Operación: ${numeroOperacion}`
    });

    // Buscar usuario del solicitante para notificación
    const usuarioSolicitante = await Usuario.findOne({ email: expediente.solicitante.email });

    // Enviar notificación
    await enviarNotificacion({
      destinatario: expediente.solicitante.email,
      usuarioId: usuarioSolicitante?._id,
      expedienteId: expediente._id,
      tipo: 'INFO',
      asunto: `Pago Registrado - Expediente ${expediente.numeroExpediente}`,
      mensaje: `Su comprobante de pago ha sido registrado exitosamente. N° Operación: ${numeroOperacion}`,
      prioridad: 'NORMAL'
    });

    res.json({ 
      mensaje: 'Voucher y datos de pago registrados exitosamente',
      expediente 
    });
  } catch (error) {
    console.error('Error al subir voucher:', error);
    res.status(500).json({ error: error.message || 'Error al subir voucher' });
  }
});

// Enviar mensaje personalizado al usuario (solo GERENTE y MESA_PARTES)
router.post('/:id/enviar-mensaje', auth, requiereRol('GERENTE', 'MESA_PARTES'), async (req, res) => {
  try {
    console.log('🚀 Recibida solicitud de enviar mensaje');
    console.log('   - Expediente ID:', req.params.id);
    console.log('   - Body:', req.body);
    
    const { asunto, mensaje } = req.body;

    if (!asunto || !mensaje) {
      return res.status(400).json({ error: 'El asunto y el mensaje son requeridos' });
    }

    // Buscar expediente
    const expediente = await Expediente.findById(req.params.id);
    console.log('   - Expediente encontrado:', expediente ? 'SÍ' : 'NO');
    console.log('   - Solicitante email:', expediente?.solicitante?.email);

    if (!expediente) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    if (!expediente.solicitante || !expediente.solicitante.email) {
      return res.status(400).json({ error: 'El expediente no tiene un solicitante asociado' });
    }

    // Buscar el usuario por email para obtener su ID
    const usuario = await Usuario.findOne({ email: expediente.solicitante.email });
    console.log('   - Usuario encontrado en BD:', usuario ? 'SÍ' : 'NO');
    console.log('   - Usuario ID:', usuario?._id);

    if (!usuario) {
      return res.status(404).json({ error: 'No se encontró el usuario del solicitante en la base de datos' });
    }

    // Determinar tipo de notificación según el asunto
    let tipo = 'MENSAJE';
    const asuntoLower = asunto.toLowerCase();
    if (asuntoLower.includes('inspecc')) tipo = 'INSPECCION';
    else if (asuntoLower.includes('observa')) tipo = 'OBSERVACION';
    else if (asuntoLower.includes('aprob')) tipo = 'APROBACION';
    else if (asuntoLower.includes('rechaz')) tipo = 'RECHAZO';

    console.log('   - Tipo de notificación:', tipo);
    
    // Enviar notificación (email + guardar en BD)
    await enviarNotificacion({
      destinatario: expediente.solicitante.email,
      asunto,
      mensaje,
      usuarioId: usuario._id,
      expedienteId: expediente._id,
      tipo,
      prioridad: 'NORMAL'
    });

    // Registrar en historial
    await registrarHistorial(req.params.id, {
      accion: 'MENSAJE_ENVIADO',
      detalles: `Mensaje enviado: ${asunto}`,
      usuario: req.usuario.id
    });

    res.json({ 
      mensaje: 'Mensaje enviado exitosamente (correo y notificación en la app)',
      notificacionCreada: true
    });
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({ error: error.message || 'Error al enviar mensaje' });
  }
});

// Configuración de multer para licencia final (solo PDF)
const uploadLicencia = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF para la licencia'));
    }
  }
});

// Subir licencia final y enviar al usuario (solo GERENTE)
router.post('/:id/subir-licencia', auth, requiereRol('GERENTE'), uploadLicencia.single('licencia'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Debe adjuntar el archivo PDF de la licencia' });
    }

    const expediente = await Expediente.findById(req.params.id);

    if (!expediente) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    // Buscar usuario solicitante por email (solicitante es objeto embebido, no referencia)
    const usuario = await Usuario.findOne({ email: expediente.solicitante.email });
    
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario solicitante no encontrado' });
    }

    // Convertir ruta a relativa
    let rutaRelativa = req.file.path.replace(/\\/g, '/');
    if (rutaRelativa.includes('uploads/')) {
      rutaRelativa = 'uploads/' + rutaRelativa.split('uploads/')[1];
    }

    // Guardar información de la licencia en el expediente
    expediente.licenciaFinal = {
      nombre: req.file.originalname,
      ruta: rutaRelativa,
      fechaCarga: new Date(),
      enviadaAlUsuario: false
    };

    // Actualizar estado a LICENCIA_EMITIDA
    expediente.estado = 'LICENCIA_EMITIDA';

    await expediente.save();

    // Enviar licencia por correo con archivo adjunto
    const rutaCompleta = path.join(__dirname, '../../', rutaRelativa);
    const resultado = await enviarLicenciaAprobada(usuario, expediente, rutaCompleta);

    if (resultado.success) {
      // Marcar como enviada
      expediente.licenciaFinal.enviadaAlUsuario = true;
      expediente.licenciaFinal.fechaEnvio = new Date();
      await expediente.save();
    }

    // Registrar en historial
    await registrarHistorial(req.params.id, {
      accion: 'LICENCIA_EMITIDA',
      detalles: `Licencia de construcción emitida y enviada al usuario: ${usuario.email}`,
      usuario: req.usuario.id
    });

    res.json({ 
      mensaje: 'Licencia subida y enviada exitosamente al usuario',
      expediente,
      emailEnviado: resultado.success
    });
  } catch (error) {
    console.error('Error al subir licencia:', error);
    res.status(500).json({ error: error.message || 'Error al subir licencia' });
  }
});

// Descargar licencia final
router.get('/:id/descargar-licencia', auth, async (req, res) => {
  try {
    const expediente = await Expediente.findById(req.params.id);

    if (!expediente) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    if (!expediente.licenciaFinal || !expediente.licenciaFinal.ruta) {
      return res.status(404).json({ error: 'No hay licencia disponible para este expediente' });
    }

    // Verificar permisos: gerente/mesa de partes o el mismo solicitante (comparar por email ya que solicitante es objeto embebido)
    const rolesPermitidos = ['GERENTE', 'MESA_PARTES'];
    if (!rolesPermitidos.includes(req.usuario.rol) && expediente.solicitante.email !== req.usuario.email) {
      return res.status(403).json({ error: 'No tiene permiso para descargar esta licencia' });
    }

    const rutaArchivo = path.join(__dirname, '../../', expediente.licenciaFinal.ruta);

    if (!fs.existsSync(rutaArchivo)) {
      return res.status(404).json({ error: 'Archivo de licencia no encontrado en el servidor' });
    }

    res.download(rutaArchivo, expediente.licenciaFinal.nombre);
  } catch (error) {
    console.error('Error al descargar licencia:', error);
    res.status(500).json({ error: 'Error al descargar licencia' });
  }
});

// Subsanar documentos observados
router.post('/:id/subsanar', auth, upload.fields([
  { name: 'formularioUnico', maxCount: 1 },
  { name: 'certificadoLiteral', maxCount: 1 },
  { name: 'declaracionJurada', maxCount: 1 },
  { name: 'documentoDerecho', maxCount: 1 },
  { name: 'vigenciaPoder', maxCount: 1 },
  { name: 'licenciaAnterior', maxCount: 1 },
  { name: 'planoUbicacion', maxCount: 1 },
  { name: 'planosArquitectura', maxCount: 1 },
  { name: 'planosEspecialidades', maxCount: 1 },
  { name: 'planoSenalizacion', maxCount: 1 },
  { name: 'cartaSeguridad', maxCount: 1 }
]), async (req, res) => {
  try {
    const expediente = await Expediente.findById(req.params.id);

    if (!expediente) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    // Verificar permisos
    if (req.usuario.rol === 'USUARIO_EXTERNO' && 
        expediente.solicitante.email !== req.usuario.email) {
      return res.status(403).json({ error: 'No tienes permiso para modificar este expediente' });
    }

    // Verificar que el expediente tenga observaciones
    if (!expediente.estado.includes('OBSERV') && expediente.estado !== 'DOCUMENTOS_INCOMPLETOS') {
      return res.status(400).json({ error: 'Este expediente no tiene observaciones pendientes' });
    }

    // Actualizar documentos
    if (req.files) {
      Object.keys(req.files).forEach(fieldName => {
        if (req.files[fieldName] && req.files[fieldName][0]) {
          const rutaCompleta = req.files[fieldName][0].path;
          const rutaRelativa = rutaCompleta.replace(/\\/g, '/').split('uploads/')[1];
          
          expediente.documentos[fieldName] = {
            nombre: req.files[fieldName][0].originalname,
            ruta: `uploads/${rutaRelativa}`,
            fechaCarga: new Date()
          };
        }
      });
    }

    // Cambiar estado a REGISTRADO para nueva revisión
    const estadoAnterior = expediente.estado;
    expediente.estado = 'REGISTRADO';
    expediente.departamentoActual = 'MESA_PARTES';

    await expediente.save();

    // Registrar en historial
    await registrarHistorial(expediente._id, {
      accion: 'SUBSANACION_DOCUMENTOS',
      usuario: req.usuario._id,
      detalles: `Usuario subsanó ${Object.keys(req.files || {}).length} documento(s)`,
      estadoAnterior,
      estadoNuevo: 'REGISTRADO'
    });

    // Notificar a todos los usuarios de Mesa de Partes
    const usuariosMesaPartes = await Usuario.find({ rol: 'MESA_PARTES', activo: true });
    
    for (const usuarioMP of usuariosMesaPartes) {
      await enviarNotificacion({
        destinatario: usuarioMP.email,
        usuarioId: usuarioMP._id,
        expedienteId: expediente._id,
        tipo: 'INFO',
        asunto: '📝 Documentos subsanados',
        mensaje: `El expediente ${expediente.numeroExpediente} ha subsanado documentos observados y requiere nueva revisión.`,
        prioridad: 'ALTA'
      });
    }

    res.json({ 
      mensaje: 'Documentos subsanados correctamente. Tu expediente será revisado nuevamente.',
      expediente 
    });
  } catch (error) {
    console.error('Error al subsanar documentos:', error);
    res.status(500).json({ error: error.message || 'Error al subsanar documentos' });
  }
});

module.exports = router;
