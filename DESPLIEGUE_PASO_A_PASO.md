# 🚀 GUÍA RÁPIDA: DESPLIEGUE A INTERNET

## 📦 PASO 1: Instalar Git (5 minutos)

### Opción A: Git tradicional
1. Descargar de: https://git-scm.com/download/win
2. Instalar con opciones por defecto (Next, Next, Next...)
3. Reiniciar VS Code después de instalar

### Opción B: GitHub Desktop (MÁS FÁCIL) ⭐ RECOMENDADO
1. Descargar de: https://desktop.github.com/
2. Instalar
3. Login con tu cuenta GitHub (o crear cuenta)
4. Más visual, más fácil de usar

---

## 🌐 PASO 2: Crear cuenta MongoDB Atlas (5 minutos)

**Base de datos gratuita en la nube**

1. Ve a: **https://www.mongodb.com/cloud/atlas/register**

2. Crear cuenta:
   - Usa tu email
   - Elige plan **M0 FREE** (512MB gratis forever)

3. Crear Cluster:
   - Provider: **AWS**
   - Region: **US East (N. Virginia)** us-east-1
   - Cluster Name: **licencias-construccion**
   - Click **"Create Deployment"**
   - **Esperar 3-5 minutos** mientras se crea

4. Configurar acceso:
   
   **A) Database Access (Crear usuario):**
   - Click **"Database Access"** (menú izquierda)
   - Click **"Add New Database User"**
   - Authentication Method: **Password**
   - Username: `admin`
   - Password: `LicenciasSistema2024!` (copia esta contraseña)
   - Database User Privileges: **Read and write to any database**
   - Click **"Add User"**

   **B) Network Access (Permitir conexiones):**
   - Click **"Network Access"** (menú izquierda)
   - Click **"Add IP Address"**
   - Click **"Allow Access From Anywhere"** (o poner `0.0.0.0/0`)
   - Click **"Confirm"**

5. Obtener Connection String:
   - Click **"Database"** (menú izquierda)
   - Click **"Connect"** en tu cluster
   - Click **"Drivers"**
   - Selecciona: **Node.js** y versión **5.5 or later**
   - Copia el string de conexión, se ve así:
   
   ```
   mongodb+srv://admin:<password>@licencias-construccion.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

   - Reemplaza `<password>` con: `LicenciasSistema2024!`
   - Resultado final:
   
   ```
   mongodb+srv://admin:LicenciasSistema2024!@licencias-construccion.xxxxx.mongodb.net/licencias_construccion?retryWrites=true&w=majority
   ```
   
   **📋 GUARDA ESTE STRING, lo necesitarás después**

---

## 📤 PASO 3: Subir código a GitHub (10 minutos)

### Con GitHub Desktop (Recomendado):

1. Abrir GitHub Desktop
2. File → Add Local Repository
3. Buscar carpeta: `C:\Users\juant\OneDrive\Imágenes\Escritorio\app interfaz-sistemas de informacion`
4. Si dice "not a git repository", click **"Create a repository"**
5. Llenar:
   - Name: `licencias-construccion`
   - Description: `Sistema de Gestión de Licencias de Construcción`
   - Click **"Create Repository"**
6. Click **"Publish repository"** (arriba)
7. Desmarcar **"Keep this code private"** (o dejarlo marcado si quieres privado)
8. Click **"Publish Repository"**
9. ¡Listo! Tu código está en GitHub

### Con Git en terminal (Alternativa):

```powershell
# Inicializar Git
git init

# Configurar usuario (primera vez)
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"

# Agregar archivos
git add .

# Commit
git commit -m "Deploy inicial - Sistema Licencias de Construcción"

