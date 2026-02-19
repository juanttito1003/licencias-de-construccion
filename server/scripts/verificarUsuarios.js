/**
 * Script: Verificar Usuarios Existentes
 * Descripción: Marca como verificados los usuarios existentes en el sistema
 * Autor: Juan Diego Ttito Valenzuela
 * Contacto: 948 225 929
 * © 2025 Todos los derechos reservados
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');

const verificarUsuarios = async () => {
  try {
    console.log('📧 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/licencias_construccion');
    console.log('✓ Conectado a MongoDB\n');

    // Actualizar todos los usuarios para marcarlos como verificados
    const resultado = await Usuario.updateMany(
      { emailVerificado: { $ne: true } },
      { $set: { emailVerificado: true } }
    );

    console.log(`✅ Usuarios actualizados: ${resultado.modifiedCount}`);
    console.log('✓ Todos los usuarios ahora están verificados\n');

    // Mostrar usuarios verificados
    const usuarios = await Usuario.find({}, 'email nombres apellidos rol emailVerificado');
    console.log('📋 Lista de usuarios:');
    usuarios.forEach(user => {
      console.log(`   - ${user.email} (${user.rol}) - Verificado: ${user.emailVerificado ? '✓' : '✗'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

verificarUsuarios();
