const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/licencias_construccion';

const limpiarExpedientes = async () => {
  try {
    console.log('🗑️  Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Conectado a MongoDB\n');

    // Modelos
    const Expediente = require('../models/Expediente');
    const Notificacion = require('../models/Notificacion');
    const Inspeccion = require('../models/Inspeccion');

    // Contar documentos antes de eliminar
    console.log('📊 Documentos antes de eliminar:');
    const expedientesCount = await Expediente.countDocuments();
    const notificacionesCount = await Notificacion.countDocuments();
    const inspeccionesCount = await Inspeccion.countDocuments();
    
    console.log(`   - Expedientes: ${expedientesCount}`);
    console.log(`   - Notificaciones: ${notificacionesCount}`);
    console.log(`   - Inspecciones: ${inspeccionesCount}`);
    console.log('');

    // Eliminar expedientes
    console.log('🗑️  Eliminando expedientes...');
    await Expediente.deleteMany({});
    console.log('✓ Expedientes eliminados');

    // Eliminar notificaciones
    console.log('🗑️  Eliminando notificaciones...');
    await Notificacion.deleteMany({});
    console.log('✓ Notificaciones eliminadas');

    // Eliminar inspecciones
    console.log('🗑️  Eliminando inspecciones...');
    await Inspeccion.deleteMany({});
    console.log('✓ Inspecciones eliminadas');

    console.log('\n✅ Limpieza completada exitosamente');
    console.log('ℹ️  Los usuarios se mantuvieron intactos');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
    process.exit(0);
  }
};

limpiarExpedientes();
