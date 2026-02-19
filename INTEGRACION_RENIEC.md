# 🏛️ Integración con RENIEC - Validación de DNI Real

## 📋 **Limitación Actual del Sistema**

### ❌ **Solo Validación de Formato**
```javascript
// El sistema actual SOLO verifica:
✅ 8 dígitos
✅ Solo números
✅ No es patrón obvio (00000000, 12345678)
✅ Rango válido

// PERO NO VERIFICA:
❌ Si el DNI existe en RENIEC
❌ Si pertenece a una persona real
❌ Datos del titular (nombres, apellidos)
```

**Ejemplo:**
- `76543210` → ✅ Pasa validación (pero puede no existir)
- `44556677` → ❌ Rechazado (patrón repetitivo)
- `23456789` → ❌ Rechazado (patrón secuencial)

---

## 🌐 **Opciones para Validar con RENIEC**

### **Opción 1: APIs Perú (RECOMENDADO)**

#### **Características:**
- ✅ Consulta oficial de RENIEC
- ✅ Devuelve nombres y apellidos
- ✅ API RESTful simple
- ✅ 500 consultas gratis/mes
- ⚠️ Requiere registro

#### **Instalación:**

1. **Registrarse:** https://apis.net.pe/registro

2. **Obtener token** desde el panel

3. **Configurar en `.env`:**
```env
# RENIEC API Configuration
RENIEC_API_PROVIDER=apis_peru
RENIEC_API_TOKEN=tu_token_aqui
```

4. **Ya está implementado en el código!**

#### **Uso en el Sistema:**

El sistema automáticamente:
1. Valida formato localmente
2. Si `RENIEC_API_TOKEN` está configurado, consulta RENIEC
3. Si falla la API, usa validación de formato

**Ejemplo de respuesta:**
```json
{
  "valido": true,
  "dni": "12345678",
  "verificadoRENIEC": true,
  "datos": {
    "nombres": "JUAN CARLOS",
    "apellidoPaterno": "PEREZ",
    "apellidoMaterno": "GARCIA",
    "nombreCompleto": "JUAN CARLOS PEREZ GARCIA"
  }
}
```

#### **Precios:**
| Plan | Consultas/mes | Precio |
|------|---------------|--------|
| Gratis | 500 | S/ 0 |
| Basic | 10,000 | S/ 29 |
| Pro | 50,000 | S/ 99 |
| Enterprise | 500,000 | S/ 799 |

---

### **Opción 2: Consulta DNI**

#### **Instalación:**
```bash
npm install consulta-dni-peru
```

#### **Configuración:**
```env
RENIEC_API_PROVIDER=consulta_dni
RENIEC_API_TOKEN=tu_api_key
```

#### **Código adicional:**
```javascript
// Agregar en validadores.js después de la línea 145

if (process.env.RENIEC_API_PROVIDER === 'consulta_dni') {
  const ConsultaDNI = require('consulta-dni-peru');
  const consulta = new ConsultaDNI(process.env.RENIEC_API_TOKEN);
  
  const resultado = await consulta.consultarPorDNI(dni);
  
  return {
    valido: true,
    dni: dni,
    verificadoRENIEC: true,
    datos: {
      nombres: resultado.nombres,
      apellidoPaterno: resultado.apellidoPaterno,
      apellidoMaterno: resultado.apellidoMaterno,
      nombreCompleto: resultado.nombreCompleto
    }
  };
}
```

---

### **Opción 3: API RUC (Alternativa)**

Para empresas que ya usan API RUC:

```javascript
if (process.env.RENIEC_API_PROVIDER === 'apiruc') {
  const axios = require('axios');
  const response = await axios.get(
    `https://apiruc.com/api/dni/${dni}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.RENIEC_API_TOKEN}`
      }
    }
  );
  
  return {
    valido: true,
    dni: dni,
    verificadoRENIEC: true,
    datos: {
      nombres: response.data.nombres,
      apellidoPaterno: response.data.apellido_paterno,
      apellidoMaterno: response.data.apellido_materno
    }
  };
}
```

---

## 🔧 **Implementación en el Registro**

### **Actualizar routes/auth.js:**

```javascript
const { validarDNIConRENIEC } = require('../utils/validadores');

