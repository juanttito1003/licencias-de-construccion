const mongoose = require('mongoose');

async function verificarNotificaciones() {
  try {
    await mongoose.connect('mongodb://localhost:27017/licencias_construccion');
    console.log('✓ Conectado a MongoDB\n');

    const Notificacion = mongoose.model('Notificacion', new mongoose.Schema({}, {strict: false}));
    const notificaciones = await Notificacion.find();
    
    console.log(`📊 Total de notificaciones: ${notificaciones.length}\n`);
    
    if (notificaciones.length > 0) {
      notificaciones.forEach((n, i) => {
        console.log(`${i + 1}. Usuario ID: ${n.usuario}`);
        console.log(`   Asunto: ${n.asunto}`);
        console.log(`   Tipo: ${n.tipo}`);
        console.log(`   Leída: ${n.leida ? 'Sí' : 'No'}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No hay notificaciones en la base de datos');
      console.log('💡 Envía un mensaje desde el panel de administrador para crear notificaciones');
    }

    await mongoose.connection.close();
    console.log('\n✓ Desconectado de MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit();
}

verificarNotificaciones();
