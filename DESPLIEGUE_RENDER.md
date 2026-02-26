# 🚀 GUÍA DE DESPLIEGUE EN RENDER

## Paso 1: Crear cuenta en Render
1. Ve a: https://render.com
2. Haz clic en "Get Started for Free"
3. Regístrate con GitHub (recomendado) o tu email

## Paso 2: Crear nuevo Web Service
1. En el dashboard de Render, haz clic en **"New +"**
2. Selecciona **"Web Service"**
3. Conecta tu repositorio de GitHub:
   - Busca: `licencias-de-construccion`
   - Haz clic en **"Connect"**

## Paso 3: Configurar el servicio

### Información básica:
- **Name:** licencias-construccion (o el nombre que prefieras)
- **Region:** Oregon (US West) - Gratis
- **Branch:** main
- **Root Directory:** (dejar vacío)
- **Environment:** Node
- **Build Command:** 
  ```bash
  npm install && cd client && npm install && npm run build && cd ..
  ```
- **Start Command:**
  ```bash
  npm start
  ```

### Plan:
- Selecciona: **Free** (0 USD/mes)

## Paso 4: Configurar Variables de Entorno

Haz clic en "Advanced" y agrega las siguientes variables de entorno:

### Variables OBLIGATORIAS:

**NODE_ENV**
```
production
```

**PORT** (opcional, Render lo asigna automáticamente)
```
10000
```

**MONGODB_URI**
```
mongodb+srv://juanttitov_db_user:TTITOjuan@cluster0.dajnrvl.mongodb.net/licencias_construccion?retryWrites=true&w=majority
```

**JWT_SECRET**
```
tu_clave_secreta_muy_segura_para_produccion_cambiar_2026
```

**EMAIL_HOST**
```
smtp.gmail.com
```

**EMAIL_PORT**
```
587
```

**EMAIL_USER**
```
distritomunicipalidad@gmail.com
```

**EMAIL_PASSWORD**
```
qnqjdvkqktxxyekl
```

**EMAIL_FROM**
```
distritomunicipalidad@gmail.com
```

**FRONTEND_URL** (se actualizará después)
```
https://licencias-construccion.onrender.com
```

### Variables OPCIONALES (puedes dejarlas vacías):

**REDIS_HOST**
```
(dejar vacío - usará memoria)
```

**RENIEC_API_PROVIDER**
```
(dejar vacío por ahora)
```

**RENIEC_API_TOKEN**
```
(dejar vacío por ahora)
```

## Paso 5: Desplegar

1. Revisa que todos los campos estén correctos
2. Haz clic en **"Create Web Service"**
3. Render comenzará a:
   - Clonar tu repositorio
   - Instalar dependencias (backend + frontend)
   - Compilar el frontend de React
   - Iniciar el servidor

**Esto tomará 5-10 minutos la primera vez** ⏱️

## Paso 6: Verificar el despliegue

### Monitorear logs:
- En la página del servicio, ve a la pestaña **"Logs"**
- Deberías ver:
  ```
  ✓ Servidor corriendo en puerto XXXX
  ✓ Conectado a MongoDB
  ```

### URL de tu aplicación:
- Render te dará una URL como: `https://licencias-construccion.onrender.com`
- Haz clic en ella para abrir tu aplicación

## Paso 7: Actualizar FRONTEND_URL

1. Copia la URL que Render te asignó
2. Ve a "Environment" en tu servicio de Render
3. Edita la variable **FRONTEND_URL** con tu URL real:
   ```
   https://tu-app.onrender.com
   ```
4. Guarda los cambios
5. Render reiniciará automáticamente

## Paso 8: Probar la aplicación

1. Abre la URL de tu aplicación
2. Intenta iniciar sesión con:
   - Email: `mesa.partes@sistema.com`
   - Password: `licencias123`

3. Verifica que:
   - ✅ Login funciona
   - ✅ Se ven los expedientes
   - ✅ Puedes navegar entre páginas
   - ✅ Las notificaciones aparecen

## ⚠️ IMPORTANTE - Limitaciones del Plan Gratuito:

### 1. **Sleep después de 15 minutos de inactividad**
   - El servicio se "duerme" si no hay actividad
   - Al visitarlo, tardará 30-60 segundos en "despertar"
   - **Solución:** Para demo, simplemente espera que cargue

### 2. **750 horas gratis por mes**
   - Suficiente para demos y pruebas
   - No 24/7 continuo en plan gratuito

### 3. **No hay persistencia de archivos**
   - Los PDFs/archivos subidos se perderán al reiniciar
   - **Solución futura:** Usar Cloudinary o AWS S3

## 🔄 Actualizar el despliegue

Cada vez que hagas `git push` a GitHub, Render automáticamente:
1. Detectará los cambios
2. Reconstruirá la aplicación
3. La desplegará

**No necesitas hacer nada más** 🎉

## 🐛 Solución de problemas

### Error: "Build failed"
- Revisa los logs de build
- Verifica que MongoDB_URI sea correcto
- Verifica que todas las dependencias estén en package.json

### Error: "Application failed to respond"
- Ve a Logs y busca errores
- Verifica que PORT no esté hardcodeado
- Verifica la conexión a MongoDB Atlas

### La aplicación carga pero no muestra datos:
- Verifica que MongoDB Atlas tenga Network Access configurado (0.0.0.0/0)
- Verifica que los datos se hayan migrado correctamente

## 📝 Credenciales de prueba

**Usuarios del sistema:**

| Rol | Email | Contraseña |
|-----|-------|------------|
| Gerente | gerente@sistema.com | licencias123 |
| Mesa de Partes | mesa.partes@sistema.com | licencias123 |
| Técnico | tecnico1@sistema.com | licencias123 |
| Inspector | inspector@sistema.com | licencias123 |
| Usuario Externo | usuario1@test.com | licencias123 |

## 🎉 ¡Listo!

Tu aplicación ahora está:
- ✅ Desplegada en internet
- ✅ Accesible 24/7 (con sleep en inactividad)
- ✅ Usando MongoDB Atlas en la nube
- ✅ Con auto-deployment desde GitHub

**URL:** La que Render te asignó (ej: https://licencias-construccion.onrender.com)
