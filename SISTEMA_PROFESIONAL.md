# 🏢 Sistema Profesional de Gestión de Licencias de Construcción

## 📋 Descripción del Nuevo Sistema

El sistema ha sido completamente reestructurado con un **flujo profesional por capas**, donde cada rol tiene funciones específicas y los expedientes pasan por varias etapas de revisión antes de la aprobación final.

---

## 👥 ROLES DEL SISTEMA

### 1. **USUARIO_EXTERNO** (Ciudadano)
- **Función**: Solicitar licencias de construcción
- **Permisos**:
  - Crear nuevos expedientes
  - Ver sus propios expedientes
  - Recibir notificaciones de observaciones
  - Reenviar documentos observados
  - Descargar su licencia cuando sea aprobada

### 2. **MESA_PARTES** (Mesa de Partes)
- **Función**: Recepción y verificación documental inicial
- **Permisos**:
  - Ver TODOS los expedientes del sistema
  - Verificar documentación completa
  - Asignar expedientes a técnicos
  - Marcar expedientes como "Documentos Incompletos"
  - Establecer prioridades (NORMAL, ALTA, URGENTE)
- **Dashboard**: Vista completa con filtros y asignación directa

### 3. **TECNICO** (Revisor Técnico)
- **Función**: Revisión técnica y normativa de planos y documentación
- **Permisos**:
  - Ver solo expedientes asignados a él
  - Revisar planos de arquitectura, ubicación, memoria descriptiva
  - Aprobar o observar aspectos técnicos
  - Verificar cumplimiento del RNE
  - Enviar expedientes a inspección
- **Dashboard**: Vista de expedientes asignados con herramientas de revisión

### 4. **INSPECTOR** (Inspector de Obra)
- **Función**: Verificación física en campo
- **Permisos**:
  - Ver solo expedientes asignados a él
  - Programar inspecciones
  - Registrar resultados de inspección
  - Aprobar o observar condiciones de obra
  - Lista de verificación in situ
- **Dashboard**: Vista de inspecciones programadas y por realizar

### 5. **GERENTE** (Gerencia)
- **Función**: Decisión final y emisión de licencias
- **Permisos**:
  - Ver TODOS los expedientes
  - Ver estadísticas completas del sistema
  - Tomar decisión final (Aprobar/Rechazar)
  - Emitir resolución y licencia
  - Asignar expedientes a cualquier departamento
  - Dashboard gerencial con métricas
- **Dashboard**: Vista ejecutiva con estadísticas y timeline de procesos

---

## 🔄 FLUJO DEL PROCESO

```
CIUDADANO
   ↓ (Registra expediente)
MESA DE PARTES
   ↓ (Verifica documentos completos)
   ↓ (Asigna a técnico)
TÉCNICO
   ↓ (Revisa planos y documentación técnica)
   ↓ (Aprueba técnicamente)
INSPECTOR
   ↓ (Inspección física en campo)
   ↓ (Verifica cumplimiento)
GERENTE
   ↓ (Decisión final)
   ↓ (Emite resolución)
LICENCIA EMITIDA ✅
```

---

## 🗄️ ESTRUCTURA DE LA BASE DE DATOS

### Modelo Usuario (Actualizado)
```javascript
{
  rol: 'USUARIO_EXTERNO' | 'MESA_PARTES' | 'TECNICO' | 'INSPECTOR' | 'GERENTE',
  departamento: 'MESA_PARTES' | 'REVISION_TECNICA' | 'INSPECCION' | 'GERENCIA' | 'NINGUNO',
  permisos: {
    puedeAsignar: Boolean,
    puedeAprobar: Boolean,
    puedeInspeccionar: Boolean,
    puedeEmitirLicencias: Boolean,
    puedeVerTodos: Boolean
  },
  estadisticas: {
    expedientesAsignados: Number,
    expedientesCompletados: Number,
    promedioTiempoAtencion: Number
  }
}
```

### Modelo Expediente (Actualizado)
```javascript
{
  asignaciones: {
    mesaPartes: {
      usuario: ObjectId,
      fechaAsignacion: Date,
      fechaCompletado: Date,
      tiempoAtencion: Number,
      estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'DEVUELTO'
    },
    tecnico: { ... },
    inspector: { ... },
    gerente: { ... }
  },
  departamentoActual: 'MESA_PARTES' | 'REVISION_TECNICA' | 'INSPECCION' | 'GERENCIA',
  estado: [17 estados específicos por etapa],
  plazos: {
    mesaPartes: { inicio, fin, diasLimite, vencido },
    tecnico: { ... },
    inspector: { ... },
    gerente: { ... }
  },
  prioridad: 'BAJA' | 'NORMAL' | 'ALTA' | 'URGENTE'
}
```

### Estados del Expediente
```
MESA DE PARTES:
  - REGISTRADO
  - VERIFICACION_DOCUMENTARIA
  - DOCUMENTOS_INCOMPLETOS

TÉCNICO:
  - REVISION_TECNICA
  - OBSERVADO_TECNICO
  - APROBADO_TECNICO

INSPECTOR:
  - PROGRAMACION_INSPECCION
  - EN_INSPECCION
  - OBSERVADO_INSPECCION
  - APROBADO_INSPECCION

GERENCIA:
  - REVISION_GERENCIA
  - PENDIENTE_PAGO
  - PAGO_VERIFICADO

FINALES:
  - APROBADO
  - RECHAZADO
  - LICENCIA_EMITIDA
  - ARCHIVADO
```

