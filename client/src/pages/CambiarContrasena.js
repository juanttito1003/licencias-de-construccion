/**
 * Componente: CambiarContrasena
 * Descripción: Cambio de contraseña con verificación por código
 * Autor: Juan Diego Ttito Valenzuela
 * Contacto: 948 225 929
 * © 2025 Todos los derechos reservados
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaLock, FaEye, FaEyeSlash, FaKey } from 'react-icons/fa';
import api from '../services/api';
import './Pages.css';

const CambiarContrasena = () => {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1); // 1: solicitar código, 2: cambiar contraseña
  const [cargando, setCargando] = useState(false);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  
  const [formData, setFormData] = useState({
    codigo: '',
    contrasenaNueva: '',
    confirmarContrasena: ''
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
    setCargando(true);

    try {
      const response = await api.post('/auth/solicitar-codigo-cambio-contrasena');

      toast.success(response.data.mensaje);
      toast.info('Revisa tu correo electrónico (incluye spam)', { autoClose: 5000 });
      setPaso(2);
    } catch (error) {
      console.error('Error al solicitar código:', error);
      toast.error(error.response?.data?.error || 'Error al enviar el código');
    } finally {
      setCargando(false);
    }
  };

  const handleCambiarContrasena = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.codigo || !formData.contrasenaNueva || !formData.confirmarContrasena) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    if (formData.contrasenaNueva !== formData.confirmarContrasena) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    const erroresPassword = validarPassword(formData.contrasenaNueva);
    if (erroresPassword.length > 0) {
      toast.error(`Contraseña insegura: ${erroresPassword.join(', ')}`);
      return;
    }

    if (formData.codigo.length !== 6) {
      toast.error('El código debe tener 6 dígitos');
      return;
    }

    setCargando(true);

    try {
      await api.put('/auth/cambiar-contrasena', {
        codigo: formData.codigo,
        contrasenaNueva: formData.contrasenaNueva,
        confirmarContrasena: formData.confirmarContrasena
      });

      toast.success('Contraseña actualizada exitosamente');
      
      // Redirigir al dashboard después de 2 segundos
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      toast.error(error.response?.data?.error || 'Error al cambiar la contraseña');
    } finally {
      setCargando(false);
    }
  };

  const handleCancelar = () => {
    navigate('/');
  };

  const getPasswordStrength = () => {
    const errores = validarPassword(formData.contrasenaNueva);
    if (formData.contrasenaNueva.length === 0) return { color: '#ccc', text: '' };
    if (errores.length === 0) return { color: '#4caf50', text: 'Segura' };
    if (errores.length === 1) return { color: '#ff9800', text: 'Media' };
    return { color: '#f44336', text: 'Débil' };
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Cambiar Contraseña</h1>
        <p>
          {paso === 1 
            ? 'Recibirás un código de verificación en tu correo' 
            : 'Ingresa el código y tu nueva contraseña'}
        </p>
      </div>

      <div className="card">
        {paso === 1 ? (
          <form onSubmit={handleSolicitarCodigo} className="form">
            <div className="info-card" style={{ marginBottom: '24px' }}>
              <h3>🔐 Verificación de Seguridad</h3>
              <p>
                Para cambiar tu contraseña, primero debes verificar tu identidad. 
                Te enviaremos un código de 6 dígitos a tu correo electrónico registrado.
              </p>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={handleCancelar}
                className="btn btn-secondary"
                disabled={cargando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={cargando}
              >
                {cargando ? 'Enviando...' : 'Enviar Código de Verificación'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCambiarContrasena} className="form">
            <div className="info-box" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderLeft: '4px solid #2196f3', borderRadius: '4px' }}>
              <p style={{ margin: 0, color: '#1976d2' }}>
                <FaKey /> Revisa tu correo electrónico (incluye spam) para obtener el código de verificación
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
              <small className="form-hint">El código expira en 10 minutos</small>
            </div>

            <div className="form-group">
              <label htmlFor="contrasenaNueva">
                <FaLock /> Nueva Contraseña *
              </label>
              <div className="password-input-wrapper">
                <input
                  type={mostrarNueva ? 'text' : 'password'}
                  id="contrasenaNueva"
                  name="contrasenaNueva"
                  value={formData.contrasenaNueva}
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
                  onClick={() => setMostrarNueva(!mostrarNueva)}
                  aria-label={mostrarNueva ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {mostrarNueva ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {formData.contrasenaNueva && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill" 
                      style={{ 
                        width: `${(3 - validarPassword(formData.contrasenaNueva).length) * 33.33}%`,
                        backgroundColor: getPasswordStrength().color 
                      }}
                    />
                  </div>
                  <span style={{ color: getPasswordStrength().color }}>
                    {getPasswordStrength().text}
                  </span>
                </div>
              )}
              <small className="form-hint">Debe tener mínimo 8 caracteres, incluir números y letras</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmarContrasena">
                <FaLock /> Confirmar Nueva Contraseña *
              </label>
              <div className="password-input-wrapper">
                <input
                  type={mostrarConfirmar ? 'text' : 'password'}
                  id="confirmarContrasena"
                  name="confirmarContrasena"
                  value={formData.confirmarContrasena}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Repite la nueva contraseña"
                  required
                  minLength="8"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                  aria-label={mostrarConfirmar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {mostrarConfirmar ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {formData.confirmarContrasena && formData.contrasenaNueva !== formData.confirmarContrasena && (
                <small style={{ color: '#f44336' }}>Las contraseñas no coinciden</small>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={handleCancelar}
                className="btn btn-secondary"
                disabled={cargando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={cargando}
              >
                {cargando ? 'Actualizando...' : 'Cambiar Contraseña'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="info-card">
        <h3>Consejos de Seguridad</h3>
        <ul>
          <li>Usa una contraseña única que no utilices en otros sitios</li>
          <li>Combina letras mayúsculas, minúsculas, números y símbolos</li>
          <li>Evita usar información personal fácil de adivinar</li>
          <li>Cambia tu contraseña periódicamente</li>
          <li>No compartas tu contraseña con nadie</li>
          <li>El código de verificación expira en 10 minutos</li>
        </ul>
      </div>
    </div>
  );
};

export default CambiarContrasena;
