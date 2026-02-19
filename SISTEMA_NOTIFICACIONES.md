# Sistema de Notificaciones Dentro de la Aplicación

## 📱 Descripción General

Se ha implementado un sistema completo de notificaciones dentro de la aplicación que permite a los usuarios recibir mensajes no solo por correo electrónico, sino también directamente en la interfaz de la app.

## ✨ Características Implementadas

### 1. **Modelo de Notificación** (`server/models/Notificacion.js`)
- Almacena notificaciones en MongoDB
- Tipos de notificación: MENSAJE, INSPECCION, OBSERVACION, APROBACION, RECHAZO, ALERTA, INFO
- Estados: leída/no leída
- Prioridades: BAJA, NORMAL, ALTA, URGENTE
- Relación con usuarios y expedientes
- Métodos para marcar como leída y obtener notificaciones

### 2. **API de Notificaciones** (`server/routes/notificaciones.js`)
Endpoints disponibles:
- `GET /notificaciones` - Listar notificaciones del usuario
- `GET /notificaciones/no-leidas/contador` - Contador de notificaciones no leídas
- `PATCH /notificaciones/:id/leer` - Marcar una notificación como leída
- `PATCH /notificaciones/leer-todas` - Marcar todas como leídas
- `DELETE /notificaciones/:id` - Eliminar una notificación
- `POST /notificaciones` - Enviar notificación manual (administrador)

### 3. **Utilidad de Notificaciones Mejorada** (`server/utils/notificaciones.js`)
- Guarda notificaciones en la base de datos automáticamente
- Envía email simultáneamente
- Soporte para mensajes con saltos de línea preservados

### 4. **Componente de Notificaciones** (`client/src/components/Notificaciones.js`)
Panel lateral con:
- Lista de notificaciones con diseño atractivo
- Filtros: todas / no leídas
- Iconos según tipo de notificación con colores distintivos
- Formato de fecha relativo ("Hace 5 minutos", "Hace 2 horas", etc.)
- Acciones: marcar como leída, eliminar
- Botón para marcar todas como leídas
- Indicador de prioridad en cada notificación
- Estado de carga y estado vacío

### 5. **Integración en Navbar** (`client/src/components/Navbar.js`)
- Botón de campana (🔔) con badge de contador
- Badge rojo con número de notificaciones no leídas
- Animación de pulso en el badge
- Actualización automática cada 30 segundos
- Abre panel lateral al hacer clic

### 6. **Actualización de EnviarMensaje**
- Ahora crea notificación en la BD automáticamente
- Detecta tipo de notificación según el asunto
- Mensajes informativos actualizados

## 🎨 Interfaz de Usuario

### Panel de Notificaciones
- **Ubicación**: Se abre desde la derecha al hacer clic en el icono de campana
- **Diseño**: Panel deslizante con fondo oscuro en el header
- **Filtros**: Botones para ver "Todas" o solo "No leídas"
- **Notificaciones**: 
  - Fondo celeste para no leídas
  - Borde izquierdo de color según tipo
  - Iconos específicos para cada tipo
  - Fecha relativa
  - Botones de acción (marcar leída, eliminar)

### Iconos por Tipo
- 📧 MENSAJE - Azul
- 📋 INSPECCION - Morado
- ⚠️ OBSERVACION - Naranja
- ✅ APROBACION - Verde
- ❌ RECHAZO - Rojo
- 🚨 ALERTA - Naranja oscuro
- ℹ️ INFO - Verde agua

## 🔄 Flujo de Trabajo

1. **Envío de Mensaje**:
   - Administrador envía mensaje desde el detalle del expediente
   - Sistema detecta tipo según asunto
   - Crea notificación en BD automáticamente
   - Envía email al usuario
   - Usuario recibe notificación en ambos canales

2. **Recepción**:
   - Usuario ve badge rojo en campana del navbar
   - Número indica cuántas notificaciones no leídas tiene
   - Al abrir panel, ve lista completa con formato atractivo

3. **Lectura**:
   - Usuario puede marcar individualmente como leída
   - O marcar todas con un solo clic
   - Notificaciones leídas se ven con estilo diferente

4. **Actualización Automática**:
   - Contador se actualiza cada 30 segundos
   - No requiere refrescar la página

## 📊 Ventajas del Sistema

✅ **Doble canal**: Email + Notificaciones en app
✅ **Tiempo real**: Los usuarios ven mensajes inmediatamente
✅ **Persistencia**: Las notificaciones se guardan en BD
✅ **Historial**: Los usuarios pueden revisar mensajes antiguos
✅ **UX mejorada**: No dependen solo del email
✅ **Seguimiento**: Saber qué notificaciones se han leído
✅ **Organizado**: Filtros y categorías por tipo
✅ **Responsive**: Funciona en móviles y tablets

## 🚀 Uso

### Para Administradores
1. Ir al detalle de un expediente
2. Clic en "Enviar Mensaje"
3. Elegir plantilla o escribir mensaje personalizado
4. El mensaje se envía automáticamente por email Y aparece en las notificaciones del usuario

### Para Usuarios
1. Ver campana en el navbar
2. Si hay notificaciones no leídas, aparece badge rojo con número
3. Clic en campana para abrir panel
4. Leer notificaciones
5. Marcar como leídas o eliminar según necesidad

## 🔐 Seguridad

- Solo los usuarios autenticados pueden ver sus notificaciones
- Cada usuario solo ve sus propias notificaciones
- Los administradores pueden enviar notificaciones
- API protegida con middleware de autenticación

## 📱 Responsive

El sistema funciona perfectamente en:
- Desktop (panel lateral de 450px)
- Tablets (panel de 90% del ancho)
- Móviles (panel de ancho completo)

## 🎯 Próximas Mejoras (Opcionales)

- [ ] Notificaciones push en tiempo real con WebSockets
- [ ] Sonido al recibir notificación nueva
- [ ] Previsualizaciones más ricas con imágenes
- [ ] Filtros por tipo de notificación
- [ ] Búsqueda dentro de notificaciones
- [ ] Exportar notificaciones a PDF
- [ ] Configuración de preferencias de notificación

---

**Desarrollado por**: Juan Diego Ttito Valenzuela  
**Contacto**: 948 225 929  
**Fecha**: Enero 2026
