# Guía de Instalación de Redis en Windows

## Opción 1: Memurai (Recomendado para Windows)

**Memurai** es un port oficial de Redis para Windows.

### Instalación:
1. Descargar desde: https://www.memurai.com/get-memurai
2. Instalar el ejecutable
3. Redis correrá automáticamente como servicio de Windows

### Verificar instalación:
```powershell
# Verificar que el servicio esté corriendo
Get-Service Memurai

# Conectarse a Redis
memurai-cli ping
# Debe responder: PONG
```

---

## Opción 2: Redis en WSL2 (Windows Subsystem for Linux)

### Pasos:
1. Instalar WSL2:
```powershell
wsl --install
```

2. En la terminal de Ubuntu/WSL:
```bash
sudo apt update
sudo apt install redis-server

# Iniciar Redis
sudo service redis-server start

# Verificar
redis-cli ping
# Debe responder: PONG
```

3. Configurar para que Redis acepte conexiones desde Windows:
```bash
sudo nano /etc/redis/redis.conf

# Cambiar:
bind 127.0.0.1 ::1
# Por:
bind 0.0.0.0

# Reiniciar
sudo service redis-server restart
```

4. En tu `.env` de Windows, usar:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Opción 3: Redis en Docker (Recomendado para desarrollo)

### Requisitos:
- Docker Desktop instalado

### Comando:
```powershell
# Ejecutar Redis en contenedor
docker run -d -p 6379:6379 --name redis-licencias redis:alpine

# Verificar
docker ps

# Conectarse para probar
docker exec -it redis-licencias redis-cli ping
# Debe responder: PONG
```

### Detener/Iniciar:
```powershell
docker stop redis-licencias
docker start redis-licencias
```

---

## ⚠️ Opción 4: Sin Redis (Fallback automático)

**Si no instalas Redis, el sistema funcionará igual** usando almacenamiento en memoria como fallback.

**Limitaciones del fallback:**
- Los códigos se pierden si reinicias el servidor
- No funciona con múltiples instancias del servidor (load balancing)
- No recomendado para producción

### Para usar sin Redis:
Simplemente **no instales nada**. El sistema detectará automáticamente que Redis no está disponible y usará memoria.

---

## 🔧 Configuración en el Proyecto

### Archivo `.env`:
```env
# Redis Configuration (opcional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### Verificar conexión desde la aplicación:
Cuando inicies el servidor, verás uno de estos mensajes:

✅ **Con Redis:**
```
✓ Redis conectado exitosamente
✓ Servidor corriendo en puerto 5000
```

⚠️ **Sin Redis (fallback):**
```
⚠️  Redis no disponible, usando almacenamiento en memoria
✓ Servidor corriendo en puerto 5000
```

---

## 📊 Comparación de Opciones

| Opción | Facilidad | Performance | Recomendado |
|--------|-----------|-------------|-------------|
| Memurai | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Producción Windows |
| Docker | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Desarrollo |
| WSL2 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⚠️ Avanzado |
| Fallback (sin Redis) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⚠️ Solo desarrollo |

---

## 🚀 Recomendación Final

**Para desarrollo:** Usa Docker o el fallback automático (sin instalar nada)

**Para producción:** Usa Memurai o un servicio cloud como:
- Redis Labs (https://redis.com/try-free/)
- AWS ElastiCache
- Azure Cache for Redis
- Upstash (https://upstash.com/)

---

**© 2025 Juan Diego Ttito Valenzuela**  
**Contacto: 948 225 929**
