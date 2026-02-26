import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos timeout
});

// Interceptor para agregar token en cada petición
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si no hay respuesta del servidor (servidor caído, red)
    if (!error.response) {
      console.warn('⚠️ Error de red o servidor no disponible:', error.message);
      // NO cerrar sesión - mantener sesión activa
      return Promise.reject(error);
    }

    // Error 401 - Solo cerrar sesión si es token realmente inválido
    if (error.response.status === 401) {
      const errorMessage = error.response?.data?.error;
      const url = error.config?.url || '';
      
      // NO cerrar sesión en estas situaciones:
      // 1. Error en /auth/login (ya está en login)
      // 2. Error en /auth/verificar (verificación automática)
      if (url.includes('/auth/login') || url.includes('/auth/verificar')) {
        return Promise.reject(error);
      }
      
      // Solo cerrar sesión si es ESPECÍFICAMENTE token inválido/expirado
      if (errorMessage === 'Token inválido' || errorMessage === 'Token expirado') {
        console.warn('🔐 Token expirado, redirigiendo al login...');
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        // Usar setTimeout para evitar loops
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }, 100);
      }
      // Para otros 401 (permisos, etc.) NO cerrar sesión
      return Promise.reject(error);
    }

    // Error 403 - Sin permisos (NO cerrar sesión)
    if (error.response.status === 403) {
      console.warn('⚠️ Sin permisos para esta acción');
      return Promise.reject(error);
    }

    // Errores 500, 502, 503 - Servidor/BD caída (NO cerrar sesión)
    if (error.response.status >= 500) {
      console.warn('⚠️ Error del servidor, manteniendo sesión activa');
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
