# Guía de Inicio Rápido
## Sistema de Gestión de Licencias de Construcción

**Desarrollado por:** Juan Diego Ttito Valenzuela  
**© 2025 Todos los derechos reservados**  
**Contacto:** 948 225 929

---

## 🚀 Inicio Rápido (5 minutos)

### Opción 1: Instalación Automática (Recomendada)

```powershell
# En PowerShell, ejecute:
.\install.ps1
```

### Opción 2: Instalación Manual

```powershell
# 1. Instalar dependencias
npm install
cd client
npm install
cd ..

# 2. Crear archivo .env
cp .env.example .env

# 3. Iniciar la aplicación
npm run dev
```

## 📋 Configuración Inicial

### 1. MongoDB

Asegúrese de que MongoDB esté corriendo:

```powershell
# Iniciar MongoDB
net start MongoDB
```

### 2. Variables de Entorno (.env)

Edite el archivo `.env` con sus configuraciones:

```env
# Requerido
MONGODB_URI=mongodb://localhost:27017/licencias_construccion
JWT_SECRET=clave_secreta_super_segura_cambiar_en_produccion

# Opcional para pruebas (las notificaciones se mostrarán en consola)
NODE_ENV=development
```

### 3. Iniciar la Aplicación

```powershell
npm run dev
```

Acceda a:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

## 👤 Usuarios de Prueba

Para crear usuarios de prueba, use el formulario de registro en:
http://localhost:3000/registro

### Roles Disponibles

1. **SOLICITANTE** (Por defecto al registrarse)
   - Puede crear y gestionar solicitudes
   - Cargar documentos y planos
   - Ver estado de expedientes

2. **REVISOR_ADMINISTRATIVO** (Crear manualmente en BD)
   - Revisar documentos administrativos
   - Cambiar estados de expedientes

3. **REVISOR_TECNICO** (Crear manualmente en BD)
   - Revisar planos técnicos
   - Aprobar/rechazar documentación técnica

4. **INSPECTOR** (Crear manualmente en BD)
   - Ver inspecciones asignadas
   - Registrar observaciones
   - Completar inspecciones

5. **ADMINISTRADOR** (Crear manualmente en BD)
   - Acceso completo al sistema
   - Generar reportes
   - Ver estadísticas

### Crear Usuarios con Roles Especiales

Puede crear usuarios con roles específicos usando MongoDB Compass o la shell de Mongo:

```javascript
// Conectar a MongoDB
mongo

// Usar la base de datos
use licencias_construccion

// Crear un administrador
db.usuarios.insertOne({
  nombres: "Admin",
  apellidos: "Sistema",
  email: "admin@sistema.com",
  password: "$2a$10$XqvH5V0pXUE.NbXw9K5.qeYQoC8YGm0H3x5qXnR4jLGxvLOqX5KjG", // password123
  dni: "00000001",
  telefono: "999999999",
  rol: "ADMINISTRADOR",
  activo: true,
  fechaCreacion: new Date()
})

// Crear un revisor administrativo
db.usuarios.insertOne({
  nombres: "Revisor",
  apellidos: "Administrativo",
  email: "revisor.admin@sistema.com",
  password: "$2a$10$XqvH5V0pXUE.NbXw9K5.qeYQoC8YGm0H3x5qXnR4jLGxvLOqX5KjG", // password123
  dni: "00000002",
  telefono: "999999998",
  rol: "REVISOR_ADMINISTRATIVO",
  activo: true,
  fechaCreacion: new Date()
})
```

## 🎯 Flujo de Prueba Completo

### 1. Registro de Solicitante
1. Ir a http://localhost:3000/registro
2. Completar el formulario de registro
3. Iniciar sesión con las credenciales creadas

### 2. Crear Nueva Solicitud
1. Click en "Nueva Solicitud"
2. Completar datos del solicitante y proyecto
3. Click en "Crear Expediente"

### 3. Cargar Documentos (Por implementar en próxima versión)
En la pantalla de detalle del expediente, podrá:
- Subir documentos administrativos (FUE, certificados, etc.)
- Subir planos técnicos (arquitectura, estructuras, etc.)

### 4. Revisar Estado
1. Ir a "Expedientes"
2. Click en "Ver Detalles" del expediente
3. Revisar el historial y estado actual

## 📱 Características Responsive

La aplicación es totalmente responsive y se adapta a:
- 📱 **Móviles** (320px - 768px)
- 💻 **Tablets** (768px - 1024px)
- 🖥️ **Desktop** (1024px+)

