/**
 * Configuración de Redis
 * Para almacenamiento temporal de códigos de verificación
 * Autor: Juan Diego Ttito Valenzuela
 * © 2025 Todos los derechos reservados
 */

const redis = require('redis');

let redisClient = null;
let isRedisAvailable = false;

const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        reconnectStrategy: false // Desactivar reconexión automática
      },
      password: process.env.REDIS_PASSWORD || undefined,
      database: process.env.REDIS_DB || 0,
    });

    let errorLogged = false;

    redisClient.on('error', (err) => {
      if (!errorLogged) {
        console.warn('⚠️  Redis no disponible. Usando almacenamiento en memoria.');
        errorLogged = true;
      }
      isRedisAvailable = false;
    });

    redisClient.on('connect', () => {
      console.log('✓ Redis conectado exitosamente');
      isRedisAvailable = true;
    });

    redisClient.on('disconnect', () => {
      if (!errorLogged) {
        console.warn('⚠️  Redis desconectado. Usando almacenamiento en memoria.');
        errorLogged = true;
      }
      isRedisAvailable = false;
    });

    await redisClient.connect();
  } catch (error) {
    console.warn('⚠️  Redis no disponible. Usando almacenamiento en memoria.');
    isRedisAvailable = false;
    redisClient = null;
  }
};

// Almacenamiento en memoria como fallback
const memoryStorage = new Map();

// Guardar código con expiración
const setCode = async (key, value, expirationSeconds) => {
  try {
    if (isRedisAvailable && redisClient) {
      await redisClient.setEx(key, expirationSeconds, JSON.stringify(value));
      return true;
    } else {
      // Fallback a memoria
      memoryStorage.set(key, {
        value,
        expira: Date.now() + (expirationSeconds * 1000)
      });
      
      // Auto-limpiar después de expiración
      setTimeout(() => {
        memoryStorage.delete(key);
      }, expirationSeconds * 1000);
      
      return true;
    }
  } catch (error) {
    console.error('Error al guardar código:', error);
    return false;
  }
};

// Obtener código
const getCode = async (key) => {
  try {
    if (isRedisAvailable && redisClient) {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } else {
      // Fallback a memoria
      const data = memoryStorage.get(key);
      
      if (!data) return null;
      
      // Verificar si expiró
      if (Date.now() > data.expira) {
        memoryStorage.delete(key);
        return null;
      }
      
      return data.value;
    }
  } catch (error) {
    console.error('Error al obtener código:', error);
    return null;
  }
};

// Eliminar código
const deleteCode = async (key) => {
  try {
    if (isRedisAvailable && redisClient) {
      await redisClient.del(key);
    } else {
      memoryStorage.delete(key);
    }
    return true;
  } catch (error) {
    console.error('Error al eliminar código:', error);
    return false;
  }
};

// Incrementar intentos
const incrementAttempts = async (key, maxAttempts = 3) => {
  try {
    const data = await getCode(key);
    if (!data) return null;
    
    data.intentos = (data.intentos || 0) + 1;
    
    if (data.intentos >= maxAttempts) {
      await deleteCode(key);
      return { bloqueado: true, intentos: data.intentos };
    }
    
    // Guardar con el mismo tiempo de expiración restante
    const ttl = isRedisAvailable && redisClient 
      ? await redisClient.ttl(key)
      : Math.floor((data.expira - Date.now()) / 1000);
    
    await setCode(key, data, ttl > 0 ? ttl : 600);
    
    return { bloqueado: false, intentos: data.intentos };
  } catch (error) {
    console.error('Error al incrementar intentos:', error);
    return null;
  }
};

// Rate limiting: Verificar límite de solicitudes
const checkRateLimit = async (key, limit, windowSeconds) => {
  try {
    if (isRedisAvailable && redisClient) {
      const count = await redisClient.incr(key);
      
      if (count === 1) {
        await redisClient.expire(key, windowSeconds);
      }
      
      return {
        permitido: count <= limit,
        intentos: count,
        limite: limit
      };
    } else {
      // Fallback a memoria
      const now = Date.now();
      const data = memoryStorage.get(key);
      
      if (!data || now > data.expira) {
        memoryStorage.set(key, {
          value: 1,
          expira: now + (windowSeconds * 1000)
        });
        
        setTimeout(() => memoryStorage.delete(key), windowSeconds * 1000);
        
        return { permitido: true, intentos: 1, limite: limit };
      }
      
      data.value++;
      memoryStorage.set(key, data);
      
      return {
        permitido: data.value <= limit,
        intentos: data.value,
        limite: limit
      };
    }
  } catch (error) {
    console.error('Error en rate limiting:', error);
    return { permitido: true, intentos: 0, limite: limit };
  }
};

module.exports = {
  connectRedis,
  setCode,
  getCode,
  deleteCode,
  incrementAttempts,
  checkRateLimit,
  isRedisAvailable: () => isRedisAvailable
};
