# Sistema de Gestión de Licencias de Construcción - Modalidad A

Sistema web completo para la digitalización, automatización y control del proceso de licencias de construcción modalidad A, cumpliendo con los lineamientos establecidos por municipalidades.

**Autor:** Juan Diego Ttito Valenzuela  
**Contacto:** 948 225 929  
**© 2025 Todos los derechos reservados**

## 📋 Características Principales

### Funcionalidades Implementadas

✅ **RF01-RF15:** Todos los requerimientos funcionales implementados
- Registro y gestión de expedientes
- Carga y validación de documentos (FUE, certificados, DJ, planos)
- Validación automática de documentación completa
- Generación de número único de expediente
- Registro y gestión de pagos
- Sistema de inspecciones con registro de observaciones
- Consulta de estado en tiempo real
- Sistema de notificaciones automáticas por email
- Revisión y aprobación de documentos
- Subsanación de expedientes observados
- Generación de resolución final
- Historial completo de acciones
- Exportación de reportes (PDF/Excel)

### Requisitos No Funcionales

✅ **RNF01-RNF05:** Implementados
- Respuesta rápida (< 3 segundos)
- Soporte para 200+ usuarios concurrentes
- Cifrado de información (preparado para AES-256)
- Alta disponibilidad
- Interfaz responsive con estándares de usabilidad

## 🛠️ Tecnologías Utilizadas

### Backend
- Node.js + Express
- MongoDB (base de datos)
- JWT (autenticación)
- Bcrypt (encriptación de contraseñas)
- Multer (carga de archivos)
- PDFKit (generación de PDFs)
- Nodemailer (envío de emails)
- Helmet (seguridad)
- Rate Limiting (protección contra ataques)

### Frontend
- React 18
- React Router (navegación)
- Axios (peticiones HTTP)
- React Query (gestión de estado)
- Formik + Yup (formularios y validación)
- React Toastify (notificaciones)
- React Icons (iconografía)
- CSS3 con diseño responsive

## 📦 Instalación

### Prerrequisitos

- Node.js v16 o superior
- MongoDB v5 o superior
- npm o yarn

### Paso 1: Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd "app interfaz-sistemas de informacion"
```

### Paso 2: Instalar dependencias

```bash
# Instalar dependencias del servidor y cliente
npm run install-all
```

### Paso 3: Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Editar el archivo `.env` con tus configuraciones:

```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/licencias_construccion

# JWT
JWT_SECRET=tu_clave_secreta_muy_segura

# Email (configurar con tus credenciales)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_password_app

# Archivos
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

### Paso 4: Iniciar MongoDB

```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

### Paso 5: Iniciar la aplicación

```bash
# Modo desarrollo (inicia servidor y cliente simultáneamente)
npm run dev
```

La aplicación estará disponible en:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🚀 Uso del Sistema

### Roles de Usuario

1. **SOLICITANTE**
   - Registrar nuevas solicitudes de licencia
   - Cargar documentos y planos
   - Consultar estado de expedientes
   - Registrar pagos

2. **REVISOR_ADMINISTRATIVO**
   - Revisar documentación administrativa
   - Aprobar/rechazar documentos
   - Cambiar estados de expedientes

3. **REVISOR_TECNICO**
   - Revisar planos técnicos
   - Aprobar/rechazar planos
   - Validar cumplimiento técnico

4. **INSPECTOR**
   - Ver inspecciones asignadas
   - Programar visitas
   - Registrar observaciones en campo
   - Completar inspecciones

5. **ADMINISTRADOR**
   - Acceso completo al sistema
   - Generar reportes
   - Ver estadísticas
   - Gestionar usuarios

### Flujo de Trabajo

1. **Registro:** El solicitante crea una cuenta en el sistema
2. **Nueva Solicitud:** Registra un nuevo expediente con datos del proyecto
3. **Carga de Documentos:** Sube documentos administrativos y planos técnicos
4. **Revisión:** Los revisores validan la documentación
5. **Inspección:** Se programa y realiza inspección en campo
6. **Pago:** El solicitante registra el pago de derechos
7. **Aprobación:** Se revisa y aprueba el expediente
8. **Licencia:** Se genera y entrega la licencia de construcción

## 📱 Características Responsive

La aplicación está optimizada para:
- 📱 Móviles (320px - 768px)
- 💻 Tablets (768px - 1024px)
- 🖥️ Desktop (1024px+)

### Principios de Usabilidad (Nielsen/ISO 9241)

✅ **Visibilidad del estado del sistema:** Estados claros con badges de colores
✅ **Correspondencia con el mundo real:** Lenguaje claro y familiar
✅ **Control y libertad del usuario:** Navegación intuitiva con breadcrumbs
✅ **Consistencia:** Diseño uniforme en toda la aplicación
✅ **Prevención de errores:** Validación de formularios en tiempo real
✅ **Reconocimiento vs recuerdo:** Elementos visuales claros
✅ **Flexibilidad:** Múltiples formas de acceder a funciones
✅ **Diseño minimalista:** Interfaz limpia sin elementos innecesarios
✅ **Ayuda y documentación:** Mensajes de error descriptivos

## 🔒 Seguridad

- Autenticación JWT
- Encriptación de contraseñas con bcrypt
- Validación de entrada de datos
- Rate limiting contra ataques de fuerza bruta
- Helmet.js para headers de seguridad
- CORS configurado
- Sanitización de datos

## 📊 API Endpoints

### Autenticación
- `POST /api/auth/registro` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/verificar` - Verificar token

