# 🚀 Guía de Despliegue y Solución de Problemas

## 📋 Diagnóstico: ¿Por qué se cae la aplicación?

### Problemas Comunes Locales:

#### 1. **Memoria RAM Insuficiente**
- **Síntoma**: La aplicación se cierra sola después de un tiempo
- **Causa**: Node.js + React + MongoDB + Redis consumen ~500MB-1GB de RAM
- **Solución**:
  ```powershell
  # Verificar uso de memoria
  Get-Process node,mongod | Select-Object Name,WorkingSet,CPU
  ```

#### 2. **Puerto ya en uso**
- **Síntoma**: Error "EADDRINUSE" al iniciar
- **Solución**:
  ```powershell
  # Ver qué usa el puerto 5000 (backend)
  Get-NetTCPConnection -LocalPort 5000 | Select-Object OwningProcess
  
  # Ver qué usa el puerto 3000 (frontend)
  Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess
  
  # Matar proceso
  Stop-Process -Id <PID>
  ```

#### 3. **MongoDB no está corriendo**
- **Solución**:
  ```powershell
  # Iniciar MongoDB
  net start MongoDB
  
  # O manualmente
  mongod --dbpath "C:\data\db"
  ```

#### 4. **Dependencias no instaladas**
- **Solución**:
  ```powershell
  # Instalar todo
  npm run install-all
  ```

#### 5. **Variables de entorno incorrectas**
- Revisar que `.env` tenga todos los valores necesarios (ver `.env.example`)

---

## 🌐 Opciones para Desplegar en Internet

### **Opción 1: Render + MongoDB Atlas** ⭐ RECOMENDADO (GRATIS)

**Ventajas:**
- ✅ 100% Gratis para proyectos pequeños
- ✅ SSL automático (HTTPS)
- ✅ Fácil configuración
- ✅ Auto-deploy desde GitHub
- ✅ MongoDB Atlas tiene tier gratuito de 512MB

**Pasos:**

#### A. Preparar el Código

1. **Crear archivo `.gitignore` (si no existe)**:
```
node_modules/
.env
uploads/
*.log
.DS_Store
client/build
```

2. **Agregar scripts en `package.json` raíz**:
```json
{
  "scripts": {
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "server": "nodemon server/index.js",
    "client": "cd client && npm start",
    "build": "cd client && npm run build",
    "start": "node server/index.js",
    "install-all": "npm install && cd client && npm install"
  }
}
```

3. **Modificar `server/index.js` para servir React en producción**:
```javascript
// Agregar después de las rutas API:

// Servir frontend React en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}
```

#### B. MongoDB Atlas (Base de Datos en la Nube - GRATIS)

1. Ve a https://www.mongodb.com/cloud/atlas/register
2. Crea una cuenta gratuita
3. Crea un **Cluster M0** (gratuito, 512MB)
4. En **Database Access**: Crea un usuario con contraseña
5. En **Network Access**: Agrega `0.0.0.0/0` (permitir desde cualquier IP)
6. Obtén tu **Connection String**:
   - Formato: `mongodb+srv://usuario:password@cluster.mongodb.net/licencias_construccion`

#### C. Subir a GitHub

```powershell
# Inicializar Git (si no está)
git init

# Agregar archivos
git add .

# Commit
git commit -m "Preparar para deploy"

# Crear repositorio en GitHub (https://github.com/new)
# Después:
git remote add origin https://github.com/tu-usuario/tu-repo.git
git branch -M main
git push -u origin main
```

#### D. Deploy en Render

1. Ve a https://render.com/
2. Crea cuenta (gratis con GitHub)
3. **New → Web Service**
4. Conecta tu repositorio de GitHub
5. Configuración:
   - **Name**: `licencias-construccion`
   - **Environment**: `Node`
   - **Build Command**: `npm install && cd client && npm install && npm run build`
   - **Start Command**: `node server/index.js`
   - **Plan**: `Free`

6. **Variables de entorno** (Environment):
   ```
   PORT=5000
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/licencias_construccion
   JWT_SECRET=generar_clave_segura_aleatoria_min_32_caracteres
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=distritomunicipalidad@gmail.com
   EMAIL_PASSWORD=qnqjdvkqktxxyekl
   EMAIL_FROM=distritomunicipalidad@gmail.com
   FRONTEND_URL=https://tu-app.onrender.com
   REDIS_HOST=
   REDIS_PORT=
   ENCRYPTION_KEY=otra_clave_aleatoria_segura_32_chars
   ```

7. Click **Create Web Service**

8. **Esperar 10-15 minutos** (primera vez es lento)

9. Tu app estará en: `https://licencias-construccion.onrender.com`

**Nota importante sobre Render Free Tier:**
- Se "duerme" después de 15 minutos sin uso
- Primera petición tarda ~30 segundos en despertar
- Perfecto para demos y proyectos pequeños

---

### **Opción 2: Vercel (Frontend) + Railway (Backend)** 🚄

**Ventajas:**
- Frontend súper rápido con CDN global
- Railway tiene $5 gratis mensuales
- Buen para apps más grandes

#### A. Frontend en Vercel

1. Instala Vercel CLI:
```powershell
npm install -g vercel
```

2. En carpeta `client`:
```powershell
cd client
vercel login
vercel
```

3. Sigue las instrucciones (selecciona React)

4. Actualiza `client/src/services/api.js`:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

5. Variables de entorno en Vercel:
```
REACT_APP_API_URL=https://tu-backend.railway.app/api
```

#### B. Backend en Railway

