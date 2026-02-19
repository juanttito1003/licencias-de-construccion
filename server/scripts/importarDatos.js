/**
 * Script: Importar Datos a MongoDB
 * Descripción: Importa datos desde archivos JSON
 * Autor: Juan Diego Ttito Valenzuela
 * © 2025 Todos los derechos reservados
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Importar modelos
const Usuario = require('../models/Usuario');
const Expediente = require('../models/Expediente');

const importarDatos = async () => {
  try {
    console.log('📥 Importando datos a MongoDB...\n');
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/licencias_construccion');
    console.log('✓ Conectado a MongoDB\n');

    const backupDir = path.join('C:', 'backup-mongodb-json');

    // Verificar que existe la carpeta
    if (!fs.existsSync(backupDir)) {
      console.error('❌ No se encuentra la carpeta C:\\backup-mongodb-json');
      console.log('   Asegúrate de copiar la carpeta de backup a C:\\');
      process.exit(1);
    }

    // Importar Usuarios
    const usuariosPath = path.join(backupDir, 'usuarios.json');
    if (fs.existsSync(usuariosPath)) {
      console.log('📄 Importando usuarios...');
      const usuarios = JSON.parse(fs.readFileSync(usuariosPath, 'utf8'));
      
      // Eliminar usuarios existentes
      await Usuario.deleteMany({});
      
      // Insertar usuarios
      await Usuario.insertMany(usuarios);
      console.log(`   ✓ ${usuarios.length} usuarios importados\n`);
    }

    // Importar Expedientes
    const expedientesPath = path.join(backupDir, 'expedientes.json');
    if (fs.existsSync(expedientesPath)) {
      console.log('📄 Importando expedientes...');
      const expedientes = JSON.parse(fs.readFileSync(expedientesPath, 'utf8'));
      
      // Eliminar expedientes existentes
      await Expediente.deleteMany({});
      
      // Insertar expedientes
      await Expediente.insertMany(expedientes);
      console.log(`   ✓ ${expedientes.length} expedientes importados\n`);
    }

    console.log('✅ IMPORTACIÓN COMPLETADA');
    console.log('🎉 Todos los datos han sido restaurados\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

importarDatos();
