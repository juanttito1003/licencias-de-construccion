const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Usuario = require('../models/Usuario');

// Cargar variables de entorno
dotenv.config({ path: '../.env' });

// Usuarios a crear
const usuarios = [
  {
    nombres: 'Gerente',
    apellidos: 'General',
    email: 'gerente@sistema.com',
    password: 'gerente123',
    dni: '12345678',
    telefono: '987654321',
    rol: 'GERENTE'
  },
  {
    nombres: 'Mesa de',
    apellidos: 'Partes',
    email: 'mesapartes@sistema.com',
    password: 'mesa123',
    dni: '23456789',
    telefono: '987654322',
    rol: 'MESA_PARTES'
  },
  {
    nombres: 'Técnico',
    apellidos: 'Revisor',
    email: 'tecnico@sistema.com',
    password: 'tecnico123',
    dni: '34567890',
    telefono: '987654323',
    rol: 'TECNICO'
  },
  {
    nombres: 'Inspector',
    apellidos: 'Campo',
    email: 'inspector@sistema.com',
    password: 'inspector123',
    dni: '45678901',
    telefono: '987654324',
    rol: 'INSPECTOR'
  },
  {
    nombres: 'Juan',
    apellidos: 'Usuario',
    email: 'usuario@sistema.com',
    password: 'usuario123',
    dni: '87654321',
    telefono: '912345678',
    rol: 'USUARIO_EXTERNO'
  }
];

async function crearUsuarios() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/licencias_construccion', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Conectado a MongoDB');

    // Crear usuarios
    for (const userData of usuarios) {
      // Verificar si el usuario ya existe
      const existente = await Usuario.findOne({ email: userData.email });
      
      if (existente) {
        console.log(`⚠ Usuario ${userData.email} ya existe, actualizando...`);
        
        // Actualizar el usuario existente
        existente.nombres = userData.nombres;
        existente.apellidos = userData.apellidos;
        existente.dni = userData.dni;
        existente.telefono = userData.telefono;
        existente.rol = userData.rol;
        existente.password = userData.password; // Se hasheará automáticamente
        existente.activo = true;
        existente.emailVerificado = true; // ✅ Email verificado para testing
        
        await existente.save();
        console.log(`✓ Usuario ${userData.email} actualizado`);
      } else {
        // Crear nuevo usuario
        const usuario = new Usuario({
          ...userData,
          activo: true,
          emailVerificado: true // ✅ Email verificado para testing
        });
        await usuario.save();
        console.log(`✓ Usuario ${userData.email} creado exitosamente`);
      }
    }

    console.log('\n=== USUARIOS CREADOS/ACTUALIZADOS ===');
    console.log('\n👤 GERENTE:');
    console.log('   Email: gerente@sistema.com');
    console.log('   Password: gerente123');
    
    console.log('\n👤 MESA DE PARTES:');
    console.log('   Email: mesapartes@sistema.com');
    console.log('   Password: mesa123');
    
    console.log('\n👤 TÉCNICO:');
    console.log('   Email: tecnico@sistema.com');
    console.log('   Password: tecnico123');
    
    console.log('\n👤 INSPECTOR:');
    console.log('   Email: inspector@sistema.com');
    console.log('   Password: inspector123');
    
    console.log('\n👤 USUARIO EXTERNO:');
    console.log('   Email: usuario@sistema.com');
    console.log('   Password: usuario123');
    
    console.log('\n✓ ¡Listo! Ahora puedes iniciar sesión en http://localhost:3000');

  } catch (error) {
    console.error('❌ Error al crear usuarios:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Desconectado de MongoDB');
    process.exit();
  }
}

// Ejecutar
crearUsuarios();
