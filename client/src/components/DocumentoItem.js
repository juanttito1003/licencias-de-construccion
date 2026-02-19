import React, { useState } from 'react';
import { FaFilePdf, FaDownload, FaCheckCircle, FaExclamationTriangle, FaClock, FaUpload } from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';

const DocumentoItem = ({ documento, nombreDocumento, tipoDocumento, expedienteId, puedeEditar, esSolicitante, onActualizar }) => {
  const [mostrarObservaciones, setMostrarObservaciones] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [procesando, setProcesando] = useState(false);

  if (!documento || !documento.ruta) return null;

  const descargarDocumento = (ruta, nombre) => {
    window.open(`http://localhost:5000/${ruta}`, '_blank');
  };

  const getEstadoInfo = (estado) => {
    switch(estado) {
      case 'APROBADO':
        return { 
          icon: <FaCheckCircle />, 
          color: '#27ae60', 
          texto: 'Aprobado',
          bgColor: '#e8f5e9'
        };
      case 'OBSERVADO':
        return { 
          icon: <FaExclamationTriangle />, 
          color: '#e74c3c', 
          texto: 'Observado',
          bgColor: '#ffebee'
        };
      default:
        return { 
          icon: <FaClock />, 
          color: '#f39c12', 
          texto: 'Pendiente de revisión',
          bgColor: '#fff3e0'
        };
    }
  };

  const marcarDocumento = async (nuevoEstado) => {
    try {
      setProcesando(true);
      await api.patch(`/documentos/${expedienteId}/revisar-documento`, {
        tipoDocumento,
        estado: nuevoEstado,
        observaciones: nuevoEstado === 'OBSERVADO' ? observaciones : ''
      });

      toast.success(`Documento ${nuevoEstado.toLowerCase()} exitosamente`);
      setMostrarObservaciones(false);
      setObservaciones('');
      if (onActualizar) onActualizar();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al revisar documento');
    } finally {
      setProcesando(false);
    }
  };

  const reenviarDocumento = async () => {
    if (!archivo) {
      toast.error('Debe seleccionar un archivo');
      return;
    }

    try {
      setProcesando(true);
      const formData = new FormData();
      formData.append('documento', archivo);
      formData.append('tipoDocumento', tipoDocumento);

      await api.post(`/documentos/${expedienteId}/reenviar-documento`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Documento reenviado exitosamente');
      setArchivo(null);
      if (onActualizar) onActualizar();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al reenviar documento');
    } finally {
      setProcesando(false);
    }
  };

  const estadoInfo = getEstadoInfo(documento.estado || 'PENDIENTE');

  return (
    <div 
      className="document-item" 
      style={{ 
        border: `2px solid ${estadoInfo.color}`,
        backgroundColor: estadoInfo.bgColor,
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '12px'
      }}
    >
      {/* Información del documento */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <strong style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <FaFilePdf style={{ color: '#d32f2f' }} /> 
            {nombreDocumento}
          </strong>
          <p style={{ fontSize: '12px', color: '#666', margin: '4px 0' }}>
            {documento.nombre}
          </p>
          <small style={{ color: '#999' }}>
            Cargado: {new Date(documento.fechaCarga).toLocaleDateString()}
          </small>
        </div>
        <button 
          className="btn btn-sm btn-primary"
          onClick={() => descargarDocumento(documento.ruta, documento.nombre)}
        >
          <FaDownload /> Ver
        </button>
      </div>

      {/* Estado del documento */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        padding: '8px 12px', 
        backgroundColor: 'white',
        borderRadius: '6px',
        marginBottom: documento.observaciones ? '8px' : '0'
      }}>
        <span style={{ color: estadoInfo.color, fontSize: '16px' }}>
          {estadoInfo.icon}
        </span>
        <strong style={{ color: estadoInfo.color }}>
          {estadoInfo.texto}
        </strong>
      </div>

      {/* Observaciones existentes */}
      {documento.observaciones && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#fff9e6', 
          border: '1px solid #f39c12',
          borderRadius: '6px',
          marginTop: '8px'
        }}>
          <strong style={{ color: '#f57c00', display: 'block', marginBottom: '4px' }}>
            ⚠️ Observaciones:
          </strong>
          <p style={{ margin: 0, fontSize: '14px', color: '#e65100' }}>
            {documento.observaciones}
          </p>
        </div>
      )}

      {/* Controles para Admin */}
      {puedeEditar && documento.estado !== 'APROBADO' && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #ddd' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-sm btn-success"
              onClick={() => marcarDocumento('APROBADO')}
              disabled={procesando}
            >
              <FaCheckCircle /> Aprobar
            </button>
            <button 
              className="btn btn-sm btn-warning"
              onClick={() => setMostrarObservaciones(!mostrarObservaciones)}
              disabled={procesando}
            >
              <FaExclamationTriangle /> {mostrarObservaciones ? 'Cancelar' : 'Observar'}
            </button>
          </div>

          {mostrarObservaciones && (
            <div style={{ marginTop: '12px' }}>
              <textarea
                className="form-control"
                placeholder="Describa las observaciones del documento..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows="3"
                style={{ marginBottom: '8px' }}
              />
              <button 
                className="btn btn-sm btn-danger"
                onClick={() => marcarDocumento('OBSERVADO')}
                disabled={!observaciones.trim() || procesando}
              >
                Marcar como Observado
              </button>
            </div>
          )}
        </div>
      )}

      {/* Control para reenviar (Usuario) */}
      {esSolicitante && documento.estado === 'OBSERVADO' && (
        <div style={{ 
          marginTop: '12px', 
          paddingTop: '12px', 
          borderTop: '1px solid #ddd',
          backgroundColor: '#e3f2fd',
          padding: '12px',
          borderRadius: '6px'
        }}>
          <strong style={{ color: '#1976d2', display: 'block', marginBottom: '8px' }}>
            <FaUpload /> Reenviar Documento Corregido
          </strong>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setArchivo(e.target.files[0])}
            style={{ marginBottom: '8px' }}
          />
          {archivo && (
            <p style={{ fontSize: '12px', color: '#666', margin: '4px 0' }}>
              Archivo seleccionado: {archivo.name}
            </p>
          )}
          <button 
            className="btn btn-sm btn-primary"
            onClick={reenviarDocumento}
            disabled={!archivo || procesando}
          >
            {procesando ? 'Enviando...' : 'Enviar Documento'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentoItem;
