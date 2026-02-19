import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { FaBuilding, FaMapMarkerAlt, FaRuler, FaSpinner, FaFilePdf, FaUpload, FaCheckCircle } from 'react-icons/fa';

const NuevoExpediente = () => {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  const [formData, setFormData] = useState({
    // Datos del solicitante
    nombres: '',
    apellidos: '',
    dni: '',
    email: '',
    telefono: '',
    direccion: '',
    // Datos del proyecto
    nombreProyecto: '',
    direccionProyecto: '',
    distrito: '',
    areaTerreno: '',
    areaConstruccion: '',
    numeroNiveles: '',
    usoProyecto: '',
    // Modalidad A - Nuevos campos
    tipoObra: '',
    esPropietario: 'SI',
    esPersonaJuridica: 'NO'
  });

  // Estado para documentos
  const [documentos, setDocumentos] = useState({
    // Documentos Administrativos
    formularioUnico: null,
    certificadoLiteral: null,
    declaracionJurada: null,
    documentoDerecho: null,
    vigenciaPoder: null,
    licenciaAnterior: null,
    // Documentación Técnica
    planoUbicacion: null,
    planosArquitectura: null,
    planosEspecialidades: null,
    planoSenalizacion: null,
    cartaSeguridad: null
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];

    // Validar que sea PDF
    if (file && file.type !== 'application/pdf') {
      toast.error('Solo se permiten archivos PDF');
      e.target.value = '';
      return;
    }

    // Validar tamaño máximo (10MB)
    if (file && file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no debe superar los 10MB');
      e.target.value = '';
      return;
    }

    setDocumentos({
      ...documentos,
      [name]: file
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar campos obligatorios del solicitante
    if (!formData.nombres || !formData.apellidos || !formData.dni || !formData.email || !formData.telefono) {
      toast.error('Complete todos los datos del solicitante (todos son obligatorios)');
      return;
    }

    // Validar campos obligatorios del proyecto
    if (!formData.nombreProyecto || !formData.direccionProyecto || !formData.distrito || 
        !formData.areaTerreno || !formData.areaConstruccion || !formData.numeroNiveles) {
      toast.error('Complete todos los datos del proyecto (todos son obligatorios)');
      return;
    }

    // Validar área de construcción máxima para Modalidad A
    if (parseFloat(formData.areaConstruccion) > 120) {
      toast.error('El área de construcción no puede superar los 120 m² (Modalidad A)');
      return;
    }

    // Validar tipo de obra
    if (!formData.tipoObra) {
      toast.error('Debe seleccionar el tipo de obra (Modalidad A)');
      return;
    }

    // Validar documentos obligatorios según el caso
    if (!documentos.formularioUnico || !documentos.certificadoLiteral || !documentos.declaracionJurada) {
      toast.error('Debe adjuntar: FUE, Certificado Literal y Declaración Jurada (obligatorios)');
      return;
    }

    // Validar planos técnicos obligatorios
    if (!documentos.planoUbicacion || !documentos.planosArquitectura || !documentos.planosEspecialidades || !documentos.planoSenalizacion) {
      toast.error('Debe adjuntar todos los planos técnicos (obligatorios)');
      return;
    }

    // Validar documento de derecho a edificar si NO es propietario
    if (formData.esPropietario === 'NO' && !documentos.documentoDerecho) {
      toast.error('Si no es propietario, debe adjuntar documento que acredite derecho a edificar');
      return;
    }

    // Validar vigencia de poder si es persona jurídica
    if (formData.esPersonaJuridica === 'SI' && !documentos.vigenciaPoder) {
      toast.error('Si es persona jurídica, debe adjuntar vigencia de poder');
      return;
    }

    // Validar licencia anterior para remodelaciones/ampliaciones
    if ((formData.tipoObra === 'AMPLIACION' || formData.tipoObra === 'REMODELACION') && !documentos.licenciaAnterior) {
      toast.error('Para ampliaciones/remodelaciones debe adjuntar copia de licencia anterior');
      return;
    }

    // Validar carta de seguridad para demoliciones
    if (formData.tipoObra === 'DEMOLICION' && !documentos.cartaSeguridad) {
      toast.error('Para demoliciones debe adjuntar Carta de Seguridad de Obra (XV)');
      return;
    }

    setCargando(true);

    try {
      // Crear FormData para enviar archivos
      const formDataToSend = new FormData();
      
      // Agregar datos del expediente
      const datos = {
        solicitante: {
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          dni: formData.dni,
          email: formData.email,
          telefono: formData.telefono,
          direccion: formData.direccion
        },
        proyecto: {
          nombreProyecto: formData.nombreProyecto,
          direccionProyecto: formData.direccionProyecto,
          distrito: formData.distrito,
          areaTerreno: parseFloat(formData.areaTerreno) || 0,
          areaConstruccion: parseFloat(formData.areaConstruccion) || 0,
          numeroNiveles: parseInt(formData.numeroNiveles) || 1,
          usoProyecto: formData.usoProyecto,
          tipoObra: formData.tipoObra,
          esPropietario: formData.esPropietario,
          esPersonaJuridica: formData.esPersonaJuridica
        }
      };

      formDataToSend.append('datos', JSON.stringify(datos));

      // Agregar archivos si existen
      Object.keys(documentos).forEach(key => {
        if (documentos[key]) {
          formDataToSend.append(key, documentos[key]);
        }
      });

      const response = await api.post('/expedientes', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Expediente creado exitosamente');
      navigate(`/expediente/${response.data.expediente._id}`);
    } catch (error) {
      console.error('Error al crear expediente:', error);
      toast.error(error.response?.data?.error || 'Error al crear expediente');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container">
      <h1>Nueva Solicitud de Licencia</h1>
      <p>Complete el formulario para registrar su solicitud de licencia de construcción Modalidad A</p>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Datos del Solicitante</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Nombres *</label>
                <input
                  type="text"
                  name="nombres"
                  className="form-control"
                  value={formData.nombres}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Apellidos *</label>
                <input
                  type="text"
                  name="apellidos"
                  className="form-control"
                  value={formData.apellidos}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">DNI *</label>
                <input
                  type="text"
                  name="dni"
                  className="form-control"
                  maxLength="8"
                  value={formData.dni}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono *</label>
                <input
                  type="tel"
                  name="telefono"
                  className="form-control"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Dirección</label>
                <input
                  type="text"
                  name="direccion"
                  className="form-control"
                  value={formData.direccion}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title"><FaBuilding /> Datos del Proyecto</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Nombre del Proyecto *</label>
                <input
                  type="text"
                  name="nombreProyecto"
                  className="form-control"
                  value={formData.nombreProyecto}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Distrito *</label>
                <input
                  type="text"
                  name="distrito"
                  className="form-control"
                  value={formData.distrito}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label"><FaMapMarkerAlt /> Dirección del Proyecto *</label>
              <input
                type="text"
                name="direccionProyecto"
                className="form-control"
                value={formData.direccionProyecto}
                onChange={handleChange}
                required
              />
            </div>

            {/* Tipo de Obra - Modalidad A */}
            <div className="form-group">
              <label className="form-label">Tipo de Obra - Modalidad A *</label>
              <select
                name="tipoObra"
                className="form-control"
                value={formData.tipoObra}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione el tipo de obra...</option>
                <option value="CONSTRUCCION_NUEVA">Construcción nueva de vivienda unifamiliar (hasta 120 m²)</option>
                <option value="AMPLIACION">Ampliación de vivienda con licencia (hasta 200 m²)</option>
                <option value="OBRA_MENOR">Ampliación/remodelación obra menor (menos de 30 m²)</option>
                <option value="REMODELACION">Remodelación sin modificación estructural</option>
                <option value="CERCO">Cerco perimétrico (20 metros lineales o más)</option>
                <option value="DEMOLICION">Demolición total (menos de 3 pisos, sin sótanos)</option>
                <option value="MILITAR_POLICIAL">Obra militar, policial o penitenciaria</option>
              </select>
              <small className="form-text">Seleccione según Modalidad A - Municipalidad de Lurigancho</small>
            </div>

            <div className="grid grid-3">
              <div className="form-group">
                <label className="form-label"><FaRuler /> Área de Terreno (m²) *</label>
                <input
                  type="number"
                  name="areaTerreno"
                  className="form-control"
                  value={formData.areaTerreno}
                  onChange={handleChange}
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label"><FaRuler /> Área de Construcción (m²) *</label>
                <input
                  type="number"
                  name="areaConstruccion"
                  className="form-control"
                  value={formData.areaConstruccion}
                  onChange={handleChange}
                  step="0.01"
                  max="120"
                  required
                />
                <small className="form-text" style={{color: '#D91E18'}}>
                  Máximo 120 m² según Modalidad A
                </small>
              </div>
              <div className="form-group">
                <label className="form-label">Número de Niveles *</label>
                <input
                  type="number"
                  name="numeroNiveles"
                  className="form-control"
                  value={formData.numeroNiveles}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">¿Es propietario del predio? *</label>
                <select
                  name="esPropietario"
                  className="form-control"
                  value={formData.esPropietario}
                  onChange={handleChange}
                  required
                >
                  <option value="SI">Sí, soy propietario</option>
                  <option value="NO">No, tengo derecho a edificar</option>
                </select>
                {formData.esPropietario === 'NO' && (
                  <small className="form-text" style={{color: '#ff9800'}}>
                    ⚠️ Deberá adjuntar documento que acredite derecho a edificar
                  </small>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">¿Es persona jurídica? *</label>
                <select
                  name="esPersonaJuridica"
                  className="form-control"
                  value={formData.esPersonaJuridica}
                  onChange={handleChange}
                  required
                >
                  <option value="NO">No, persona natural</option>
                  <option value="SI">Sí, persona jurídica</option>
                </select>
                {formData.esPersonaJuridica === 'SI' && (
                  <small className="form-text" style={{color: '#ff9800'}}>
                    ⚠️ Deberá adjuntar vigencia de poder con datos de partida registral
                  </small>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Uso del Proyecto</label>
              <select
                name="usoProyecto"
                className="form-control"
                value={formData.usoProyecto}
                onChange={handleChange}
              >
                <option value="">Seleccione...</option>
                <option value="VIVIENDA">Vivienda</option>
                <option value="COMERCIO">Comercio</option>
                <option value="OFICINAS">Oficinas</option>
                <option value="INDUSTRIAL">Industrial</option>
                <option value="MIXTO">Mixto</option>
              </select>
            </div>
          </div>
        </div>

        {/* Documentos Administrativos */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title"><FaFilePdf /> Documentos Administrativos</h2>
            <p style={{fontSize: '14px', color: '#666', marginTop: '8px'}}>
              Documentos requeridos según Modalidad A - Municipalidad de Lurigancho
            </p>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">
                <span style={{color: 'red'}}>* </span>
                Formulario Único de Edificación (FUE) completo {documentos.formularioUnico && <FaCheckCircle style={{color: 'green'}} />}
              </label>
              <div style={{marginBottom: '8px', padding: '8px', backgroundColor: '#e3f2fd', borderRadius: '4px'}}>
                <a 
                  href="https://www.gob.pe/institucion/vivienda/informes-publicaciones/2067653-formulario-unico-de-edificacion-fue" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{color: '#1976d2', textDecoration: 'none', fontSize: '14px'}}
                >
                  📥 Descargar formato FUE desde gob.pe →
                </a>
              </div>
              <input
                type="file"
                name="formularioUnico"
                className="form-control"
                accept=".pdf"
                onChange={handleFileChange}
              />
              {documentos.formularioUnico && (
                <small className="form-text" style={{color: 'green'}}>
                  ✓ {documentos.formularioUnico.name}
                </small>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <span style={{color: 'red'}}>* </span>
                Certificado literal actualizado (máx. 30 días) {documentos.certificadoLiteral && <FaCheckCircle style={{color: 'green'}} />}
              </label>
              <div style={{marginBottom: '8px', padding: '8px', backgroundColor: '#e3f2fd', borderRadius: '4px'}}>
                <a 
                  href="https://www.gob.pe/360-solicitar-certificado-literal-de-partida-a-sunarp" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{color: '#1976d2', textDecoration: 'none', fontSize: '14px'}}
                >
                  📥 Solicitar certificado literal en SUNARP →
                </a>
              </div>
              <input
                type="file"
                name="certificadoLiteral"
                className="form-control"
                accept=".pdf"
                onChange={handleFileChange}
              />
              <small className="form-text">
                Antigüedad máxima de 30 días calendario
              </small>
              {documentos.certificadoLiteral && (
                <small className="form-text" style={{color: 'green'}}>
                  ✓ {documentos.certificadoLiteral.name}
                </small>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <span style={{color: 'red'}}>* </span>
                Declaración jurada de profesionales habilitados {documentos.declaracionJurada && <FaCheckCircle style={{color: 'green'}} />}
              </label>
              <input
                type="file"
                name="declaracionJurada"
                className="form-control"
                accept=".pdf"
                onChange={handleFileChange}
              />
              {documentos.declaracionJurada && (
                <small className="form-text" style={{color: 'green'}}>
                  ✓ {documentos.declaracionJurada.name}
                </small>
              )}
            </div>

            {/* Documento derecho a edificar - Solo si NO es propietario */}
            {formData.esPropietario === 'NO' && (
              <div className="form-group" style={{backgroundColor: '#fff3e0', padding: '16px', borderRadius: '8px', border: '1px solid #ff9800'}}>
                <label className="form-label">
                  <span style={{color: 'red'}}>* </span>
                  Documento que acredita derecho a edificar (OBLIGATORIO) {documentos.documentoDerecho && <FaCheckCircle style={{color: 'green'}} />}
                </label>
                <input
                  type="file"
                  name="documentoDerecho"
                  className="form-control"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
                <small className="form-text">
                  Escritura pública o certificado de vigencia de poder (máx. 30 días)
                </small>
                {documentos.documentoDerecho && (
                  <small className="form-text" style={{color: 'green'}}>
                    ✓ {documentos.documentoDerecho.name}
                  </small>
                )}
              </div>
            )}

            {/* Vigencia de poder - Solo si es persona jurídica */}
            {formData.esPersonaJuridica === 'SI' && (
              <div className="form-group" style={{backgroundColor: '#fff3e0', padding: '16px', borderRadius: '8px', border: '1px solid #ff9800'}}>
                <label className="form-label">
                  <span style={{color: 'red'}}>* </span>
                  Vigencia de poder - Persona jurídica (OBLIGATORIO) {documentos.vigenciaPoder && <FaCheckCircle style={{color: 'green'}} />}
                </label>
                <input
                  type="file"
                  name="vigenciaPoder"
                  className="form-control"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
                <small className="form-text">
                  Con datos de partida registral y asiento inscrito (máx. 30 días)
                </small>
                {documentos.vigenciaPoder && (
                  <small className="form-text" style={{color: 'green'}}>
                    ✓ {documentos.vigenciaPoder.name}
                  </small>
                )}
              </div>
            )}

            {/* Licencia anterior - Solo para remodelaciones y ampliaciones */}
            {(formData.tipoObra === 'AMPLIACION' || formData.tipoObra === 'REMODELACION' || formData.tipoObra === 'OBRA_MENOR') && (
              <div className="form-group" style={{backgroundColor: '#fff3e0', padding: '16px', borderRadius: '8px', border: '1px solid #ff9800'}}>
                <label className="form-label">
                  <span style={{color: 'red'}}>* </span>
                  Licencia de edificación o conformidad anterior (OBLIGATORIO) {documentos.licenciaAnterior && <FaCheckCircle style={{color: 'green'}} />}
                </label>
                <input
                  type="file"
                  name="licenciaAnterior"
                  className="form-control"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
                <small className="form-text">
                  Copia de la licencia de edificación o conformidad de obra original
                </small>
                {documentos.licenciaAnterior && (
                  <small className="form-text" style={{color: 'green'}}>
                    ✓ {documentos.licenciaAnterior.name}
                  </small>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Documentación Técnica */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title"><FaUpload /> Documentación Técnica (Todos Obligatorios)</h2>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">
                <span style={{color: 'red'}}>* </span>
                Plano de ubicación y localización {documentos.planoUbicacion && <FaCheckCircle style={{color: 'green'}} />}
              </label>
              <input
                type="file"
                name="planoUbicacion"
                className="form-control"
                accept=".pdf"
                onChange={handleFileChange}
              />
              <small className="form-text">
                Con información del certificado de parámetros urbanos
              </small>
              {documentos.planoUbicacion && (
                <small className="form-text" style={{color: 'green'}}>
                  ✓ {documentos.planoUbicacion.name}
                </small>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <span style={{color: 'red'}}>* </span>
                Planos de arquitectura (planta, cortes y elevaciones) {documentos.planosArquitectura && <FaCheckCircle style={{color: 'green'}} />}
              </label>
              <input
                type="file"
                name="planosArquitectura"
                className="form-control"
                accept=".pdf"
                onChange={handleFileChange}
              />
              <small className="form-text">
                Incluir memorias descriptivas
              </small>
              {documentos.planosArquitectura && (
                <small className="form-text" style={{color: 'green'}}>
                  ✓ {documentos.planosArquitectura.name}
                </small>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <span style={{color: 'red'}}>* </span>
                Planos de especialidades (estructuras, sanitarias, eléctricas) {documentos.planosEspecialidades && <FaCheckCircle style={{color: 'green'}} />}
              </label>
              <input
                type="file"
                name="planosEspecialidades"
                className="form-control"
                accept=".pdf"
                onChange={handleFileChange}
              />
              <small className="form-text">
                Incluir memorias descriptivas de estructuras, instalaciones sanitarias e instalaciones eléctricas
              </small>
              {documentos.planosEspecialidades && (
                <small className="form-text" style={{color: 'green'}}>
                  ✓ {documentos.planosEspecialidades.name}
                </small>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <span style={{color: 'red'}}>* </span>
                Plano de señalización y evacuación {documentos.planoSenalizacion && <FaCheckCircle style={{color: 'green'}} />}
              </label>
              <input
                type="file"
                name="planoSenalizacion"
                className="form-control"
                accept=".pdf"
                onChange={handleFileChange}
              />
              {documentos.planoSenalizacion && (
                <small className="form-text" style={{color: 'green'}}>
                  ✓ {documentos.planoSenalizacion.name}
                </small>
              )}
            </div>

            {/* Carta de seguridad - Solo para demoliciones */}
            {formData.tipoObra === 'DEMOLICION' && (
              <div className="form-group" style={{backgroundColor: '#fff3e0', padding: '16px', borderRadius: '8px', border: '1px solid #ff9800'}}>
                <label className="form-label">
                  <span style={{color: 'red'}}>* </span>
                  Carta de seguridad de obra - XV (OBLIGATORIO para demoliciones) {documentos.cartaSeguridad && <FaCheckCircle style={{color: 'green'}} />}
                </label>
                <input
                  type="file"
                  name="cartaSeguridad"
                  className="form-control"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
                <small className="form-text">
                  XV - Obligatorio para demoliciones totales de edificaciones
                </small>
                {documentos.cartaSeguridad && (
                  <small className="form-text" style={{color: 'green'}}>
                    ✓ {documentos.cartaSeguridad.name}
                  </small>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Resumen de documentos requeridos */}
        {formData.tipoObra && (
          <div className="card" style={{backgroundColor: '#e3f2fd', border: '2px solid #2196f3'}}>
            <div className="card-header" style={{backgroundColor: '#2196f3', color: 'white'}}>
              <h3 style={{margin: 0, fontSize: '16px'}}>📋 Resumen de Documentos Obligatorios</h3>
            </div>
            <div className="card-body">
              <p style={{fontWeight: 'bold', marginBottom: '12px'}}>Según su configuración, debe adjuntar:</p>
              <ul style={{lineHeight: '1.8', marginLeft: '20px'}}>
                <li>✓ Formulario Único de Edificación (FUE)</li>
                <li>✓ Certificado literal (máx. 30 días)</li>
                <li>✓ Declaración jurada de profesionales</li>
                {formData.esPropietario === 'NO' && (
                  <li style={{color: '#ff9800', fontWeight: 'bold'}}>✓ Documento que acredita derecho a edificar</li>
                )}
                {formData.esPersonaJuridica === 'SI' && (
                  <li style={{color: '#ff9800', fontWeight: 'bold'}}>✓ Vigencia de poder (persona jurídica)</li>
                )}
                {(formData.tipoObra === 'AMPLIACION' || formData.tipoObra === 'REMODELACION' || formData.tipoObra === 'OBRA_MENOR') && (
                  <li style={{color: '#ff9800', fontWeight: 'bold'}}>✓ Licencia de edificación anterior</li>
                )}
                <li>✓ Plano de ubicación y localización</li>
                <li>✓ Planos de arquitectura con memorias</li>
                <li>✓ Planos de especialidades con memorias</li>
                <li>✓ Plano de señalización y evacuación</li>
                {formData.tipoObra === 'DEMOLICION' && (
                  <li style={{color: '#ff9800', fontWeight: 'bold'}}>✓ Carta de seguridad de obra (XV)</li>
                )}
              </ul>
              <p style={{marginTop: '12px', fontSize: '14px', color: '#666'}}>
                <strong>Nota:</strong> La licencia tendrá vigencia de 36 meses con prórroga única de 12 meses.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <button type="submit" className="btn btn-primary" disabled={cargando}>
            {cargando ? (
              <>
                <FaSpinner className="spinner-icon" />
                Creando Expediente...
              </>
            ) : (
              'Crear Expediente de Licencia'
            )}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/')}
            disabled={cargando}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default NuevoExpediente;
