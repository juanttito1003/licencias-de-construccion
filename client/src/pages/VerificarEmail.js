import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import './Pages.css';

const VerificarEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [estado, setEstado] = useState('verificando'); // verificando, exito, error
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    verificarToken();
  }, [token]);

  const verificarToken = async () => {
    try {
      const response = await api.get(`/auth/verificar-email/${token}`);
      setEstado('exito');
      setMensaje(response.data.mensaje);
      toast.success('¡Email verificado exitosamente!');
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setEstado('error');
      setMensaje(error.response?.data?.error || 'Error al verificar el email');
      toast.error('Error al verificar el email');
    }
  };

  return (
    <div className="container" style={{ 
      maxWidth: '600px', 
      marginTop: '80px',
      textAlign: 'center'
    }}>
      <div className="card">
        <div className="card-body" style={{ padding: '40px' }}>
          {estado === 'verificando' && (
            <>
              <FaSpinner className="fa-spin" style={{ fontSize: '64px', color: 'var(--primary-color)', marginBottom: '20px' }} />
              <h2>Verificando tu email...</h2>
              <p>Por favor espera mientras verificamos tu cuenta.</p>
            </>
          )}

          {estado === 'exito' && (
            <>
              <FaCheckCircle style={{ fontSize: '80px', color: 'var(--success-color)', marginBottom: '20px' }} />
              <h2 style={{ color: 'var(--success-color)', marginBottom: '16px' }}>
                ¡Verificación Exitosa!
              </h2>
              <p style={{ fontSize: '16px', marginBottom: '24px' }}>
                {mensaje}
              </p>
              <p style={{ color: '#666', marginBottom: '24px' }}>
                Serás redirigido al inicio de sesión en 3 segundos...
              </p>
              <Link to="/login" className="btn btn-primary">
                Ir a Iniciar Sesión
              </Link>
            </>
          )}

          {estado === 'error' && (
            <>
              <FaTimesCircle style={{ fontSize: '80px', color: 'var(--danger-color)', marginBottom: '20px' }} />
              <h2 style={{ color: 'var(--danger-color)', marginBottom: '16px' }}>
                Error de Verificación
              </h2>
              <p style={{ fontSize: '16px', marginBottom: '24px', color: '#666' }}>
                {mensaje}
              </p>
              <div style={{ 
                backgroundColor: '#fff3e0', 
                padding: '16px', 
                borderRadius: '8px',
                marginBottom: '24px',
                textAlign: 'left'
              }}>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  <strong>Posibles causas:</strong>
                </p>
                <ul style={{ marginTop: '8px', marginBottom: 0 }}>
                  <li>El link de verificación ha expirado (24 horas)</li>
                  <li>El link ya fue utilizado</li>
                  <li>El link es inválido</li>
                </ul>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Link to="/registro" className="btn btn-secondary">
                  Registrarse Nuevamente
                </Link>
                <Link to="/login" className="btn btn-primary">
                  Iniciar Sesión
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificarEmail;
