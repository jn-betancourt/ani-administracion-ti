import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { ServicioLinuxConfig } from '../types';
import { 
  Server, 
  HardDrive, 
  Clock, 
  FolderSync, 
  Printer, 
  KeyRound, 
  Edit3, 
  Check, 
  AlertCircle,
  Network
} from 'lucide-react';

export const ServiciosLinuxView: React.FC = () => {
  const [servicios, setServicios] = useState<ServicioLinuxConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editIp, setEditIp] = useState<string>('');
  const [editPuerto, setEditPuerto] = useState<number>(0);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    loadServicios();
  }, []);

  const loadServicios = async () => {
    try {
      const data = await ApiService.getServiciosLinux();
      setServicios(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (id: string) => {
    switch (id) {
      case 'nfs': return HardDrive;
      case 'ntp': return Clock;
      case 'nis': return KeyRound;
      case 'samba': return FolderSync;
      case 'cups': return Printer;
      default: return Server;
    }
  };

  const startEdit = (s: ServicioLinuxConfig) => {
    setEditingId(s.id);
    setEditIp(s.ipPlaceholder);
    setEditPuerto(s.puerto);
  };

  const saveEdit = async (id: string) => {
    try {
      await ApiService.updateServicioLinux(id, {
        ipPlaceholder: editIp,
        puerto: editPuerto
      });
      setMsg(`Servicio ${id.toUpperCase()} actualizado con IP: ${editIp}`);
      setEditingId(null);
      loadServicios();
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar');
    }
  };

  return (
    <div className="view-content">
      <div className="view-header">
        <div>
          <h2>Consolidación de Servicios de Servidor Linux</h2>
          <p>Mapeo de puertos, protocolos, justificaciones institucionales e IPs placeholder para entorno Multipass.</p>
        </div>
      </div>

      {/* Alerta Institucional Multipass */}
      <div className="callout-card">
        <div className="callout-icon">
          <Network size={24} />
        </div>
        <div>
          <h4>Entorno de Consolidación Multipass (IPs en Formato Placeholder)</h4>
          <p>
            Conforme a los requerimientos de la administración del sistema, las direcciones de red y sockets hacia el <strong>Servidor Linux</strong> residen en formato <code>10.88.199.PLACEHOLDER_IP</code>. Una vez inicializada y aprovisionada tu máquina virtual en <strong>Canonical Multipass</strong>, puedes registrar aquí la IP real asignada (ej. <code>10.88.199.12</code> o <code>10.88.199.242</code>) sin alterar la arquitectura interna de la Backend API.
          </p>
        </div>
      </div>

      {msg && (
        <div className="alert-success">
          <Check size={18} />
          <span>{msg}</span>
        </div>
      )}

      {/* Lista de Servicios */}
      <div className="services-grid">
        {servicios.map((s) => {
          const Icon = getIcon(s.id);
          const isEditing = editingId === s.id;

          return (
            <div key={s.id} className="service-card">
              <div className="service-card-top">
                <div className="service-icon-wrapper">
                  <Icon size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="service-title-row">
                    <h3>{s.nombre}</h3>
                    <span className="status-badge-multipass">{s.estado}</span>
                  </div>
                  <span className="service-category">{s.tipoServicio}</span>
                </div>
              </div>

              {/* Justificación según ANI */}
              <div className="service-justification-box">
                <strong>Justificación Técnica para la ANI:</strong>
                <p>{s.justificacion}</p>
              </div>

              {/* Especificaciones de Red */}
              <div className="service-specs-grid">
                <div>
                  <span className="spec-label">Protocolo:</span>
                  <span className="spec-val">{s.protocolo}</span>
                </div>
                <div>
                  <span className="spec-label">Puerto:</span>
                  {isEditing ? (
                    <input 
                      type="number" 
                      className="input-inline"
                      value={editPuerto}
                      onChange={(e) => setEditPuerto(parseInt(e.target.value, 10))}
                    />
                  ) : (
                    <span className="spec-val">:{s.puerto}</span>
                  )}
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <span className="spec-label">IP de Enlace / Socket (Placeholder):</span>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <input 
                        type="text" 
                        className="input-inline"
                        value={editIp}
                        onChange={(e) => setEditIp(e.target.value)}
                        placeholder="Ej: 10.88.199.10"
                      />
                      <button className="btn-small-success" onClick={() => saveEdit(s.id)}>
                        Guardar
                      </button>
                      <button className="btn-small-cancel" onClick={() => setEditingId(null)}>
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <code className="ip-badge">{s.ipPlaceholder}</code>
                      <button className="btn-text-edit" onClick={() => startEdit(s)}>
                        <Edit3 size={14} />
                        <span>Editar IP</span>
                      </button>
                    </div>
                  )}
                </div>
                {s.rutaRecurso && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span className="spec-label">Recurso / Punto de Montaje:</span>
                    <span className="code-tag">{s.rutaRecurso}</span>
                  </div>
                )}
              </div>

              <div className="service-card-footer">
                <small className="text-muted">ℹ️ {s.detalles}</small>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
