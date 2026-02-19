/**
 * Script para limpiar datos del sistema
 * Autor: Juan Diego Ttito Valenzuela
 * Contacto: 948 225 929
 * © 2025 Todos los derechos reservados
 */

const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const Expediente = require('../models/Expediente');

const limpiarDatos = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect('mongodb://localhost:27017/licencias_construccion');
    console.log('✅ Conectado a MongoDB');

    // 1. Eliminar todos los expedientes
    const expedientesEliminados = await Expediente.deleteMany({});
    console.log(`\n📋 Expedientes eliminados: ${expedientesEliminados.deletedCount}`);

    // 2. Eliminar todos los usuarios EXCEPTO usuario@sistema.com
    const usuariosEliminados = await Usuario.deleteMany({
      email: { $ne: 'usuario@sistema.com' }
    });
    console.log(`👥 Usuarios eliminados: ${usuariosEliminados.deletedCount}`);

    // 3. Verificar que usuario@sistema.com sigue existiendo
    const usuarioMantenido = await Usuario.findOne({ email: 'usuario@sistema.com' });
    if (usuarioMantenido) {
      console.log('\n✅ Usuario mantenido:');
      console.log(`   Email: ${usuarioMantenido.email}`);
      console.log(`   Nombre: ${usuarioMantenido.nombre}`);
      console.log(`   Rol: ${usuarioMantenido.rol}`);
      console.log('   Password: usuario123');
    } else {
      console.log('\n⚠️  Advertencia: No se encontró usuario@sistema.com');
    }

    console.log('\n✅ Limpieza completada exitosamente');
    console.log('💡 El sistema está listo para nuevos expedientes');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al limpiar datos:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

limpiarDatos();
