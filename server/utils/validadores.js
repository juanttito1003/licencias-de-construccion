/**
 * Utilidades de Validación
 * Validadores personalizados para DNI, teléfono, etc.
 * Autor: Juan Diego Ttito Valenzuela
 * © 2025 Todos los derechos reservados
 */

/**
 * Valida DNI peruano (FORMATO BÁSICO)
 * NOTA: Esta validación solo verifica el formato, NO consulta RENIEC
 * Para validar si el DNI existe realmente, usar validarDNIConRENIEC()
 * 
 * - Debe tener exactamente 8 dígitos
 * - Solo números
 * - Rango válido y patrones
 */
const validarDNIPeru = (dni) => {
  // Debe ser string o número
  const dniStr = String(dni).trim();
  
  // Debe tener 8 dígitos
  if (!/^\d{8}$/.test(dniStr)) {
    return {
      valido: false,
      error: 'El DNI debe tener exactamente 8 dígitos numéricos'
    };
  }
  
  // Validación básica: no puede ser todos ceros u otros patrones inválidos
  const patronesInvalidos = [
    '00000000',
    '11111111',
    '22222222',
    '33333333',
    '44444444',
    '55555555',
    '66666666',
    '77777777',
    '88888888',
    '99999999',
    '12345678',
    '87654321',
    '23456789',
    '98765432'
  ];
  
  if (patronesInvalidos.includes(dniStr)) {
    return {
      valido: false,
      error: 'El DNI ingresado no es válido'
    };
  }
  
  // Detectar patrones secuenciales o repetitivos
  if (esPatronSecuencial(dniStr) || esPatronRepetitivo(dniStr)) {
    return {
      valido: false,
      error: 'El DNI ingresado tiene un patrón no válido'
    };
  }
  
  // El DNI debe estar en un rango válido según emisión histórica RENIEC
  // Los primeros DNIs electrónicos empezaron alrededor de 1995
  const dniNum = parseInt(dniStr, 10);
  
  // Rango más restrictivo basado en emisión real
  // Antes de 1995: < 10000000
  // Actual 2025: aproximadamente 85000000
  if (dniNum < 1000000 || dniNum > 90000000) {
    return {
      valido: false,
      error: 'El DNI está fuera del rango de emisión válido'
    };
  }
  
  return {
    valido: true,
    dni: dniStr,
    advertencia: 'Validación de formato únicamente. Para verificar existencia real, consultar con RENIEC.'
  };
};

/**
 * Detecta patrones secuenciales (ej: 45678901, 12345678)
 */
const esPatronSecuencial = (dniStr) => {
  let ascendente = 0;
  let descendente = 0;
  
  for (let i = 1; i < dniStr.length; i++) {
    const diff = parseInt(dniStr[i]) - parseInt(dniStr[i-1]);
    if (diff === 1) ascendente++;
    if (diff === -1) descendente++;
  }
  
  // Si más de 5 dígitos consecutivos son secuenciales
  return ascendente >= 5 || descendente >= 5;
};

/**
 * Detecta patrones repetitivos (ej: 44556677, 11223344)
 */
const esPatronRepetitivo = (dniStr) => {
  const pares = {};
  
  for (let i = 0; i < dniStr.length - 1; i += 2) {
    const par = dniStr.substring(i, i + 2);
    pares[par] = (pares[par] || 0) + 1;
  }
  
  // Si algún par se repite más de 2 veces
  return Object.values(pares).some(count => count > 2);
};

/**
 * Valida DNI consultando API de RENIEC (REQUIERE CONFIGURACIÓN)
 * Esta función requiere:
 * 1. Token de API de terceros (APIs Perú, etc.)
 * 2. Configurar RENIEC_API_TOKEN en .env
 * 3. Instalar: npm install axios
 */
const validarDNIConRENIEC = async (dni) => {
  // Primero validar formato
  const validacionFormato = validarDNIPeru(dni);
  if (!validacionFormato.valido) {
    return validacionFormato;
  }
  
  // Si no hay token configurado, solo devolver validación de formato
  if (!process.env.RENIEC_API_TOKEN) {
    return {
      ...validacionFormato,
      advertencia: 'RENIEC_API_TOKEN no configurado. Solo se validó el formato.'
    };
  }
  
  try {
    // Opción 1: APIs Perú (https://apis.net.pe)
    if (process.env.RENIEC_API_PROVIDER === 'apis_peru') {
      const axios = require('axios');
      const response = await axios.get(
        `https://api.apis.net.pe/v2/reniec/dni?numero=${dni}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.RENIEC_API_TOKEN}`
          },
          timeout: 5000
        }
      );
      
      return {
        valido: true,
        dni: dni,
        verificadoRENIEC: true,
        datos: {
          nombres: response.data.nombres,
          apellidoPaterno: response.data.apellidoPaterno,
          apellidoMaterno: response.data.apellidoMaterno,
          nombreCompleto: `${response.data.nombres} ${response.data.apellidoPaterno} ${response.data.apellidoMaterno}`
        }
      };
    }
    
    // Agregar más proveedores aquí...
    
    return validacionFormato;
  } catch (error) {
    if (error.response?.status === 404) {
      return {
        valido: false,
        error: 'DNI no encontrado en RENIEC. Verifica que el número sea correcto.'
      };
    }
    
    // Si falla la API, devolver validación de formato
    console.warn('Error al consultar RENIEC:', error.message);
    return {
      ...validacionFormato,
      advertencia: 'No se pudo verificar con RENIEC. Se validó solo el formato.'
    };
  }
};