1. Ve a https://railway.app/
2. Login con GitHub
3. **New Project → Deploy from GitHub**
4. Selecciona tu repositorio
5. Configurar:
   - **Root Directory**: (dejar vacío)
   - **Build Command**: `npm install`
   - **Start Command**: `node server/index.js`

6. Agregar variables de entorno (igual que Render)

7. Railway automáticamente provee MongoDB (addon gratuito)

---

### **Opción 3: Heroku** 💜 (Requiere tarjeta)

**Nota**: Heroku ya no tiene tier gratuito, pero es muy popular.

```powershell
# Instalar Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Crear app
heroku create licencias-construccion

# Agregar MongoDB addon
heroku addons:create mongolab:sandbox

# Configurar variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=tu_jwt_secret

# Deploy
git push heroku main

# Abrir app
heroku open
```

---

### **Opción 4: VPS (DigitalOcean, Linode, AWS EC2)** 💻

**Para proyectos profesionales con más control**

**Ventajas:**
- Control total del servidor
- Mejor rendimiento
- No se "duerme"

**Costo**: Desde $5-$10/mes

#### Deploy en DigitalOcean Droplet ($6/mes)

1. Crea un Droplet Ubuntu 22.04 (1GB RAM, $6/mes)

2. Conecta por SSH:
```bash
ssh root@tu_ip
```

3. Instalar dependencias:
```bash
# Actualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Instalar MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# Instalar PM2 (process manager)
npm install -g pm2

# Instalar Nginx (web server)
apt install -y nginx

# Instalar Certbot (SSL gratis)
apt install -y certbot python3-certbot-nginx
```

4. Clonar tu repositorio:
```bash
cd /var/www
git clone https://github.com/tu-usuario/tu-repo.git licencias
cd licencias

# Instalar dependencias
npm install
cd client && npm install && npm run build
cd ..
```

5. Crear archivo `.env` con tus variables

6. Iniciar con PM2:
```bash
pm2 start server/index.js --name "licencias-backend"
pm2 startup
pm2 save
```

7. Configurar Nginx:
```bash
nano /etc/nginx/sites-available/licencias
```

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    # Servir frontend
    location / {
        root /var/www/licencias/client/build;
        try_files $uri /index.html;
    }

    # Proxy al backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Servir uploads
    location /uploads {
        alias /var/www/licencias/uploads;
    }
}
```

```bash
# Habilitar sitio
ln -s /etc/nginx/sites-available/licencias /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

8. Configurar SSL (HTTPS):
```bash
certbot --nginx -d tu-dominio.com
```

---

## 🔧 Solución al Problema Local

Si tu app se cae localmente, ejecuta estos comandos:

```powershell
# 1. Detener todos los procesos Node
Get-Process node* | Stop-Process -Force

# 2. Verificar MongoDB
net start MongoDB

# 3. Limpiar caché y reinstalar
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force client/node_modules
npm run install-all

# 4. Iniciar limpiamente
npm run dev
```

### Monitor de recursos:
```powershell
# Ver en tiempo real
while ($true) {
    Clear-Host
    "=== MONITOREO DE RECURSOS ==="
    Get-Process node,mongod -ErrorAction SilentlyContinue | 
        Select-Object Name, 
                      @{N='CPU(%)';E={$_.CPU}}, 
                      @{N='RAM(MB)';E={[math]::Round($_.WorkingSet/1MB,2)}}
    Start-Sleep -Seconds 2
}
```

---

## 📊 Comparación de Opciones

| Opción | Costo | Dificultad | Tiempo Deploy | Mejor Para |
|--------|-------|------------|---------------|------------|
| **Render** | Gratis | ⭐ Fácil | 15 min | Demos, proyectos pequeños |
| **Vercel + Railway** | $5/mes | ⭐⭐ Media | 20 min | Apps medianas, buen rendimiento |
| **Heroku** | $7/mes | ⭐ Fácil | 10 min | Prototipado rápido |
| **VPS** | $6-10/mes | ⭐⭐⭐ Difícil | 60 min | Producción, control total |

---

## 🎯 Mi Recomendación

### Para estudiante/demo:
**Render + MongoDB Atlas** (100% GRATIS)
- Link: https://render.com/
- MongoDB: https://www.mongodb.com/cloud/atlas/register

### Para proyecto real:
**VPS en DigitalOcean** ($6/mes)
- Mejor rendimiento
- No se duerme
- Control total
- Link: https://www.digitalocean.com/ (cupón $200 gratis por 60 días)

---

## ❓ Preguntas Frecuentes

**P: ¿Necesito dominio propio?**
R: No, Render/Vercel te dan un subdominio gratis. Si quieres tu dominio: Namecheap (~$10/año)

**P: ¿Los archivos subidos se pierden en Render?**
R: Sí, Render es efímero. Solución: usar Cloudinary (gratis) para imágenes/PDFs.

**P: ¿Cuántos usuarios soporta el plan gratuito?**
R: ~10-20 usuarios simultáneos en Render Free

**P: ¿Cómo hago backup de MongoDB Atlas?**
R: Atlas hace backups automáticos. También puedes usar:
```powershell
mongodump --uri="mongodb+srv://..." --out=backup
```

---

## 📞 Próximos Pasos

1. **Elige una plataforma** (recomiendo Render para empezar)
2. **Sube tu código a GitHub**
3. **Crea cuenta en MongoDB Atlas**
4. **Sigue la guía paso a paso**
5. **Configura variables de entorno**
6. **Despliega**

¡Tu aplicación estará online en menos de 30 minutos! 🚀