# Crear repo en GitHub (ir a https://github.com/new)
# Después:
git remote add origin https://github.com/TU-USUARIO/licencias-construccion.git
git branch -M main
git push -u origin main
```

---

## 🌐 PASO 4: Deploy en Render (10 minutos)

**Hosting gratuito con auto-deploy**

1. Ve a: **https://render.com/**

2. Click **"Get Started for Free"** o **"Sign Up"**
   - Login con GitHub (más rápido)

3. Autorizar Render en GitHub si pregunta

4. En Dashboard, click **"New +"** → **"Web Service"**

5. Conectar repositorio:
   - Si no aparece tu repo, click **"Configure account"**
   - Dar acceso a tu repositorio `licencias-construccion`
   - Refrescar página
   - Click **"Connect"** en tu repo

6. Configurar el servicio:

   ```
   Name: licencias-construccion
   Region: Oregon (US West)
   Branch: main
   Root Directory: (dejar vacío)
   Runtime: Node
   
   Build Command:
   npm install && cd client && npm install && npm run build
   
   Start Command:
   node server/index.js
   
   Instance Type: Free
   ```

7. **IMPORTANTE: Variables de Entorno**
   
   Click **"Advanced"** → **"Add Environment Variable"**
   
   Agregar estas variables (una por una):

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `MONGODB_URI` | *(pegar tu string de MongoDB Atlas de arriba)* |
   | `JWT_SECRET` | `licencias_jwt_secret_super_seguro_produccion_2024_cambiar_random` |
   | `EMAIL_HOST` | `smtp.gmail.com` |
   | `EMAIL_PORT` | `587` |
   | `EMAIL_USER` | `distritomunicipalidad@gmail.com` |
   | `EMAIL_PASSWORD` | `qnqjdvkqktxxyekl` |
   | `EMAIL_FROM` | `distritomunicipalidad@gmail.com` |
   | `FRONTEND_URL` | `https://licencias-construccion.onrender.com` |
   | `ENCRYPTION_KEY` | `otra_clave_aleatoria_muy_segura_32_caracteres_min` |

   **Nota:** El FRONTEND_URL usa el nombre que pusiste en "Name" arriba

8. Click **"Create Web Service"**

9. **ESPERAR 10-15 MINUTOS** ⏳
   - Primera vez tarda más
   - Verás logs en tiempo real
   - Cuando veas "✓ Servidor corriendo en puerto 5000" = ¡Listo!

10. Tu aplicación estará en:
    ```
    https://licencias-construccion.onrender.com
    ```

---

## ✅ VERIFICAR QUE FUNCIONA

1. Abrir: `https://licencias-construccion.onrender.com`

2. **Primera vez tarda 30-50 segundos** (el servidor "despierta")

3. Deberías ver la pantalla de Login

4. Probar con los usuarios que creamos:
   ```
   Email: gerente@sistema.com
   Password: gerente123
   ```

5. ¡Funciona! 🎉

---

## 🔄 ACTUALIZAR LA APP (después de cambios)

### Con GitHub Desktop:
1. Hacer cambios en el código
2. GitHub Desktop mostrará los cambios
3. Escribir descripción del commit
4. Click **"Commit to main"**
5. Click **"Push origin"**
6. Render detecta cambios y hace auto-deploy (5-10 min)

### Con Git:
```powershell
git add .
git commit -m "Descripción de cambios"
git push
```

---

## ⚠️ PROBLEMAS COMUNES

### "Application failed to respond"
- La app está "durmiendo" (Render Free)
- Esperar 30-50 segundos y recargar página
- Después funciona normal

### "Cannot connect to MongoDB"
- Verificar que MONGODB_URI sea correcto
- Verificar que en Atlas permitas IP 0.0.0.0/0

### "Build failed"
- Ver logs en Render
- Generalmente: falta alguna dependencia
- Solución: `npm install` localmente primero

### Archivos subidos se pierden
- Render Free es efímero
- Solución: Usar Cloudinary para uploads (gratis)
- Link: https://cloudinary.com/

---

## 💡 LÍMITES DEL PLAN GRATUITO

**Render Free:**
- ✅ 750 horas/mes (suficiente)
- ✅ SSL/HTTPS automático
- ⚠️ Se duerme después de 15 min sin uso
- ⚠️ Primera carga tarda ~30 seg
- ⚠️ Reinicia cada 24h

**MongoDB Atlas Free:**
- ✅ 512MB almacenamiento
- ✅ Suficiente para ~10,000-50,000 expedientes
- ✅ Backups automáticos
- ✅ Sin límite de tiempo

---

## 🎯 SIGUIENTE NIVEL (Cuando necesites)

### Render Upgrade ($7/mes):
- No se duerme
- Más RAM/CPU
- Sin reinicios

### Dominio propio:
1. Comprar en Namecheap (~$10/año)
2. En Render → Settings → Custom Domain
3. Agregar tu dominio

### Uploads persistentes:
```bash
npm install cloudinary
```
Configurar en código para guardar archivos en Cloudinary

---

## 📞 AYUDA

**¿Atascado?**
- Logs en Render: Dashboard → tu servicio → Logs
- Logs en MongoDB: Atlas → Browse Collections

**¿Algo no funciona?**
- Verificar variables de entorno
- Ver logs de Render
- Verificar conexión a MongoDB

---

## 🎉 ¡LISTO!

Tu aplicación está online en:
**https://licencias-construccion.onrender.com**

Accesible desde:
- ✅ Celular
- ✅ Tablet  
- ✅ Cualquier computadora
- ✅ Cualquier lugar del mundo
- ✅ 24/7 (cuando despierte)

**¡Felicitaciones!** 🚀
