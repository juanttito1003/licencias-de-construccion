# 🔄 REINICIAR SISTEMA DESDE CERO

Este script te permite reiniciar completamente el sistema con el nuevo diseño profesional.

## ⚠️ ADVERTENCIA
**Esto eliminará TODOS los datos existentes:**
- ❌ Usuarios antiguos (admin@sistema.com, usuario@sistema.com, etc.)
- ❌ Expedientes
- ❌ Notificaciones
- ❌ Inspecciones

## 📋 PASOS PARA REINICIAR

### 1. Limpiar base de datos completa
```bash
cd server
node scripts/limpiarBaseDatos.js
```

### 2. Crear usuarios del nuevo sistema
```bash
node scripts/crearUsuariosNuevoSistema.js
```

### 3. Iniciar el sistema
```bash
cd ..
iniciar-sistema.bat
```

## 🔐 NUEVOS USUARIOS CREADOS

### Mesa de Partes (Verificación de documentos)
- `mesa.partes@sistema.com` / `123456`
- `mesa.partes2@sistema.com` / `123456`

### Técnicos (Revisión técnica)
- `tecnico1@sistema.com` / `123456`
- `tecnico2@sistema.com` / `123456`
- `tecnico3@sistema.com` / `123456`

### Inspectores (Inspecciones de campo)
- `inspector1@sistema.com` / `123456`
- `inspector2@sistema.com` / `123456`

### Gerente (Decisión final)
- `gerente@sistema.com` / `123456`

### Usuarios Externos (Ciudadanos)
- `usuario1@test.com` / `123456`
- `usuario2@test.com` / `123456`

## ✅ SISTEMA NUEVO

Después de ejecutar estos pasos tendrás:
- ✅ Sistema completamente limpio
- ✅ 5 roles profesionales
- ✅ Flujo por capas implementado
- ✅ Dashboards especializados
- ✅ Sin usuarios antiguos

## 🚀 ALTERNATIVA: Sin limpiar

Si prefieres mantener tus expedientes actuales:
```bash
# Solo actualizar usuarios existentes
cd server
node scripts/crearUsuariosNuevoSistema.js migrar
```

Esto actualizará los roles antiguos a los nuevos sin eliminar nada.
