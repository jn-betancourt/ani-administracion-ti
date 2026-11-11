import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { Usuario } from '../types';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  Mail, 
  CheckCircle2, 
  Briefcase
} from 'lucide-react';

export const UsuariosView: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<Usuario['rol']>('ADMIN_TI');
  const [cargo, setCargo] = useState('');

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      const data = await ApiService.getUsuarios();
      setUsuarios(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.createUsuario({
        email,
        nombreCompleto,
        password,
        rol,
        cargo
      });
      setMsg(`Usuario ${email} registrado exitosamente.`);
      setShowModal(false);
      resetForm();
      loadUsuarios();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error al crear usuario');
    }
  };

  const handleDelete = async (id: string, emailUser: string) => {
    if (!confirm(`¿Desea revocar el acceso y eliminar la cuenta [${emailUser}]?`)) return;
    try {
      await ApiService.deleteUsuario(id);
      setMsg(`Usuario eliminado.`);
      loadUsuarios();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    }
  };

  const resetForm = () => {
    setEmail('');
    setNombreCompleto('');
    setPassword('');
    setCargo('');
  };

  return (
    <div className="view-content">
      <div className="view-header">
        <div>
          <h2>Gestión de Usuarios & Control de Acceso (RBAC)</h2>
          <p>Administración de cuentas institucionales para funcionarios y operadores de TI de la ANI.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <UserPlus size={18} />
          <span>Nuevo Usuario</span>
        </button>
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
                <th>Funcionario / Email</th>
                <th>Cargo Institucional</th>
                <th>Rol Asignado</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.nombreCompleto}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.email}</div>
                  </td>
                  <td>{u.cargo}</td>
                  <td>
                    <span className="badge-public" style={{ fontWeight: 600 }}>
                      <ShieldCheck size={12} /> {u.rol}
                    </span>
                  </td>
                  <td>
                    <span className="status-pill-ok">Activo</span>
                  </td>
                  <td>
                    {u.email !== 'admin@ani.gov.co' ? (
                      <button 
                        className="btn-icon text-red"
                        onClick={() => handleDelete(u.id, u.email)}
                        title="Eliminar usuario"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <small className="text-muted">Protegido</small>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Creación de Usuario */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Registrar Funcionario en el Sistema</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label>Nombre Completo *</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Ing. Laura Gómez"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Correo Electrónico Institucional *</label>
                <input 
                  type="email" 
                  className="form-control"
                  placeholder="usuario@ani.gov.co"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Contraseña Temporal *</label>
                  <input 
                    type="password" 
                    className="form-control"
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Rol en el Sistema *</label>
                  <select 
                    className="form-control"
                    value={rol}
                    onChange={(e) => setRol(e.target.value as any)}
                  >
                    <option value="ADMIN_TI">Administrador TI (Acceso Total)</option>
                    <option value="GESTOR_DOCUMENTAL">Gestor Documental (NFS)</option>
                    <option value="ATENCION_CIUDADANO">Atención Ciudadana (PQRSF)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Cargo / Dependencia</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej: Especialista de Redes y Sistemas"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
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
                  Registrar Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
