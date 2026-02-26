const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Modelos
const Usuario = require('./server/models/Usuario');
const Expediente = require('./server/models/Expediente');
const Inspeccion = require('./server/models/Inspeccion');

async function migrarDatos() {
  let conexionLocal, conexionAtlas;
  
  try {
    console.log('\n📦 MIGRACIÓN DE DATOS: LOCAL → MONGODB ATLAS\n');
    console.log('='.repeat(70));
    
    // 1. Conectar a MongoDB LOCAL
    console.log('\n📍 PASO 1: Conectando a MongoDB LOCAL...');
    conexionLocal = await mongoose.createConnection('mongodb://localhost:27017/licencias_construccion');
    console.log('   ✅ Conectado a MongoDB Local');
    
    // Modelos en conexión local
    const UsuarioLocal = conexionLocal.model('Usuario', require('./server/models/Usuario').schema);
    const ExpedienteLocal = conexionLocal.model('Expediente', require('./server/models/Expediente').schema);
    const InspeccionLocal = conexionLocal.model('Inspeccion', require('./server/models/Inspeccion').schema);
    
    // 2. Conectar a MongoDB ATLAS
    console.log('\n☁️  PASO 2: Conectando a MongoDB ATLAS...');
    conexionAtlas = await mongoose.createConnection(process.env.MONGODB_URI);
    console.log('   ✅ Conectado a MongoDB Atlas');
    
    // Modelos en conexión Atlas
    const UsuarioAtlas = conexionAtlas.model('Usuario', require('./server/models/Usuario').schema);
    const ExpedienteAtlas = conexionAtlas.model('Expediente', require('./server/models/Expediente').schema);
    const InspeccionAtlas = conexionAtlas.model('Inspeccion', require('./server/models/Inspeccion').schema);
    
    // 3. Exportar datos de LOCAL
    console.log('\n📤 PASO 3: Exportando datos de MongoDB Local...');
    
    const usuarios = await UsuarioLocal.find({}).lean();
    console.log(`   ✅ ${usuarios.length} usuarios exportados`);
    
    const expedientes = await ExpedienteLocal.find({}).lean();
    console.log(`   ✅ ${expedientes.length} expedientes exportados`);
    
    const inspecciones = await InspeccionLocal.find({}).lean();
    console.log(`   ✅ ${inspecciones.length} inspecciones exportadas`);
    
    const totalRegistros = usuarios.length + expedientes.length + inspecciones.length;
    
    if (totalRegistros === 0) {
      console.log('\n   ⚠️  No hay datos para migrar en la base de datos local');
      await conexionLocal.close();
      await conexionAtlas.close();
      process.exit(0);
    }
    
    // 4. Importar datos a ATLAS
    console.log('\n📥 PASO 4: Importando datos a MongoDB Atlas...');
    
    if (usuarios.length > 0) {
      // Limpiar _id para que Mongo genere nuevos IDs si es necesario
      const usuariosParaInsertar = usuarios.map(u => {
        const { _id, ...resto } = u;
        return { ...resto, _id }; // Mantener IDs originales para referencias
      });
      await UsuarioAtlas.insertMany(usuariosParaInsertar);
      console.log(`   ✅ ${usuarios.length} usuarios importados`);
    }
    
    if (expedientes.length > 0) {
      const expedientesParaInsertar = expedientes.map(e => {
        const { _id, ...resto } = e;
        return { ...resto, _id };
      });
      await ExpedienteAtlas.insertMany(expedientesParaInsertar);
      console.log(`   ✅ ${expedientes.length} expedientes importados`);
    }
    
    if (inspecciones.length > 0) {
      const inspeccionesParaInsertar = inspecciones.map(i => {
        const { _id, ...resto } = i;
        return { ...resto, _id };
      });
      await InspeccionAtlas.insertMany(inspeccionesParaInsertar);
      console.log(`   ✅ ${inspecciones.length} inspecciones importadas`);
    }
    
    // 5. Verificar migración
    console.log('\n✔️  PASO 5: Verificando migración...');
    const usuariosAtlas = await UsuarioAtlas.countDocuments();
    const expedientesAtlas = await ExpedienteAtlas.countDocuments();
    const inspeccionesAtlas = await InspeccionAtlas.countDocuments();
    
    console.log(`   ✅ Usuarios en Atlas: ${usuariosAtlas}`);
    console.log(`   ✅ Expedientes en Atlas: ${expedientesAtlas}`);
    console.log(`   ✅ Inspecciones en Atlas: ${inspeccionesAtlas}`);
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');
    console.log('='.repeat(70));
    console.log('\n💡 Ahora tu aplicación usará MongoDB Atlas en lugar de local');
    console.log('   Para volver a usar local, cambia MONGODB_URI en .env\n');
    
    await conexionLocal.close();
    await conexionAtlas.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR EN LA MIGRACIÓN\n');
    console.error('Detalles:', error.message);
    console.error('\nStack:', error.stack);
    
    if (conexionLocal) await conexionLocal.close();
    if (conexionAtlas) await conexionAtlas.close();
    process.exit(1);
  }
}

migrarDatos();
