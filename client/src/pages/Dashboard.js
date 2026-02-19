import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { FaFileAlt, FaClipboardList, FaCheckCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { useQuery } from 'react-query';
import api from '../services/api';
import './Dashboard.css';

// Importar dashboards específicos por rol
import DashboardMesaPartes from '../components/DashboardMesaPartes';
import DashboardTecnico from '../components/DashboardTecnico';
import DashboardInspector from '../components/DashboardInspector';
import DashboardGerente from '../components/DashboardGerente';

const Dashboard = () => {
  const { usuario } = useAuth();

  // Dashboard original para USUARIO_EXTERNO - Definir hooks ANTES de cualquier return
  const { data: expedientes, isLoading } = useQuery('expedientes', async () => {
    const response = await api.get('/expedientes?limit=5');
    return response.data.expedientes;
  }, { enabled: usuario.rol === 'USUARIO_EXTERNO' });

  // Las estadísticas se muestran en los dashboards específicos de cada rol

  // Redirigir a dashboard específico según el rol (DESPUÉS de los hooks)
  if (usuario.rol === 'MESA_PARTES') {
    return <DashboardMesaPartes />;
  }

  if (usuario.rol === 'TECNICO') {
    return <DashboardTecnico />;
  }

  if (usuario.rol === 'INSPECTOR') {
    return <DashboardInspector />;
  }

  if (usuario.rol === 'GERENTE') {
    return <DashboardGerente />;
  }

  // Dashboard para USUARIO_EXTERNO

  const getBadgeClass = (estado) => {
    const badgeMap = {
      'REGISTRADO': 'badge-info',
      'EN_REVISION_ADMINISTRATIVA': 'badge-warning',
      'EN_REVISION_TECNICA': 'badge-warning',
      'OBSERVADO': 'badge-danger',
      'PENDIENTE_PAGO': 'badge-warning',
      'PAGADO': 'badge-success',
      'APROBADO': 'badge-success',
      'LICENCIA_EMITIDA': 'badge-success',
      'RECHAZADO': 'badge-danger'
    };
    return badgeMap[estado] || 'badge-secondary';
  };

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>Bienvenido, {usuario.nombres}</h1>
        <p>Panel de control - {usuario.rol.replace('_', ' ')}</p>
      </div>

      {usuario.rol === 'USUARIO_EXTERNO' && (
        <div className="quick-actions">
          <h2>Acciones Rápidas</h2>
          <div className="grid grid-2">
            <Link to="/nuevo-expediente" className="action-card">
              <FaFileAlt className="action-icon" />
              <h3>Nueva Solicitud</h3>
              <p>Registrar una nueva solicitud de licencia de construcción</p>
            </Link>
            <Link to="/expedientes" className="action-card">
              <FaClipboardList className="action-icon" />
              <h3>Mis Expedientes</h3>
              <p>Ver el estado de tus solicitudes</p>
            </Link>
          </div>
        </div>
      )}

      <div className="expedientes-recientes">
        <div className="section-header">
          <h2>
            {usuario.rol === 'USUARIO_EXTERNO' ? 'Mis Expedientes Recientes' : 'Expedientes Recientes'}
          </h2>
          <Link to="/expedientes" className="btn btn-secondary">Ver Todos</Link>
        </div>

        {isLoading ? (
          <div className="spinner"></div>
        ) : expedientes && expedientes.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>N° Expediente</th>
                  <th>Proyecto</th>
                  <th>Solicitante</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {expedientes.map((exp) => (
                  <tr key={exp._id}>
                    <td>{exp.numeroExpediente}</td>
                    <td>{exp.proyecto.nombreProyecto}</td>
                    <td>{exp.solicitante.nombres} {exp.solicitante.apellidos}</td>
                    <td>
                      <span className={`badge ${getBadgeClass(exp.estado)}`}>
                        {exp.estado.replace(/_/g, ' ')}
                      </span>
                      {/* Indicador de pago pendiente */}
                      {exp.pago && exp.pago.monto && !exp.pago.comprobante && (
                        <span style={{
                          display: 'inline-block',
                          marginLeft: '8px',
                          padding: '4px 8px',
                          backgroundColor: '#ff9800',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}>
                          💰 PAGO PENDIENTE
                        </span>
                      )}
                    </td>
                    <td>{new Date(exp.fechaCreacion).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/expediente/${exp._id}`} className="btn btn-primary btn-sm">
                        {exp.pago && exp.pago.monto && !exp.pago.comprobante ? '💰 Registrar Pago' : 'Ver Detalles'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <FaExclamationTriangle />
            <p>No hay expedientes para mostrar</p>
            {usuario.rol === 'USUARIO_EXTERNO' && (
              <Link to="/nuevo-expediente" className="btn btn-primary">
                Crear Nueva Solicitud
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
