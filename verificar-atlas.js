const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function verificarAtlas() {
  try {
    console.log('\n🔍 VERIFICANDO CONEXIÓN A MONGODB ATLAS\n');
    console.log('='.repeat(60));
    
    console.log('\n📡 Conectando a MongoDB Atlas...');
    console.log(`   URI: ${process.env.MONGODB_URI.replace(/:[^:@]+@/, ':****@')}`);
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('\n✅ CONEXIÓN EXITOSA A MONGODB ATLAS');
    console.log('='.repeat(60));
    
    // Ver bases de datos disponibles
    const admin = mongoose.connection.db.admin();
    const { databases } = await admin.listDatabases();
    
    console.log('\n📚 Bases de datos disponibles:');
    databases.forEach(db => {
      console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // Ver colecciones en nuestra base de datos
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log('\n📦 Colecciones en "licencias_construccion":');
    if (collections.length === 0) {
      console.log('   ⚠️  No hay colecciones aún (base de datos vacía)');
    } else {
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ MongoDB Atlas está listo para usar');
    console.log('='.repeat(60) + '\n');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR AL CONECTAR A MONGODB ATLAS\n');
    console.error('Detalles:', error.message);
    console.error('\nVerifica:');
    console.error('  1. La cadena de conexión en .env es correcta');
    console.error('  2. El usuario y contraseña son correctos');
    console.error('  3. Network Access permite tu IP (0.0.0.0/0)');
    console.error('  4. El cluster está activo en MongoDB Atlas\n');
    await mongoose.connection.close();
    process.exit(1);
  }
}

verificarAtlas();
