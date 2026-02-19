# 🔍 DIAGNÓSTICO: Por qué se cae tu aplicación

## 📊 Estado Actual Detectado:

```
✅ Node.js v24.12.0 - Instalado
✅ MongoDB - Corriendo
✅ Backend (puerto 5000) - Activo (71MB RAM)
❌ Frontend (puerto 3000) - NO está corriendo
```

## 🐛 PROBLEMA IDENTIFICADO:

**Solo el backend está corriendo. El frontend React NO está iniciado.**

### ¿Por qué se cae?

1. **Frontend no está ejecutándose**: El usuario ve una pantalla en blanco o error de conexión
2. **Uso de memoria**: Aunque el proceso actual usa poca RAM (71MB), si inicias el frontend se sumarán ~200MB más
3. **Posible causa**: Solo ejecutaste `npm run server` en lugar de `npm run dev`

## ✅ SOLUCIÓN INMEDIATA (para correr localmente):

### Opción 1: Iniciar ambos servicios (Recomendado)
```powershell
# Detener proceso actual
Get-Process node | Stop-Process -Force

# Iniciar todo junto
npm run dev
```

### Opción 2: Dos terminales separadas
```powershell
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

## 🌐 DESPLEGAR EN INTERNET (RECOMENDADO)

### ¿Por qué desplegar en internet?

- ✅ No depende de tu laptop (puede apagarse)
- ✅ Accesible desde cualquier lugar
- ✅ No consume recursos de tu PC
- ✅ Mejor rendimiento
- ✅ No se "cae" cuando cierras la laptop

### Opción GRATUITA: Render + MongoDB Atlas

**Tiempo estimado: 25 minutos**
**Costo: $0 (100% gratis)**

#### Paso 1: Preparar para despliegue (opcional)

Ya preparé el código. Solo necesitas subir a GitHub.

#### Paso 2: Crear cuenta MongoDB Atlas (Base de datos gratis)

1. Ve a: https://www.mongodb.com/cloud/atlas/register
2. Regístrate (usa Gmail para más rápido)
3. Crea un cluster M0 (FREE)
4. En "Database Access" crea un usuario:
   - Username: `admin`
   - Password: `TuPasswordSegura123`
5. En "Network Access" agrega: `0.0.0.0/0` (permitir desde cualquier IP)
6. En "Database" click CONNECT y copia la URL:
   ```
   mongodb+srv://admin:TuPasswordSegura123@cluster0.xxxxx.mongodb.net/licencias_construccion
   ```

#### Paso 3: Subir a GitHub

```powershell
# Inicializar Git
git init

# Agregar todos los archivos
git add .

# Primer commit
git commit -m "Deploy inicial - Sistema de Licencias de Construcción"

# Crear repositorio en GitHub
# Ve a: https://github.com/new
# Nombre sugerido: licencias-construccion
# Después ejecuta:

git remote add origin https://github.com/TU-USUARIO/licencias-construccion.git
git branch -M main
git push -u origin main
```

#### Paso 4: Deploy en Render

1. Ve a: https://render.com/
2. Regístrate con GitHub (gratis)
3. Click **"New +"** → **"Web Service"**
4. Conecta tu repositorio `licencias-construccion`
5. Configuración:

```
Name: licencias-construccion
Region: Oregon (US West)
Branch: main
Root Directory: (dejar vacío)
Runtime: Node
Build Command: npm install && cd client && npm install && npm run build
Start Command: node server/index.js
Instance Type: Free
```

6. **Variables de Entorno** (click "Advanced" → "Add Environment Variable"):

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://admin:TuPasswordSegura123@cluster0.xxxxx.mongodb.net/licencias_construccion
JWT_SECRET=licencias_jwt_secret_super_seguro_2024_cambiar
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=distritomunicipalidad@gmail.com
EMAIL_PASSWORD=qnqjdvkqktxxyekl
EMAIL_FROM=distritomunicipalidad@gmail.com
ENCRYPTION_KEY=encryption_key_32_caracteres_min
FRONTEND_URL=https://licencias-construccion.onrender.com
```

