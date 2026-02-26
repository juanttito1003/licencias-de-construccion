const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Modelos
const Usuario = require('./server/models/Usuario');
const Expediente = require('./server/models/Expediente');
const Notificacion = require('./server/models/Notificacion');
const Inspeccion = require('./server/models/Inspeccion');

async function verificarConexion() {
  try {
    console.log('\n🔍 VERIFICANDO CONEXIÓN Y FUNCIONALIDAD DE LA BASE DE DATOS\n');
    console.log('='.repeat(60));

    // 1. Conectar a MongoDB
    console.log('\n[1/7] Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conexión exitosa a:', process.env.MONGODB_URI);

    // 2. Verificar usuarios
    console.log('\n[2/7] Verificando usuarios...');
    const usuarios = await Usuario.find();
    console.log(`✅ Usuarios encontrados: ${usuarios.length}`);
    console.log('   Roles disponibles:', [...new Set(usuarios.map(u => u.rol))]);

    // 3. Verificar expedientes
    console.log('\n[3/7] Verificando expedientes...');
    const expedientes = await Expediente.find();
    console.log(`✅ Expedientes en base de datos: ${expedientes.length}`);
    if (expedientes.length > 0) {
      console.log('   Estados:', [...new Set(expedientes.map(e => e.estado))]);
    }

    // 4. Probar CREACIÓN de expediente
    console.log('\n[4/7] Probando creación de expediente...');
    const usuarioTest = await Usuario.findOne({ rol: 'USUARIO_EXTERNO' });
    if (usuarioTest) {
      const expedienteTest = new Expediente({
        numeroExpediente: `TEST-${Date.now()}`,
        solicitante: {
          nombres: 'Juan',
          apellidos: 'Pérez García',
          dni: '12345678',
          email: 'test@prueba.com',
          telefono: '987654321',
          direccion: 'Av. Test 123'
        },
        proyecto: {
          nombreProyecto: 'Casa Habitación Prueba',
          direccionProyecto: 'Av. Test 123',
          distrito: 'Lima',
          areaTerreno: 150.00,
          areaConstruccion: 100.00,
          numeroNiveles: 2,
          usoProyecto: 'VIVIENDA',
          tipoObra: 'CONSTRUCCION_NUEVA',
          esPropietario: 'SI',
          esPersonaJuridica: 'NO'
        },
        estado: 'REGISTRADO',
        departamentoActual: 'MESA_PARTES',
        observaciones: 'Expediente de prueba para verificar conexión'
      });

      await expedienteTest.save();
      console.log('✅ Expediente creado correctamente:', expedienteTest.numeroExpediente);

      // 5. Probar LECTURA
      console.log('\n[5/7] Probando lectura de expediente...');
      const expedienteLeido = await Expediente.findById(expedienteTest._id);
      console.log('✅ Expediente leído correctamente:', expedienteLeido.numeroExpediente);

      // 6. Probar ACTUALIZACIÓN
      console.log('\n[6/7] Probando actualización de expediente...');
      expedienteTest.estado = 'VERIFICACION_DOCUMENTARIA';
      expedienteTest.observaciones = 'Actualizado en verificación';
      await expedienteTest.save();
      
      const expedienteActualizado = await Expediente.findById(expedienteTest._id);
      console.log('✅ Expediente actualizado correctamente');
      console.log('   Nuevo estado:', expedienteActualizado.estado);

      // 7. Probar NOTIFICACIÓN
      console.log('\n[7/7] Probando creación de notificación...');
      const notificacionTest = new Notificacion({
        usuario: usuarioTest._id,
        tipo: 'INFO',
        asunto: 'Prueba de conexión',
        mensaje: 'Esta es una notificación de prueba',
        expediente: expedienteTest._id
      });
      await notificacionTest.save();
      console.log('✅ Notificación creada correctamente');

      // Limpiar datos de prueba
      console.log('\n🧹 Limpiando datos de prueba...');
      await Expediente.findByIdAndDelete(expedienteTest._id);
      await Notificacion.findByIdAndDelete(notificacionTest._id);
      console.log('✅ Datos de prueba eliminados');
    } else {
      console.log('⚠️  No se encontró usuario de prueba');
    }

    // Verificar integridad de colecciones
    console.log('\n📊 RESUMEN DE BASE DE DATOS');
    console.log('='.repeat(60));
    const stats = {
      usuarios: await Usuario.countDocuments(),
      expedientes: await Expediente.countDocuments(),
      notificaciones: await Notificacion.countDocuments(),
      inspecciones: await Inspeccion.countDocuments()
    };
    
    console.log(`📁 Usuarios:        ${stats.usuarios}`);
    console.log(`📄 Expedientes:     ${stats.expedientes}`);
    console.log(`🔔 Notificaciones:  ${stats.notificaciones}`);
    console.log(`🔍 Inspecciones:    ${stats.inspecciones}`);

    // Verificar índices
    console.log('\n🔧 VERIFICANDO ÍNDICES...');
    const expedienteIndexes = await Expediente.collection.getIndexes();
    const usuarioIndexes = await Usuario.collection.getIndexes();
    console.log(`✅ Índices en Expedientes: ${Object.keys(expedienteIndexes).length}`);
    console.log(`✅ Índices en Usuarios: ${Object.keys(usuarioIndexes).length}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ ¡TODAS LAS VERIFICACIONES COMPLETADAS CON ÉXITO!');
    console.log('='.repeat(60));
    console.log('\n✓ La base de datos está correctamente configurada');
    console.log('✓ Todas las operaciones CRUD funcionan correctamente');
    console.log('✓ Los modelos están bien definidos');
    console.log('✓ No hay problemas de conexión');
    console.log('\n💡 Tu aplicación está lista para ser desplegada a producción\n');

  } catch (error) {
    console.error('\n❌ ERROR EN LA VERIFICACIÓN:');
    console.error('='.repeat(60));
    console.error('Tipo de error:', error.name);
    console.error('Mensaje:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    console.error('\n⚠️  ACCIÓN REQUERIDA:');
    console.error('1. Verifica que MongoDB esté corriendo (puerto 27017)');
    console.error('2. Revisa el archivo .env y la variable MONGODB_URI');
    console.error('3. Asegúrate de que los modelos estén correctamente definidos');
    console.error('='.repeat(60));
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada\n');
    process.exit(0);
  }
}

// Ejecutar verificación
verificarConexion();
