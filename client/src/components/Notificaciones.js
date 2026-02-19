/**
 * Componente: Notificaciones
 * Descripción: Panel para mostrar y gestionar notificaciones dentro de la aplicación
 * Autor: Juan Diego Ttito Valenzuela
 * Contacto: 948 225 929
 * © 2025 Todos los derechos reservados
 */

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { 
  FaBell, 
  FaEnvelope, 
  FaEnvelopeOpen, 
  FaTimes, 
  FaTrash,
  FaCheckDouble,
  FaExclamationCircle,
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaFileAlt
} from 'react-icons/fa';
import api from '../services/api';
import './Notificaciones.css';

const Notificaciones = ({ isOpen, onClose, onCountUpdate }) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [filtro, setFiltro] = useState('todas'); // 'todas', 'no-leidas'

  const cargarNotificaciones = useCallback(async () => {
    try {
      setCargando(true);
      const response = await api.get('/notificaciones', {
        params: {
          soloNoLeidas: filtro === 'no-leidas',
          limit: 50
        }
      });
      setNotificaciones(response.data.notificaciones);
      
      // Actualizar contador
      if (onCountUpdate) {
        onCountUpdate(response.data.noLeidas);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      toast.error('Error al cargar notificaciones');
    } finally {
      setCargando(false);
    }
  }, [filtro, onCountUpdate]);

  useEffect(() => {
    if (isOpen) {
      cargarNotificaciones();
    }
  }, [isOpen, cargarNotificaciones]);

  const marcarComoLeida = async (notificacionId) => {
    try {
      await api.patch(`/notificaciones/${notificacionId}/leer`);
      cargarNotificaciones();
      toast.success('Marcada como leída');
    } catch (error) {
      console.error('Error al marcar notificación:', error);
      toast.error('Error al marcar como leída');
    }
  };

  const marcarTodasComoLeidas = async () => {
    try {
      await api.patch('/notificaciones/leer-todas');
      cargarNotificaciones();
      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      console.error('Error al marcar todas:', error);
      toast.error('Error al marcar todas como leídas');
    }
  };

  const eliminarNotificacion = async (notificacionId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta notificación?')) {
      return;
    }

    try {
      await api.delete(`/notificaciones/${notificacionId}`);
      cargarNotificaciones();
      toast.success('Notificación eliminada');
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      toast.error('Error al eliminar notificación');
    }
  };

  const obtenerIconoTipo = (tipo) => {
    switch (tipo) {
      case 'INSPECCION':
        return <FaFileAlt className="icono-tipo inspeccion" />;
      case 'OBSERVACION':
        return <FaExclamationCircle className="icono-tipo observacion" />;
      case 'APROBACION':
        return <FaCheckCircle className="icono-tipo aprobacion" />;
      case 'RECHAZO':
        return <FaTimesCircle className="icono-tipo rechazo" />;
      case 'ALERTA':
        return <FaExclamationCircle className="icono-tipo alerta" />;
      case 'INFO':
        return <FaInfoCircle className="icono-tipo info" />;
      default:
        return <FaEnvelope className="icono-tipo mensaje" />;
    }
  };

  const formatearFecha = (fecha) => {
    const ahora = new Date();
    const fechaNotif = new Date(fecha);
    const diferencia = Math.floor((ahora - fechaNotif) / 1000); // segundos

    if (diferencia < 60) {
      return 'Hace un momento';
    } else if (diferencia < 3600) {
      const minutos = Math.floor(diferencia / 60);
      return `Hace ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
    } else if (diferencia < 86400) {
      const horas = Math.floor(diferencia / 3600);
      return `Hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    } else if (diferencia < 604800) {
      const dias = Math.floor(diferencia / 86400);
      return `Hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
    } else {
      return fechaNotif.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notificaciones-panel-overlay" onClick={onClose}>
      <div className="notificaciones-panel" onClick={(e) => e.stopPropagation()}>
        <div className="notificaciones-header">
          <h3>
            <FaBell /> Notificaciones
          </h3>
          <button onClick={onClose} className="btn-cerrar" aria-label="Cerrar">
            <FaTimes />
          </button>
        </div>

        <div className="notificaciones-toolbar">
          <div className="filtros">
            <button
              className={`btn-filtro ${filtro === 'todas' ? 'activo' : ''}`}
              onClick={() => setFiltro('todas')}
            >
              Todas
            </button>
            <button
              className={`btn-filtro ${filtro === 'no-leidas' ? 'activo' : ''}`}
              onClick={() => setFiltro('no-leidas')}
            >
              No leídas
            </button>
          </div>
          {notificaciones.some(n => !n.leida) && (
            <button
              className="btn-marcar-todas"
              onClick={marcarTodasComoLeidas}
              title="Marcar todas como leídas"
            >
              <FaCheckDouble /> Marcar todas
            </button>
          )}
        </div>

        <div className="notificaciones-lista">
          {cargando ? (
            <div className="notificaciones-loading">
              <div className="spinner"></div>
              <p>Cargando notificaciones...</p>
            </div>
          ) : notificaciones.length === 0 ? (
            <div className="notificaciones-vacio">
              <FaBell className="icono-vacio" />
              <p>No hay notificaciones</p>
              <small>Aquí aparecerán tus mensajes y alertas</small>
            </div>
          ) : (
            notificaciones.map((notif) => (
              <div
                key={notif._id}
                className={`notificacion-item ${!notif.leida ? 'no-leida' : ''} prioridad-${notif.prioridad.toLowerCase()}`}
              >
                <div className="notificacion-icono">
                  {obtenerIconoTipo(notif.tipo)}
                </div>
                <div className="notificacion-contenido">
                  <div className="notificacion-header-item">
                    <h4>{notif.asunto}</h4>
                    <span className="notificacion-fecha">
                      {formatearFecha(notif.createdAt)}
                    </span>
                  </div>
                  <p className="notificacion-mensaje">
                    {notif.mensaje}
                  </p>
                  {notif.expediente && (
                    <div className="notificacion-expediente">
                      <FaFileAlt /> Expediente: {notif.expediente.numeroExpediente}
                    </div>
                  )}
                </div>
                <div className="notificacion-acciones">
                  {!notif.leida ? (
                    <button
                      className="btn-accion"
                      onClick={() => marcarComoLeida(notif._id)}
                      title="Marcar como leída"
                    >
                      <FaEnvelopeOpen />
                    </button>
                  ) : (
                    <FaCheckCircle className="icono-leida" title="Leída" />
                  )}
                  <button
                    className="btn-accion btn-eliminar"
                    onClick={() => eliminarNotificacion(notif._id)}
                    title="Eliminar"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notificaciones;
