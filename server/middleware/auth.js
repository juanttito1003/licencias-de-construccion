const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Middleware de autenticación
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('❌ Auth: Token no proporcionado en', req.method, req.path);
      return res.status(401).json({ error: 'Acceso no autorizado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(decoded.id).select('-password');
    
    if (!usuario) {
      console.log('❌ Auth: Usuario no encontrado', decoded.id);
      return res.status(401).json({ error: 'Usuario no válido' });
    }
    
    if (!usuario.activo) {
      console.log('❌ Auth: Usuario inactivo', usuario.email);
      return res.status(401).json({ error: 'Usuario no válido' });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    console.log('❌ Auth: Error al verificar token -', error.message, 'en', req.method, req.path);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware de autorización por rol
const requiereRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }

    next();
  };
};

module.exports = { auth, requiereRol };