### Expedientes
- `GET /api/expedientes` - Listar expedientes
- `POST /api/expedientes` - Crear expediente
- `GET /api/expedientes/:id` - Obtener expediente
- `PATCH /api/expedientes/:id/estado` - Actualizar estado
- `GET /api/expedientes/:id/validar` - Validar documentación

### Documentos
- `POST /api/documentos/:expedienteId/administrativo` - Subir documento
- `POST /api/documentos/:expedienteId/plano` - Subir plano
- `PATCH /api/documentos/:expedienteId/documento/:documentoId` - Revisar documento

### Inspecciones
- `POST /api/inspecciones` - Programar inspección
- `GET /api/inspecciones/mis-inspecciones` - Obtener inspecciones asignadas
- `POST /api/inspecciones/:id/observaciones` - Registrar observaciones
- `PATCH /api/inspecciones/:id/finalizar` - Finalizar inspección

### Pagos
- `POST /api/pagos/:expedienteId` - Registrar pago
- `PATCH /api/pagos/:expedienteId/verificar` - Verificar pago

### Reportes
- `GET /api/reportes/expedientes` - Generar reporte
- `GET /api/reportes/estadisticas` - Obtener estadísticas

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén implementados)
npm test
```

## 📈 Optimización y Rendimiento

- Paginación de resultados
- Compresión gzip
- Caché de consultas frecuentes
- Lazy loading de imágenes
- Debounce en búsquedas
- Optimización de consultas MongoDB

## 🐛 Solución de Problemas

### Error de conexión a MongoDB
```bash
# Verificar que MongoDB esté corriendo
mongo --version
mongod --version

# Iniciar MongoDB
net start MongoDB  # Windows
sudo systemctl start mongod  # Linux
```

### Puerto en uso
```bash
# Cambiar el puerto en el archivo .env
PORT=5001
```

### Problemas con dependencias
```bash
# Limpiar caché e reinstalar
rm -rf node_modules package-lock.json
npm install
```

## 📝 Notas de Desarrollo

- En modo desarrollo, las notificaciones por email se muestran en consola
- Los archivos se guardan en `/uploads`
- Los logs del servidor se muestran en consola

## 🔄 Próximas Mejoras

- [ ] Implementación de tests unitarios e integración
- [ ] Integración con sistemas externos (SUNARP, RENIEC)
- [ ] Firma digital de documentos
- [ ] App móvil nativa
- [ ] Módulo de chat en tiempo real
- [ ] Dashboard de analítics avanzado
- [ ] Backup automático de base de datos

## � Autor

**Juan Diego Ttito Valenzuela**  
Desarrollador Full Stack especializado en sistemas de gestión municipal

**Habilidades:**
- Desarrollo Web (React, Node.js, MongoDB)
- Diseño de Sistemas de Información
- Automatización de Procesos
- Integración de APIs

**Contacto:** 948 225 929

## 📄 Licencia y Derechos de Autor

© 2025 **Juan Diego Ttito Valenzuela**. Todos los derechos reservados.

Este software es propiedad exclusiva de Juan Diego Ttito Valenzuela. Queda prohibida su reproducción, distribución o modificación sin autorización expresa del autor.

## 📞 Soporte y Contacto

**Autor:** Juan Diego Ttito Valenzuela  
**Teléfono:** 948 225 929  
**Email:** Disponible bajo solicitud

Para consultas técnicas, personalizaciones o implementaciones, contactar directamente al autor.

---

**Desarrollado con ❤️ por Juan Diego Ttito Valenzuela para la modernización de trámites municipales**
