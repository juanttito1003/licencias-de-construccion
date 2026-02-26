const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Expediente = require('./server/models/Expediente');

async function limpiarExpedientesPrueba() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('\n🧹 Limpiando expedientes de prueba...\n');
    
    // Eliminar expedientes que empiecen con "TEST-"
    const resultado = await Expediente.deleteMany({
      numeroExpediente: { $regex: /^TEST-/ }
    });
    
    console.log(`✅ ${resultado.deletedCount} expediente(s) de prueba eliminado(s)\n`);
    
    // Mostrar expedientes restantes
    const expedientes = await Expediente.find().select('numeroExpediente estado solicitante proyecto');
    
    console.log(`📄 Expedientes reales en el sistema: ${expedientes.length}\n`);
    expedientes.forEach((exp, i) => {
      console.log(`${i + 1}. ${exp.numeroExpediente}`);
      console.log(`   Solicitante: ${exp.solicitante.nombres} ${exp.solicitante.apellidos}`);
      console.log(`   Proyecto: ${exp.proyecto.nombreProyecto}`);
      console.log(`   Estado: ${exp.estado}\n`);
    });
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

limpiarExpedientesPrueba();
