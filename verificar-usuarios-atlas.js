const mongoose = require('mongoose');
const Usuario = require('./server/models/Usuario');
require('dotenv').config();

const verificarUsuariosAtlas = async () => {
  try {
    console.log('🔄 Conectando a MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB Atlas\n');

    // Verificar todos los usuarios
    const resultado = await Usuario.updateMany(
      { emailVerificado: { $ne: true } },
      { $set: { emailVerificado: true, activo: true } }
    );

    console.log(`✅ ${resultado.modifiedCount} usuarios actualizados`);
    
    // Mostrar todos los usuarios
    const usuarios = await Usuario.find({}).select('nombres apellidos email rol emailVerificado activo');
    console.log('\n📋 Lista de usuarios:');
    usuarios.forEach(u => {
      console.log(`  ${u.email} - ${u.rol} - Verificado: ${u.emailVerificado} - Activo: ${u.activo}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Proceso completado');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

verificarUsuariosAtlas();
