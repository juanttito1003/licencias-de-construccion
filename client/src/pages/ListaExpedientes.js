import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../services/api';
import { FaSearch, FaFilter, FaEye } from 'react-icons/fa';
import './Pages.css';

const ListaExpedientes = () => {
  const [filtros, setFiltros] = useState({
    search: '',
    estado: '',
    page: 1
  });

  const { data, isLoading } = useQuery(
    ['expedientes', filtros],
    async () => {
      const params = new URLSearchParams();
      if (filtros.search) params.append('search', filtros.search);
      if (filtros.estado) params.append('estado', filtros.estado);
      params.append('page', filtros.page);
      params.append('limit', '10');

      const response = await api.get(`/expedientes?${params.toString()}`);
      return response.data;
    }
  );

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

  const handleSearch = (e) => {
    e.preventDefault();
    setFiltros({ ...filtros, page: 1 });
  };

  return (
    <div className="container">
      <h1>Expedientes</h1>

      <div className="card">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-group">
            <FaSearch />
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por número de expediente, solicitante o proyecto..."
              value={filtros.search}
              onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
            />
          </div>

          <div className="filter-group">
            <FaFilter />
            <select
              className="form-control"
              value={filtros.estado}
              onChange={(e) => setFiltros({ ...filtros, estado: e.target.value, page: 1 })}
            >
              <option value="">Todos los estados</option>
              <option value="REGISTRADO">Registrado</option>
              <option value="EN_REVISION_ADMINISTRATIVA">En Revisión Administrativa</option>
              <option value="EN_REVISION_TECNICA">En Revisión Técnica</option>
              <option value="OBSERVADO">Observado</option>
              <option value="PENDIENTE_PAGO">Pendiente de Pago</option>
              <option value="PAGADO">Pagado</option>
              <option value="APROBADO">Aprobado</option>
              <option value="LICENCIA_EMITIDA">Licencia Emitida</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary">Buscar</button>
        </form>
      </div>

      {isLoading ? (
        <div className="spinner"></div>
      ) : data && data.expedientes.length > 0 ? (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>N° Expediente</th>
                  <th>Solicitante</th>
                  <th>Proyecto</th>
                  <th>Distrito</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.expedientes.map((exp) => (
                  <tr key={exp._id}>
                    <td><strong>{exp.numeroExpediente}</strong></td>
                    <td>{exp.solicitante.nombres} {exp.solicitante.apellidos}</td>
                    <td>{exp.proyecto.nombreProyecto}</td>
                    <td>{exp.proyecto.distrito}</td>
                    <td>
                      <span className={`badge ${getBadgeClass(exp.estado)}`}>
                        {exp.estado.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>{new Date(exp.fechaCreacion).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/expediente/${exp._id}`} className="btn btn-primary btn-sm">
                        <FaEye /> Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.totalPaginas > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary"
                onClick={() => setFiltros({ ...filtros, page: filtros.page - 1 })}
                disabled={filtros.page === 1}
              >
                Anterior
              </button>
              <span>Página {filtros.page} de {data.totalPaginas}</span>
              <button
                className="btn btn-secondary"
                onClick={() => setFiltros({ ...filtros, page: filtros.page + 1 })}
                disabled={filtros.page === data.totalPaginas}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <p>No se encontraron expedientes</p>
        </div>
      )}
    </div>
  );
};

export default ListaExpedientes;