Pruebe redimensionando la ventana del navegador o usando las herramientas de desarrollo (F12).

## 🎨 Diseño y Usabilidad

### Principios Implementados (ISO 9241 / Nielsen)

✅ **Visibilidad del estado:** Badges de colores para estados
✅ **Lenguaje del usuario:** Términos claros y familiares
✅ **Control del usuario:** Navegación intuitiva
✅ **Consistencia:** Diseño uniforme
✅ **Prevención de errores:** Validaciones en tiempo real
✅ **Flexibilidad:** Adaptable a diferentes dispositivos
✅ **Diseño minimalista:** Sin elementos innecesarios
✅ **Feedback:** Notificaciones inmediatas

### Paleta de Colores

- **Primary:** #2c3e50 (Azul oscuro)
- **Secondary:** #3498db (Azul)
- **Success:** #27ae60 (Verde)
- **Warning:** #f39c12 (Naranja)
- **Danger:** #e74c3c (Rojo)
- **Light:** #ecf0f1 (Gris claro)

### Accesibilidad

- Contraste adecuado (WCAG AA)
- Navegación por teclado
- Labels descriptivos
- Mensajes de error claros
- Tamaños de fuente legibles

## 🔧 Comandos Útiles

```powershell
# Instalar todas las dependencias
npm run install-all

# Modo desarrollo (servidor + cliente)
npm run dev

# Solo servidor
npm run server

# Solo cliente
npm run client

# Build para producción
npm run build
```

## 📊 Estructura de Estados de Expediente

1. **REGISTRADO** → Expediente creado
2. **EN_REVISION_ADMINISTRATIVA** → Revisión de documentos administrativos
3. **EN_REVISION_TECNICA** → Revisión de planos técnicos
4. **OBSERVADO** → Requiere subsanación
5. **SUBSANACION** → En proceso de subsanación
6. **PENDIENTE_INSPECCION** → Esperando inspección
7. **EN_INSPECCION** → Inspección en curso
8. **PENDIENTE_PAGO** → Esperando pago
9. **PAGADO** → Pago registrado
10. **APROBADO** → Expediente aprobado
11. **RECHAZADO** → Expediente rechazado
12. **LICENCIA_EMITIDA** → Licencia generada

## 🐛 Solución de Problemas Comunes

### Error: Cannot connect to MongoDB
```powershell
# Verificar si MongoDB está corriendo
net start MongoDB

# O iniciar manualmente
mongod
```

### Error: Port 3000 or 5000 already in use
```powershell
# Cambiar puertos en .env
PORT=5001

# Para el cliente, editar package.json
# y agregar: "start": "set PORT=3001 && react-scripts start"
```

### Error: Module not found
```powershell
# Reinstalar dependencias
rm -r node_modules
rm package-lock.json
npm install

cd client
rm -r node_modules
rm package-lock.json
npm install
```

### Las notificaciones no se envían
En modo desarrollo (NODE_ENV=development), las notificaciones se muestran en la consola del servidor en lugar de enviarse por email.

Para enviar emails reales:
1. Configure las variables de entorno de email en .env
2. Cambie NODE_ENV=production

## 📚 Documentación de la API

Ver el archivo README.md para la documentación completa de endpoints.

## 🔐 Seguridad en Producción

Antes de desplegar en producción:

1. ✅ Cambiar JWT_SECRET a un valor seguro y aleatorio
2. ✅ Configurar CORS con dominio específico
3. ✅ Habilitar HTTPS
4. ✅ Configurar límites de rate limiting apropiados
5. ✅ Habilitar logs de auditoría
6. ✅ Configurar backups automáticos de MongoDB
7. ✅ Implementar cifrado AES-256 para datos sensibles
8. ✅ Validar y sanitizar todas las entradas

## 📞 Soporte y Contacto

**Desarrollador:** Juan Diego Ttito Valenzuela  
**Teléfono:** 948 225 929  
**Soporte técnico:** Disponible bajo solicitud

Para consultas sobre implementación, personalización o soporte técnico, contactar directamente al desarrollador.

## ✨ Próximas Características

- [ ] Panel de administración completo
- [ ] Notificaciones push en tiempo real
- [ ] Generación automática de licencias en PDF
- [ ] Firma digital de documentos
- [ ] Integración con pasarelas de pago
- [ ] App móvil nativa
- [ ] Dashboard de analytics avanzado

---

**¡Listo para comenzar! 🚀**

© 2025 **Juan Diego Ttito Valenzuela**. Todos los derechos reservados.
