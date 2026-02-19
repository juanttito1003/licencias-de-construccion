import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './DashboardMesaPartes.css';
import { FaFileAlt, FaUserPlus, FaClock, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const DashboardMesaPartes = () => {
  const { usuario } = useAuth();
  const [expedientes, setExpedientes] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModalAsignar, setMostrarModalAsignar] = useState(false);
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [vistaActual, setVistaActual] = useState('MIS_EXPEDIENTES'); // MIS_EXPEDIENTES o TODOS

  useEffect(() => {
    cargarDatos();
  }, [filtroEstado, vistaActual]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      
      if (vistaActual === 'MIS_EXPEDIENTES') {
        // Cargar solo mis expedientes asignados
        let url = '/asignaciones/mis-asignaciones';
        if (filtroEstado !== 'TODOS') {
          url += `?estado=${filtroEstado}`;
        }
        
        const respExpedientes = await api.get(url);
        setExpedientes(respExpedientes.data.expedientes);
        setEstadisticas(respExpedientes.data.estadisticas);
      } else {
        // Cargar TODOS los expedientes del sistema
        const resp = await api.get('/expedientes');
        setExpedientes(resp.data);
      }
      
      // Cargar usuarios técnicos disponibles
      const respUsuarios = await api.get('/asignaciones/usuarios-disponibles/REVISION_TECNICA');
      setUsuarios(respUsuarios.data.usuarios);
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setCargando(false);
    }
  };



  const aprobarYAsignar = (expediente) => {
    setExpedienteSeleccionado(expediente);
    setMostrarModalAsignar(true);
  };

  const completarRevisionYAsignar = async (usuarioId, prioridad) => {
    try {
      // 1. Completar revisión de Mesa de Partes
      await api.post(`/asignaciones/${expedienteSeleccionado._id}/completar`, {
        aprobado: true,
        observaciones: 'Documentos completos y correctos',
        siguienteDepartamento: 'REVISION_TECNICA'
      });

      // 2. Asignar al técnico seleccionado
      await api.post(`/asignaciones/${expedienteSeleccionado._id}/asignar`, {
        usuarioId,
        departamento: 'REVISION_TECNICA',
        prioridad
      });
      
      setMostrarModalAsignar(false);
      cargarDatos();
      alert('✅ Expediente aprobado y asignado correctamente al técnico');
    } catch (error) {
      console.error('Error al aprobar y asignar:', error);
      alert('❌ Error: ' + (error.response?.data?.mensaje || error.message));
    }
  };

  const marcarObservado = async (expedienteId) => {
    try {
      const observaciones = prompt('Ingresa las observaciones sobre documentos faltantes o incorrectos:');
      
      if (!observaciones) return;

      await api.post(`/asignaciones/${expedienteId}/completar`, {
        aprobado: false,
        observaciones,
        siguienteDepartamento: 'MESA_PARTES'
      });

      cargarDatos();
      alert('⚠️ Expediente marcado con observaciones. Se notificó al usuario.');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error: ' + (error.response?.data?.mensaje || error.message));
    }
  };

  const getBadgeClass = (estado) => {
    const clases = {
      'REGISTRADO': 'badge-info',
      'VERIFICACION_DOCUMENTARIA': 'badge-warning',
      'DOCUMENTOS_INCOMPLETOS': 'badge-danger',
      'REVISION_TECNICA': 'badge-primary',
      'APROBADO_TECNICO': 'badge-success',
    };
    return clases[estado] || 'badge-secondary';
  };

  const getPrioridadClass = (prioridad) => {
    const clases = {
      'URGENTE': 'prioridad-urgente',
      'ALTA': 'prioridad-alta',
      'NORMAL': 'prioridad-normal',
      'BAJA': 'prioridad-baja'
    };
    return clases[prioridad] || 'prioridad-normal';
  };

  if (cargando) {
    return <div className="cargando">Cargando dashboard...</div>;
  }

  return (
    <div className="dashboard-mesa-partes">
      <div className="dashboard-header">
        <h2>📋 Mesa de Partes - Gestión de Expedientes</h2>
        <p className="subtitle">Revisión y asignación de expedientes</p>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="estadisticas-grid">
          <div className="stat-card">
            <FaFileAlt className="stat-icon primary" />
            <div className="stat-info">
              <h3>{estadisticas.total}</h3>
              <p>Total Expedientes</p>
            </div>
          </div>
          <div className="stat-card">
            <FaClock className="stat-icon warning" />
            <div className="stat-info">
              <h3>{estadisticas.porEstado['VERIFICACION_DOCUMENTARIA'] || 0}</h3>
              <p>En Revisión</p>
            </div>
          </div>
          <div className="stat-card">
            <FaCheckCircle className="stat-icon success" />
            <div className="stat-info">
              <h3>{estadisticas.porEstado['REVISION_TECNICA'] || 0}</h3>
              <p>Enviados a Técnico</p>
            </div>
          </div>
          <div className="stat-card">
            <FaExclamationTriangle className="stat-icon danger" />
            <div className="stat-info">
              <h3>{estadisticas.vencidos}</h3>
              <p>Vencidos</p>
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
          Todos los Expedientes del Sistema
        </button>
      </div>

      {/* Filtros (solo para MIS_EXPEDIENTES) */}
      {vistaActual === 'MIS_EXPEDIENTES' && (
        <div className="filtros-section">
          <button 
            className={filtroEstado === 'TODOS' ? 'btn-filtro active' : 'btn-filtro'}
            onClick={() => setFiltroEstado('TODOS')}
          >
            Todos
          </button>
          <button 
            className={filtroEstado === 'REGISTRADO' ? 'btn-filtro active' : 'btn-filtro'}
            onClick={() => setFiltroEstado('REGISTRADO')}
          >
            Nuevos
          </button>
          <button 
            className={filtroEstado === 'VERIFICACION_DOCUMENTARIA' ? 'btn-filtro active' : 'btn-filtro'}
            onClick={() => setFiltroEstado('VERIFICACION_DOCUMENTARIA')}
          >
            En Revisión
          </button>
          <button 
            className={filtroEstado === 'DOCUMENTOS_INCOMPLETOS' ? 'btn-filtro active' : 'btn-filtro'}
            onClick={() => setFiltroEstado('DOCUMENTOS_INCOMPLETOS')}
          >
            Observados
          </button>
        </div>
      )}

      {/* Lista de Expedientes */}
      <div className="expedientes-lista">
        {expedientes.length === 0 ? (
          <div className="sin-expedientes">
            <FaFileAlt size={60} />
            <p>No hay expedientes que mostrar</p>
          </div>
        ) : (
          expedientes.map(exp => (
            <div key={exp._id} className={`expediente-card ${getPrioridadClass(exp.prioridad)}`}>
              <div className="expediente-header">
                <div>
                  <h3>{exp.numeroExpediente}</h3>
                  <p className="solicitante-nombre">
                    {exp.solicitante.nombres} {exp.solicitante.apellidos}
                  </p>
                </div>
                <div className="badges">
                  <span className={`badge ${getBadgeClass(exp.estado)}`}>
                    {exp.estado.replace(/_/g, ' ')}
                  </span>
                  <span className={`badge-prioridad ${exp.prioridad.toLowerCase()}`}>
                    {exp.prioridad}
                  </span>
                </div>
              </div>

              <div className="expediente-body">
                <div className="info-grid">
                  <div className="info-item">
                    <strong>Proyecto:</strong>
                    <span>{exp.proyecto.nombreProyecto}</span>
                  </div>
                  <div className="info-item">
                    <strong>Ubicación:</strong>
                    <span>{exp.proyecto.direccionProyecto}</span>
                  </div>
                  <div className="info-item">
                    <strong>Área:</strong>
                    <span>{exp.proyecto.areaConstruccion} m²</span>
                  </div>
                  <div className="info-item">
                    <strong>Fecha Registro:</strong>
                    <span>{new Date(exp.fechaCreacion).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Documentos verificados */}
                <div className="documentos-resumen">
                  <strong>Documentos:</strong>
                  <div className="documentos-estado">
                    {Object.entries(exp.documentos).map(([key, doc]) => {
                      if (!doc || !doc.nombre) return null;
                      return (
                        <span key={key} className={`doc-badge ${doc.estado.toLowerCase()}`}>
                          {key.replace(/([A-Z])/g, ' $1').trim()} - {doc.estado}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Asignación actual */}
                {exp.asignaciones?.tecnico?.usuario && (
                  <div className="asignacion-info">
                    <FaUserPlus className="icon" />
                    <span>Asignado a: {exp.asignaciones.tecnico.usuario.nombres} {exp.asignaciones.tecnico.usuario.apellidos}</span>
                  </div>
                )}
              </div>

              <div className="expediente-actions">
                {exp.estado === 'REGISTRADO' && (
                  <>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => window.open(`/expediente/${exp._id}`, '_blank')}
                    >
                      Ver Detalles
                    </button>
                    <button 
                      className="btn btn-success"
                      onClick={() => aprobarYAsignar(exp)}
                    >
                      ✓ Aprobar y Asignar
                    </button>
                    <button 
                      className="btn btn-warning"
                      onClick={() => marcarObservado(exp._id)}
                    >
                      ⚠ Observar
                    </button>
                  </>
                )}
                
                {exp.estado === 'VERIFICACION_DOCUMENTARIA' && !exp.asignaciones?.tecnico?.usuario && (
                  <>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => window.open(`/expediente/${exp._id}`, '_blank')}
                    >
                      Ver Detalles
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={() => aprobarYAsignar(exp)}
                    >
                      <FaUserPlus /> Asignar a Técnico
                    </button>
                  </>
                )}

                {exp.estado === 'DOCUMENTOS_INCOMPLETOS' && (
                  <button 
                    className="btn btn-secondary"
                    onClick={() => window.open(`/expediente/${exp._id}`, '_blank')}
                  >
                    Ver Detalles
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Asignación */}
      {mostrarModalAsignar && expedienteSeleccionado && (
        <div className="modal-overlay" onClick={() => setMostrarModalAsignar(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Aprobar y Asignar Expediente</h3>
            <p className="modal-subtitle">
              Expediente: {expedienteSeleccionado.numeroExpediente}
            </p>
            <p style={{color: '#666', marginBottom: '20px'}}>
              Selecciona el técnico que revisará este expediente y la prioridad de atención.
            </p>

            <div className="form-group">
              <label>Seleccionar Técnico:</label>
              <select id="selectTecnico" className="form-control">
                <option value="">-- Seleccionar --</option>
                {usuarios.map(usuario => (
                  <option key={usuario._id} value={usuario._id}>
                    {usuario.nombres} {usuario.apellidos} - {usuario.estadisticas?.expedientesAsignados || 0} asignados
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Prioridad:</label>
              <select id="selectPrioridad" className="form-control">
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
                  const tecnicoId = document.getElementById('selectTecnico').value;
                  const prioridad = document.getElementById('selectPrioridad').value;
                  if (!tecnicoId) {
                    alert('Selecciona un técnico');
                    return;
                  }
                  completarRevisionYAsignar(tecnicoId, prioridad);
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

export default DashboardMesaPartes;