7. Click **"Create Web Service"**

8. **ESPERAR 10-15 minutos** (primera vez tarda)

9. ¡Listo! Tu app estará en:
   ```
   https://licencias-construccion.onrender.com
   ```

## ⚠️ IMPORTANTE sobre Render Free Tier:

- Se "duerme" después de 15 minutos sin uso
- Primera petición tarda 30-50 segundos en "despertar"
- Después de despertar funciona normal
- Perfecto para demos y proyectos de estudiantes
- **Si necesitas que esté siempre activo 24/7**: Upgrade a plan de $7/mes

## 🔄 Actualizar después de cambios:

```powershell
# Hacer cambios en el código
# ...

# Commit
git add .
git commit -m "Descripción de los cambios"

# Push a GitHub
git push

# Render hace auto-deploy automáticamente (5-10 min)
```

## 📱 Acceso después del Deploy:

**URL de tu aplicación**: `https://licencias-construccion.onrender.com`

**Usuarios de prueba** (crear con el Register):
- Gerente: gerente@example.com
- Mesa de Partes: mesapartes@example.com
- Técnico: tecnico@example.com
- Inspector: inspector@example.com
- Usuario Externo: (cualquier email)

## 🐛 Si algo falla en Render:

1. Ve a tu servicio en Render
2. Click en "Logs"
3. Busca errores en rojo
4. Problemas comunes:
   - **"Cannot connect to MongoDB"**: Verifica que MONGODB_URI sea correcto y que en Atlas permitas IP 0.0.0.0/0
   - **"Module not found"**: El build falló, revisa Build Logs
   - **"Port already in use"**: Render asigna PORT automáticamente, NO lo cambies

## 💰 Comparación de Costos:

| Plataforma | Costo | Ventaja |
|------------|-------|---------|
| **Render** | GRATIS | Fácil, auto-deploy |
| **Heroku** | $7/mes | Popular, muchos addons |
| **Railway** | $5/mes gratis | MongoDB incluido |
| **VPS DigitalOcean** | $6/mes | Control total, no se duerme |
| **AWS/Azure** | Variable | Empresarial, muy complejo |

## 🎯 Mi Recomendación:

### Para ti ahora (estudiante/demo):
**Render + MongoDB Atlas (GRATIS)**
- Deploy en 25 minutos
- Sin tarjeta de crédito
- Suficiente para demo/proyecto escolar

### Si el proyecto crece:
**VPS en DigitalOcean ($6/mes)**
- Siempre activo
- Mejor rendimiento
- Base de datos local
- Cupón: $200 gratis por 60 días en https://m.do.co/c/XXXXXX

## 📞 Siguiente Paso:

1. **¿Quieres seguir usando local?**
   - Ejecuta: `npm run dev`
   - Abre: http://localhost:3000

2. **¿Quieres desplegar en internet? (Recomendado)**
   - Sigue los 4 pasos de arriba
   - En 25 minutos estará online
   - Envíame la URL cuando termine

## ❓ Preguntas Frecuentes:

**P: ¿Por qué Render en vez de ejecutar local?**
R: Porque:
- No depende de tu laptop (puedes apagarla)
- Accesible desde celular/otras computadoras
- No consume tu RAM
- Tiene SSL (https://) automático
- Es gratis

**P: ¿Los archivos subidos se guardan?**
R: En Render Free NO (se reinicia cada vez). Soluciones:
- Usar Cloudinary para PDFs/imágenes (gratis)
- Usar AWS S3 para archivos
- Por ahora en desarrollo está OK

**P: ¿Puedo usar mi propio dominio?**
R: Sí, en la configuración de Render puedes agregar un dominio custom (ej: licencias.tudominio.com)

---

Ver guía completa de despliegue: **GUIA_DESPLIEGUE.md**