/**
 * Valida teléfono peruano
 * - Celular: 9 dígitos, empieza con 9
 * - Fijo: 7 dígitos (Lima) u 8 dígitos (provincias)
 */
const validarTelefonoPeru = (telefono) => {
  if (!telefono) {
    return { valido: true }; // Teléfono es opcional
  }
  
  const telStr = String(telefono).trim().replace(/[\s\-()]/g, '');
  
  // Celular: 9 dígitos empezando con 9
  if (/^9\d{8}$/.test(telStr)) {
    return {
      valido: true,
      telefono: telStr,
      tipo: 'celular'
    };
  }
  
  // Fijo Lima: 7 dígitos
  if (/^\d{7}$/.test(telStr)) {
    return {
      valido: true,
      telefono: telStr,
      tipo: 'fijo_lima'
    };
  }
  
  // Fijo provincias: 8 dígitos
  if (/^\d{8}$/.test(telStr) && !telStr.startsWith('9')) {
    return {
      valido: true,
      telefono: telStr,
      tipo: 'fijo_provincial'
    };
  }
  
  return {
    valido: false,
    error: 'Formato de teléfono inválido. Debe ser 9 dígitos (celular) o 7-8 dígitos (fijo)'
  };
};

/**
 * Valida email
 */
const validarEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return {
      valido: false,
      error: 'Formato de email inválido'
    };
  }
  
  // Validar que no sea email temporal/desechable (opcional)
  const dominiosTemporales = [
    'tempmail.com',
    'guerrillamail.com',
    '10minutemail.com',
    'mailinator.com',
    'throwaway.email'
  ];
  
  const dominio = email.split('@')[1].toLowerCase();
  
  if (dominiosTemporales.includes(dominio)) {
    return {
      valido: false,
      error: 'No se permiten emails temporales'
    };
  }
  
  return {
    valido: true,
    email: email.toLowerCase().trim()
  };
};

/**
 * Valida contraseña segura
 */
const validarContrasena = (password) => {
  const errores = [];
  
  if (password.length < 8) {
    errores.push('Debe tener al menos 8 caracteres');
  }
  
  if (!/[0-9]/.test(password)) {
    errores.push('Debe incluir al menos un número');
  }
  
  if (!/[a-z]/.test(password)) {
    errores.push('Debe incluir al menos una letra minúscula');
  }
  
  if (!/[A-Z]/.test(password)) {
    errores.push('Debe incluir al menos una letra mayúscula');
  }
  
  // Opcional: caracteres especiales
  // if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
  //   errores.push('Debe incluir al menos un carácter especial');
  // }
  
  if (errores.length > 0) {
    return {
      valido: false,
      errores
    };
  }
  
  return {
    valido: true,
    fortaleza: calcularFortalezaContrasena(password)
  };
};

/**
 * Calcula fortaleza de contraseña
 */
const calcularFortalezaContrasena = (password) => {
  let puntos = 0;
  
  // Longitud
  if (password.length >= 8) puntos += 1;
  if (password.length >= 12) puntos += 1;
  if (password.length >= 16) puntos += 1;
  
  // Complejidad
  if (/[a-z]/.test(password)) puntos += 1;
  if (/[A-Z]/.test(password)) puntos += 1;
  if (/[0-9]/.test(password)) puntos += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) puntos += 2;
  
  // Clasificación
  if (puntos <= 3) return 'debil';
  if (puntos <= 5) return 'media';
  if (puntos <= 7) return 'fuerte';
  return 'muy_fuerte';
};

/**
 * Valida nombres y apellidos
 */
const validarNombreCompleto = (nombre) => {
  if (!nombre || nombre.trim().length < 2) {
    return {
      valido: false,
      error: 'Debe tener al menos 2 caracteres'
    };
  }
  
  // Solo letras, espacios, tildes y ñ
  if (!/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/.test(nombre)) {
    return {
      valido: false,
      error: 'Solo se permiten letras y espacios'
    };
  }
  
  // Capitalizar primera letra de cada palabra
  const nombreFormateado = nombre
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return {
    valido: true,
    nombre: nombreFormateado
  };
};

module.exports = {
  validarDNIPeru,
  validarDNIConRENIEC,
  validarTelefonoPeru,
  validarEmail,
  validarContrasena,
  validarNombreCompleto,
  calcularFortalezaContrasena
};
