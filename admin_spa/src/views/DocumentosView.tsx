import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { Documento } from '../types';
import { 
  FolderArchive, 
  Upload, 
  Trash2, 
  Download, 
  FileText, 
  Lock, 
  Globe, 
  Check, 
  Plus
} from 'lucide-react';

export const DocumentosView: React.FC = () => {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Form states
  const [titulo, setTitulo] = useState('');
  const [proyectoId, setProyectoId] = useState('prj-001-bog-girardot');
  const [tipoDocumental, setTipoDocumental] = useState('RESOLUCION');
  const [codigoDocumento, setCodigoDocumento] = useState('');
  const [esPublico, setEsPublico] = useState(true);
  const [resumen, setResumen] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    try {
      const data = await ApiService.getDocumentos();
      setDocumentos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, tituloDoc: string) => {
    if (!confirm(`¿Está seguro de eliminar el documento [${tituloDoc}] del almacenamiento NFS?`)) return;
    try {
      await ApiService.deleteDocumento(id);
      setMsg(`Documento eliminado exitosamente.`);
      loadDocs();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Debe seleccionar un archivo PDF.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('proyectoId', proyectoId);
    formData.append('titulo', titulo);
    formData.append('tipoDocumental', tipoDocumental);
    formData.append('codigoDocumento', codigoDocumento);
    formData.append('esPublico', String(esPublico));
    formData.append('resumen', resumen);

    try {
      await ApiService.uploadDocumento(formData);
      setMsg('Documento cargado exitosamente en el volumen NFS de la ANI.');
      setShowUploadModal(false);
      resetForm();
      loadDocs();
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error en carga');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitulo('');
    setCodigoDocumento('');
    setResumen('');
    setFile(null);
  };

  return (
    <div className="view-content">
      <div className="view-header">
        <div>
          <h2>Gestión Documental (OneDrive Simulado / NFS)</h2>
          <p>Repositorio centralizado de pliegos, minutas y resoluciones oficiales almacenados en <code>/var/ani/documentos</code>.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
          <Plus size={18} />
          <span>Subir Documento</span>
        </button>
      </div>

      {msg && (
        <div className="alert-success">
          <Check size={18} />
          <span>{msg}</span>
        </div>
      )}

      {/* Tabla de Documentos */}
      <div className="dashboard-card">
        <div className="card-header-flex">
          <h3>Expedientes Indexados en Almacenamiento ({documentos.length})</h3>
          <span className="badge-count">Sincronizado con NFS</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Código / Título</th>
                <th>Proyecto</th>
                <th>Tipo</th>
                <th>Visibilidad</th>
                <th>Peso</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={18} className="text-muted" />
                      <div>
                        <strong>{d.titulo}</strong>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>{d.codigoDocumento}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="code-tag">{d.proyectoId}</span></td>
                  <td><span className="spec-val">{d.tipoDocumental}</span></td>
                  <td>
                    {d.esPublico ? (
                      <span className="badge-public">
                        <Globe size={12} /> Público (API)
                      </span>
                    ) : (
                      <span className="badge-private">
                        <Lock size={12} /> Reservado (Intranet)
                      </span>
                    )}
                  </td>
                  <td>{(d.pesoBytes / 1024 / 1024).toFixed(2)} MB</td>
                  <td>{d.fechaPublicacion}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {d.enlaceDescarga && (
                        <a 
                          href={d.enlaceDescarga} 
                          target="_blank" 
                          rel="noreferrer"
                          className="btn-icon text-blue"
                          title="Descargar desde NFS"
                        >
                          <Download size={16} />
                        </a>
                      )}
                      <button 
                        className="btn-icon text-red"
                        onClick={() => handleDelete(d.id, d.titulo)}
                        title="Eliminar de NFS"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Carga de Documento */}
      {showUploadModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Subir Documento Oficial a Repositorio NFS</h3>
              <button className="close-btn" onClick={() => setShowUploadModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleUploadSubmit}>
              <div className="form-group">
                <label>Proyecto ANI *</label>
                <select 
                  className="form-control"
                  value={proyectoId}
                  onChange={(e) => setProyectoId(e.target.value)}
                  required
                >
                  <option value="prj-001-bog-girardot">Tercer Carril Bogotá - Girardot (4G)</option>
                  <option value="prj-002-mar-2">Autopista al Mar 2 (4G)</option>
                  <option value="prj-003-tren-dorada-chiriguana">Corredor Férreo La Dorada - Chiriguaná</option>
                  <option value="prj-004-puerto-antioquia">Puerto Antioquia (Portuario)</option>
                  <option value="prj-005-eldorado-fase-2">Ampliación Terminal El Dorado</option>
                </select>
              </div>

              <div className="form-group">
                <label>Título del Documento *</label>
                <input 
                  type="text"
                  className="form-control"
                  placeholder="Ej: Resolución de Aprobación de Plan de Obras"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Tipo Documental *</label>
                  <select 
                    className="form-control"
                    value={tipoDocumental}
                    onChange={(e) => setTipoDocumental(e.target.value)}
                  >
                    <option value="RESOLUCION">Resolución Oficial</option>
                    <option value="PLIEGO">Pliego de Condiciones</option>
                    <option value="CONTRATO">Contrato de Concesión</option>
                    <option value="INFORME_TECNICO">Informe Técnico</option>
                    <option value="ACTA_INICIO">Acta de Inicio</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Código Oficial</label>
                  <input 
                    type="text"
                    className="form-control"
                    placeholder="Ej: ANI-RES-2026-99"
                    value={codigoDocumento}
                    onChange={(e) => setCodigoDocumento(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Visibilidad de Acceso</label>
                <div style={{ display: 'flex', gap: '20px', marginTop: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="visibilidad" 
                      checked={esPublico === true}
                      onChange={() => setEsPublico(true)}
                    />
                    <span>Público (Accesible en el portal y API ciudadana)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="visibilidad" 
                      checked={esPublico === false}
                      onChange={() => setEsPublico(false)}
                    />
                    <span>Reservado (Exclusivo funcionarios / Intranet)</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Archivo PDF *</label>
                <input 
                  type="file"
                  accept=".pdf,application/pdf"
                  className="form-control"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Resumen / Objeto del Documento</label>
                <textarea 
                  className="form-control"
                  rows={2}
                  placeholder="Breve descripción del contenido para fines de auditoría..."
                  value={resumen}
                  onChange={(e) => setResumen(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={uploading}
                >
                  {uploading ? 'Cargando a NFS...' : 'Confirmar y Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
