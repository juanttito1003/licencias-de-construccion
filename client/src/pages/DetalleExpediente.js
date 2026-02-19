import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import api from '../services/api';
import { FaFileAlt, FaHistory, FaMoneyBillWave, FaFilePdf, FaDownload, FaUpload, FaCheckCircle, FaEnvelope, FaEdit, FaClock, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import EnviarMensaje from '../components/EnviarMensaje';
import DocumentoItem from '../components/DocumentoItem';
import CambiarEstadoExpediente from '../components/CambiarEstadoExpediente';
import './Pages.css';

const DetalleExpediente = () => {
  const { id } = useParams();
  const { usuario } = useAuth();
  const queryClient = useQueryClient();
  const [voucherFile, setVoucherFile] = useState(null);
  const [subiendoVoucher, setSubiendoVoucher] = useState(false);
  const [datosVoucher, setDatosVoucher] = useState({
    numeroOperacion: '',
    fechaPago: ''
  });
  const [montoAsignar, setMontoAsignar] = useState('');
  const [asignandoMonto, setAsignandoMonto] = useState(false);
  const [mostrarModalMensaje, setMostrarModalMensaje] = useState(false);
  const [mostrarModalEstado, setMostrarModalEstado] = useState(false);
  const [licenciaFile, setLicenciaFile] = useState(null);
  const [subiendoLicencia, setSubiendoLicencia] = useState(false);
  const [mostrarModalSubsanar, setMostrarModalSubsanar] = useState(false);
  const [archivosSubsanar, setArchivosSubsanar] = useState({});
  const [subiendoSubsanacion, setSubiendoSubsanacion] = useState(false);

  const { data: expediente, isLoading } = useQuery(['expediente', id], async () => {
    const response = await api.get(`/expedientes/${id}`);
    return response.data;
  });

  const handleSubsanarArchivo = (campo, archivo) => {
    setArchivosSubsanar(prev => ({ ...prev, [campo]: archivo }));
  };

  const subsanarDocumentos = async () => {
    if (Object.keys(archivosSubsanar).length === 0) {
      toast.error('Debes seleccionar al menos un documento para subsanar');
      return;
    }

    try {
      setSubiendoSubsanacion(true);
      const formData = new FormData();
      
      Object.keys(archivosSubsanar).forEach(campo => {
        formData.append(campo, archivosSubsanar[campo]);
      });

      await api.post(`/expedientes/${id}/subsanar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('✅ Documentos subsanados correctamente. Serán revisados nuevamente.');
      setMostrarModalSubsanar(false);
      setArchivosSubsanar({});
      queryClient.invalidateQueries(['expediente', id]);
    } catch (error) {
      console.error('Error al subsanar:', error);
      toast.error('❌ ' + (error.response?.data?.error || 'Error al subsanar documentos'));
    } finally {
      setSubiendoSubsanacion(false);
    }
  };

  const handleVoucherChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo (imagen o PDF)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Solo se permiten imágenes (JPG, PNG) o PDF');
        e.target.value = '';
        return;
      }
      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo no debe superar los 5MB');
        e.target.value = '';
        return;
      }
      setVoucherFile(file);
    }
  };

  const subirVoucher = async () => {
    if (!voucherFile) {
      toast.error('Por favor seleccione la imagen o PDF del voucher');
      return;
    }

    if (!datosVoucher.numeroOperacion || !datosVoucher.fechaPago) {
      toast.error('Complete el número de operación y la fecha de pago');
      return;
    }

    setSubiendoVoucher(true);
    try {
      const formData = new FormData();
      formData.append('voucher', voucherFile);
      formData.append('numeroOperacion', datosVoucher.numeroOperacion);
      formData.append('fechaPago', datosVoucher.fechaPago);

      await api.post(`/expedientes/${id}/voucher`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Voucher de pago registrado exitosamente');
      setVoucherFile(null);
      setDatosVoucher({ numeroOperacion: '', fechaPago: '' });
      queryClient.invalidateQueries(['expediente', id]);
    } catch (error) {
      console.error('Error al subir voucher:', error);
      toast.error(error.response?.data?.error || 'Error al subir voucher');
    } finally {
      setSubiendoVoucher(false);
    }
  };

  const asignarMonto = async () => {
    if (!montoAsignar || parseFloat(montoAsignar) <= 0) {
      toast.error('Ingrese un monto válido');
      return;
    }

    setAsignandoMonto(true);
    try {
      await api.put(`/expedientes/${id}/pago`, {
        monto: parseFloat(montoAsignar)
      });

      toast.success('Monto de pago asignado correctamente');
      setMontoAsignar('');
      queryClient.invalidateQueries(['expediente', id]);
    } catch (error) {
      console.error('Error al asignar monto:', error);
      toast.error(error.response?.data?.error || 'Error al asignar monto');
    } finally {
      setAsignandoMonto(false);
    }
  };

  const verificarPago = async (aprobar) => {
    if (!aprobar && !window.confirm('¿Está seguro de rechazar este pago? El usuario deberá volver a registrarlo.')) {
      return;
    }

    try {
      if (aprobar) {
        await api.patch(`/pagos/${id}/verificar`);
        toast.success('✅ Pago verificado correctamente');
      } else {
        await api.patch(`/pagos/${id}/rechazar`);
        toast.success('❌ Pago rechazado. Se notificó al usuario.');
      }
      queryClient.invalidateQueries(['expediente', id]);
    } catch (error) {
      console.error('Error al verificar pago:', error);
      toast.error(error.response?.data?.error || 'Error al procesar el pago');
    }
  };

  const descargarDocumento = (ruta, nombre) => {
    if (!ruta) {
      toast.error('Documento no disponible');
      return;
    }
    // Abrir en nueva pestaña para descargar
    window.open(`http://localhost:5000/${ruta}`, '_blank');
  };

  const handleLicenciaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo (solo PDF)
      if (file.type !== 'application/pdf') {
        toast.error('Solo se permiten archivos PDF');
        e.target.value = '';
        return;
      }
      // Validar tamaño (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo no debe superar los 10MB');
        e.target.value = '';
        return;
      }
      setLicenciaFile(file);
    }
  };

  const subirLicencia = async () => {
    if (!licenciaFile) {
      toast.error('Por favor seleccione el archivo PDF de la licencia');
      return;
    }

    if (!window.confirm('¿Está seguro de subir esta licencia? Se enviará automáticamente al usuario por correo electrónico.')) {
      return;
    }

    setSubiendoLicencia(true);

    try {
      const formData = new FormData();
      formData.append('licencia', licenciaFile);

      await api.post(`/expedientes/${id}/subir-licencia`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('¡Licencia subida y enviada al usuario exitosamente!');
      toast.info('El usuario recibirá la licencia en su correo electrónico');
      setLicenciaFile(null);
      
      // Limpiar el input file
      const fileInput = document.getElementById('licencia-file');
      if (fileInput) fileInput.value = '';
      
      queryClient.invalidateQueries(['expediente', id]);
    } catch (error) {
      console.error('Error al subir licencia:', error);
      toast.error(error.response?.data?.error || 'Error al subir la licencia');
    } finally {
      setSubiendoLicencia(false);
    }
  };

  const descargarLicencia = async () => {
    try {
      const response = await api.get(`/expedientes/${id}/descargar-licencia`, {
        responseType: 'blob'
      });
      
      // Crear un enlace temporal para descargar
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', expediente.licenciaFinal.nombre || `licencia-${expediente.numeroExpediente}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Licencia descargada exitosamente');
    } catch (error) {
      console.error('Error al descargar licencia:', error);
      toast.error('Error al descargar la licencia');
    }
  };

  if (isLoading) return <div className="spinner"></div>;
  if (!expediente) return <div>Expediente no encontrado</div>;

  const getBadgeClass = (estado) => {
    const badgeMap = {
      'REGISTRADO': 'badge-secondary',
      'EN_REVISION_ADMINISTRATIVA': 'badge-info',
      'EN_REVISION_TECNICA': 'badge-info',
      'OBSERVADO': 'badge-warning',
      'SUBSANACION': 'badge-warning',
      'PENDIENTE_INSPECCION': 'badge-purple',
      'EN_INSPECCION': 'badge-purple',
      'PENDIENTE_PAGO': 'badge-warning',
      'PAGADO': 'badge-success',
      'APROBADO': 'badge-success',
      'RECHAZADO': 'badge-danger',
      'LICENCIA_EMITIDA': 'badge-success'
    };
    return badgeMap[estado] || 'badge-secondary';
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      'REGISTRADO': '📝 Registrado',
      'EN_REVISION_ADMINISTRATIVA': '📋 En Revisión Administrativa',
      'EN_REVISION_TECNICA': '🔍 En Revisión Técnica',
      'OBSERVADO': '⚠️ Observado',
      'SUBSANACION': '📝 En Subsanación',
      'PENDIENTE_INSPECCION': '⏳ Pendiente de Inspección',
      'EN_INSPECCION': '🔎 En Inspección',
      'PENDIENTE_PAGO': '💰 Pendiente de Pago',
      'PAGADO': '✅ Pago Registrado',
      'APROBADO': '✅ Aprobado',
      'RECHAZADO': '❌ Rechazado',
      'LICENCIA_EMITIDA': '📄 Licencia Emitida'
    };
    return labels[estado] || estado.replace(/_/g, ' ');
  };

  return (
    <div className="container">
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1>{expediente.numeroExpediente}</h1>
            <span className={`badge ${getBadgeClass(expediente.estado)}`}>
              {getEstadoLabel(expediente.estado)}
            </span>
          </div>
          
          {usuario && usuario.rol === 'GERENTE' && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setMostrarModalEstado(true)}
                className="btn btn-warning"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <FaEdit /> Cambiar Estado
              </button>
              <button 
                onClick={() => setMostrarModalMensaje(true)}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <FaEnvelope /> Enviar Mensaje
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Alerta de pago pendiente */}
      {usuario && usuario.rol === 'USUARIO_EXTERNO' && expediente.pago && !expediente.pago.comprobante && (
        <div style={{padding: '16px', backgroundColor: '#fff3e0', border: '2px solid #ff9800', borderRadius: '8px', marginBottom: '20px'}}>
          <h3 style={{margin: '0 0 8px 0', color: '#f57c00', fontSize: '18px'}}>
            ⚠️ Acción Requerida: Registrar Pago
          </h3>
          <p style={{margin: '0 0 12px 0', fontSize: '14px'}}>
            Para continuar con el trámite, debe realizar el pago de la licencia en el <strong>Banco de la Nación</strong> y adjuntar el voucher en la sección de "Información de Pago" más abajo.
          </p>
          <p style={{margin: 0, fontSize: '13px', color: '#666'}}>
            Recuerde tener a mano: número de operación, fecha de pago y foto/PDF del voucher.
          </p>
        </div>
      )}

      {/* Alerta de documentos observados */}
      {usuario && usuario.rol === 'USUARIO_EXTERNO' && 
       (expediente.estado === 'DOCUMENTOS_INCOMPLETOS' || expediente.estado.includes('OBSERV')) && (
        <div style={{padding: '16px', backgroundColor: '#ffebee', border: '2px solid #f44336', borderRadius: '8px', marginBottom: '20px'}}>
          <h3 style={{margin: '0 0 8px 0', color: '#c62828', fontSize: '18px'}}>
            📝 Acción Requerida: Subsanar Documentos
          </h3>
          <p style={{margin: '0 0 12px 0', fontSize: '14px'}}>
            Tu expediente tiene observaciones. Debes corregir y volver a subir los documentos observados.
          </p>
          {expediente.historial && expediente.historial.length > 0 && (
            <div style={{backgroundColor: '#fff', padding: '12px', borderRadius: '6px', marginBottom: '12px'}}>
              <strong>Última observación:</strong>
              <p style={{margin: '8px 0 0 0', fontSize: '14px', color: '#666'}}>
                {expediente.historial[expediente.historial.length - 1]?.detalles || 'Ver historial para más detalles'}
              </p>
            </div>
          )}
          <button 
            onClick={() => setMostrarModalSubsanar(true)}
            className="btn btn-danger"
            style={{marginTop: '8px'}}
          >
            📤 Subsanar Documentos
          </button>
        </div>
      )}

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Datos del Solicitante</h2>
          </div>
          <div className="card-body">
            <p><strong>Nombre:</strong> {expediente.solicitante.nombres} {expediente.solicitante.apellidos}</p>
            <p><strong>DNI:</strong> {expediente.solicitante.dni}</p>
            <p><strong>Email:</strong> {expediente.solicitante.email}</p>
            <p><strong>Teléfono:</strong> {expediente.solicitante.telefono}</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Datos del Proyecto</h2>
          </div>
          <div className="card-body">
            <p><strong>Proyecto:</strong> {expediente.proyecto.nombreProyecto}</p>
            <p><strong>Dirección:</strong> {expediente.proyecto.direccionProyecto}</p>
            <p><strong>Distrito:</strong> {expediente.proyecto.distrito}</p>
            <p><strong>Área Terreno:</strong> {expediente.proyecto.areaTerreno} m²</p>
            <p><strong>Área Construcción:</strong> {expediente.proyecto.areaConstruccion} m²</p>
          </div>
        </div>
      </div>

      {/* Documentos Administrativos */}
      {expediente.documentos && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title"><FaFilePdf /> Documentación Administrativa</h2>
          </div>
          <div className="card-body">
            {!expediente.documentos.formularioUnico && !expediente.documentos.certificadoLiteral && 
             !expediente.documentos.declaracionJurada && !expediente.documentos.documentoDerecho && 
             !expediente.documentos.vigenciaPoder && !expediente.documentos.licenciaAnterior ? (
              <p className="text-center" style={{color: '#999'}}>No se han adjuntado documentos administrativos</p>
            ) : (
              <div>
                <DocumentoItem
                  documento={expediente.documentos.formularioUnico}
                  nombreDocumento="Formulario Único de Edificación (FUE)"
                  tipoDocumento="formularioUnico"
                  expedienteId={id}
                  puedeEditar={usuario && (usuario.rol === 'MESA_PARTES' || usuario.rol === 'GERENTE')}
                  esSolicitante={usuario && expediente.solicitante.email === usuario.email}
                  onActualizar={() => queryClient.invalidateQueries(['expediente', id])}
                />
                
                <DocumentoItem
                  documento={expediente.documentos.certificadoLiteral}
                  nombreDocumento="Certificado Literal Actualizado"
                  tipoDocumento="certificadoLiteral"
                  expedienteId={id}
                  puedeEditar={usuario && (usuario.rol === 'MESA_PARTES' || usuario.rol === 'GERENTE')}
                  esSolicitante={usuario && expediente.solicitante.email === usuario.email}
                  onActualizar={() => queryClient.invalidateQueries(['expediente', id])}
                />
                
                <DocumentoItem
                  documento={expediente.documentos.declaracionJurada}
                  nombreDocumento="Declaración Jurada de Profesionales"
                  tipoDocumento="declaracionJurada"
                  expedienteId={id}
                  puedeEditar={usuario && (usuario.rol === 'MESA_PARTES' || usuario.rol === 'GERENTE')}
                  esSolicitante={usuario && expediente.solicitante.email === usuario.email}
                  onActualizar={() => queryClient.invalidateQueries(['expediente', id])}
                />
                
                <DocumentoItem
                  documento={expediente.documentos.documentoDerecho}
                  nombreDocumento="Derecho a Edificar"
                  tipoDocumento="documentoDerecho"
                  expedienteId={id}
                  puedeEditar={usuario && (usuario.rol === 'MESA_PARTES' || usuario.rol === 'GERENTE')}
                  esSolicitante={usuario && expediente.solicitante.email === usuario.email}
                  onActualizar={() => queryClient.invalidateQueries(['expediente', id])}
                />
                
                <DocumentoItem
                  documento={expediente.documentos.vigenciaPoder}
                  nombreDocumento="Vigencia de Poder (Persona Jurídica)"
                  tipoDocumento="vigenciaPoder"
                  expedienteId={id}
                  puedeEditar={usuario && (usuario.rol === 'MESA_PARTES' || usuario.rol === 'GERENTE')}
                  esSolicitante={usuario && expediente.solicitante.email === usuario.email}
                  onActualizar={() => queryClient.invalidateQueries(['expediente', id])}
                />
                
                <DocumentoItem
                  documento={expediente.documentos.licenciaAnterior}
                  nombreDocumento="Licencia Anterior (si aplica)"
                  tipoDocumento="licenciaAnterior"
                  expedienteId={id}
                  puedeEditar={usuario && (usuario.rol === 'MESA_PARTES' || usuario.rol === 'GERENTE')}
                  esSolicitante={usuario && expediente.solicitante.email === usuario.email}
                  onActualizar={() => queryClient.invalidateQueries(['expediente', id])}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Documentación Técnica */}
      {expediente.documentos && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title"><FaUpload /> Documentación Técnica</h2>
          </div>
          <div className="card-body">
            {!expediente.documentos.planoUbicacion && !expediente.documentos.planosArquitectura && 
             !expediente.documentos.planosEspecialidades && !expediente.documentos.planoSenalizacion && 
             !expediente.documentos.cartaSeguridad ? (
              <p className="text-center" style={{color: '#999'}}>No se han adjuntado documentos técnicos</p>
            ) : (
              <div>
                <DocumentoItem
                  documento={expediente.documentos.planoUbicacion}
                  nombreDocumento="Plano de Ubicación y Localización"
                  tipoDocumento="planoUbicacion"
                  expedienteId={id}
                  puedeEditar={usuario && (usuario.rol === 'MESA_PARTES' || usuario.rol === 'GERENTE')}
                  esSolicitante={usuario && expediente.solicitante.email === usuario.email}
                  onActualizar={() => queryClient.invalidateQueries(['expediente', id])}
                />
                
                <DocumentoItem
                  documento={expediente.documentos.planosArquitectura}
                  nombreDocumento="Planos de Arquitectura"
                  tipoDocumento="planosArquitectura"
                  expedienteId={id}
                  puedeEditar={usuario && (usuario.rol === 'MESA_PARTES' || usuario.rol === 'GERENTE')}
                  esSolicitante={usuario && expediente.solicitante.email === usuario.email}
                  onActualizar={() => queryClient.invalidateQueries(['expediente', id])}
                />
                
                <DocumentoItem
                  documento={expediente.documentos.planosEspecialidades}
                  nombreDocumento="Planos de Especialidades"
                  tipoDocumento="planosEspecialidades"
                  expedienteId={id}
                  puedeEditar={usuario && (usuario.rol === 'MESA_PARTES' || usuario.rol === 'GERENTE')}
                  esSolicitante={usuario && expediente.solicitante.email === usuario.email}
                  onActualizar={() => queryClient.invalidateQueries(['expediente', id])}
                />
                
                <DocumentoItem
                  documento={expediente.documentos.planoSenalizacion}
                  nombreDocumento="Plano de Señalización y Evacuación"
                  tipoDocumento="planoSenalizacion"
                  expedienteId={id}
                  puedeEditar={usuario && (usuario.rol === 'MESA_PARTES' || usuario.rol === 'GERENTE')}
                  esSolicitante={usuario && expediente.solicitante.email === usuario.email}
                  onActualizar={() => queryClient.invalidateQueries(['expediente', id])}
                />
                
                <DocumentoItem
                  documento={expediente.documentos.cartaSeguridad}
                  nombreDocumento="Carta de Seguridad de Obra"
                  tipoDocumento="cartaSeguridad"
                  expedienteId={id}
                  puedeEditar={usuario && (usuario.rol === 'MESA_PARTES' || usuario.rol === 'GERENTE')}
                  esSolicitante={usuario && expediente.solicitante.email === usuario.email}
                  onActualizar={() => queryClient.invalidateQueries(['expediente', id])}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title"><FaMoneyBillWave /> Información de Pago - Banco de la Nación</h2>
        </div>
        <div className="card-body">
          {expediente.pago && expediente.pago.monto ? (
            <>
              <div className="grid grid-2" style={{marginBottom: '16px'}}>
                <div>
                  <p><strong>Monto a Pagar:</strong></p>
                  <p style={{fontSize: '24px', color: '#1976d2', fontWeight: 'bold', margin: '4px 0'}}>
                    S/ {expediente.pago.monto.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p><strong>Estado del Pago:</strong></p>
                  <p><span className={`badge ${getBadgeClass(expediente.pago.estado)}`} style={{fontSize: '14px', padding: '8px 16px'}}>
                    {expediente.pago.estado}
                  </span></p>
                </div>
              </div>
              {expediente.pago.fechaPago && (
                <p><strong>Fecha de Registro:</strong> {new Date(expediente.pago.fechaPago).toLocaleDateString()}</p>
              )}
              
              {/* Mostrar voucher si existe */}
              {expediente.pago.comprobante && (
                <div style={{marginTop: '16px', padding: '16px', backgroundColor: expediente.pago.estado === 'VERIFICADO' ? '#e8f5e9' : '#fff3e0', borderRadius: '8px', border: `1px solid ${expediente.pago.estado === 'VERIFICADO' ? '#4caf50' : '#ff9800'}`}}>
                  <p style={{fontWeight: 'bold', marginBottom: '12px'}}>
                    {expediente.pago.estado === 'VERIFICADO' ? (
                      <>
                        <FaCheckCircle style={{color: 'green', marginRight: '8px'}} />
                        Pago Verificado y Aprobado
                      </>
                    ) : (
                      <>
                        <FaClock style={{color: '#ff9800', marginRight: '8px'}} />
                        Comprobante de Pago Registrado - Pendiente de Verificación
                      </>
                    )}
                  </p>
                  <div className="grid grid-2" style={{gap: '12px', marginBottom: '12px'}}>
                    <div>
                      <strong>Número de Operación:</strong>
                      <p style={{margin: '4px 0', fontSize: '16px', color: '#1976d2'}}>
                        {expediente.pago.numeroOperacion || 'No especificado'}
                      </p>
                    </div>
                    <div>
                      <strong>Fecha de Operación:</strong>
                      <p style={{margin: '4px 0'}}>
                        {expediente.pago.fechaOperacion ? new Date(expediente.pago.fechaOperacion).toLocaleDateString() : 'No especificada'}
                      </p>
                    </div>
                  </div>
                  <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => descargarDocumento(expediente.pago.comprobante, 'voucher-pago')}
                    >
                      <FaDownload /> Ver Voucher del Banco de la Nación
                    </button>

                    {/* Botones para Mesa de Partes/Gerente verificar pago */}
                    {usuario && (usuario.rol === 'MESA_PARTES' || usuario.rol === 'GERENTE') && 
                     expediente.pago.estado !== 'VERIFICADO' && (
                      <>
                        <button 
                          className="btn btn-sm btn-success"
                          onClick={() => verificarPago(true)}
                        >
                          <FaCheckCircle /> Aprobar Pago
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => verificarPago(false)}
                        >
                          <FaTimes /> Rechazar Pago
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Botón para mostrar formulario de pago - Solo si NO tiene voucher */}
              {usuario && usuario.rol === 'USUARIO_EXTERNO' && expediente.pago && expediente.pago.monto && !expediente.pago.comprobante && (
                <>
                  <div style={{textAlign: 'center', margin: '20px 0'}}>
                    <button 
                      className="btn btn-success btn-lg"
                      onClick={() => {
                        const formulario = document.getElementById('formulario-pago');
                        if (formulario) {
                          formulario.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          formulario.style.animation = 'pulse 0.5s';
                        }
                      }}
                      style={{padding: '12px 32px', fontSize: '16px'}}
                    >
                      <FaUpload style={{marginRight: '8px'}} />
                      Registrar Pago del Banco de la Nación
                    </button>
                  </div>
                  
                  <hr style={{margin: '24px 0', border: '1px dashed #ddd'}} />
                </>
              )}

              {/* Formulario para subir voucher - Solo si NO tiene voucher */}
              {usuario && usuario.rol === 'USUARIO_EXTERNO' && expediente.pago && expediente.pago.monto && !expediente.pago.comprobante && (
                <div 
                  id="formulario-pago" 
                  style={{marginTop: '20px', padding: '20px', backgroundColor: '#fff3e0', borderRadius: '8px', border: '2px solid #ff9800'}}
                >
                  <h3 style={{marginBottom: '16px', fontSize: '18px', color: '#f57c00'}}>
                    <FaUpload /> Formulario de Registro de Pago - Banco de la Nación
                  </h3>
                  
                  <div style={{marginBottom: '16px', padding: '12px', backgroundColor: '#e3f2fd', borderRadius: '4px'}}>
                    <p style={{margin: 0, fontSize: '14px'}}>
                      <strong>📌 Instrucciones:</strong> Realice el pago en el Banco de la Nación y adjunte el voucher con los datos de la operación.
                    </p>
                  </div>

                  <div className="grid grid-2" style={{gap: '16px', marginBottom: '16px'}}>
                    <div className="form-group">
                      <label className="form-label">
                        <span style={{color: 'red'}}>* </span>
                        Número de Operación
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej: 001234567890"
                        value={datosVoucher.numeroOperacion}
                        onChange={(e) => setDatosVoucher({...datosVoucher, numeroOperacion: e.target.value})}
                        disabled={subiendoVoucher}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <span style={{color: 'red'}}>* </span>
                        Fecha de Pago
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={datosVoucher.fechaPago}
                        onChange={(e) => setDatosVoucher({...datosVoucher, fechaPago: e.target.value})}
                        disabled={subiendoVoucher}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <span style={{color: 'red'}}>* </span>
                      Voucher del Banco de la Nación (Imagen o PDF)
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleVoucherChange}
                      disabled={subiendoVoucher}
                    />
                    <small className="form-text">
                      Formatos permitidos: JPG, PNG, PDF (máx. 5MB)
                    </small>
                    {voucherFile && (
                      <small className="form-text" style={{color: 'green', display: 'block', marginTop: '8px'}}>
                        ✓ {voucherFile.name}
                      </small>
                    )}
                  </div>

                  <button 
                    className="btn btn-success"
                    onClick={subirVoucher}
                    disabled={!voucherFile || !datosVoucher.numeroOperacion || !datosVoucher.fechaPago || subiendoVoucher}
                    style={{marginTop: '8px'}}
                  >
                    {subiendoVoucher ? 'Registrando pago...' : 'Registrar Pago'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <p style={{color: '#999', marginBottom: '16px'}}>No se ha asignado un monto de pago para este expediente</p>
              
              {/* Formulario para que Mesa de Partes o Gerente asignen el monto */}
              {usuario && (usuario.rol === 'MESA_PARTES' || usuario.rol === 'GERENTE') && (
                <div style={{padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px', border: '2px solid #1976d2'}}>
                  <h3 style={{marginBottom: '16px', fontSize: '18px', color: '#1976d2'}}>
                    <FaMoneyBillWave /> Asignar Monto de Pago
                  </h3>
                  
                  <div style={{marginBottom: '16px', padding: '12px', backgroundColor: '#fff3e0', borderRadius: '4px'}}>
                    <p style={{margin: 0, fontSize: '14px'}}>                      <strong>📌 Instrucciones:</strong> Ingrese el monto que el solicitante debe pagar en el Banco de la Nación por la licencia de construcción.
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <span style={{color: 'red'}}>* </span>
                      Monto a Pagar (S/)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Ej: 150.00"
                      step="0.01"
                      min="0"
                      value={montoAsignar}
                      onChange={(e) => setMontoAsignar(e.target.value)}
                      disabled={asignandoMonto}
                    />
                    <small className="form-text">
                      Ingrese el monto calculado según el tipo de obra y área de construcción
                    </small>
                  </div>

                  <button 
                    className="btn btn-primary"
                    onClick={asignarMonto}
                    disabled={!montoAsignar || parseFloat(montoAsignar) <= 0 || asignandoMonto}
                    style={{marginTop: '8px'}}
                  >
                    {asignandoMonto ? 'Asignando monto...' : 'Asignar Monto de Pago'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Sección de Licencia Final */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <FaCheckCircle style={{ color: '#27ae60' }} /> Licencia de Construcción
          </h2>
        </div>
        <div className="card-body">
          {expediente.licenciaFinal && expediente.licenciaFinal.ruta ? (
            <div>
              <div style={{ 
                padding: '20px', 
                backgroundColor: '#e8f5e9', 
                borderRadius: '8px', 
                border: '2px solid #27ae60',
                marginBottom: '20px'
              }}>
                <h3 style={{ color: '#27ae60', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaCheckCircle /> ¡Licencia Aprobada y Emitida!
                </h3>
                <p style={{ margin: 0, fontSize: '15px', color: '#2e7d32' }}>
                  Su licencia de construcción ha sido aprobada y está disponible para descarga.
                  {expediente.licenciaFinal.generadaAutomaticamente && (
                    <> Este documento fue generado automáticamente por el sistema con código QR de verificación.</>
                  )}
                  {expediente.licenciaFinal.enviadaAlUsuario && (
                    <> También fue enviada a su correo electrónico el {new Date(expediente.licenciaFinal.fechaEnvio).toLocaleString()}.</>
                  )}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <div>
                  <strong style={{ fontSize: '16px' }}>
                    <FaFilePdf style={{ color: '#d32f2f' }} /> {expediente.licenciaFinal.nombre}
                  </strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#666' }}>
                    Emitida el: {new Date(expediente.licenciaFinal.fechaCarga).toLocaleString()}
                    {expediente.licenciaFinal.generadaAutomaticamente && (
                      <span style={{ marginLeft: '10px', padding: '2px 8px', backgroundColor: '#2196f3', color: 'white', borderRadius: '4px', fontSize: '11px' }}>
                        ✨ GENERADA AUTOMÁTICAMENTE
                      </span>
                    )}
                  </p>
                </div>
                <button 
                  className="btn btn-success"
                  onClick={descargarLicencia}
                >
                  <FaDownload /> Descargar Licencia
                </button>
              </div>

              <div style={{ 
                marginTop: '20px', 
                padding: '16px', 
                backgroundColor: '#fff3e0', 
                borderLeft: '4px solid #f39c12', 
                borderRadius: '4px' 
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#f57c00', fontSize: '15px' }}>⚠️ Importante:</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#f57c00' }}>
                  <li>Conserve este documento en lugar seguro</li>
                  <li>Debe tener una copia física en el lugar de la obra</li>
                  <li>La licencia debe estar visible durante toda la construcción</li>
                  <li>Cualquier modificación al proyecto requiere nueva aprobación</li>
                  {expediente.licenciaFinal.generadaAutomaticamente && (
                    <li style={{ color: '#2196f3' }}>✨ Esta licencia incluye un código QR para verificación de autenticidad</li>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <div>
              {usuario && usuario.rol === 'GERENTE' ? (
                <div style={{ 
                  padding: '20px', 
                  backgroundColor: '#e3f2fd', 
                  borderRadius: '8px', 
                  border: '2px solid #1976d2' 
                }}>
                  <h3 style={{ marginBottom: '16px', fontSize: '18px', color: '#1976d2' }}>
                    <FaUpload /> Subir Licencia de Construcción Aprobada
                  </h3>
                  
                  <div style={{ 
                    marginBottom: '16px', 
                    padding: '12px', 
                    backgroundColor: '#fff3e0', 
                    borderRadius: '4px' 
                  }}>
                    <p style={{ margin: 0, fontSize: '14px' }}>
                      <strong>📌 Instrucciones:</strong> Una vez que el expediente haya sido revisado y aprobado por todas las áreas, 
                      suba aquí el PDF de la licencia de construcción oficial. Este documento será enviado automáticamente 
                      al correo electrónico del solicitante.
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <span style={{ color: 'red' }}>* </span>
                      Archivo PDF de la Licencia
                    </label>
                    <input
                      type="file"
                      id="licencia-file"
                      className="form-control"
                      accept="application/pdf"
                      onChange={handleLicenciaChange}
                      disabled={subiendoLicencia}
                    />
                    <small className="form-text">
                      Solo archivos PDF. Tamaño máximo: 10MB
                    </small>
                  </div>

                  {licenciaFile && (
                    <div style={{ 
                      padding: '12px', 
                      backgroundColor: '#e8f5e9', 
                      borderRadius: '4px', 
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <FaCheckCircle style={{ color: '#27ae60' }} />
                      <span style={{ fontSize: '14px', color: '#2e7d32' }}>
                        Archivo seleccionado: {licenciaFile.name}
                      </span>
                    </div>
                  )}

                  <div style={{ 
                    marginBottom: '16px', 
                    padding: '12px', 
                    backgroundColor: '#ffebee', 
                    borderLeft: '4px solid #d32f2f', 
                    borderRadius: '4px' 
                  }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#c62828' }}>
                      <strong>⚠️ Atención:</strong> Al subir la licencia, se enviará automáticamente un correo electrónico 
                      al usuario con el documento adjunto. Asegúrese de que el archivo sea el correcto antes de continuar.
                    </p>
                  </div>

                  <button 
                    className="btn btn-success"
                    onClick={subirLicencia}
                    disabled={!licenciaFile || subiendoLicencia}
                    style={{ width: '100%' }}
                  >
                    {subiendoLicencia ? (
                      'Subiendo y enviando licencia...'
                    ) : (
                      <>
                        <FaUpload /> Subir Licencia y Enviar al Usuario
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <FaFilePdf style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
                  <p style={{ margin: 0, fontSize: '16px' }}>
                    La licencia de construcción aún no ha sido emitida
                  </p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                    Recibirá un correo electrónico cuando su licencia esté disponible
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title"><FaHistory /> Historial</h2>
        </div>
        <div className="card-body">
          {expediente.historial && expediente.historial.length > 0 ? (
            <div className="timeline">
              {expediente.historial.map((item, index) => {
                // Mejorar visualización de mensajes
                let titulo = item.accion;
                let contenido = item.detalles;
                
                if (item.accion === 'MENSAJE_ENVIADO' && item.detalles) {
                  // Extraer el asunto del mensaje si está en el formato "Mensaje enviado: ASUNTO"
                  const match = item.detalles.match(/Mensaje enviado: (.+)/);
                  if (match) {
                    titulo = '📧 Mensaje Enviado';
                    contenido = match[1];
                  }
                } else if (item.accion === 'CAMBIO_ESTADO') {
                  titulo = '🔄 Cambio de Estado';
                } else if (item.accion === 'DOCUMENTO_AGREGADO') {
                  titulo = '📎 Documento Agregado';
                } else if (item.accion === 'PAGO_REGISTRADO') {
                  titulo = '💰 Pago Registrado';
                }

                return (
                  <div key={index} className="timeline-item">
                    <div className="timeline-date">
                      {new Date(item.fecha).toLocaleString()}
                    </div>
                    <div className="timeline-content">
                      <strong>{titulo}</strong>
                      {contenido && <p style={{ marginTop: '4px' }}>{contenido}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p>No hay historial disponible</p>
          )}
        </div>
      </div>

      {/* Modal para enviar mensaje */}
      {mostrarModalMensaje && (
        <EnviarMensaje 
          expediente={expediente}
          onClose={() => setMostrarModalMensaje(false)}
          onEnviado={() => {
            queryClient.invalidateQueries(['expediente', id]);
          }}
        />
      )}

      {/* Modal para cambiar estado */}
      {mostrarModalEstado && (
        <CambiarEstadoExpediente
          expediente={expediente}
          onClose={() => setMostrarModalEstado(false)}
          onActualizado={() => {
            queryClient.invalidateQueries(['expediente', id]);
          }}
        />
      )}

      {/* Modal para subsanar documentos */}
      {mostrarModalSubsanar && (
        <div className="modal-overlay" onClick={() => setMostrarModalSubsanar(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '600px'}}>
            <h2>📝 Subsanar Documentos Observados</h2>
            <p style={{marginBottom: '20px', color: '#666'}}>
              Selecciona y sube los documentos que necesitas corregir. Solo debes subir los documentos que fueron observados.
            </p>

            <div style={{marginBottom: '20px'}}>
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>
                  Formulario Único de Edificación (FUE)
                </label>
                <input 
                  type="file" 
                  accept=".pdf,image/*"
                  onChange={(e) => handleSubsanarArchivo('formularioUnico', e.target.files[0])}
                  style={{width: '100%'}}
                />
              </div>

              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>
                  Certificado Literal Actualizado
                </label>
                <input 
                  type="file" 
                  accept=".pdf,image/*"
                  onChange={(e) => handleSubsanarArchivo('certificadoLiteral', e.target.files[0])}
                  style={{width: '100%'}}
                />
              </div>

              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>
                  Declaración Jurada de Profesionales
                </label>
                <input 
                  type="file" 
                  accept=".pdf,image/*"
                  onChange={(e) => handleSubsanarArchivo('declaracionJurada', e.target.files[0])}
                  style={{width: '100%'}}
                />
              </div>

              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>
                  Documento de Derecho a Edificar
                </label>
                <input 
                  type="file" 
                  accept=".pdf,image/*"
                  onChange={(e) => handleSubsanarArchivo('documentoDerecho', e.target.files[0])}
                  style={{width: '100%'}}
                />
              </div>

              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>
                  Plano de Ubicación
                </label>
                <input 
                  type="file" 
                  accept=".pdf,image/*"
                  onChange={(e) => handleSubsanarArchivo('planoUbicacion', e.target.files[0])}
                  style={{width: '100%'}}
                />
              </div>

              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>
                  Planos de Arquitectura
                </label>
                <input 
                  type="file" 
                  accept=".pdf,image/*"
                  onChange={(e) => handleSubsanarArchivo('planosArquitectura', e.target.files[0])}
                  style={{width: '100%'}}
                />
              </div>
            </div>

            <div style={{backgroundColor: '#e3f2fd', padding: '12px', borderRadius: '6px', marginBottom: '20px'}}>
              <p style={{margin: 0, fontSize: '14px'}}>
                📌 <strong>Documentos seleccionados:</strong> {Object.keys(archivosSubsanar).length}
              </p>
            </div>

            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setMostrarModalSubsanar(false);
                  setArchivosSubsanar({});
                }}
                disabled={subiendoSubsanacion}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-success"
                onClick={subsanarDocumentos}
                disabled={subiendoSubsanacion || Object.keys(archivosSubsanar).length === 0}
              >
                {subiendoSubsanacion ? 'Subiendo...' : '✅ Subsanar y Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalleExpediente;
