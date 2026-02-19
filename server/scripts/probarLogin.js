// Script para probar login directamente contra la API

const testLogin = async (email, password) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    console.log('\n═══════════════════════════════════════');
    console.log(`Probando login: ${email}`);
    console.log(`Status: ${response.status}`);
    console.log('Respuesta:', JSON.stringify(data, null, 2));
    console.log('═══════════════════════════════════════\n');
    
    return { status: response.status, data };
  } catch (error) {
    console.error(`Error probando ${email}:`, error.message);
    return { error: error.message };
  }
};

async function probarLogins() {
  console.log('\n🧪 PROBANDO LOGINS CONTRA LA API\n');
  console.log('⚠️  Asegúrate de que el servidor esté corriendo en localhost:5000\n');

  const usuarios = [
    { email: 'mesa.partes@sistema.com', password: '123456' },
    { email: 'tecnico1@sistema.com', password: '123456' },
    { email: 'inspector1@sistema.com', password: '123456' },
    { email: 'gerente@sistema.com', password: '123456' },
    { email: 'usuario1@test.com', password: '123456' },
  ];

  for (const usuario of usuarios) {
    await testLogin(usuario.email, usuario.password);
    await new Promise(resolve => setTimeout(resolve, 500)); // Esperar medio segundo entre requests
  }
}

probarLogins();
