import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './DashboardGerente.css';
import { FaChartLine, FaFileSignature, FaUsers, FaExclamationCircle, FaClock, FaCheckCircle } from 'react-icons/fa';

const DashboardGerente = () => {
  const { usuario } = useAuth();
  const [expedientes, setExpedientes] = useState([]);
  const [estadisticasGenerales, setEstadisticasGenerales] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState(null);
  const [mostrarModalDecision, setMostrarModalDecision] = useState(false);
  const [vistaActual, setVistaActual] = useState('MIS_EXPEDIENTES'); // MIS_EXPEDIENTES o TODOS

  useEffect(() => {
    cargarDatos();
  }, [vistaActual]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      
      if (vistaActual === 'MIS_EXPEDIENTES') {
        const resp = await api.get('/asignaciones/mis-asignaciones');
        setExpedientes(resp.data.expedientes);
        setEstadisticas(resp.data.estadisticas);
      } else {
        const resp = await api.get('/expedientes');
        setExpedientes(resp.data);
      }

      // Estadísticas generales del sistema
      const respStats = await api.get('/asignaciones/estadisticas');
      setEstadisticasGenerales(respStats.data.estadisticas);

    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setCargando(false);
    }
  };

  const abrirModalDecision = (expediente) => {
    setExpedienteSeleccionado(expediente);
    setMostrarModalDecision(true);
  };

  const tomarDecisionFinal = async (decision, observaciones, numeroResolucion) => {
    try {
      const aprobado = decision === 'APROBAR';

      // Completar asignación
      await api.post(`/asignaciones/${expedienteSeleccionado._id}/completar`, {
        aprobado,
        observaciones,
        siguienteDepartamento: 'FINALIZADO'
      });

      // Si se aprueba, actualizar resolución
      if (aprobado && numeroResolucion) {
        await api.patch(`/expedientes/${expedienteSeleccionado._id}`, {
          resolucionFinal: {
            numero: numeroResolucion,
            fecha: new Date(),
            observaciones
          }
        });
      }

      setMostrarModalDecision(false);
      cargarDatos();
      alert(aprobado ? 
        '✅ Expediente APROBADO. Se generará la licencia automáticamente.' : 
        '❌ Expediente RECHAZADO. Se notificó al usuario.'
      );
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error: ' + (error.response?.data?.mensaje || error.message));
    }
  };

  const getBadgeClass = (estado) => {
    const clases = {
      'REVISION_GERENCIA': 'badge-warning',
      'APROBADO_INSPECCION': 'badge-primary',
      'PENDIENTE_PAGO': 'badge-info',
      'PAGO_VERIFICADO': 'badge-primary',
      'APROBADO': 'badge-success',
      'RECHAZADO': 'badge-danger',
      'LICENCIA_EMITIDA': 'badge-success-dark',
    };
    return clases[estado] || 'badge-secondary';
  };

  if (cargando) {
    return <div className="cargando">Cargando dashboard...</div>;
  }

  return (
    <div className="dashboard-gerente">
      <div className="dashboard-header">
        <h2>👔 Dashboard Gerencial</h2>
        <p className="subtitle">Aprobación Final y Gestión del Sistema</p>
      </div>

      {/* Estadísticas Generales del Sistema */}
      {estadisticasGenerales && (
        <div className="estadisticas-sistema">
          <h3>📊 Estadísticas del Sistema</h3>
          <div className="estadisticas-grid-large">
            <div className="stat-card">
              <FaFileSignature className="stat-icon primary" />
              <div className="stat-info">
                <h3>{estadisticasGenerales.totalExpedientes}</h3>
                <p>Total Expedientes</p>
              </div>
            </div>
            <div className="stat-card">
              <FaClock className="stat-icon warning" />
              <div className="stat-info">
                <h3>{estadisticasGenerales.porDepartamento.MESA_PARTES || 0}</h3>
                <p>Mesa de Partes</p>
              </div>
            </div>
            <div className="stat-card">
              <FaUsers className="stat-icon info" />
              <div className="stat-info">
                <h3>{estadisticasGenerales.porDepartamento.REVISION_TECNICA || 0}</h3>
                <p>Revisión Técnica</p>
              </div>
            </div>
            <div className="stat-card">
              <FaCheckCircle className="stat-icon success" />
              <div className="stat-info">
                <h3>{estadisticasGenerales.porDepartamento.INSPECCION || 0}</h3>
                <p>Inspección</p>
              </div>
            </div>
            <div className="stat-card">
              <FaExclamationCircle className="stat-icon danger" />
              <div className="stat-info">
                <h3>{estadisticasGenerales.vencidos}</h3>
                <p>Plazos Vencidos</p>
              </div>
            </div>
            <div className="stat-card">
              <FaChartLine className="stat-icon primary" />
              <div className="stat-info">
                <h3>{Math.round(estadisticasGenerales.promedioTiempos.gerente || 0)} min</h3>
                <p>Tiempo Promedio</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selector de vista */}
      <div className="selector-vista">
        <button 
          className={vistaActual === 'MIS_EXPEDIENTES' ? 'btn-vista active' : 'btn-vista'}
          onClick={() => setVistaActual('MIS_EXPEDIENTES')}
        >
          Mis Expedientes Asignados
        </button>
        <button 
          className={vistaActual === 'TODOS' ? 'btn-vista active' : 'btn-vista'}
          onClick={() => setVistaActual('TODOS')}
        >
          Todos los Expedientes
        </button>
      </div>

      {/* Estadísticas de mis expedientes */}
      {vistaActual === 'MIS_EXPEDIENTES' && estadisticas && (
        <div className="estadisticas-personales">
          <h4>Mis Expedientes:</h4>
          <div className="stats-mini">
            <span className="stat-mini">
              Total: <strong>{estadisticas.total}</strong>
            </span>
            <span className="stat-mini warning">
              En Revisión: <strong>{estadisticas.porEstado['REVISION_GERENCIA'] || 0}</strong>
            </span>
            <span className="stat-mini success">
              Aprobados: <strong>{estadisticas.porEstado['APROBADO'] || 0}</strong>
            </span>
            <span className="stat-mini danger">
              Rechazados: <strong>{estadisticas.porEstado['RECHAZADO'] || 0}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Lista de Expedientes */}
      <div className="expedientes-lista">
        {expedientes.length === 0 ? (
          <div className="sin-expedientes">
            <FaFileSignature size={60} />
            <p>No hay expedientes que mostrar</p>
          </div>
        ) : (
          expedientes.map(exp => (
            <div key={exp._id} className="expediente-card-gerencial">
              <div className="expediente-header">
                <div>
                  <h3>{exp.numeroExpediente}</h3>
                  <p className="proyecto-nombre">{exp.proyecto.nombreProyecto}</p>
                  <p className="solicitante-mini">
                    {exp.solicitante.nombres} {exp.solicitante.apellidos}
                  </p>
                </div>
                <div className="badges-container">
                  <span className={`badge ${getBadgeClass(exp.estado)}`}>
                    {exp.estado.replace(/_/g, ' ')}
                  </span>
                  <span className={`badge-depto ${exp.departamentoActual.toLowerCase()}`}>
                    {exp.departamentoActual.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="expediente-body">
                {/* Timeline del proceso */}
                <div className="proceso-timeline">
                  <div className={`timeline-item ${exp.asignaciones?.mesaPartes?.estado === 'COMPLETADO' ? 'completado' : ''}`}>
                    <span className="timeline-dot"></span>
                    <span className="timeline-label">Mesa Partes</span>
                    {exp.asignaciones?.mesaPartes?.usuario && (
                      <span className="timeline-usuario">
                        {exp.asignaciones.mesaPartes.usuario.nombres}
                      </span>
                    )}
                  </div>
                  <div className={`timeline-item ${exp.asignaciones?.tecnico?.estado === 'COMPLETADO' ? 'completado' : ''}`}>
                    <span className="timeline-dot"></span>
                    <span className="timeline-label">Técnico</span>
                    {exp.asignaciones?.tecnico?.usuario && (
                      <span className="timeline-usuario">
                        {exp.asignaciones.tecnico.usuario.nombres}
                      </span>
                    )}
                  </div>
                  <div className={`timeline-item ${exp.asignaciones?.inspector?.estado === 'COMPLETADO' ? 'completado' : ''}`}>
                    <span className="timeline-dot"></span>
                    <span className="timeline-label">Inspector</span>
                    {exp.asignaciones?.inspector?.usuario && (
                      <span className="timeline-usuario">
                        {exp.asignaciones.inspector.usuario.nombres}
                      </span>
                    )}
                  </div>
                  <div className={`timeline-item ${exp.asignaciones?.gerente?.estado === 'COMPLETADO' ? 'completado' : ''}`}>
                    <span className="timeline-dot"></span>
                    <span className="timeline-label">Gerencia</span>
                  </div>
                </div>

                {/* Info resumida */}
                <div className="info-resumen">
                  <div className="info-item">
                    <strong>Área:</strong>
                    <span>{exp.proyecto.areaConstruccion} m²</span>
                  </div>
                  <div className="info-item">
                    <strong>Tipo:</strong>
                    <span>{exp.proyecto.tipoObra?.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="info-item">
                    <strong>Prioridad:</strong>
                    <span className={`prioridad-${exp.prioridad?.toLowerCase()}`}>
                      {exp.prioridad || 'NORMAL'}
                    </span>
                  </div>
                  <div className="info-item">
                    <strong>Fecha Registro:</strong>
                    <span>{new Date(exp.fechaCreacion).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="expediente-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => window.open(`/expediente/${exp._id}`, '_blank')}
                >
                  Ver Expediente Completo
                </button>
                
                {vistaActual === 'MIS_EXPEDIENTES' && 
                 (exp.estado === 'REVISION_GERENCIA' || exp.estado === 'APROBADO_INSPECCION') && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => abrirModalDecision(exp)}
                  >
                    <FaFileSignature /> Tomar Decisión Final
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Decisión Final */}
      {mostrarModalDecision && expedienteSeleccionado && (
        <div className="modal-overlay" onClick={() => setMostrarModalDecision(false)}>
          <div className="modal-content-gerencial" onClick={e => e.stopPropagation()}>
            <h3>Decisión Final - Gerencia</h3>
            <p className="modal-subtitle">
              Expediente: {expedienteSeleccionado.numeroExpediente}<br/>
              Proyecto: {expedienteSeleccionado.proyecto.nombreProyecto}
            </p>

            <div className="decision-form">
              <div className="alert-info">
                <strong>⚠️ Decisión Definitiva:</strong>
                <p>Esta es la decisión final del expediente. Si se aprueba, se generará automáticamente la licencia de construcción.</p>
              </div>

              <div className="form-group">
                <label>Decisión:</label>
                <select id="selectDecision" className="form-control">
                  <option value="APROBAR">✅ APROBAR - Emitir Licencia de Construcción</option>
                  <option value="RECHAZAR">❌ RECHAZAR - Denegar Licencia</option>
                </select>
              </div>

              <div className="form-group">
                <label>Número de Resolución:</label>
                <input 
                  type="text"
                  id="inputResolucion"
                  className="form-control"
                  placeholder="Ej: RES-2026-001234"
                />
              </div>

              <div className="form-group">
                <label>Observaciones de Gerencia:</label>
                <textarea 
                  id="textObservaciones"
                  className="form-control"
                  rows="6"
                  placeholder="Consideraciones finales, fundamentos de la decisión, observaciones adicionales..."
                ></textarea>
              </div>

              <div className="resumen-expediente">
                <h4>Resumen del Proceso:</h4>
                <div className="resumen-items">
                  <div className="resumen-item">
                    <span className="label">Mesa de Partes:</span>
                    <span className="valor completado">✓ Completado</span>
                  </div>
                  <div className="resumen-item">
                    <span className="label">Revisión Técnica:</span>
                    <span className="valor completado">
                      {expedienteSeleccionado.asignaciones?.tecnico?.estado === 'COMPLETADO' ? '✓ Completado' : 'Pendiente'}
                    </span>
                  </div>
                  <div className="resumen-item">
                    <span className="label">Inspección:</span>
                    <span className="valor completado">
                      {expedienteSeleccionado.asignaciones?.inspector?.estado === 'COMPLETADO' ? '✓ Completado' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setMostrarModalDecision(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-danger"
                style={{marginRight: 'auto'}}
                onClick={() => {
                  const observaciones = document.getElementById('textObservaciones').value;
                  if (!observaciones.trim()) {
                    alert('Debes ingresar las observaciones');
                    return;
                  }
                  if (window.confirm('¿Estás seguro de RECHAZAR este expediente? Esta acción es definitiva.')) {
                    tomarDecisionFinal('RECHAZAR', observaciones, null);
                  }
                }}
              >
                ❌ Rechazar Expediente
              </button>
              <button 
                className="btn btn-success"
                onClick={() => {
                  const observaciones = document.getElementById('textObservaciones').value;
                  const resolucion = document.getElementById('inputResolucion').value;
                  
                  if (!resolucion.trim()) {
                    alert('Debes ingresar el número de resolución');
                    return;
                  }

                  if (window.confirm('¿Estás seguro de APROBAR este expediente? Se generará la licencia automáticamente.')) {
                    tomarDecisionFinal('APROBAR', observaciones, resolucion);
                  }
                }}
              >
                ✅ Aprobar y Emitir Licencia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardGerente;
