const mongoose = require('mongoose');

const uri = 'mongodb+srv://juanttitov_db_user:TTITOjuan@cluster0.dajnrvl.mongodb.net/licencias_construccion?retryWrites=true&w=majority';

console.log('🔄 Probando conexión a MongoDB Atlas...');

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 10000,
})
.then(() => {
  console.log('✅ CONEXIÓN EXITOSA');
  console.log('📊 Estado:', mongoose.connection.readyState); // 1 = conectado
  mongoose.connection.close();
  process.exit(0);
})
.catch((error) => {
  console.error('❌ ERROR DE CONEXIÓN:');
  console.error(error.message);
  process.exit(1);
});