---

## 🛠️ ENDPOINTS DE LA API

### Asignaciones (nuevos)
- `POST /api/asignaciones/:id/asignar` - Asignar expediente a usuario
- `GET /api/asignaciones/mis-asignaciones` - Obtener expedientes asignados
- `POST /api/asignaciones/:id/completar` - Completar etapa actual
- `GET /api/asignaciones/usuarios-disponibles/:depto` - Listar usuarios por departamento
- `GET /api/asignaciones/estadisticas` - Dashboard gerencial

---

## 🚀 INSTALACIÓN Y CONFIGURACIÓN

### 1. Crear usuarios del nuevo sistema
```bash
cd server
node scripts/crearUsuariosNuevoSistema.js
```

Esto creará usuarios de prueba para cada rol.

### 2. Migrar usuarios existentes (opcional)
```bash
node scripts/crearUsuariosNuevoSistema.js migrar
```

Esto convertirá los roles antiguos a los nuevos:
- `ADMINISTRADOR` → `GERENTE`
- `REVISOR_ADMINISTRATIVO` → `MESA_PARTES`
- `REVISOR_TECNICO` → `TECNICO`
- `INSPECTOR` → `INSPECTOR`
- `SOLICITANTE` → `USUARIO_EXTERNO`

### 3. Iniciar el sistema
```bash
# Opción 1: Usar el script de inicio
cd ..
iniciar-sistema.bat

# Opción 2: Manual
cd server
npm run dev

cd ../client
npm start
```

---

## 🔐 CREDENCIALES DE PRUEBA

### Mesa de Partes
- `mesa.partes@sistema.com` / `123456`
- `mesa.partes2@sistema.com` / `123456`

### Técnicos
- `tecnico1@sistema.com` / `123456`
- `tecnico2@sistema.com` / `123456`
- `tecnico3@sistema.com` / `123456`

### Inspectores
- `inspector1@sistema.com` / `123456`
- `inspector2@sistema.com` / `123456`

### Gerente
- `gerente@sistema.com` / `123456`

### Usuarios Externos
- `usuario1@test.com` / `123456`
- `usuario2@test.com` / `123456`

---

## 📊 FUNCIONALIDADES POR ROL

### Dashboard Mesa de Partes
- ✅ Vista de todos los expedientes nuevos
- ✅ Verificación rápida de documentos
- ✅ Asignación a técnicos con un click
- ✅ Gestión de prioridades
- ✅ Estadísticas de documentos incompletos

### Dashboard Técnico
- ✅ Vista de expedientes asignados
- ✅ Revisión de documentación técnica
- ✅ Descarga directa de planos
- ✅ Formulario de observaciones técnicas
- ✅ Lista de verificación RNE

### Dashboard Inspector
- ✅ Calendario de inspecciones
- ✅ Información de ubicación y contacto
- ✅ Lista de verificación en campo
- ✅ Registro fotográfico de inspección
- ✅ Resultados: Conforme/No Conforme

### Dashboard Gerente
- ✅ Vista ejecutiva del sistema completo
- ✅ Timeline visual del proceso de cada expediente
- ✅ Estadísticas generales por departamento
- ✅ Decisión final (Aprobar/Rechazar)
- ✅ Emisión de resolución y licencia
- ✅ Métricas de tiempo promedio por etapa

---

## 🔔 SISTEMA DE NOTIFICACIONES

Las notificaciones automáticas se envían en:
- ✉️ Asignación de expediente a un usuario
- ✉️ Cambio de estado del expediente
- ✉️ Observaciones en documentos
- ✉️ Aprobación de etapas
- ✉️ Rechazo del expediente
- ✉️ Emisión de licencia
- ⏰ Plazos por vencer
- ⏰ Plazos vencidos

---

## 📈 VENTAJAS DEL NUEVO SISTEMA

1. **Trazabilidad completa**: Cada acción queda registrada con usuario, fecha y detalles
2. **Responsabilidad clara**: Cada rol tiene funciones específicas
3. **Control de tiempos**: Plazos por etapa y alertas de vencimiento
4. **Seguridad mejorada**: Permisos granulares por rol
5. **Eficiencia**: Asignación automática y flujo optimizado
6. **Métricas**: Estadísticas de desempeño por usuario y departamento
7. **Profesionalismo**: Interfaz específica para cada rol

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### No veo mis expedientes asignados
- Verifica que tu usuario tenga el rol correcto
- Revisa que el expediente esté asignado a ti en el departamento correcto

### No puedo asignar expedientes
- Solo MESA_PARTES y GERENTE pueden asignar
- Verifica que el usuario destino tenga el rol adecuado

### Error al completar una etapa
- Asegúrate de ingresar observaciones cuando se requiera
- Verifica que el expediente esté en el estado correcto

---

## 📞 SOPORTE

Para consultas o problemas, revisar:
- Logs del servidor: `server/logs`
- Consola del navegador (F12)
- Verificar permisos del usuario en MongoDB

---

Desarrollado con ❤️ para gestión profesional de licencias de construcción.
