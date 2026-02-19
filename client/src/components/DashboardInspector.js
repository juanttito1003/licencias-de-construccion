import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './DashboardInspector.css';
import { FaMapMarkedAlt, FaClipboardList, FaCheckCircle, FaExclamationTriangle, FaCalendarAlt } from 'react-icons/fa';

const DashboardInspector = () => {
  const { usuario } = useAuth();
  const [expedientes, setExpedientes] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState(null);
  const [mostrarModalInspeccion, setMostrarModalInspeccion] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      
      // Cargar expedientes asignados
      const respExpedientes = await api.get('/asignaciones/mis-asignaciones');
      
      // Cargar también inspecciones programadas
      const respInspecciones = await api.get('/inspecciones/mis-inspecciones');
      
      // Combinar: expedientes pueden tener inspecciones o no
      const expedientesConInspeccion = respExpedientes.data.expedientes || [];
      
      setExpedientes(expedientesConInspeccion);
      setEstadisticas(respExpedientes.data.estadisticas);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setCargando(false);
    }
  };

  const programarInspeccion = async (expedienteId) => {
    const fecha = prompt('Ingresa la fecha y hora de inspección (formato: YYYY-MM-DD HH:MM):');
    if (!fecha) return;

    try {
      await api.post('/inspecciones', {
        expedienteId: expedienteId,
        fechaProgramada: new Date(fecha),
        inspector: usuario._id,
        tipo: 'INICIAL'
      });
      cargarDatos();
      alert('✅ Inspección programada correctamente');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al programar inspección: ' + (error.response?.data?.error || error.message));
    }
  };

  const abrirModalInspeccion = (expediente) => {
    setExpedienteSeleccionado(expediente);
    setMostrarModalInspeccion(true);
  };

  const completarInspeccion = async (aprobado, observaciones) => {
    try {
      console.log('Expediente seleccionado:', expedienteSeleccionado);
      console.log('Inspecciones:', expedienteSeleccionado.inspecciones);
      
      // Buscar la inspección PROGRAMADA para este expediente
      let inspeccionId = null;
      
      if (expedienteSeleccionado.inspecciones && expedienteSeleccionado.inspecciones.length > 0) {
        // Si inspecciones es un array de IDs
        inspeccionId = expedienteSeleccionado.inspecciones[expedienteSeleccionado.inspecciones.length - 1];
        if (typeof inspeccionId === 'object' && inspeccionId._id) {
          inspeccionId = inspeccionId._id;
        }
      }
      
      if (!inspeccionId) {
        // Buscar la inspección programada
        const respInspecciones = await api.get('/inspecciones/mis-inspecciones');
        const inspeccionEncontrada = respInspecciones.data.inspecciones.find(
          i => i.expediente._id === expedienteSeleccionado._id && i.estado === 'PROGRAMADA'
        );
        
        if (inspeccionEncontrada) {
          inspeccionId = inspeccionEncontrada._id;
        } else {
          throw new Error('No se encontró una inspección programada para este expediente');
        }
      }

      console.log('ID de inspección a actualizar:', inspeccionId);

      // Finalizar inspección usando la ruta correcta
      const respuesta = await api.patch(`/inspecciones/${inspeccionId}/finalizar`, {
        resultado: aprobado ? 'CONFORME' : 'NO_CONFORME',
        informe: observaciones
      });

      console.log('✓ Inspección finalizada:', respuesta.data);

      setMostrarModalInspeccion(false);
      cargarDatos();
      
      if (aprobado) {
        alert('✅ Inspección CONFORME registrada exitosamente.\n\n' +
              '📋 El expediente fue enviado a GERENCIA para aprobación final.');
      } else {
        alert('⚠️ Inspección NO CONFORME registrada.\n\n' +
              '📋 Se notificó al usuario sobre las observaciones encontradas.');
      }
      
    } catch (error) {
      console.error('Error completo:', error);
      console.error('Error response:', error.response);
      alert('❌ Error al registrar inspección:\n' + (error.response?.data?.error || error.message));
    }
  };

  const getBadgeClass = (estado) => {
    const clases = {
      'PROGRAMACION_INSPECCION': 'badge-info',
      'EN_INSPECCION': 'badge-warning',
      'OBSERVADO_INSPECCION': 'badge-danger',
      'APROBADO_INSPECCION': 'badge-success',
    };
    return clases[estado] || 'badge-secondary';
  };

  if (cargando) {
    return <div className="cargando">Cargando dashboard...</div>;
  }

  return (
    <div className="dashboard-inspector">
      <div className="dashboard-header">
        <h2>🔍 Dashboard Inspector</h2>
        <p className="subtitle">Inspecciones de Obra</p>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="estadisticas-grid">
          <div className="stat-card">
            <FaClipboardList className="stat-icon primary" />
            <div className="stat-info">
              <h3>{estadisticas.total}</h3>
              <p>Inspecciones Asignadas</p>
            </div>
          </div>
          <div className="stat-card">
            <FaCalendarAlt className="stat-icon warning" />
            <div className="stat-info">
              <h3>{estadisticas.porEstado['PROGRAMACION_INSPECCION'] || 0}</h3>
              <p>Por Programar</p>
            </div>
          </div>
          <div className="stat-card">
            <FaMapMarkedAlt className="stat-icon info" />
            <div className="stat-info">
              <h3>{estadisticas.porEstado['EN_INSPECCION'] || 0}</h3>
              <p>En Proceso</p>
            </div>
          </div>
          <div className="stat-card">
            <FaCheckCircle className="stat-icon success" />
            <div className="stat-info">
              <h3>{estadisticas.porEstado['APROBADO_INSPECCION'] || 0}</h3>
              <p>Aprobadas</p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Expedientes */}
      <div className="expedientes-lista">
        {expedientes.length === 0 ? (
          <div className="sin-expedientes">
            <FaMapMarkedAlt size={60} />
            <p>No tienes inspecciones asignadas</p>
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
                    <strong>Teléfono:</strong>
                    <span>{exp.solicitante.telefono}</span>
                  </div>
                  <div className="info-item">
                    <strong>Ubicación:</strong>
                    <span>{exp.proyecto.direccionProyecto}</span>
                  </div>
                  <div className="info-item">
                    <strong>Distrito:</strong>
                    <span>{exp.proyecto.distrito}</span>
                  </div>
                </div>

                {/* Información de la obra */}
                <div className="obra-info">
                  <h4>📋 Datos de la Obra:</h4>
                  <div className="obra-detalles">
                    <div className="detalle-item">
                      <span className="label">Tipo:</span>
                      <span className="valor">{exp.proyecto.tipoObra?.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="detalle-item">
                      <span className="label">Área Terreno:</span>
                      <span className="valor">{exp.proyecto.areaTerreno} m²</span>
                    </div>
                    <div className="detalle-item">
                      <span className="label">Área Construcción:</span>
                      <span className="valor">{exp.proyecto.areaConstruccion} m²</span>
                    </div>
                    <div className="detalle-item">
                      <span className="label">Niveles:</span>
                      <span className="valor">{exp.proyecto.numeroNiveles || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Lista de verificación */}
                <div className="checklist-preview">
                  <strong>Aspectos a verificar en campo:</strong>
                  <ul>
                    <li>✓ Ubicación coincide con planos</li>
                    <li>✓ Dimensiones del terreno</li>
                    <li>✓ Retiros municipales</li>
                    <li>✓ Área libre</li>
                    <li>✓ Accesos y circulaciones</li>
                  </ul>
                </div>
              </div>

              <div className="expediente-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => window.open(`/expediente/${exp._id}`, '_blank')}
                >
                  Ver Expediente Completo
                </button>
                
                {exp.estado === 'PROGRAMACION_INSPECCION' && (
                  <button 
                    className="btn btn-info"
                    onClick={() => programarInspeccion(exp._id)}
                  >
                    <FaCalendarAlt /> Programar Inspección
                  </button>
                )}

                {exp.estado === 'EN_INSPECCION' && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => abrirModalInspeccion(exp)}
                  >
                    <FaClipboardList /> Registrar Inspección
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Inspección */}
      {mostrarModalInspeccion && expedienteSeleccionado && (
        <div className="modal-overlay" onClick={() => setMostrarModalInspeccion(false)}>
          <div className="modal-content-inspeccion" onClick={e => e.stopPropagation()}>
            <h3>Registro de Inspección</h3>
            <p className="modal-subtitle">
              Expediente: {expedienteSeleccionado.numeroExpediente}<br/>
              Proyecto: {expedienteSeleccionado.proyecto.nombreProyecto}
            </p>

            <div className="inspeccion-form">
              <div className="form-group">
                <label>Resultado de la Inspección:</label>
                <select id="selectResultado" className="form-control">
                  <option value="CONFORME">✅ Conforme - Todo en orden</option>
                  <option value="NO_CONFORME">⚠️ No Conforme - Con observaciones</option>
                </select>
              </div>

              <div className="form-group">
                <label>Observaciones de Campo:</label>
                <textarea 
                  id="textObservaciones"
                  className="form-control"
                  rows="8"
                  placeholder="Describe los hallazgos de la inspección, medidas tomadas, condiciones encontradas, cumplimiento de planos, etc."
                ></textarea>
              </div>

              <div className="checklist-inspeccion">
                <strong>Lista de Verificación:</strong>
                <div className="checklist-items">
                  <label>
                    <input type="checkbox" /> Ubicación según planos
                  </label>
                  <label>
                    <input type="checkbox" /> Dimensiones del lote
                  </label>
                  <label>
                    <input type="checkbox" /> Retiros frontales y laterales
                  </label>
                  <label>
                    <input type="checkbox" /> Altura permitida
                  </label>
                  <label>
                    <input type="checkbox" /> Área libre mínima
                  </label>
                  <label>
                    <input type="checkbox" /> Estacionamientos
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setMostrarModalInspeccion(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  const resultado = document.getElementById('selectResultado').value;
                  const observaciones = document.getElementById('textObservaciones').value;
                  
                  if (!observaciones.trim()) {
                    alert('Debes ingresar observaciones de la inspección');
                    return;
                  }

                  completarInspeccion(resultado === 'CONFORME', observaciones);
                }}
              >
                Guardar Inspección
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardInspector;
