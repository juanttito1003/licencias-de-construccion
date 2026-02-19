const mongoose = require('mongoose');
require('dotenv').config();

async function verBaseDatos() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/licencias_construccion');
    console.log('✓ Conectado a MongoDB\n');

    // Ver todas las colecciones
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📂 COLECCIONES EN LA BASE DE DATOS:');
    console.log('=====================================\n');
    
    for (const col of collections) {
      const collectionName = col.name;
      const count = await mongoose.connection.db.collection(collectionName).countDocuments();
      console.log(`📁 ${collectionName}: ${count} documentos`);
    }

    console.log('\n=====================================\n');

    // Usuarios
    console.log('👥 USUARIOS:');
    console.log('-------------------------------------');
    const usuarios = await mongoose.connection.db.collection('usuarios').find().toArray();
    usuarios.forEach(u => {
      console.log(`  - ${u.nombres} ${u.apellidos}`);
      console.log(`    Email: ${u.email}`);
      console.log(`    Rol: ${u.rol}`);
      console.log(`    ID: ${u._id}`);
      console.log('');
    });

    // Expedientes
    console.log('📋 EXPEDIENTES:');
    console.log('-------------------------------------');
    const expedientes = await mongoose.connection.db.collection('expedientes').find().toArray();
    expedientes.forEach(e => {
      console.log(`  - Nº ${e.numeroExpediente}`);
      console.log(`    Proyecto: ${e.proyecto?.nombreProyecto}`);
      console.log(`    Estado: ${e.estado}`);
      console.log(`    ID: ${e._id}`);
      console.log('');
    });

    // Notificaciones
    console.log('🔔 NOTIFICACIONES:');
    console.log('-------------------------------------');
    const notificaciones = await mongoose.connection.db.collection('notificacions').find().toArray();
    if (notificaciones.length === 0) {
      console.log('  ⚠️  No hay notificaciones en la base de datos\n');
    } else {
      notificaciones.forEach(n => {
        console.log(`  - Asunto: ${n.asunto}`);
        console.log(`    Usuario ID: ${n.usuario}`);
        console.log(`    Tipo: ${n.tipo}`);
        console.log(`    Leída: ${n.leida ? 'Sí' : 'No'}`);
        console.log(`    Fecha: ${n.createdAt}`);
        console.log('');
      });
    }

    console.log('=====================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Desconectado de MongoDB');
    process.exit(0);
  }
}

verBaseDatos();
