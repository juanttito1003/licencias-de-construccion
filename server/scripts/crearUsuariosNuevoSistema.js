const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const Usuario = require('../models/Usuario');
const { PERMISOS_ROL } = require('../middleware/permisos');
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

const usuariosNuevoSistema = [
  // MESA DE PARTES
  {
    nombres: 'María',
    apellidos: 'García López',
    email: 'mesa.partes@sistema.com',
    password: '123456',
    dni: '12345601',
    telefono: '987654321',
    rol: 'MESA_PARTES',
    departamento: 'MESA_PARTES',
    activo: true,
    emailVerificado: true
  },
  {
    nombres: 'Carlos',
    apellidos: 'Rodríguez Pérez',
    email: 'mesa.partes2@sistema.com',
    password: '123456',
    dni: '12345602',
    telefono: '987654322',
    rol: 'MESA_PARTES',
    departamento: 'MESA_PARTES',
    activo: true,
    emailVerificado: true
  },

  // TÉCNICOS
  {
    nombres: 'Juan',
    apellidos: 'Martínez Silva',
    email: 'tecnico1@sistema.com',
    password: '123456',
    dni: '12345603',
    telefono: '987654323',
    rol: 'TECNICO',
    departamento: 'REVISION_TECNICA',
    activo: true,
    emailVerificado: true
  },
  {
    nombres: 'Ana',
    apellidos: 'Torres Mendoza',
    email: 'tecnico2@sistema.com',
    password: '123456',
    dni: '12345604',
    telefono: '987654324',
    rol: 'TECNICO',
    departamento: 'REVISION_TECNICA',
    activo: true,
    emailVerificado: true
  },
  {
    nombres: 'Roberto',
    apellidos: 'Flores Huamán',
    email: 'tecnico3@sistema.com',
    password: '123456',
    dni: '12345605',
    telefono: '987654325',
    rol: 'TECNICO',
    departamento: 'REVISION_TECNICA',
    activo: true,
    emailVerificado: true
  },

  // INSPECTORES
  {
    nombres: 'Luis',
    apellidos: 'Sánchez Vargas',
    email: 'inspector1@sistema.com',
    password: '123456',
    dni: '12345606',
    telefono: '987654326',
    rol: 'INSPECTOR',
    departamento: 'INSPECCION',
    activo: true,
    emailVerificado: true
  },
  {
    nombres: 'Patricia',
    apellidos: 'Ramírez Castro',
    email: 'inspector2@sistema.com',
    password: '123456',
    dni: '12345607',
    telefono: '987654327',
    rol: 'INSPECTOR',
    departamento: 'INSPECCION',
    activo: true,
    emailVerificado: true
  },

  // GERENTES
  {
    nombres: 'Ricardo',
    apellidos: 'Morales Gutiérrez',
    email: 'gerente@sistema.com',
    password: '123456',
    dni: '12345608',
    telefono: '987654328',
    rol: 'GERENTE',
    departamento: 'GERENCIA',
    activo: true,
    emailVerificado: true
  },

  // USUARIOS EXTERNOS (ciudadanos)
  {
    nombres: 'Pedro',
    apellidos: 'Gómez Quispe',
    email: 'usuario1@test.com',
    password: '123456',
    dni: '12345609',
    telefono: '987654329',
    rol: 'USUARIO_EXTERNO',
    departamento: 'NINGUNO',
    activo: true,
    emailVerificado: true
  },
  {
    nombres: 'Lucía',
    apellidos: 'Fernández Rojas',
    email: 'usuario2@test.com',
    password: '123456',
    dni: '12345610',
    telefono: '987654330',
    rol: 'USUARIO_EXTERNO',
    departamento: 'NINGUNO',
    activo: true,
    emailVerificado: true
  }
];

