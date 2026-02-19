import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { FaFileDownload, FaFilePdf, FaFileExcel, FaChartBar } from 'react-icons/fa';

const Reportes = () => {
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    estado: ''
  });
  const [generando, setGenerando] = useState(false);

  const handleGenerarReporte = async (formato) => {
    if (!filtros.fechaInicio || !filtros.fechaFin) {
      toast.warning('Por favor seleccione un rango de fechas');
      return;
    }

    setGenerando(true);

    try {
      const params = new URLSearchParams({
        formato,
        fechaInicio: filtros.fechaInicio,
        fechaFin: filtros.fechaFin,
        ...(filtros.estado && { estado: filtros.estado })
      });

      if (formato === 'csv') {
        const response = await api.get(`/reportes/expedientes?${params.toString()}`, {
          responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `reporte-${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        toast.success('Reporte descargado exitosamente');
      } else {
        const response = await api.get(`/reportes/expedientes?${params.toString()}`);
        
        if (formato === 'pdf' && response.data.archivo) {
          window.open(response.data.archivo, '_blank');
          toast.success('Reporte generado exitosamente');
        } else {
          toast.success(`Reporte generado: ${response.data.total} expedientes`);
        }
      }
    } catch (error) {
      console.error('Error al generar reporte:', error);
      toast.error('Error al generar reporte');
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="container">
      <h1><FaChartBar /> Reportes</h1>
      <p>Genere reportes de expedientes procesados</p>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Filtros</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-3">
            <div className="form-group">
              <label className="form-label">Fecha Inicio</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaInicio}
                onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Fecha Fin</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaFin}
                onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Estado (opcional)</label>
              <select
                className="form-control"
                value={filtros.estado}
                onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="REGISTRADO">Registrado</option>
                <option value="APROBADO">Aprobado</option>
                <option value="RECHAZADO">Rechazado</option>
                <option value="LICENCIA_EMITIDA">Licencia Emitida</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title"><FaFileDownload /> Generar Reportes</h2>
        </div>
        <div className="card-body">
          <div className="flex gap-2 flex-wrap">
            <button
              className="btn btn-danger"
              onClick={() => handleGenerarReporte('pdf')}
              disabled={generando}
            >
              <FaFilePdf /> Descargar PDF
            </button>
            <button
              className="btn btn-success"
              onClick={() => handleGenerarReporte('csv')}
              disabled={generando}
            >
              <FaFileExcel /> Descargar Excel/CSV
            </button>
          </div>
          
          {generando && (
            <div className="mt-3">
              <div className="spinner"></div>
              <p className="text-center">Generando reporte...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reportes;