// En el endpoint de registro:
router.post('/verificar-codigo-registro', async (req, res) => {
  // ... código existente ...
  
  // Reemplazar validación simple por validación con RENIEC
  const validacionDNI = await validarDNIConRENIEC(dni);
  
  if (!validacionDNI.valido) {
    return res.status(400).json({ error: validacionDNI.error });
  }
  
  // Si hay datos de RENIEC, autocompletar nombres
  if (validacionDNI.verificadoRENIEC) {
    const datosRENIEC = validacionDNI.datos;
    
    // Opcional: Verificar que coincidan con lo ingresado
    const nombreIngresado = `${nombres} ${apellidos}`.toUpperCase();
    const nombreRENIEC = datosRENIEC.nombreCompleto.toUpperCase();
    
    const similitud = calcularSimilitud(nombreIngresado, nombreRENIEC);
    
    if (similitud < 0.7) {
      return res.status(400).json({ 
        error: `El nombre no coincide con RENIEC. Según RENIEC: ${nombreRENIEC}` 
      });
    }
  }
  
  // ... continuar con registro ...
});
```

---

## 📊 **Mejoras con Validación RENIEC**

### **Antes (Solo Formato):**
```javascript
DNI: 76543210
✅ 8 dígitos → OK
✅ Solo números → OK
✅ Rango válido → OK
❓ ¿Existe? → DESCONOCIDO
```

### **Después (Con RENIEC):**
```javascript
DNI: 76543210
✅ 8 dígitos → OK
✅ Solo números → OK
✅ Rango válido → OK
✅ Existe en RENIEC → VERIFICADO
✅ Nombres: MARIA ELENA
✅ Apellidos: RODRIGUEZ CASTRO
```

---

## 🚀 **Guía Rápida de Implementación**

### **Paso 1: Registrarse**
```
1. Ir a https://apis.net.pe/registro
2. Completar formulario
3. Verificar email
4. Obtener token del dashboard
```

### **Paso 2: Configurar**
```env
# Agregar a .env
RENIEC_API_PROVIDER=apis_peru
RENIEC_API_TOKEN=eyJ0eXAiOiJKV1QiLCJhbGc...
```

### **Paso 3: Probar**
```bash
# El sistema automáticamente usará RENIEC
npm run dev
```

### **Paso 4: Verificar**
```
1. Registrar usuario con DNI real
2. Ver en consola del servidor:
   ✓ DNI verificado con RENIEC: JUAN PEREZ
3. Si el DNI no existe:
   ❌ DNI no encontrado en RENIEC
```

---

## ⚠️ **Consideraciones Importantes**

### **1. Límites de Consultas**
```javascript
// Implementar cache para no gastar consultas innecesarias
const cache = {};

if (cache[dni] && (Date.now() - cache[dni].timestamp) < 86400000) {
  return cache[dni].datos; // Cache por 24 horas
}

const resultado = await validarDNIConRENIEC(dni);
cache[dni] = { datos: resultado, timestamp: Date.now() };
```

### **2. Fallback Automático**
```javascript
// Si falla RENIEC, el sistema sigue funcionando
try {
  resultado = await validarDNIConRENIEC(dni);
} catch (error) {
  console.warn('RENIEC no disponible, usando validación de formato');
  resultado = validarDNIPeru(dni);
}
```

### **3. Privacidad**
```javascript
// NO almacenar datos sensibles de RENIEC en logs
console.log('DNI validado'); // ✅ OK
console.log('DNI:', dni, 'Nombres:', nombres); // ❌ Evitar
```

---

## 📈 **Mejoras Implementadas**

### **Validación Local Mejorada:**
```javascript
// Ahora rechaza más patrones:
✅ 44556677 → Patrón repetitivo
✅ 23456789 → Secuencial
✅ 45678901 → Secuencial
✅ 11223344 → Repetitivo
```

### **Rango Actualizado:**
```javascript
// Antes: 1000000 - 99999999
// Ahora: 1000000 - 90000000 (más realista)
```

### **Detección de Patrones:**
```javascript
esPatronSecuencial('12345678') → true
esPatronRepetitivo('44556677') → true
```

---

## 🎯 **Comparación de Proveedores**

| Proveedor | Precio/mes | Consultas | Precisión | Velocidad |
|-----------|------------|-----------|-----------|-----------|
| APIs Perú | S/ 29 | 10,000 | ⭐⭐⭐⭐⭐ | 200ms |
| Consulta DNI | S/ 25 | 5,000 | ⭐⭐⭐⭐ | 300ms |
| API RUC | S/ 35 | 15,000 | ⭐⭐⭐⭐⭐ | 150ms |
| Sin API (formato) | Gratis | ∞ | ⭐⭐⭐ | 1ms |

---

## ✅ **Recomendaciones**

### **Para Producción:**
1. ✅ Usar APIs Perú (mejor relación precio/calidad)
2. ✅ Implementar cache de 24 horas
3. ✅ Tener fallback a validación local
4. ✅ Monitorear uso de cuota

### **Para Desarrollo:**
1. ✅ Usar validación local mejorada
2. ✅ Probar con DNIs reales en plan gratis
3. ✅ No commitear el token en git

### **Para Testing:**
```javascript
// Usar DNIs de prueba proporcionados por la API
const DNI_TEST = '12345678'; // APIs Perú lo acepta en sandbox
```

---

## 🔐 **Seguridad**

```env
# NUNCA commitear esto:
RENIEC_API_TOKEN=tu_token_secreto

# Usar variables de entorno en producción:
# Railway, Heroku, Vercel, etc.
```

---

## 📞 **Soporte**

### **APIs Perú:**
- Web: https://apis.net.pe
- Email: soporte@apis.net.pe
- WhatsApp: +51 999 999 999

### **Documentación:**
- API: https://apis.net.pe/api-reniec
- Ejemplos: https://github.com/apis-net-pe/ejemplos

---

**© 2025 Juan Diego Ttito Valenzuela**  
**Contacto: 948 225 929**
