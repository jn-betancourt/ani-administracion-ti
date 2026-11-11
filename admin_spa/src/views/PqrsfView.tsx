import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { PQRSF } from '../types';
import { 
  Inbox, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  User, 
  Mail, 
  Phone,
  FileCheck
} from 'lucide-react';

export const PqrsfView: React.FC = () => {
  const [items, setItems] = useState<PQRSF[]>([]);
  const [filterEstado, setFilterEstado] = useState<string>('');
  const [selectedPqrsf, setSelectedPqrsf] = useState<PQRSF | null>(null);
  const [respuestaTexto, setRespuestaTexto] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    loadPqrsf();
  }, [filterEstado]);

  const loadPqrsf = async () => {
    try {
      const data = await ApiService.getPqrsf(filterEstado || undefined);
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResponder = (item: PQRSF) => {
    setSelectedPqrsf(item);
    setRespuestaTexto(item.respuestaOficial || '');
  };

  const handleResponderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPqrsf || !respuestaTexto.trim()) return;

    try {
      await ApiService.responderPqrsf(selectedPqrsf.radicado, respuestaTexto);
      setMsg(`Trámite ${selectedPqrsf.radicado} respondido oficialmente.`);
      setSelectedPqrsf(null);
      loadPqrsf();
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error al emitir respuesta');
    }
  };

  return (
    <div className="view-content">
      <div className="view-header">
        <div>
          <h2>Bandeja de Trámites Ciudadanos (PQRSF)</h2>
          <p>Supervisión, radicación y respuesta legal a solicitudes ciudadanas recibidas por la API pública.</p>
        </div>
      </div>

      {msg && (
        <div className="alert-success">
          <CheckCircle2 size={18} />
          <span>{msg}</span>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="controls-bar" style={{ marginBottom: '20px' }}>
        <div className="filter-group">
          <button 
            className={`btn-filter ${filterEstado === '' ? 'active' : ''}`}
            onClick={() => setFilterEstado('')}
          >
            Todos ({items.length})
          </button>
          <button 
            className={`btn-filter ${filterEstado === 'RADICADO' ? 'active' : ''}`}
            onClick={() => setFilterEstado('RADICADO')}
          >
            Pendientes
          </button>
          <button 
            className={`btn-filter ${filterEstado === 'RESPONDIDO' ? 'active' : ''}`}
            onClick={() => setFilterEstado('RESPONDIDO')}
          >
            Respondidos
          </button>
        </div>
      </div>

      {/* Tabla de PQRSF */}
      <div className="dashboard-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Radicado Oficial</th>
                <th>Solicitante</th>
                <th>Tipo / Asunto</th>
                <th>Dependencia</th>
                <th>Vencimiento Legal</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.radicado}>
                  <td>
                    <strong className="code-tag">{item.radicado}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {new Date(item.fechaRadicacion).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div><strong>{item.nombreSolicitante}</strong></div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{item.correoElectronico}</div>
                  </td>
                  <td>
                    <span className="spec-val">{item.tipo}</span>
                    <div style={{ fontSize: '0.82rem', color: '#334155', maxWidth: '280px' }}>{item.asunto}</div>
                  </td>
                  <td><small>{item.dependenciaAsignada}</small></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem' }}>
                      <Clock size={13} className="text-amber" />
                      <span>{new Date(item.fechaLimiteRespuesta).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td>
                    <span className={item.estado === 'RESPONDIDO' ? 'badge-public' : 'badge-notice'}>
                      {item.estado}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-small-primary"
                      onClick={() => handleOpenResponder(item)}
                    >
                      {item.estado === 'RESPONDIDO' ? 'Ver Respuesta' : 'Responder'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Responder */}
      {selectedPqrsf && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>Gestión de Solicitud: {selectedPqrsf.radicado}</h3>
              <button className="close-btn" onClick={() => setSelectedPqrsf(null)}>&times;</button>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                <div><strong>Peticionario:</strong> {selectedPqrsf.nombreSolicitante}</div>
                <div><strong>Identificación:</strong> {selectedPqrsf.tipoDocumento} {selectedPqrsf.numeroDocumento}</div>
                <div><strong>Correo:</strong> {selectedPqrsf.correoElectronico}</div>
                <div><strong>Teléfono:</strong> {selectedPqrsf.telefono || 'No reporta'}</div>
              </div>
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                <strong>Hechos y Solicitud:</strong>
                <p style={{ marginTop: '4px', fontSize: '0.88rem', color: '#334155' }}>
                  {selectedPqrsf.descripcion}
                </p>
              </div>
            </div>

            <form onSubmit={handleResponderSubmit}>
              <div className="form-group">
                <label>Respuesta Oficial de la Entidad (ANI) *</label>
                <textarea 
                  className="form-control"
                  rows={4}
                  placeholder="Redacte aquí la respuesta técnica o jurídica fundamentada..."
                  value={respuestaTexto}
                  onChange={(e) => setRespuestaTexto(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setSelectedPqrsf(null)}
                >
                  Cerrar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                >
                  <Send size={15} style={{ marginRight: '6px' }} />
                  <span>Emitir Respuesta Oficial</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
