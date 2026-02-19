/**
 * Script: Exportar Datos de MongoDB
 * Descripción: Exporta toda la base de datos a archivos JSON
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

const exportarDatos = async () => {
  try {
    console.log('📦 Exportando datos de MongoDB...\n');
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/licencias_construccion');
    console.log('✓ Conectado a MongoDB\n');

    // Crear carpeta de backup
    const backupDir = path.join('C:', 'backup-mongodb-json');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Exportar Usuarios
    console.log('📄 Exportando usuarios...');
    const usuarios = await Usuario.find({}).lean();
    fs.writeFileSync(
      path.join(backupDir, 'usuarios.json'),
      JSON.stringify(usuarios, null, 2)
    );
    console.log(`   ✓ ${usuarios.length} usuarios exportados\n`);

    // Exportar Expedientes
    console.log('📄 Exportando expedientes...');
    const expedientes = await Expediente.find({}).lean();
    fs.writeFileSync(
      path.join(backupDir, 'expedientes.json'),
      JSON.stringify(expedientes, null, 2)
    );
    console.log(`   ✓ ${expedientes.length} expedientes exportados\n`);

    console.log('✅ EXPORTACIÓN COMPLETADA');
    console.log(`📁 Los datos están en: ${backupDir}\n`);
    console.log('Archivos creados:');
    console.log('   - usuarios.json');
    console.log('   - expedientes.json\n');
    console.log('📋 Copia esta carpeta a tu nueva laptop');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

exportarDatos();