async function crearUsuarios() {
  try {
    console.log('🔄 Creando usuarios del nuevo sistema profesional...\n');

    // NO eliminar nada, solo crear nuevos usuarios
    console.log('📋 Creando usuarios para el sistema profesional:\n');

    for (const usuarioData of usuariosNuevoSistema) {
      // Asignar permisos según el rol
      const permisos = PERMISOS_ROL[usuarioData.rol] || {};
      
      const usuario = new Usuario({
        ...usuarioData,
        permisos,
        estadisticas: {
          expedientesAsignados: 0,
          expedientesCompletados: 0,
          promedioTiempoAtencion: 0
        }
      });

      await usuario.save();
      
      console.log(`✅ Usuario creado: ${usuario.nombres} ${usuario.apellidos}`);
      console.log(`   Email: ${usuario.email}`);
      console.log(`   Rol: ${usuario.rol}`);
      console.log(`   Departamento: ${usuario.departamento}`);
      console.log(`   Permisos:`, permisos);
      console.log('');
    }

    console.log('\n✅ Todos los usuarios han sido creados exitosamente!\n');
    console.log('📋 CREDENCIALES DE ACCESO:');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('MESA DE PARTES:');
    console.log('  - mesa.partes@sistema.com / 123456');
    console.log('  - mesa.partes2@sistema.com / 123456\n');
    
    console.log('TÉCNICOS:');
    console.log('  - tecnico1@sistema.com / 123456');
    console.log('  - tecnico2@sistema.com / 123456');
    console.log('  - tecnico3@sistema.com / 123456\n');
    
    console.log('INSPECTORES:');
    console.log('  - inspector1@sistema.com / 123456');
    console.log('  - inspector2@sistema.com / 123456\n');
    
    console.log('GERENTE:');
    console.log('  - gerente@sistema.com / 123456\n');
    
    console.log('USUARIOS EXTERNOS:');
    console.log('  - usuario1@test.com / 123456');
    console.log('  - usuario2@test.com / 123456\n');
    
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error al crear usuarios:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Conexión a MongoDB cerrada');
    process.exit(0);
  }
}

// Función para migrar usuarios existentes
async function migrarUsuariosExistentes() {
  try {
    console.log('🔄 Actualizando usuarios existentes al nuevo sistema...\n');
    console.log('✅ TODOS tus usuarios existentes serán preservados y actualizados\n');

    const usuariosExistentes = await Usuario.find({});
    console.log(`📋 Encontrados ${usuariosExistentes.length} usuarios existentes\n`);

    for (const usuario of usuariosExistentes) {
      let nuevoRol = usuario.rol; // Mantener el rol si ya es nuevo
      let nuevoDepartamento = usuario.departamento || 'NINGUNO';

      // Mapeo de roles antiguos a nuevos (solo si tiene rol antiguo)
      if (usuario.rol === 'ADMINISTRADOR') {
        nuevoRol = 'GERENTE';
        nuevoDepartamento = 'GERENCIA';
      } else if (usuario.rol === 'REVISOR_ADMINISTRATIVO') {
        nuevoRol = 'MESA_PARTES';
        nuevoDepartamento = 'MESA_PARTES';
      } else if (usuario.rol === 'REVISOR_TECNICO') {
        nuevoRol = 'TECNICO';
        nuevoDepartamento = 'REVISION_TECNICA';
      } else if (usuario.rol === 'INSPECTOR') {
        nuevoRol = 'INSPECTOR';
        nuevoDepartamento = 'INSPECCION';
      } else if (usuario.rol === 'SOLICITANTE') {
        nuevoRol = 'USUARIO_EXTERNO';
        nuevoDepartamento = 'NINGUNO';
      }

      // Actualizar rol y asignar permisos
      const rolAnterior = usuario.rol;
      usuario.rol = nuevoRol;
      usuario.departamento = nuevoDepartamento;
      usuario.permisos = PERMISOS_ROL[nuevoRol] || {};
      
      if (!usuario.estadisticas) {
        usuario.estadisticas = {
          expedientesAsignados: 0,
          expedientesCompletados: 0,
          promedioTiempoAtencion: 0
        };
      }

      await usuario.save();

      console.log(`✅ Usuario actualizado: ${usuario.email}`);
      if (rolAnterior !== nuevoRol) {
        console.log(`   Rol: ${rolAnterior} → ${nuevoRol}`);
      } else {
        console.log(`   Rol: ${nuevoRol} (sin cambios)`);
      }
      console.log(`   Departamento: ${nuevoDepartamento}\n`);
    }

    console.log('✅ Actualización completada exitosamente!');
    console.log('\n📋 RESUMEN DE TUS USUARIOS:');
    console.log('═══════════════════════════════════════════════════════════');
    
    const usuariosActualizados = await Usuario.find({});
    const porRol = {};
    
    usuariosActualizados.forEach(u => {
      porRol[u.rol] = (porRol[u.rol] || 0) + 1;
    });
    
    console.log('\nUsuarios por rol:');
    Object.entries(porRol).forEach(([rol, cantidad]) => {
      console.log(`  ${rol}: ${cantidad} usuario(s)`);
    });
    
    console.log('\nLista completa:');
    usuariosActualizados.forEach(u => {
      console.log(`  - ${u.email} (${u.rol})`);
    });

  } catch (error) {
    console.error('❌ Error al actualizar usuarios:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Conexión a MongoDB cerrada');
    process.exit(0);
  }
}

// Ejecutar según argumento de línea de comandos
const comando = process.argv[2];

if (comando === 'migrar') {
  migrarUsuariosExistentes();
} else {
  crearUsuarios();
}
