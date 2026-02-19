/**
 * Componente: EnviarMensaje
 * Descripción: Modal para que el administrador envíe mensajes a los usuarios
 * Autor: Juan Diego Ttito Valenzuela
 * Contacto: 948 225 929
 * © 2025 Todos los derechos reservados
 * Actualizado: 2026
 */

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FaEnvelope, FaTimes, FaFileAlt, FaSpinner } from 'react-icons/fa';
import api from '../services/api';
import '../pages/Pages.css';

const EnviarMensaje = ({ expediente, onClose, onEnviado }) => {
  const [cargando, setCargando] = useState(false);
  const [formData, setFormData] = useState({
    asunto: '',
    mensaje: ''
  });

  // Plantillas de mensajes predefinidas
  const plantillas = {
    inspeccion_proxima: {
      asunto: '📋 Programación de Inspección - Expediente N° ' + expediente.numeroExpediente,
      mensaje: `Estimado(a) ${expediente.solicitante?.nombres || 'Usuario'},

Le informamos que el inspector municipal se dirigirá a su vivienda ubicada en:
${expediente.proyecto?.ubicacion?.direccion || 'su domicilio'}

⏰ Fecha: En los próximos 10 días
📅 Le avisaremos con 1 día de anticipación la fecha exacta

Por favor, asegúrese de que el predio esté accesible para la inspección.

Gracias por su atención.

Tu Municipalidad a tu servicio
Sistema de Licencias de Construcción`
    },
    inspeccion_manana: {
      asunto: '⚠️ Inspección Programada para Mañana - Expediente N° ' + expediente.numeroExpediente,
      mensaje: `Estimado(a) ${expediente.solicitante?.nombres || 'Usuario'},

Le recordamos que el inspector municipal acudirá a su predio MAÑANA:

📍 Dirección: ${expediente.proyecto?.ubicacion?.direccion || 'su domicilio'}
🕐 Horario: Entre las 9:00 AM y 6:00 PM
📞 El inspector se contactará con usted cuando esté cerca del predio

Por favor:
✓ Esté atento a su teléfono
✓ Asegure el acceso al predio
✓ Tenga disponible la documentación original si es necesario

Agradecemos su colaboración.

Tu Municipalidad a tu servicio
Sistema de Licencias de Construcción`
    },
    observaciones: {
      asunto: '📝 Observaciones en Expediente N° ' + expediente.numeroExpediente,
      mensaje: `Estimado(a) ${expediente.solicitante?.nombres || 'Usuario'},

Después de revisar su expediente N° ${expediente.numeroExpediente}, hemos detectado algunas observaciones que requieren su atención.

Por favor, ingrese al sistema para revisar los detalles y subsanar las observaciones en el plazo establecido.

Quedamos atentos a su respuesta.

Tu Municipalidad a tu servicio
Sistema de Licencias de Construcción`
    },
    aprobacion: {
      asunto: '✅ Expediente Aprobado N° ' + expediente.numeroExpediente,
      mensaje: `Estimado(a) ${expediente.solicitante?.nombres || 'Usuario'},

¡Felicitaciones! Su expediente N° ${expediente.numeroExpediente} ha sido APROBADO.

Puede acercarse a nuestras oficinas para recoger su licencia de construcción presentando:
- DNI original
- Comprobante de pago
- Este correo electrónico

Horario de atención: Lunes a Viernes, 8:00 AM - 4:00 PM

Gracias por confiar en nosotros.

Tu Municipalidad a tu servicio
Sistema de Licencias de Construcción`
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const aplicarPlantilla = (tipo) => {
    const plantilla = plantillas[tipo];
    if (plantilla) {
      setFormData({
        asunto: plantilla.asunto,
        mensaje: plantilla.mensaje
      });
      toast.info('Plantilla aplicada. Puedes editarla antes de enviar.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.asunto.trim() || !formData.mensaje.trim()) {
      toast.error('El asunto y el mensaje son obligatorios');
      return;
    }

    setCargando(true);

    try {
      await api.post(`/expedientes/${expediente._id}/enviar-mensaje`, {
        asunto: formData.asunto,
        mensaje: formData.mensaje
      });

      toast.success('Mensaje enviado exitosamente al correo y a las notificaciones del usuario');
      
      if (onEnviado) {
        onEnviado();
      }

      // Cerrar modal después de un breve delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      toast.error(error.response?.data?.error || 'Error al enviar el mensaje');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <FaEnvelope /> Enviar Mensaje al Usuario
          </h2>
          <button onClick={onClose} className="modal-close" aria-label="Cerrar">
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <div className="info-box" style={{ marginBottom: '20px' }}>
            <p>
              <strong>Usuario:</strong> {expediente.solicitante?.nombres} {expediente.solicitante?.apellidos}<br />
              <strong>Email:</strong> {expediente.solicitante?.email}<br />
              <strong>Expediente:</strong> {expediente.numeroExpediente}
            </p>
          </div>

          <div className="plantillas-section" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
              <FaFileAlt /> Plantillas Rápidas:
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => aplicarPlantilla('inspeccion_proxima')}
                className="btn btn-sm btn-secondary"
                disabled={cargando}
              >
                📋 Inspección Próxima (10 días)
              </button>
              <button
                type="button"
                onClick={() => aplicarPlantilla('inspeccion_manana')}
                className="btn btn-sm btn-secondary"
                disabled={cargando}
              >
                ⚠️ Inspección Mañana
              </button>
              <button
                type="button"
                onClick={() => aplicarPlantilla('observaciones')}
                className="btn btn-sm btn-secondary"
                disabled={cargando}
              >
                📝 Observaciones
              </button>
              <button
                type="button"
                onClick={() => aplicarPlantilla('aprobacion')}
                className="btn btn-sm btn-secondary"
                disabled={cargando}
              >
                ✅ Aprobación
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="asunto">
                Asunto del Mensaje *
              </label>
              <input
                type="text"
                id="asunto"
                name="asunto"
                value={formData.asunto}
                onChange={handleChange}
                className="form-control"
                placeholder="Ej: Programación de Inspección"
                required
                disabled={cargando}
              />
            </div>

            <div className="form-group">
              <label htmlFor="mensaje">
                Mensaje *
              </label>
              <textarea
                id="mensaje"
                name="mensaje"
                value={formData.mensaje}
                onChange={handleChange}
                className="form-control"
                rows="12"
                placeholder="Escribe aquí tu mensaje personalizado..."
                required
                disabled={cargando}
                style={{ fontFamily: 'monospace', fontSize: '14px' }}
              />
              <small className="form-hint">
                El mensaje se enviará al correo: {expediente.solicitante?.email} y aparecerá en sus notificaciones dentro de la app
              </small>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={onClose}
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
                {cargando ? (
                  <>
                    <FaSpinner className="spinner" /> Enviando...
                  </>
                ) : (
                  <>
                    <FaEnvelope /> Enviar Mensaje
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnviarMensaje;
