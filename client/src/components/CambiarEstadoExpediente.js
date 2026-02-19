import React, { useState } from 'react';
import { FaCheckCircle, FaTimes, FaExclamationTriangle, FaClipboardCheck } from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';
import '../pages/Pages.css';

const CambiarEstadoExpediente = ({ expediente, onClose, onActualizado }) => {
  const [nuevoEstado, setNuevoEstado] = useState(expediente.estado);
  const [observaciones, setObservaciones] = useState('');
  const [procesando, setProcesando] = useState(false);

  const estados = [
    { valor: 'REGISTRADO', label: '📝 Registrado', color: '#9e9e9e', descripcion: 'Expediente recién creado' },
    { valor: 'EN_REVISION_ADMINISTRATIVA', label: '📋 En Revisión Administrativa', color: '#2196f3', descripcion: 'Revisando documentos administrativos' },
    { valor: 'EN_REVISION_TECNICA', label: '🔍 En Revisión Técnica', color: '#2196f3', descripcion: 'Revisando planos y especificaciones técnicas' },
    { valor: 'OBSERVADO', label: '⚠️ Observado', color: '#ff9800', descripcion: 'Requiere correcciones por parte del usuario' },
    { valor: 'SUBSANACION', label: '📝 En Subsanación', color: '#ff9800', descripcion: 'Usuario está corrigiendo observaciones' },
    { valor: 'PENDIENTE_INSPECCION', label: '⏳ Pendiente de Inspección', color: '#9c27b0', descripcion: 'Esperando programación de inspección' },
    { valor: 'EN_INSPECCION', label: '🔎 En Inspección', color: '#9c27b0', descripcion: 'Inspección de campo en proceso' },
    { valor: 'PENDIENTE_PAGO', label: '💰 Pendiente de Pago', color: '#ff5722', descripcion: 'Esperando que el usuario realice el pago' },
    { valor: 'PAGADO', label: '✅ Pago Registrado', color: '#4caf50', descripcion: 'Pago verificado' },
    { valor: 'APROBADO', label: '✅ Aprobado', color: '#4caf50', descripcion: 'Expediente aprobado - se generará licencia automáticamente' },
    { valor: 'RECHAZADO', label: '❌ Rechazado', color: '#f44336', descripcion: 'Expediente rechazado definitivamente' },
    { valor: 'LICENCIA_EMITIDA', label: '📄 Licencia Emitida', color: '#00897b', descripcion: 'Licencia de construcción entregada' }
  ];

  const getMensajeNotificacion = (estado) => {
    const mensajes = {
      'REGISTRADO': 'Su expediente ha sido registrado exitosamente y está en espera de revisión.',
      'EN_REVISION_ADMINISTRATIVA': 'Su expediente está siendo revisado por el área administrativa. Verificaremos sus documentos.',
      'EN_REVISION_TECNICA': 'Su expediente ha pasado a revisión técnica. Los profesionales revisarán los planos y especificaciones.',
      'OBSERVADO': 'Su expediente tiene observaciones que deben ser subsanadas. Por favor revise los detalles y corrija lo indicado.',
      'SUBSANACION': 'Su expediente está en proceso de subsanación. Puede reenviar los documentos observados.',
      'PENDIENTE_INSPECCION': 'Su expediente ha sido aprobado en escritorio. Próximamente se programará una inspección de campo.',
      'EN_INSPECCION': 'Se está realizando la inspección de campo de su proyecto.',
      'PENDIENTE_PAGO': 'Su expediente ha sido aprobado. Por favor realice el pago correspondiente en el Banco de la Nación.',
      'PAGADO': 'Su pago ha sido verificado correctamente.',
      'APROBADO': '¡Felicitaciones! Su expediente ha sido APROBADO. Se generará automáticamente su licencia de construcción.',
      'RECHAZADO': 'Lamentamos informarle que su expediente ha sido RECHAZADO.',
      'LICENCIA_EMITIDA': '¡Su licencia de construcción ha sido emitida! Puede descargarla desde el sistema.'
    };
    return mensajes[estado] || 'El estado de su expediente ha sido actualizado.';
  };

  const getTipoNotificacion = (estado) => {
    if (estado === 'APROBADO' || estado === 'LICENCIA_EMITIDA') return 'APROBACION';
    if (estado === 'RECHAZADO') return 'RECHAZO';
    if (estado === 'OBSERVADO') return 'OBSERVACION';
    if (estado === 'EN_INSPECCION' || estado === 'PENDIENTE_INSPECCION') return 'INSPECCION';
    return 'INFO';
  };

  const getPrioridad = (estado) => {
    if (estado === 'APROBADO' || estado === 'RECHAZADO') return 'ALTA';
    if (estado === 'OBSERVADO' || estado === 'PENDIENTE_PAGO') return 'ALTA';
    return 'NORMAL';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (nuevoEstado === expediente.estado) {
      toast.warning('Debe seleccionar un estado diferente al actual');
      return;
    }

    if ((nuevoEstado === 'OBSERVADO' || nuevoEstado === 'RECHAZADO') && !observaciones.trim()) {
      toast.error('Debe especificar las observaciones o motivo de rechazo');
      return;
    }

    if (!window.confirm(`¿Está seguro de cambiar el estado a "${estados.find(e => e.valor === nuevoEstado)?.label}"?`)) {
      return;
    }

    setProcesando(true);
    try {
      await api.patch(`/expedientes/${expediente._id}/estado`, {
        estado: nuevoEstado,
        observaciones: observaciones.trim()
      });

      toast.success('Estado actualizado exitosamente');
      if (onActualizado) onActualizado();
      onClose();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      toast.error(error.response?.data?.error || 'Error al cambiar estado');
    } finally {
      setProcesando(false);
    }
  };

  const estadoActualInfo = estados.find(e => e.valor === expediente.estado);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
        <div className="modal-header">
          <h2><FaClipboardCheck /> Cambiar Estado del Expediente</h2>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          {/* Estado Actual */}
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '8px',
            marginBottom: '20px',
            borderLeft: `4px solid ${estadoActualInfo?.color || '#999'}`
          }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: '#666' }}>Estado Actual:</strong>
            <span style={{ fontSize: '18px', color: estadoActualInfo?.color }}>
              {estadoActualInfo?.label}
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Selector de Nuevo Estado */}
            <div className="form-group">
              <label className="form-label">
                <span style={{ color: 'red' }}>* </span>
                Nuevo Estado
              </label>
              <select
                className="form-control"
                value={nuevoEstado}
                onChange={(e) => setNuevoEstado(e.target.value)}
                disabled={procesando}
                required
              >
                {estados.map(estado => (
                  <option key={estado.valor} value={estado.valor}>
                    {estado.label}
                  </option>
                ))}
              </select>
              <small className="form-text" style={{ color: estados.find(e => e.valor === nuevoEstado)?.color }}>
                {estados.find(e => e.valor === nuevoEstado)?.descripcion}
              </small>
            </div>

            {/* Vista previa del mensaje que se enviará */}
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#e3f2fd', 
              borderRadius: '6px',
              marginBottom: '16px',
              borderLeft: '4px solid #2196f3'
            }}>
              <strong style={{ display: 'block', marginBottom: '8px', color: '#1976d2' }}>
                📧 Notificación que se enviará al usuario:
              </strong>
              <p style={{ margin: 0, fontSize: '14px', color: '#0d47a1' }}>
                <strong>Asunto:</strong> {getTipoNotificacion(nuevoEstado) === 'APROBACION' ? '✅' : getTipoNotificacion(nuevoEstado) === 'RECHAZO' ? '❌' : '📋'} 
                {' '}Actualización - Expediente N° {expediente.numeroExpediente}
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#1565c0' }}>
                {getMensajeNotificacion(nuevoEstado)}
              </p>
            </div>

            {/* Campo de Observaciones */}
            <div className="form-group">
              <label className="form-label">
                {(nuevoEstado === 'OBSERVADO' || nuevoEstado === 'RECHAZADO') && (
                  <span style={{ color: 'red' }}>* </span>
                )}
                Observaciones o Comentarios
              </label>
              <textarea
                className="form-control"
                rows="5"
                placeholder={
                  nuevoEstado === 'RECHAZADO' 
                    ? 'Especifique claramente los motivos del rechazo...'
                    : nuevoEstado === 'OBSERVADO'
                    ? 'Especifique las observaciones que debe subsanar el usuario...'
                    : nuevoEstado === 'EN_INSPECCION'
                    ? 'Detalles de la inspección programada...'
                    : 'Comentarios adicionales (opcional)...'
                }
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                disabled={procesando}
                required={nuevoEstado === 'OBSERVADO' || nuevoEstado === 'RECHAZADO'}
              />
              {(nuevoEstado === 'OBSERVADO' || nuevoEstado === 'RECHAZADO') && (
                <small className="form-text" style={{ color: '#f44336' }}>
                  * Campo obligatorio - El usuario recibirá esta información
                </small>
              )}
            </div>

            {/* Alertas especiales */}
            {nuevoEstado === 'APROBADO' && (
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#e8f5e9', 
                border: '2px solid #4caf50',
                borderRadius: '6px',
                marginBottom: '16px'
              }}>
                <strong style={{ color: '#2e7d32', display: 'block', marginBottom: '4px' }}>
                  ✅ Al aprobar:
                </strong>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#388e3c' }}>
                  <li>Se generará automáticamente el PDF de la licencia</li>
                  <li>El PDF incluirá código QR para verificación</li>
                  <li>Se enviará notificación al usuario</li>
                </ul>
              </div>
            )}

            {nuevoEstado === 'RECHAZADO' && (
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#ffebee', 
                border: '2px solid #f44336',
                borderRadius: '6px',
                marginBottom: '16px'
              }}>
                <strong style={{ color: '#c62828', display: 'block', marginBottom: '4px' }}>
                  ⚠️ Importante:
                </strong>
                <p style={{ margin: 0, fontSize: '13px', color: '#d32f2f' }}>
                  El rechazo es definitivo. El usuario deberá iniciar un nuevo expediente si desea continuar con el trámite.
                </p>
              </div>
            )}

            {/* Botones */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button 
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={procesando}
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className={`btn ${nuevoEstado === 'RECHAZADO' ? 'btn-danger' : nuevoEstado === 'APROBADO' ? 'btn-success' : 'btn-primary'}`}
                disabled={procesando}
                style={{ flex: 1 }}
              >
                {procesando ? 'Procesando...' : 'Cambiar Estado'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CambiarEstadoExpediente;
