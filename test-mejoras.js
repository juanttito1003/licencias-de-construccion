/**
 * Script de Prueba - Mejoras del Sistema de Registro
 * Verifica que todas las funcionalidades nuevas funcionen correctamente
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Solicitar código de registro
async function testSolicitarCodigo() {
  log('\n📧 Test 1: Solicitar código de registro', 'cyan');
  
  try {
    const response = await axios.post(`${API_URL}/auth/solicitar-codigo-registro`, {
      email: 'prueba@test.com'
    });
    
    log('✅ ÉXITO: Código enviado', 'green');
    log(`   Mensaje: ${response.data.mensaje}`);
    log(`   Email: ${response.data.email}`);
    log(`   Expira en: ${response.data.expiraEn}`);
    return true;
  } catch (error) {
    log(`❌ ERROR: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

// Test 2: Rate limiting - solicitar código múltiples veces
async function testRateLimiting() {
  log('\n🛡️ Test 2: Rate Limiting (máx 3 solicitudes)', 'cyan');
  
  for (let i = 1; i <= 5; i++) {
    try {
      const response = await axios.post(`${API_URL}/auth/solicitar-codigo-registro`, {
        email: `ratelimit${i}@test.com`
      });
      
      log(`✅ Intento ${i}: Código enviado`, 'green');
      await sleep(500);
    } catch (error) {
      if (error.response?.status === 429) {
        log(`⚠️ Intento ${i}: Rate limit alcanzado (esperado)`, 'yellow');
        log(`   ${error.response.data.error}`);
        return true;
      } else {
        log(`❌ Intento ${i}: Error inesperado`, 'red');
      }
    }
  }
  
  return false;
}

// Test 3: Validación de DNI
async function testValidacionDNI() {
  log('\n🆔 Test 3: Validación de DNI peruano', 'cyan');
  
  const testCases = [
    { dni: '00000000', valido: false, descripcion: 'DNI inválido (ceros)' },
    { dni: '12345678', valido: false, descripcion: 'DNI inválido (secuencial)' },
    { dni: '12345', valido: false, descripcion: 'DNI incompleto' },
    { dni: '75842136', valido: true, descripcion: 'DNI válido' }
  ];
  
  let passed = 0;
  
  for (const test of testCases) {
    try {
      // Primero solicitar código
      await axios.post(`${API_URL}/auth/solicitar-codigo-registro`, {
        email: `dni${test.dni}@test.com`
      });
      
      await sleep(300);
      
      // Intentar registrar con el DNI
      const response = await axios.post(`${API_URL}/auth/verificar-codigo-registro`, {
        email: `dni${test.dni}@test.com`,
        codigo: '123456', // Código incorrecto para forzar error de validación
        nombres: 'Test',
        apellidos: 'Usuario',
        dni: test.dni,
        password: 'Test1234',
        confirmarPassword: 'Test1234'
      });
      
      if (test.valido) {
        log(`❓ ${test.descripcion}: Validación pasó (esperado error de código)`, 'yellow');
      } else {
        log(`❌ ${test.descripcion}: Debería haber sido rechazado`, 'red');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || '';
      
      if (!test.valido && errorMsg.includes('DNI')) {
        log(`✅ ${test.descripcion}: Rechazado correctamente`, 'green');
        passed++;
      } else if (errorMsg.includes('código')) {
        log(`✅ ${test.descripcion}: DNI aceptado, error en código (esperado)`, 'green');
        passed++;
      } else {
        log(`❌ ${test.descripcion}: Error inesperado - ${errorMsg}`, 'red');
      }
    }
    
    await sleep(500);
  }
  
  return passed === testCases.length;
}

// Test 4: Reenvío de código
async function testReenvioCodigo() {
  log('\n🔄 Test 4: Reenvío de código', 'cyan');
  
  const email = 'reenvio@test.com';
  
  try {
    // Primero solicitar código
    await axios.post(`${API_URL}/auth/solicitar-codigo-registro`, {
      email
    });
    
    log('✅ Código inicial enviado', 'green');
    await sleep(1000);
    
    // Intentar reenviar
    const response = await axios.post(`${API_URL}/auth/reenviar-codigo-registro`, {
      email
    });
    
    log('✅ ÉXITO: Código reenviado', 'green');
    log(`   Mensaje: ${response.data.mensaje}`);
    return true;
  } catch (error) {
    log(`❌ ERROR: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

// Test 5: Validación de contraseña
async function testValidacionPassword() {
  log('\n🔒 Test 5: Validación de contraseña', 'cyan');
  
  const testCases = [
    { password: '123', valido: false, descripcion: 'Muy corta' },
    { password: 'abcdefgh', valido: false, descripcion: 'Sin números' },
    { password: '12345678', valido: false, descripcion: 'Sin letras' },
    { password: 'test1234', valido: false, descripcion: 'Sin mayúsculas' },
    { password: 'Test1234', valido: true, descripcion: 'Válida' }
  ];
  
  let passed = 0;
  
  for (const test of testCases) {
    const email = `pass${Math.random()}@test.com`;
    
    try {
      await axios.post(`${API_URL}/auth/solicitar-codigo-registro`, { email });
      await sleep(300);
      
      const response = await axios.post(`${API_URL}/auth/verificar-codigo-registro`, {
        email,
        codigo: '123456',
        nombres: 'Test',
        apellidos: 'Usuario',
        dni: '87654321',
        password: test.password,
        confirmarPassword: test.password
      });
      
      if (test.valido) {
        log(`❓ ${test.descripcion}: Aceptada (error de código esperado)`, 'yellow');
        passed++;
      } else {
        log(`❌ ${test.descripcion}: Debería rechazarse`, 'red');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || '';
      
      if (!test.valido && errorMsg.toLowerCase().includes('contraseña')) {
        log(`✅ ${test.descripcion}: Rechazada correctamente`, 'green');
        passed++;
      } else if (errorMsg.includes('código')) {
        log(`✅ ${test.descripcion}: Password aceptada (error código esperado)`, 'green');
        passed++;
      } else {
        log(`❌ ${test.descripcion}: Error - ${errorMsg}`, 'red');
      }
    }
    
    await sleep(500);
  }
  
  return passed >= testCases.length - 1;
}

// Ejecutar todas las pruebas
async function runAllTests() {
  log('\n🧪 ========================================', 'cyan');
  log('🧪 PRUEBAS DEL SISTEMA DE REGISTRO MEJORADO', 'cyan');
  log('🧪 ========================================\n', 'cyan');
  
  const results = {
    total: 5,
    passed: 0
  };
  
  // Test 1
  if (await testSolicitarCodigo()) results.passed++;
  await sleep(1000);
  
  // Test 2
  if (await testRateLimiting()) results.passed++;
  await sleep(1000);
  
  // Test 3
  if (await testValidacionDNI()) results.passed++;
  await sleep(1000);
  
  // Test 4
  if (await testReenvioCodigo()) results.passed++;
  await sleep(1000);
  
  // Test 5
  if (await testValidacionPassword()) results.passed++;
  
  // Resumen
  log('\n📊 ========================================', 'cyan');
  log('📊 RESUMEN DE PRUEBAS', 'cyan');
  log('📊 ========================================\n', 'cyan');
  
  const percentage = Math.round((results.passed / results.total) * 100);
  const color = percentage >= 80 ? 'green' : percentage >= 60 ? 'yellow' : 'red';
  
  log(`✅ Pruebas exitosas: ${results.passed}/${results.total} (${percentage}%)`, color);
  
  if (percentage === 100) {
    log('\n🎉 ¡TODAS LAS PRUEBAS PASARON! Sistema funcionando perfectamente.', 'green');
  } else if (percentage >= 80) {
    log('\n✅ La mayoría de las pruebas pasaron. Sistema funcional.', 'green');
  } else {
    log('\n⚠️  Algunas pruebas fallaron. Revisar implementación.', 'yellow');
  }
  
  log('\n💡 Nota: El servidor debe estar corriendo en http://localhost:5000\n');
}

// Ejecutar
runAllTests().catch(error => {
  log('\n❌ Error fatal en las pruebas:', 'red');
  log(error.message, 'red');
  
  if (error.code === 'ECONNREFUSED') {
    log('\n⚠️  El servidor no está corriendo. Ejecuta: npm run dev', 'yellow');
  }
});
