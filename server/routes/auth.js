const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Usuario = require('../models/Usuario');
const { 
  enviarEmailVerificacion, 
  enviarCodigoCambioContrasena, 
  enviarCodigoRegistro,
  generarCodigoNumerico 
} = require('../utils/email');
const redisClient = require('../config/redis');
const { 
  validarDNIPeru, 
  validarTelefonoPeru, 
  validarEmail, 
  validarContrasena,
  validarNombreCompleto 
} = require('../utils/validadores');

// Paso 1: Solicitar código de registro
router.post('/solicitar-codigo-registro', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'El email es requerido' });
    }

    // Validar formato de email
    const validacionEmail = validarEmail(email);
    if (!validacionEmail.valido) {
      return res.status(400).json({ error: validacionEmail.error });
    }

    // Rate limiting: máximo 3 intentos cada 15 minutos por email
    const rateLimitKey = `rate:registro:${email}`;
    const rateLimit = await redisClient.checkRateLimit(rateLimitKey, 3, 900); // 15 min
    
    if (!rateLimit.permitido) {
      return res.status(429).json({ 
        error: `Demasiadas solicitudes. Has alcanzado el límite de ${rateLimit.limite} intentos. Intenta de nuevo en 15 minutos.`,
        intentos: rateLimit.intentos,
        limite: rateLimit.limite
      });
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({ email: validacionEmail.email });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'Este correo ya está registrado' });
    }

    // Generar código numérico de 6 dígitos
    const codigo = generarCodigoNumerico();

    // Guardar código en Redis (expira en 10 minutos)
    const codigoKey = `codigo:registro:${email}`;
    await redisClient.setCode(codigoKey, {
      codigo,
      email: validacionEmail.email,
      intentos: 0,
      fechaSolicitud: new Date().toISOString()
    }, 600); // 10 minutos

    // Enviar código por correo
    const resultadoEmail = await enviarCodigoRegistro(email, 'Usuario', codigo);
    
    if (!resultadoEmail.success) {
      console.error('Error al enviar código:', resultadoEmail.error);
      return res.status(500).json({ error: 'Error al enviar el código de verificación' });
    }

    res.json({
      mensaje: 'Código de verificación enviado a tu correo',
      email: validacionEmail.email,
      emailEnviado: resultadoEmail.success,
      expiraEn: '10 minutos'
    });
  } catch (error) {
    console.error('Error al solicitar código:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

// Paso 2: Verificar código y completar registro
router.post('/verificar-codigo-registro', async (req, res) => {
  try {
    const { email, codigo, nombres, apellidos, password, confirmarPassword, dni, telefono, rol } = req.body;

    // Validaciones básicas
    if (!email || !codigo || !nombres || !apellidos || !password || !confirmarPassword || !dni) {
      return res.status(400).json({ error: 'Todos los campos obligatorios deben ser completados' });
    }

    // Validar contraseñas coincidan
    if (password !== confirmarPassword) {
      return res.status(400).json({ error: 'Las contraseñas no coinciden' });
    }

    // Validar nombres y apellidos
    const validacionNombres = validarNombreCompleto(nombres);
    if (!validacionNombres.valido) {
      return res.status(400).json({ error: `Nombres inválidos: ${validacionNombres.error}` });
    }

    const validacionApellidos = validarNombreCompleto(apellidos);
    if (!validacionApellidos.valido) {
      return res.status(400).json({ error: `Apellidos inválidos: ${validacionApellidos.error}` });
    }

    // Validar DNI
    const validacionDNI = validarDNIPeru(dni);
    if (!validacionDNI.valido) {
      return res.status(400).json({ error: validacionDNI.error });
    }

    // Validar teléfono (opcional)
    if (telefono) {
      const validacionTelefono = validarTelefonoPeru(telefono);
      if (!validacionTelefono.valido) {
        return res.status(400).json({ error: validacionTelefono.error });
      }
    }

    // Validar contraseña segura
    const validacionPassword = validarContrasena(password);
    if (!validacionPassword.valido) {
      return res.status(400).json({ 
        error: `Contraseña insegura: ${validacionPassword.errores.join(', ')}` 
      });
    }

    // Verificar código en Redis
    const codigoKey = `codigo:registro:${email}`;
    const codigoPendiente = await redisClient.getCode(codigoKey);
    
    if (!codigoPendiente) {
      return res.status(400).json({ 
        error: 'No se encontró un código para este correo o ha expirado. Solicita uno nuevo.' 
      });
    }

    // Verificar intentos
    if (codigoPendiente.intentos >= 3) {
      await redisClient.deleteCode(codigoKey);
      return res.status(400).json({ 
        error: 'Demasiados intentos fallidos. Solicita un nuevo código.' 
      });
    }

    // Verificar código correcto
    if (codigoPendiente.codigo !== codigo) {
      const resultado = await redisClient.incrementAttempts(codigoKey);
      
      if (resultado.bloqueado) {
        return res.status(400).json({ 
          error: 'Código incorrecto. Demasiados intentos fallidos. Solicita un nuevo código.',
          intentosRestantes: 0
        });
      }
      
      return res.status(400).json({ 
        error: 'Código incorrecto',
        intentosRestantes: 3 - resultado.intentos
      });
    }

    // Verificar que el usuario no existe
    const usuarioExistente = await Usuario.findOne({ 
      $or: [
        { email: codigoPendiente.email }, 
        { dni: validacionDNI.dni }
      ] 
    });
    
    if (usuarioExistente) {
      await redisClient.deleteCode(codigoKey);
      
      if (usuarioExistente.email === codigoPendiente.email) {
        return res.status(400).json({ error: 'Este correo ya está registrado' });
      } else {
        return res.status(400).json({ error: 'Este DNI ya está registrado' });
      }
    }

    // Crear nuevo usuario
    const usuario = new Usuario({
      nombres: validacionNombres.nombre,
      apellidos: validacionApellidos.nombre,
      email: codigoPendiente.email,
      password,
      dni: validacionDNI.dni,
      telefono: telefono || '',
      rol: rol || 'USUARIO_EXTERNO',
      emailVerificado: true
    });

    await usuario.save();

    // Limpiar código usado
    await redisClient.deleteCode(codigoKey);

    res.status(201).json({
      mensaje: 'Registro completado exitosamente. Ya puedes iniciar sesión.',
      usuario: {
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        email: usuario.email
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'El email o DNI ya está registrado' 
      });
    }
    
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// Reenviar código de registro
router.post('/reenviar-codigo-registro', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'El email es requerido' });
    }

    // Validar email
    const validacionEmail = validarEmail(email);
    if (!validacionEmail.valido) {
      return res.status(400).json({ error: validacionEmail.error });
    }

    // Rate limiting más estricto para reenvíos: 2 cada 10 minutos
    const rateLimitKey = `rate:reenvio:${email}`;
    const rateLimit = await redisClient.checkRateLimit(rateLimitKey, 2, 600);
    
    if (!rateLimit.permitido) {
      return res.status(429).json({ 
        error: `Demasiados reenvíos. Intenta de nuevo en 10 minutos.`,
        intentos: rateLimit.intentos,
        limite: rateLimit.limite
      });
    }

    // Verificar que no exista el usuario
    const usuarioExistente = await Usuario.findOne({ email: validacionEmail.email });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'Este correo ya está registrado' });
    }

    // Verificar que exista un código previo
    const codigoKey = `codigo:registro:${email}`;
    const codigoPrevio = await redisClient.getCode(codigoKey);
    
    if (!codigoPrevio) {
      return res.status(400).json({ 
        error: 'No hay un código previo para reenviar. Solicita uno nuevo desde el inicio.' 
      });
    }

    // Generar nuevo código
    const codigo = generarCodigoNumerico();

    // Actualizar código en Redis
    await redisClient.setCode(codigoKey, {
      codigo,
      email: validacionEmail.email,
      intentos: 0,
      fechaSolicitud: new Date().toISOString(),
      reenvio: true
    }, 600); // 10 minutos

    // Enviar código por correo
    const resultadoEmail = await enviarCodigoRegistro(email, 'Usuario', codigo);
    
    if (!resultadoEmail.success) {
      console.error('Error al enviar código:', resultadoEmail.error);
      return res.status(500).json({ error: 'Error al enviar el código de verificación' });
    }

    res.json({
      mensaje: 'Código reenviado exitosamente',
      email: validacionEmail.email,
      emailEnviado: resultadoEmail.success,
      expiraEn: '10 minutos'
    });
  } catch (error) {
    console.error('Error al reenviar código:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

// Verificar email
router.get('/verificar-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Buscar usuario con el token
    const usuario = await Usuario.findOne({
      tokenVerificacion: token,
      tokenVerificacionExpira: { $gt: Date.now() }
    });

    if (!usuario) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    // Verificar el email
    usuario.emailVerificado = true;
    usuario.tokenVerificacion = undefined;
    usuario.tokenVerificacionExpira = undefined;
    await usuario.save();

    res.json({ 
      mensaje: '¡Email verificado exitosamente! Ya puedes iniciar sesión.',
      email: usuario.email
    });
  } catch (error) {
    console.error('Error al verificar email:', error);
    res.status(500).json({ error: 'Error al verificar email' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar password
    const passwordValido = await usuario.compararPassword(password);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar si el email está verificado
    if (!usuario.emailVerificado) {
      return res.status(403).json({ 
        error: 'Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.' 
      });
    }

    // Verificar si está activo
    if (!usuario.activo) {
      return res.status(403).json({ error: 'Usuario desactivado' });
    }

    // Actualizar último acceso
    usuario.ultimoAcceso = Date.now();
    await usuario.save();

    // Generar token
    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      usuario: {
        id: usuario._id,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Verificar token
router.get('/verificar', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(decoded.id).select('-password');
    
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ usuario });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

// Paso 1: Solicitar código para cambio de contraseña
router.post('/solicitar-codigo-cambio-contrasena', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(decoded.id);
    
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Generar código numérico de 6 dígitos
    const codigo = generarCodigoNumerico();
    const codigoExpira = new Date();
    codigoExpira.setMinutes(codigoExpira.getMinutes() + 10); // Expira en 10 minutos

    // Guardar código en el usuario
    usuario.codigoCambioContrasena = codigo;
    usuario.codigoCambioContrasenaExpira = codigoExpira;
    await usuario.save();

    // Enviar código por correo
    const resultadoEmail = await enviarCodigoCambioContrasena(usuario, codigo);
    
    if (!resultadoEmail.success) {
      console.error('Error al enviar código:', resultadoEmail.error);
    }

    res.json({
      mensaje: 'Código de verificación enviado a tu correo',
      email: usuario.email,
      emailEnviado: resultadoEmail.success
    });
  } catch (error) {
    console.error('Error al solicitar código:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

// Paso 2: Verificar código y cambiar contraseña
router.put('/cambiar-contrasena', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { codigo, contrasenaNueva, confirmarContrasena } = req.body;

    if (!codigo || !contrasenaNueva || !confirmarContrasena) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Validar que las contraseñas coincidan
    if (contrasenaNueva !== confirmarContrasena) {
      return res.status(400).json({ error: 'Las contraseñas no coinciden' });
    }

    // Validar contraseña segura (mínimo 8 caracteres, debe incluir números y letras)
    if (contrasenaNueva.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    if (!/[0-9]/.test(contrasenaNueva)) {
      return res.status(400).json({ error: 'La contraseña debe incluir al menos un número' });
    }

    if (!/[a-zA-Z]/.test(contrasenaNueva)) {
      return res.status(400).json({ error: 'La contraseña debe incluir al menos una letra' });
    }

    // Buscar usuario
    const usuario = await Usuario.findById(decoded.id);
    
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar código
    if (!usuario.codigoCambioContrasena) {
      return res.status(400).json({ error: 'No se ha solicitado un código. Por favor solicita uno primero.' });
    }

    if (new Date() > usuario.codigoCambioContrasenaExpira) {
      return res.status(400).json({ error: 'El código ha expirado. Solicita uno nuevo.' });
    }

    if (usuario.codigoCambioContrasena !== codigo) {
      return res.status(400).json({ error: 'Código incorrecto' });
    }

    // Actualizar contraseña
    usuario.password = contrasenaNueva;
    usuario.codigoCambioContrasena = undefined;
    usuario.codigoCambioContrasenaExpira = undefined;
    await usuario.save();

    res.json({ mensaje: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error al cambiar la contraseña' });
  }
});

module.exports = router;
