import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './DashboardTecnico.css';
import { FaFileAlt, FaCheckCircle, FaExclamationCircle, FaClock, FaClipboardCheck } from 'react-icons/fa';

const DashboardTecnico = () => {
  const { usuario } = useAuth();
  const [expedientes, setExpedientes] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState(null);
  const [mostrarModalRevision, setMostrarModalRevision] = useState(false);
  const [mostrarModalAsignar, setMostrarModalAsignar] = useState(false);
  const [inspectores, setInspectores] = useState([]);
  const [tipoAccion, setTipoAccion] = useState(null); // 'aprobar' u 'observar'

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const resp = await api.get('/asignaciones/mis-asignaciones');
      setExpedientes(resp.data.expedientes);
      setEstadisticas(resp.data.estadisticas);
      
      // Cargar inspectores disponibles
      const respInspectores = await api.get('/asignaciones/usuarios-disponibles/INSPECCION');
      setInspectores(respInspectores.data.usuarios);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setCargando(false);
    }
  };

  const abrirModalRevision = (expediente, accion) => {
    setExpedienteSeleccionado(expediente);
    setTipoAccion(accion);
    if (accion === 'aprobar') {
      setMostrarModalAsignar(true);
    } else {
      setMostrarModalRevision(true);
    }
  };

  const aprobarYAsignarInspector = async (inspectorId, prioridad) => {
    try {
      // 1. Completar revisión técnica
      await api.post(`/asignaciones/${expedienteSeleccionado._id}/completar`, {
        aprobado: true,
        observaciones: 'Revisión técnica aprobada',
        siguienteDepartamento: 'INSPECCION'
      });

      // 2. Asignar al inspector seleccionado
      await api.post(`/asignaciones/${expedienteSeleccionado._id}/asignar`, {
        usuarioId: inspectorId,
        departamento: 'INSPECCION',
        prioridad
      });
      
      setMostrarModalAsignar(false);
      cargarDatos();
      alert('✅ Expediente aprobado y asignado al inspector correctamente');
    } catch (error) {
      console.error('Error al aprobar y asignar:', error);
      alert('❌ Error: ' + (error.response?.data?.mensaje || error.message));
    }
  };

  const marcarObservado = async () => {
    try {
      const observaciones = prompt('Ingresa las observaciones técnicas:');
      
      if (!observaciones) return;

      await api.post(`/asignaciones/${expedienteSeleccionado._id}/completar`, {
        aprobado: false,
        observaciones,
        siguienteDepartamento: 'REVISION_TECNICA'
      });

      setMostrarModalRevision(false);
      cargarDatos();
      alert('⚠️ Expediente observado. Se notificó al usuario.');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error: ' + (error.response?.data?.mensaje || error.message));
    }
  };

  const revisarDocumento = async (expedienteId, tipoDoc, estado, observaciones) => {
    try {
      await api.patch(`/documentos/${expedienteId}/revisar-documento`, {
        tipoDocumento: tipoDoc,
        estado,
        observaciones
      });
      cargarDatos();
      alert('✓ Documento revisado');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al revisar documento');
    }
  };

  const getBadgeClass = (estado) => {
    const clases = {
      'REVISION_TECNICA': 'badge-warning',
      'OBSERVADO_TECNICO': 'badge-danger',
      'APROBADO_TECNICO': 'badge-success',
    };
    return clases[estado] || 'badge-secondary';
  };

  if (cargando) {
    return <div className="cargando">Cargando dashboard...</div>;
  }

  return (
    <div className="dashboard-tecnico">
      <div className="dashboard-header">
        <h2>🔧 Dashboard Técnico</h2>
        <p className="subtitle">Revisión Técnica de Expedientes</p>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="estadisticas-grid">
          <div className="stat-card">
            <FaFileAlt className="stat-icon primary" />
            <div className="stat-info">
              <h3>{estadisticas.total}</h3>
              <p>Expedientes Asignados</p>
            </div>
          </div>
          <div className="stat-card">
            <FaClock className="stat-icon warning" />
            <div className="stat-info">
              <h3>{estadisticas.porEstado['REVISION_TECNICA'] || 0}</h3>
              <p>En Revisión</p>
            </div>
          </div>
          <div className="stat-card">
            <FaCheckCircle className="stat-icon success" />
            <div className="stat-info">
              <h3>{estadisticas.porEstado['APROBADO_TECNICO'] || 0}</h3>
              <p>Aprobados</p>
            </div>
          </div>
          <div className="stat-card">
            <FaExclamationCircle className="stat-icon danger" />
            <div className="stat-info">
              <h3>{estadisticas.porEstado['OBSERVADO_TECNICO'] || 0}</h3>
              <p>Observados</p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Expedientes */}
      <div className="expedientes-lista">
        {expedientes.length === 0 ? (
          <div className="sin-expedientes">
            <FaClipboardCheck size={60} />
            <p>No tienes expedientes asignados</p>
          </div>
        ) : (
          expedientes.map(exp => (
            <div key={exp._id} className="expediente-card">
              <div className="expediente-header">
                <div>
                  <h3>{exp.numeroExpediente}</h3>
                  <p className="proyecto-nombre">{exp.proyecto.nombreProyecto}</p>
                </div>
                <span className={`badge ${getBadgeClass(exp.estado)}`}>
                  {exp.estado.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="expediente-body">
                <div className="info-grid">
                  <div className="info-item">
                    <strong>Solicitante:</strong>
                    <span>{exp.solicitante.nombres} {exp.solicitante.apellidos}</span>
                  </div>
                  <div className="info-item">
                    <strong>Tipo de Obra:</strong>
                    <span>{exp.proyecto.tipoObra?.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="info-item">
                    <strong>Área Construcción:</strong>
                    <span>{exp.proyecto.areaConstruccion} m²</span>
                  </div>
                  <div className="info-item">
                    <strong>Niveles:</strong>
                    <span>{exp.proyecto.numeroNiveles || 'N/A'}</span>
                  </div>
                </div>

                {/* Documentos Técnicos */}
                <div className="documentos-tecnicos">
                  <h4>📐 Documentación Técnica:</h4>
                  <div className="documentos-lista">
                    {exp.documentos.planoUbicacion?.nombre && (
                      <div className="documento-item">
                        <span className={`doc-estado ${exp.documentos.planoUbicacion.estado.toLowerCase()}`}>
                          {exp.documentos.planoUbicacion.estado === 'APROBADO' ? '✓' : 
                           exp.documentos.planoUbicacion.estado === 'OBSERVADO' ? '⚠' : '⏳'}
                        </span>
                        <span>Plano de Ubicación</span>
                        <a href={`${process.env.REACT_APP_API_URL}/${exp.documentos.planoUbicacion.ruta}`} 
                           target="_blank" rel="noopener noreferrer" className="btn-ver">
                          Ver
                        </a>
                      </div>
                    )}
                    {exp.documentos.planosArquitectura?.nombre && (
                      <div className="documento-item">
                        <span className={`doc-estado ${exp.documentos.planosArquitectura.estado.toLowerCase()}`}>
                          {exp.documentos.planosArquitectura.estado === 'APROBADO' ? '✓' : 
                           exp.documentos.planosArquitectura.estado === 'OBSERVADO' ? '⚠' : '⏳'}
                        </span>
                        <span>Planos de Arquitectura</span>
                        <a href={`${process.env.REACT_APP_API_URL}/${exp.documentos.planosArquitectura.ruta}`} 
                           target="_blank" rel="noopener noreferrer" className="btn-ver">
                          Ver
                        </a>
                      </div>
                    )}
                    {exp.documentos.memoriaDescriptiva?.nombre && (
                      <div className="documento-item">
                        <span className={`doc-estado ${exp.documentos.memoriaDescriptiva.estado.toLowerCase()}`}>
                          {exp.documentos.memoriaDescriptiva.estado === 'APROBADO' ? '✓' : 
                           exp.documentos.memoriaDescriptiva.estado === 'OBSERVADO' ? '⚠' : '⏳'}
                        </span>
                        <span>Memoria Descriptiva</span>
                        <a href={`${process.env.REACT_APP_API_URL}/${exp.documentos.memoriaDescriptiva.ruta}`} 
                           target="_blank" rel="noopener noreferrer" className="btn-ver">
                          Ver
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tiempo de asignación */}
                {exp.asignaciones?.tecnico?.fechaAsignacion && (
                  <div className="tiempo-info">
                    <FaClock className="icon" />
                    <span>Asignado hace: {calcularTiempo(exp.asignaciones.tecnico.fechaAsignacion)}</span>
                  </div>
                )}
              </div>

              <div className="expediente-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => window.open(`/expediente/${exp._id}`, '_blank')}
                >
                  Ver Detalles Completos
                </button>
                {exp.estado === 'REVISION_TECNICA' && (
                  <>
                    <button 
                      className="btn btn-success"
                      onClick={() => abrirModalRevision(exp, 'aprobar')}
                    >
                      ✓ Aprobar y Asignar Inspector
                    </button>
                    <button 
                      className="btn btn-warning"
                      onClick={() => abrirModalRevision(exp, 'observar')}
                    >
                      ⚠ Observar
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Observaciones */}
      {mostrarModalRevision && expedienteSeleccionado && (
        <div className="modal-overlay" onClick={() => setMostrarModalRevision(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Marcar con Observaciones Técnicas</h3>
            <p className="modal-subtitle">
              Expediente: {expedienteSeleccionado.numeroExpediente}
            </p>

            <div className="info-box" style={{marginBottom: '20px', backgroundColor: '#fff3e0', padding: '15px', borderRadius: '6px'}}>
              <strong>Aspectos a verificar:</strong>
              <ul style={{margin: '10px 0 0 20px', fontSize: '14px'}}>
                <li>Cumplimiento del Reglamento Nacional de Edificaciones</li>
                <li>Zonificación y compatibilidad de uso</li>
                <li>Retiros y alturas permitidas</li>
                <li>Escalas y dimensiones de planos</li>
              </ul>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setMostrarModalRevision(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-warning"
                onClick={marcarObservado}
              >
                ⚠ Marcar con Observaciones
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Asignación a Inspector */}
      {mostrarModalAsignar && expedienteSeleccionado && (
        <div className="modal-overlay" onClick={() => setMostrarModalAsignar(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Aprobar y Asignar a Inspector</h3>
            <p className="modal-subtitle">
              Expediente: {expedienteSeleccionado.numeroExpediente}
            </p>
            <p style={{color: '#666', marginBottom: '20px'}}>
              La revisión técnica ha sido aprobada. Selecciona el inspector que realizará la inspección de campo.
            </p>

            <div className="form-group">
              <label>Seleccionar Inspector:</label>
              <select id="selectInspector" className="form-control">
                <option value="">-- Seleccionar --</option>
                {inspectores.map(inspector => (
                  <option key={inspector._id} value={inspector._id}>
                    {inspector.nombres} {inspector.apellidos} - {inspector.estadisticas?.expedientesAsignados || 0} asignados
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Prioridad:</label>
              <select id="selectPrioridadInspector" className="form-control">
                <option value="NORMAL">Normal</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setMostrarModalAsignar(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-success"
                onClick={() => {
                  const inspectorId = document.getElementById('selectInspector').value;
                  const prioridad = document.getElementById('selectPrioridadInspector').value;
                  if (!inspectorId) {
                    alert('Selecciona un inspector');
                    return;
                  }
                  aprobarYAsignarInspector(inspectorId, prioridad);
                }}
              >
                ✓ Aprobar y Asignar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Función auxiliar para calcular tiempo transcurrido
const calcularTiempo = (fecha) => {
  const ahora = new Date();
  const asignacion = new Date(fecha);
  const diff = ahora - asignacion;
  
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (dias > 0) return `${dias} día${dias > 1 ? 's' : ''}`;
  if (horas > 0) return `${horas} hora${horas > 1 ? 's' : ''}`;
  return 'menos de 1 hora';
};

export default DashboardTecnico;
