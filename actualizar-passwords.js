const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const Usuario = require('./server/models/Usuario');

async function actualizarPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('\n🔐 ACTUALIZANDO CONTRASEÑAS DE USUARIOS\n');
    console.log('='.repeat(70));

    const usuarios = [
      { email: 'gerente@sistema.com', password: 'licencias123' },
      { email: 'mesa.partes@sistema.com', password: 'licencias123' },
      { email: 'mesa.partes2@sistema.com', password: 'licencias123' },
      { email: 'mesapartes@sistema.com', password: 'licencias123' },
      { email: 'tecnico@sistema.com', password: 'licencias123' },
      { email: 'tecnico1@sistema.com', password: 'licencias123' },
      { email: 'tecnico2@sistema.com', password: 'licencias123' },
      { email: 'tecnico3@sistema.com', password: 'licencias123' },
      { email: 'inspector@sistema.com', password: 'licencias123' },
      { email: 'inspector1@sistema.com', password: 'licencias123' },
      { email: 'inspector2@sistema.com', password: 'licencias123' },
      { email: 'usuario@sistema.com', password: 'licencias123' },
      { email: 'usuario1@test.com', password: 'licencias123' },
      { email: 'usuario2@test.com', password: 'licencias123' }
    ];

    for (const { email, password } of usuarios) {
      const usuario = await Usuario.findOne({ email });
      
      if (!usuario) {
        console.log(`⚠️  ${email} - NO EXISTE`);
        continue;
      }

      // Asignar contraseña en texto plano - el hook pre-save la hasheará automáticamente
      usuario.password = password;
      await usuario.save();

      console.log(`✅ ${email} - Contraseña actualizada`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ TODAS LAS CONTRASEÑAS ACTUALIZADAS');
    console.log('='.repeat(70));
    console.log('\n📝 Ahora puedes iniciar sesión con:');
    console.log('   Usuario: cualquier email de arriba');
    console.log('   Contraseña: licencias123\n');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

actualizarPassword();
