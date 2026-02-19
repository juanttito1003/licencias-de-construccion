import React from 'react';
import { useQuery } from 'react-query';
import api from '../services/api';
import { FaClipboardList, FaMapMarkerAlt, FaCalendar } from 'react-icons/fa';

const Inspecciones = () => {
  const { data: inspecciones, isLoading } = useQuery('mis-inspecciones', async () => {
    const response = await api.get('/inspecciones/mis-inspecciones');
    return response.data.inspecciones;
  });

  const getBadgeClass = (estado) => {
    const badgeMap = {
      'PROGRAMADA': 'badge-warning',
      'EN_CURSO': 'badge-info',
      'COMPLETADA': 'badge-success',
      'CANCELADA': 'badge-danger'
    };
    return badgeMap[estado] || 'badge-secondary';
  };

  if (isLoading) return <div className="spinner"></div>;

  return (
    <div className="container">
      <h1><FaClipboardList /> Mis Inspecciones</h1>
      <p>Lista de inspecciones asignadas</p>

      {inspecciones && inspecciones.length > 0 ? (
        <div className="grid grid-2">
          {inspecciones.map((inspeccion) => (
            <div key={inspeccion._id} className="card">
              <div className="card-header">
                <span className={`badge ${getBadgeClass(inspeccion.estado)}`}>
                  {inspeccion.estado}
                </span>
                <span className="badge badge-info">{inspeccion.tipo}</span>
              </div>
              <div className="card-body">
                {inspeccion.expediente && (
                  <>
                    <h3>{inspeccion.expediente.numeroExpediente}</h3>
                    <p>
                      <FaMapMarkerAlt /> {inspeccion.expediente.proyecto?.direccionProyecto}
                    </p>
                  </>
                )}
                <p>
                  <FaCalendar /> <strong>Programada:</strong>{' '}
                  {new Date(inspeccion.fechaProgramada).toLocaleString()}
                </p>
                {inspeccion.fechaRealizada && (
                  <p>
                    <strong>Realizada:</strong>{' '}
                    {new Date(inspeccion.fechaRealizada).toLocaleString()}
                  </p>
                )}
                {inspeccion.resultado && (
                  <p>
                    <strong>Resultado:</strong>{' '}
                    <span className={`badge ${getBadgeClass(inspeccion.resultado)}`}>
                      {inspeccion.resultado}
                    </span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <FaClipboardList />
          <p>No tienes inspecciones asignadas</p>
        </div>
      )}
    </div>
  );
};

export default Inspecciones;
