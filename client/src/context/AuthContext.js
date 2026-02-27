import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export { AuthContext }; // Exportar AuthContext para uso directo

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const verificarSesion = async () => {
      const token = localStorage.getItem('token');
      const usuarioGuardado = localStorage.getItem('usuario');

      if (token && usuarioGuardado) {
        try {
          // Intentar verificar que el token sea válido con el backend
          const response = await api.get('/auth/verificar');
          const usuario = response.data.usuario;
          setUsuario(usuario);
          // Actualizar también el localStorage con los datos más recientes
          localStorage.setItem('usuario', JSON.stringify(usuario));
        } catch (error) {
          console.warn('⚠️ No se pudo verificar sesión con el servidor:', error.message);
          
          // Si es error de red o servidor caído (no hay response)
          // MANTENER la sesión del localStorage
          if (!error.response) {
            console.log('✅ Manteniendo sesión activa (servidor temporalmente no disponible)');
            try {
              const usuarioLocal = JSON.parse(usuarioGuardado);
              setUsuario(usuarioLocal);
            } catch (parseError) {
              console.error('Error al parsear usuario guardado:', parseError);
              localStorage.removeItem('token');
              localStorage.removeItem('usuario');
              setUsuario(null);
            }
          } 
          // Si es 401 con token inválido/expirado, SÍ limpiar
          else if (error.response.status === 401) {
            const errorMsg = error.response.data?.error;
            if (errorMsg === 'Token inválido' || errorMsg === 'Token expirado') {
              console.log('🔐 Token inválido - limpiando sesión');
              localStorage.removeItem('token');
              localStorage.removeItem('usuario');
              setUsuario(null);
            } else {
              // Otro tipo de 401, mantener sesión
              try {
                const usuarioLocal = JSON.parse(usuarioGuardado);
                setUsuario(usuarioLocal);
              } catch (e) {
                setUsuario(null);
              }
            }
          }
          // Otros errores (500, 503, etc) - mantener sesión
          else {
            console.log('✅ Manteniendo sesión activa (error temporal del servidor)');
            try {
              const usuarioLocal = JSON.parse(usuarioGuardado);
              setUsuario(usuarioLocal);
            } catch (e) {
              setUsuario(null);
            }
          }
        }
      }
      setCargando(false);
    };

    verificarSesion();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, usuario } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    setUsuario(usuario);

    return usuario;
  };

  const register = async (datos) => {
    const response = await api.post('/auth/registro', datos);
    const { token, usuario } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    setUsuario(usuario);

    return usuario;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  const value = {
    usuario,
    cargando,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
