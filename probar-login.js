const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const Usuario = require('./server/models/Usuario');

async function probarLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('\n🔐 PROBANDO LOGIN\n');
    console.log('='.repeat(60));

    const email = 'mesa.partes@sistema.com';
    const password = 'licencias123';

    console.log(`\n1. Buscando usuario: ${email}`);
    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
      console.log('❌ Usuario NO encontrado en la base de datos');
      
      // Listar todos los usuarios mesa partes
      console.log('\n📋 Usuarios MESA_PARTES en BD:');
      const mesaPartes = await Usuario.find({ rol: 'MESA_PARTES' });
      mesaPartes.forEach(u => {
        console.log(`   - ${u.email} (${u.nombres} ${u.apellidos})`);
      });
      
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`✅ Usuario encontrado: ${usuario.nombres} ${usuario.apellidos}`);
    console.log(`   ID: ${usuario._id}`);
    console.log(`   Email: ${usuario.email}`);
    console.log(`   Rol: ${usuario.rol}`);
    console.log(`   Activo: ${usuario.activo}`);
    console.log(`   Email verificado: ${usuario.emailVerificado}`);

    console.log(`\n2. Verificando contraseña...`);
    console.log(`   Password ingresado: ${password}`);
    console.log(`   Hash en BD: ${usuario.password.substring(0, 20)}...`);

    const passwordCorrecta = await bcrypt.compare(password, usuario.password);

    if (!passwordCorrecta) {
      console.log('❌ Contraseña INCORRECTA');
      
      // Probar con la contraseña hasheada de nuevo
      console.log('\n🔄 Generando nuevo hash para comparar...');
      const nuevoHash = await bcrypt.hash(password, 10);
      console.log(`   Nuevo hash: ${nuevoHash.substring(0, 20)}...`);
      
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('✅ Contraseña CORRECTA');

    console.log('\n' + '='.repeat(60));
    console.log('✅ LOGIN EXITOSO - El usuario puede iniciar sesión');
    console.log('='.repeat(60));
    console.log('\nSi el login falla en el navegador, el problema está en:');
    console.log('  1. El frontend no está enviando los datos correctamente');
    console.log('  2. Hay un error en la ruta /api/auth/login del backend');
    console.log('  3. Problemas de CORS o conexión');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
}

probarLogin();
