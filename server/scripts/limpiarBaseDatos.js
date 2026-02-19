const mongoose = require('mongoose');
const path = require('path');
const Usuario = require('../models/Usuario');
const Expediente = require('../models/Expediente');
const Notificacion = require('../models/Notificacion');
const Inspeccion = require('../models/Inspeccion');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Usar conexión por defecto si no hay .env
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/licencias_construccion';

// Conectar a MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✓ Conectado a MongoDB'))
.catch(err => {
  console.error('Error al conectar a MongoDB:', err);
  process.exit(1);
});

async function limpiarBaseDatos() {
  try {
    console.log('\n⚠️  ═══════════════════════════════════════════════════════');
    console.log('⚠️    LIMPIEZA COMPLETA DE LA BASE DE DATOS');
    console.log('⚠️  ═══════════════════════════════════════════════════════\n');
    console.log('Esta acción eliminará:');
    console.log('  ❌ Todos los usuarios');
    console.log('  ❌ Todos los expedientes');
    console.log('  ❌ Todas las notificaciones');
    console.log('  ❌ Todas las inspecciones\n');
    
    // Contar registros antes de eliminar
    const countUsuarios = await Usuario.countDocuments();
    const countExpedientes = await Expediente.countDocuments();
    const countNotificaciones = await Notificacion.countDocuments();
    const countInspecciones = await Inspeccion.countDocuments();
    
    console.log('📊 Estado actual de la base de datos:');
    console.log(`  - Usuarios: ${countUsuarios}`);
    console.log(`  - Expedientes: ${countExpedientes}`);
    console.log(`  - Notificaciones: ${countNotificaciones}`);
    console.log(`  - Inspecciones: ${countInspecciones}\n`);
    
    console.log('🔄 Eliminando todos los registros...\n');
    
    // Eliminar todo
    await Usuario.deleteMany({});
    console.log('✅ Usuarios eliminados');
    
    await Expediente.deleteMany({});
    console.log('✅ Expedientes eliminados');
    
    await Notificacion.deleteMany({});
    console.log('✅ Notificaciones eliminadas');
    
    await Inspeccion.deleteMany({});
    console.log('✅ Inspecciones eliminadas');
    
    console.log('\n✅ Base de datos completamente limpia!');
    console.log('✅ Lista para empezar desde cero con el nuevo sistema\n');

  } catch (error) {
    console.error('❌ Error al limpiar base de datos:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Conexión a MongoDB cerrada\n');
    process.exit(0);
  }
}

limpiarBaseDatos();
