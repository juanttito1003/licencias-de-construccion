const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Usuario = require('./server/models/Usuario');
const Expediente = require('./server/models/Expediente');

async function verificarAsignaciones() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('\n🔍 VERIFICANDO ASIGNACIONES DE TÉCNICOS\n');
    console.log('='.repeat(70));

    // Buscar técnicos
    const tecnicos = await Usuario.find({ rol: 'TECNICO' });
    console.log(`\n📋 Técnicos en el sistema: ${tecnicos.length}\n`);
    
    tecnicos.forEach((tec, i) => {
      console.log(`${i+1}. ${tec.nombres} ${tec.apellidos}`);
      console.log(`   Email: ${tec.email}`);
      console.log(`   ID: ${tec._id}\n`);
    });

    // Buscar expedientes con asignaciones
    const expedientes = await Expediente.find()
      .populate('asignaciones.tecnico.usuario', 'nombres email')
      .populate('asignaciones.mesaPartes.usuario', 'nombres email');

    console.log('='.repeat(70));
    console.log(`\n📄 EXPEDIENTES Y SUS ASIGNACIONES\n`);

    for (const exp of expedientes) {
      console.log(`\n📌 ${exp.numeroExpediente}`);
      console.log(`   Solicitante: ${exp.solicitante.nombres} ${exp.solicitante.apellidos}`);
      console.log(`   Estado: ${exp.estado}`);
      console.log(`   Departamento: ${exp.departamentoActual}`);
      
      console.log('\n   Asignaciones:');
      
      if (exp.asignaciones.mesaPartes.usuario) {
        console.log(`   ✓ Mesa Partes: ${exp.asignaciones.mesaPartes.usuario.nombres} (${exp.asignaciones.mesaPartes.usuario.email})`);
        console.log(`     Estado: ${exp.asignaciones.mesaPartes.estado}`);
      } else {
        console.log(`   ✗ Mesa Partes: NO ASIGNADO`);
      }
      
      if (exp.asignaciones.tecnico.usuario) {
        console.log(`   ✓ Técnico: ${exp.asignaciones.tecnico.usuario.nombres} (${exp.asignaciones.tecnico.usuario.email})`);
        console.log(`     Estado: ${exp.asignaciones.tecnico.estado}`);
        console.log(`     Usuario ID: ${exp.asignaciones.tecnico.usuario._id}`);
      } else {
        console.log(`   ✗ Técnico: NO ASIGNADO`);
      }
      
      if (exp.asignaciones.inspector.usuario) {
        console.log(`   ✓ Inspector: ASIGNADO (${exp.asignaciones.inspector.estado})`);
      }
      
      if (exp.asignaciones.gerente.usuario) {
        console.log(`   ✓ Gerente: ASIGNADO (${exp.asignaciones.gerente.estado})`);
      }
    }

    // Buscar expedientes específicos para cada técnico
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 EXPEDIENTES POR TÉCNICO\n');

    for (const tecnico of tecnicos) {
      const expedientesAsignados = await Expediente.find({
        'asignaciones.tecnico.usuario': tecnico._id
      });

      console.log(`\n👤 ${tecnico.nombres} (${tecnico.email})`);
      console.log(`   ID: ${tecnico._id}`);
      console.log(`   Expedientes asignados: ${expedientesAsignados.length}`);
      
      expedientesAsignados.forEach(exp => {
        console.log(`   - ${exp.numeroExpediente} (${exp.estado})`);
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Verificación completa\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

verificarAsignaciones();
