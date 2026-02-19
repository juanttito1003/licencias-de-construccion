# Configuración de Email para Verificación de Usuarios

## 📧 Configurar Gmail para Envío de Emails

### Paso 1: Habilitar Verificación en Dos Pasos

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Seguridad → Verificación en dos pasos
3. Actívala si no está habilitada

### Paso 2: Generar Contraseña de Aplicación

1. Ve a: https://myaccount.google.com/apppasswords
2. Selecciona "Correo" y "Windows Computer" (o el dispositivo que prefieras)
3. Haz clic en "Generar"
4. **Copia la contraseña de 16 caracteres** que aparece

### Paso 3: Configurar Variables de Entorno

Edita tu archivo `.env` y agrega:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # La contraseña de aplicación de 16 caracteres
EMAIL_FROM=noreply@licencias.com

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

**Importante:** 
- `EMAIL_USER`: Tu email de Gmail completo
- `EMAIL_PASSWORD`: La contraseña de aplicación de 16 caracteres (NO tu contraseña normal)
- `FRONTEND_URL`: URL donde está corriendo tu frontend

## 🧪 Modo Desarrollo (Sin Email Real)

En modo desarrollo (`NODE_ENV=development`), los emails se mostrarán en la consola del servidor en lugar de enviarse realmente.

Verás algo como:
```
📧 Email de verificación enviado (desarrollo):
Preview URL: https://ethereal.email/message/xxxxx
Token de verificación: abc123...
URL de verificación: http://localhost:3000/verificar-email/abc123...
```

Para probar sin configurar email:
1. Mantén `NODE_ENV=development` en tu `.env`
2. Registra un usuario
3. Copia la URL de verificación de la consola
4. Pégala en tu navegador

## 🔐 Seguridad

**⚠️ NUNCA subas tu `.env` a GitHub**

El archivo `.env` está en `.gitignore` por seguridad. Contiene datos sensibles como:
- Contraseñas de email
- JWT secrets
- Credenciales de base de datos

## 📝 Flujo de Verificación

1. Usuario se registra
2. Sistema crea cuenta (sin verificar)
3. Se envía email con link único
4. Usuario hace clic en el link
5. Sistema verifica el token
6. Cuenta queda activada
7. Usuario puede iniciar sesión

## 🚨 Solución de Problemas

### Email no llega

1. **Revisa tu consola del servidor** - En desarrollo, la URL aparece ahí
2. **Verifica la contraseña** - Debe ser la contraseña de aplicación, no tu password normal
3. **Revisa spam** - A veces los emails van a spam
4. **Verifica las variables** - Asegúrate de que `EMAIL_USER` y `EMAIL_PASSWORD` sean correctos

### Error "Invalid login"

- Asegúrate de haber generado una **contraseña de aplicación**
- Verifica que la verificación en dos pasos esté activa
- La contraseña debe tener 16 caracteres (sin espacios en el .env)

### Token expirado

- Los tokens expiran en **24 horas**
- Si expira, el usuario debe registrarse nuevamente
- Puedes modificar el tiempo en `server/routes/auth.js` (línea ~24)

## 🔄 Otros Proveedores de Email

### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
```

### Yahoo
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
```

### Servicio Profesional (SendGrid, Mailgun, etc.)
Consulta la documentación del proveedor para los valores correctos.

---

© 2025 Juan Diego Ttito Valenzuela
