# COMANDOS RÁPIDOS - Sistema de Licencias

## 🚀 INICIAR LA APLICACIÓN

### Opción 1: Todo junto (Recomendado)
```
npm run dev
```
Abre: http://localhost:3000

### Opción 2: Solo backend
```
npm run server
```

### Opción 3: Solo frontend
```
npm run client
```

---

## 🛑 DETENER TODO

```
# Detener todos los procesos Node
Get-Process node | Stop-Process -Force

# O presiona Ctrl+C en cada terminal
```

---

## 🔍 VER QUÉ ESTÁ CORRIENDO

```
# Ver procesos Node y MongoDB
Get-Process node,mongod -ErrorAction SilentlyContinue | Select-Object Name,Id,@{N='RAM(MB)';E={[math]::Round($_.WorkingSet/1MB,2)}}

# Ver qué usa el puerto 5000 (Backend)
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue

# Ver qué usa el puerto 3000 (Frontend)
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
```

---

## 🗄️ MONGODB

```
# Iniciar MongoDB
net start MongoDB

# Detener MongoDB
net stop MongoDB

# Ver estado
Get-Process mongod -ErrorAction SilentlyContinue
```

---

## 📦 INSTALAR DEPENDENCIAS

```
# Instalar todo (raíz + cliente)
npm run install-all

# Solo raíz
npm install

# Solo cliente
cd client
npm install
cd ..
```

---

## 🧹 LIMPIAR Y REINSTALAR

```
# Borrar node_modules
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force client/node_modules

# Reinstalar todo
npm run install-all
```

---

## 🔄 REINICIAR DESDE CERO

```
# 1. Detener todo
Get-Process node | Stop-Process -Force

# 2. Limpiar
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force client/node_modules

# 3. Reinstalar
npm run install-all

# 4. Iniciar
npm run dev
```

---

## 📤 SUBIR A GITHUB

```
# Primera vez
git init
git add .
git commit -m "Commit inicial"
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git branch -M main
git push -u origin main

# Actualizaciones posteriores
git add .
git commit -m "Descripción de cambios"
git push
```

---

## 🏗️ BUILD PARA PRODUCCIÓN

```
# Crear build de React
cd client
npm run build
cd ..

# El backend servirá automáticamente el build en producción
```

---

## 🗃️ BACKUP DE BASE DE DATOS

```
# Exportar MongoDB
mongodump --db licencias_construccion --out backup

# Importar MongoDB
mongorestore --db licencias_construccion backup/licencias_construccion
```

---

## 🔐 CAMBIAR CONTRASEÑA DE USUARIO (MongoDB)

```
# Abrir MongoDB shell
mongosh

# Conectar a la base de datos
use licencias_construccion

# Ver usuarios
db.usuarios.find({}, {email:1, rol:1, nombres:1})

# Cambiar contraseña (encriptada con bcrypt)
# Nota: La contraseña "123456" encriptada es:
# $2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Para generar una nueva contraseña encriptada:
# 1. Ve a: https://bcrypt-generator.com/
# 2. Ingresa tu contraseña
# 3. Usa rounds: 10
# 4. Copia el hash generado

# Actualizar en MongoDB:
db.usuarios.updateOne(
  { email: "usuario@example.com" },
  { $set: { password: "$2a$10$HASH_AQUI" } }
)
```

---

## 🛠️ DIAGNÓSTICO RÁPIDO

```
# Ver todo el estado
Write-Host "Node.js:" -NoNewline; node --version;
Write-Host "MongoDB:" -NoNewline; if (Get-Process mongod -EA SilentlyContinue) { Write-Host " OK" -ForegroundColor Green } else { Write-Host " NO" -ForegroundColor Red };
Write-Host "Backend:" -NoNewline; if (Get-NetTCPConnection -LocalPort 5000 -EA SilentlyContinue) { Write-Host " OK" -ForegroundColor Green } else { Write-Host " NO" -ForegroundColor Red };
Write-Host "Frontend:" -NoNewline; if (Get-NetTCPConnection -LocalPort 3000 -EA SilentlyContinue) { Write-Host " OK" -ForegroundColor Green } else { Write-Host " NO" -ForegroundColor Red }
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS COMUNES

### Error: "EADDRINUSE" (Puerto en uso)
```
# Ver qué proceso usa el puerto
Get-NetTCPConnection -LocalPort 5000 | Select-Object OwningProcess

# Matar ese proceso
Stop-Process -Id <PID> -Force
```

### Error: "Cannot find module"
```
npm run install-all
```

### Error: "MongoDB connection failed"
```
net start MongoDB
```

### Frontend no carga
```
# Verificar que el backend respondaque no tendríaesté corriendo
Get-NetTCPConnection -LocalPort 5000

# Verificar que el frontend esté corriendo
Get-NetTCPConnection -LocalPort 3000

# Si no están, iniciar
npm run dev
```

### RAM muy alta
```
# Ver uso de memoria
Get-Process node,mongod | Select-Object Name,@{N='RAM(MB)';E={[math]::Round($_.WorkingSet/1MB,2)}}

# Reiniciar servicios
Get-Process node | Stop-Process -Force
npm run dev
```

---

## 📊 MONITOREO EN TIEMPO REAL

```
# Monitorear recursos
while ($true) {
    Clear-Host
    "=== MONITOR ==="
    Get-Process node,mongod -EA SilentlyContinue | 
        Select-Object Name, @{N='RAM(MB)';E={[math]::Round($_.WorkingSet/1MB,2)}}, @{N='CPU';E={[math]::Round($_.CPU,2)}}
    Start-Sleep 2
}
```

---

## 🌐 DESPUÉS DE DEPLOY EN RENDER

### Ver logs remotos
1. Ve a https://dashboard.render.com
2. Selecciona tu servicio
3. Click en "Logs"

### Actualizar app en Render
```
git add .
git commit -m "Actualización"
git push
# Render hace auto-deploy automáticamente
```

### Variables de entorno
1. En Render Dashboard
2. Selecciona tu servicio
3. Environment → Edit
4. Agrega/modifica variables
5. Save Changes (reinicia automáticamente)

---

## 📞 COMANDOS PARA COPIAR-PEGAR

### Diagnóstico completo
```
Write-Host "`n=== DIAGNÓSTICO ===" -ForegroundColor Cyan; node --version; if (Get-Process mongod -EA SilentlyContinue) { Write-Host "MongoDB: OK" -ForegroundColor Green } else { Write-Host "MongoDB: NO" -ForegroundColor Red }; if (Get-NetTCPConnection -LocalPort 5000 -EA SilentlyContinue) { Write-Host "Backend: OK" -ForegroundColor Green } else { Write-Host "Backend: NO" -ForegroundColor Red }; if (Get-NetTCPConnection -LocalPort 3000 -EA SilentlyContinue) { Write-Host "Frontend: OK" -ForegroundColor Green } else { Write-Host "Frontend: NO" -ForegroundColor Red }; Get-Process node -EA SilentlyContinue | Select-Object Id,@{N='RAM(MB)';E={[math]::Round($_.WorkingSet/1MB,2)}}
```

### Reinicio completo
```
Get-Process node | Stop-Process -Force; Start-Sleep 2; npm run dev
```

---

Ver más en:
- DIAGNOSTICO_Y_SOLUCION.md (por qué se cae y cómo desplegar)
- GUIA_DESPLIEGUE.md (guía completa de deploy)
