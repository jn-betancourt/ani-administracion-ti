import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { ClienteLAN } from '../types';
import { 
  Monitor, 
  Plus, 
  Trash2, 
  Network, 
  CheckCircle2, 
  Cpu, 
  HardDrive, 
  FolderSync, 
  Printer
} from 'lucide-react';

export const ClientesLANView: React.FC = () => {
  const [clientes, setClientes] = useState<ClienteLAN[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Form states
  const [nombre, setNombre] = useState('');
  const [departamentoOcupante, setDepartamentoOcupante] = useState('');
  const [tipoSO, setTipoSO] = useState<ClienteLAN['tipoSO']>('LINUX');
  const [servicioUtilizado, setServicioUtilizado] = useState<ClienteLAN['servicioUtilizado']>('NFS');
  const [ipPlaceholder, setIpPlaceholder] = useState('10.88.199.PLACEHOLDER_IP');

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      const data = await ApiService.getClientesLAN();
      setClientes(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.createClienteLAN({
        nombre,
        departamentoOcupante,
        tipoSO,
        servicioUtilizado,
        ipPlaceholder
      });
      setMsg(`Cliente [${nombre}] registrado.`);
      setShowModal(false);
      resetForm();
      loadClientes();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error al registrar cliente');
    }
  };

  const handleDelete = async (id: string, nom: string) => {
    if (!confirm(`¿Eliminar cliente [${nom}] de la lista LAN?`)) return;
    try {
      await ApiService.deleteClienteLAN(id);
      setMsg('Cliente eliminado.');
      loadClientes();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    }
  };

  const resetForm = () => {
    setNombre('');
    setDepartamentoOcupante('');
    setIpPlaceholder('10.88.199.PLACEHOLDER_IP');
  };

  return (
    <div className="view-content">
      <div className="view-header">
        <div>
          <h2>Gestión de Clientes de Red LAN (Clientes NFS, Samba y NIS)</h2>
          <p>Supervisión de terminales y puestos de trabajo de la ANI conectados al Servidor Linux local.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          <span>Registrar Estación / Cliente</span>
        </button>
      </div>

      {/* Alerta de Placeholders */}
      <div className="callout-card">
        <div className="callout-icon">
          <Network size={24} />
        </div>
        <div>
          <h4>Estaciones de Trabajo y Direccionamiento Virtual Multipass</h4>
          <p>
            Representa las estaciones de trabajo de los funcionarios de la ANI que consumen almacenamiento <strong>NFS</strong> (Linux), compartición <strong>Samba</strong> (Windows/Mac) e impresión <strong>CUPS</strong>. Las direcciones IPv4 se presentan en formato placeholder para la asignación manual en tus instancias de Multipass.
          </p>
        </div>
      </div>

      {msg && (
        <div className="alert-success">
          <CheckCircle2 size={18} />
          <span>{msg}</span>
        </div>
      )}

      <div className="dashboard-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Estación / Nombre</th>
                <th>Dependencia Asignada</th>
                <th>Sistema Operativo</th>
                <th>Servicio Enlazado</th>
                <th>IP Asignada (Placeholder)</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Monitor size={18} className="text-muted" />
                      <strong>{c.nombre}</strong>
                    </div>
                  </td>
                  <td>{c.departamentoOcupante}</td>
                  <td>
                    <span className="spec-val">{c.tipoSO}</span>
                  </td>
                  <td>
                    <span className="code-pill">
                      {c.servicioUtilizado === 'NFS' && 'NFS (Linux)'}
                      {c.servicioUtilizado === 'SAMBA' && 'Samba (Win/Mac)'}
                      {c.servicioUtilizado === 'NIS' && 'NIS (Auth)'}
                      {c.servicioUtilizado === 'CUPS' && 'CUPS (Print)'}
                    </span>
                  </td>
                  <td>
                    <code className="ip-badge">{c.ipPlaceholder}</code>
                  </td>
                  <td>
                    <span className="status-badge-multipass">{c.estado}</span>
                  </td>
                  <td>
                    <button 
                      className="btn-icon text-red"
                      onClick={() => handleDelete(c.id, c.nombre)}
                      title="Eliminar cliente"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Creación de Cliente */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Registrar Nueva Estación de Trabajo LAN</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Nombre del Equipo / Estación *</label>
                <input 
                  type="text"
                  className="form-control"
                  placeholder="Ej: Puesto Técnico Férreo 2"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Dependencia Ocupante *</label>
                <input 
                  type="text"
                  className="form-control"
                  placeholder="Ej: Gerencia Férrea y Proyectos Especiales"
                  value={departamentoOcupante}
                  onChange={(e) => setDepartamentoOcupante(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Sistema Operativo *</label>
                  <select 
                    className="form-control"
                    value={tipoSO}
                    onChange={(e) => setTipoSO(e.target.value as any)}
                  >
                    <option value="LINUX">Ubuntu / Debian Linux</option>
                    <option value="WINDOWS">Microsoft Windows 10/11</option>
                    <option value="MACOS">Apple macOS</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Servicio Linux Principal *</label>
                  <select 
                    className="form-control"
                    value={servicioUtilizado}
                    onChange={(e) => setServicioUtilizado(e.target.value as any)}
                  >
                    <option value="NFS">NFS (Almacenamiento Red)</option>
                    <option value="SAMBA">Samba (Carpetas Compartidas)</option>
                    <option value="NIS">NIS (Autenticación Central)</option>
                    <option value="CUPS">CUPS (Cola de Impresión)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Dirección IP (Formato Placeholder) *</label>
                <input 
                  type="text"
                  className="form-control"
                  value={ipPlaceholder}
                  onChange={(e) => setIpPlaceholder(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                >
                  Guardar Estación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
