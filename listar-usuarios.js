const mongoose = require('mongoose');
const Usuario = require('./server/models/Usuario');

async function listarUsuarios() {
  try {
    await mongoose.connect('mongodb://localhost:27017/licencias_construccion');
    console.log('\n=== USUARIOS EN LA BASE DE DATOS ===\n');
    
    const usuarios = await Usuario.find({}, 'email nombres apellidos rol activo emailVerificado')
      .sort('email');
    
    usuarios.forEach((u, i) => {
      console.log(`${i + 1}. ${u.email}`);
      console.log(`   Nombre: ${u.nombres} ${u.apellidos}`);
      console.log(`   Rol: ${u.rol}`);
      console.log(`   Estado: ${u.activo ? '✓ Activo' : '✗ Inactivo'}`);
      console.log(`   Email verificado: ${u.emailVerificado ? '✓ Sí' : '✗ No'}`);
      console.log('');
    });
    
    console.log(`📊 Total: ${usuarios.length} usuarios registrados\n`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

listarUsuarios();
