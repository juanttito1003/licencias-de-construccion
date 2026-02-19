const mongoose = require('mongoose');
const path = require('path');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/licencias_construccion';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✓ Conectado a MongoDB'))
.catch(err => {
  console.error('Error al conectar a MongoDB:', err);
  process.exit(1);
});

async function verificarUsuarios() {
  try {
    console.log('\n🔍 VERIFICANDO USUARIOS Y CONTRASEÑAS\n');
    
    const usuarios = await Usuario.find({});
    
    console.log(`Total de usuarios: ${usuarios.length}\n`);
    
    for (const usuario of usuarios) {
      console.log('═══════════════════════════════════════');
      console.log(`Email: ${usuario.email}`);
      console.log(`Nombre: ${usuario.nombres} ${usuario.apellidos}`);
      console.log(`Rol: ${usuario.rol}`);
      console.log(`Departamento: ${usuario.departamento}`);
      console.log(`Activo: ${usuario.activo}`);
      console.log(`Email Verificado: ${usuario.emailVerificado}`);
      console.log(`Password Hash: ${usuario.password.substring(0, 20)}...`);
      
      // Probar contraseña
      const passwordCorrecta = await bcrypt.compare('123456', usuario.password);
      console.log(`✓ Password '123456': ${passwordCorrecta ? '✅ CORRECTA' : '❌ INCORRECTA'}`);
      
      // Verificar permisos
      if (usuario.permisos) {
        console.log('Permisos:', JSON.stringify(usuario.permisos, null, 2));
      } else {
        console.log('⚠️  No tiene permisos asignados');
      }
      
      console.log('');
    }
    
    console.log('═══════════════════════════════════════\n');
    
    // Probar login manualmente
    console.log('🧪 PROBANDO LOGIN CON mesa.partes@sistema.com...\n');
    
    const usuarioPrueba = await Usuario.findOne({ email: 'mesa.partes@sistema.com' });
    
    if (!usuarioPrueba) {
      console.log('❌ Usuario no encontrado');
    } else {
      console.log('✓ Usuario encontrado');
      const passwordValida = await usuarioPrueba.compararPassword('123456');
      console.log(`✓ Método compararPassword('123456'): ${passwordValida ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
      
      if (!passwordValida) {
        console.log('\n⚠️  PROBLEMA DETECTADO: Las contraseñas no coinciden');
        console.log('Solución: Ejecutar el script de corrección de contraseñas');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Conexión cerrada');
    process.exit(0);
  }
}

verificarUsuarios();
