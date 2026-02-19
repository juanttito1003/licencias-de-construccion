/**
 * Componente: Register
 * Descripción: Registro de usuarios con verificación por código
 * Autor: Juan Diego Ttito Valenzuela
 * Contacto: 948 225 929
 * © 2025 Todos los derechos reservados
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaLock, FaIdCard, FaPhone, FaEye, FaEyeSlash, FaKey } from 'react-icons/fa';
import api from '../services/api';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1); // 1: solicitar código, 2: completar registro
  const [cargando, setCargando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  
  const [emailTemporal, setEmailTemporal] = useState('');
  
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    password: '',
    confirmarPassword: '',
    dni: '',
    telefono: '',
    codigo: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validarPassword = (password) => {
    const errores = [];
    
    if (password.length < 8) {
      errores.push('Mínimo 8 caracteres');
    }
    
    if (!/[0-9]/.test(password)) {
      errores.push('Debe incluir números');
    }
    
    if (!/[a-zA-Z]/.test(password)) {
      errores.push('Debe incluir letras');
    }
    
    return errores;
  };

  const handleSolicitarCodigo = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast.error('El correo electrónico es requerido');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Formato de correo inválido');
      return;
    }

    setCargando(true);

    try {
      const response = await api.post('/auth/solicitar-codigo-registro', {
        email: formData.email
      });

      setEmailTemporal(formData.email);
      toast.success(response.data.mensaje);
      toast.info('Revisa tu bandeja de entrada y spam', { autoClose: 5000 });
      setPaso(2);
    } catch (error) {
      console.error('Error al solicitar código:', error);
      toast.error(error.response?.data?.error || 'Error al enviar el código');
    } finally {
      setCargando(false);
    }
  };

  const handleCompletarRegistro = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.nombres || !formData.apellidos || !formData.password || 
        !formData.confirmarPassword || !formData.dni || !formData.codigo) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    if (formData.password !== formData.confirmarPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    const erroresPassword = validarPassword(formData.password);
    if (erroresPassword.length > 0) {
      toast.error(`Contraseña insegura: ${erroresPassword.join(', ')}`);
      return;
    }

    if (formData.dni.length !== 8) {
      toast.error('El DNI debe tener 8 dígitos');
      return;
    }

    if (formData.codigo.length !== 6) {
      toast.error('El código debe tener 6 dígitos');
      return;
    }

    setCargando(true);

    try {
      const response = await api.post('/auth/verificar-codigo-registro', {
        email: emailTemporal,
        codigo: formData.codigo,
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        password: formData.password,
        confirmarPassword: formData.confirmarPassword,
        dni: formData.dni,
        telefono: formData.telefono
      });

      toast.success('¡Registro exitoso! Redirigiendo al login...');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Error al completar registro:', error);
      const mensaje = error.response?.data?.error || 'Error al registrar usuario';
      const intentosRestantes = error.response?.data?.intentosRestantes;
      
      if (intentosRestantes !== undefined) {
        toast.error(`${mensaje}. Intentos restantes: ${intentosRestantes}`);
      } else {
        toast.error(mensaje);
      }
    } finally {
      setCargando(false);
    }
  };

  const handleVolverPaso1 = () => {
    setPaso(1);
    setFormData({ ...formData, codigo: '' });
  };

  const handleReenviarCodigo = async () => {
    if (!emailTemporal) {
      toast.error('No hay email registrado');
      return;
    }

    setCargando(true);

    try {
      const response = await api.post('/auth/reenviar-codigo-registro', {
        email: emailTemporal
      });

      toast.success(response.data.mensaje);
      toast.info('Revisa tu bandeja de entrada nuevamente', { autoClose: 5000 });
      
      // Limpiar el código anterior
      setFormData({ ...formData, codigo: '' });
    } catch (error) {
      console.error('Error al reenviar código:', error);
      const mensaje = error.response?.data?.error || 'Error al reenviar el código';
      toast.error(mensaje);
    } finally {
      setCargando(false);
    }
  };

  const getPasswordStrength = () => {
    const errores = validarPassword(formData.password);
    if (formData.password.length === 0) return { color: '#ccc', text: '' };
    if (errores.length === 0) return { color: '#4caf50', text: 'Segura' };
    if (errores.length === 1) return { color: '#ff9800', text: 'Media' };
    return { color: '#f44336', text: 'Débil' };
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Registro de Usuario</h1>
          <p>
            {paso === 1 
              ? 'Ingresa tu correo para recibir el código de verificación' 
              : 'Completa tus datos y el código recibido'}
          </p>
        </div>

        {paso === 1 ? (
          <form onSubmit={handleSolicitarCodigo} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">
                <FaEnvelope /> Correo Electrónico *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-control"
                placeholder="ejemplo@correo.com"
                required
                autoComplete="email"
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={cargando}>
              {cargando ? 'Enviando...' : 'Enviar Código de Verificación'}
            </button>

            <div className="auth-footer">
              <p>
                ¿Ya tienes una cuenta?{' '}
                <Link to="/login">Iniciar Sesión</Link>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCompletarRegistro} className="auth-form">
            <div className="info-box">
              <p>
                <FaEnvelope /> Código enviado a: <strong>{emailTemporal}</strong>
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="codigo">
                <FaKey /> Código de Verificación (6 dígitos) *
              </label>
              <input
                type="text"
                id="codigo"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                className="form-control"
                placeholder="123456"
                required
                maxLength="6"
                pattern="[0-9]{6}"
                autoComplete="off"
              />
              <small className="form-hint">Revisa tu correo (incluye spam)</small>
            </div>

            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleReenviarCodigo}
                className="btn-link"
                disabled={cargando}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-color)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ¿No recibiste el código? Reenviar
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nombres">
                  <FaUser /> Nombres *
                </label>
                <input
                  type="text"
                  id="nombres"
                  name="nombres"
                  value={formData.nombres}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Tus nombres"
                  required
                  autoComplete="given-name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="apellidos">
                  <FaUser /> Apellidos *
                </label>
                <input
                  type="text"
                  id="apellidos"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Tus apellidos"
                  required
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dni">
                  <FaIdCard /> DNI *
                </label>
                <input
                  type="text"
                  id="dni"
                  name="dni"
                  value={formData.dni}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="12345678"
                  required
                  maxLength="8"
                  pattern="[0-9]{8}"
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label htmlFor="telefono">
                  <FaPhone /> Teléfono
                </label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="987654321"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <FaLock /> Contraseña *
              </label>
              <div className="password-input-wrapper">
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength="8"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  aria-label={mostrarPassword ? 'Ocultar' : 'Mostrar'}
                >
                  {mostrarPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill" 
                      style={{ 
                        width: `${(3 - validarPassword(formData.password).length) * 33.33}%`,
                        backgroundColor: getPasswordStrength().color 
                      }}
                    />
                  </div>
                  <span style={{ color: getPasswordStrength().color }}>
                    {getPasswordStrength().text}
                  </span>
                </div>
              )}
              <small className="form-hint">
                Debe tener mínimo 8 caracteres, incluir números y letras
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmarPassword">
                <FaLock /> Confirmar Contraseña *
              </label>
              <div className="password-input-wrapper">
                <input
                  type={mostrarConfirmar ? 'text' : 'password'}
                  id="confirmarPassword"
                  name="confirmarPassword"
                  value={formData.confirmarPassword}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Repite tu contraseña"
                  required
                  minLength="8"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                  aria-label={mostrarConfirmar ? 'Ocultar' : 'Mostrar'}
                >
                  {mostrarConfirmar ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {formData.confirmarPassword && formData.password !== formData.confirmarPassword && (
                <small style={{ color: '#f44336' }}>Las contraseñas no coinciden</small>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={handleVolverPaso1}
                className="btn btn-secondary"
                disabled={cargando}
              >
                Cambiar Email
              </button>
              <button type="submit" className="btn btn-primary" disabled={cargando}>
                {cargando ? 'Registrando...' : 'Completar Registro'}
              </button>
            </div>

            <div className="auth-footer">
              <p>
                ¿Ya tienes una cuenta?{' '}
                <Link to="/login">Iniciar Sesión</Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register;
