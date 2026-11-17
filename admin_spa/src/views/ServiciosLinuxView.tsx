import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { ServicioLinuxConfig, NtpOfficialTimeData, MountedStorageData } from '../types';
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
  Network,
  Activity,
  RefreshCw,
  FolderOpen,
  FileCheck
} from 'lucide-react';

export const ServiciosLinuxView: React.FC = () => {
  const [servicios, setServicios] = useState<ServicioLinuxConfig[]>([]);
  const [liveProbes, setLiveProbes] = useState<Record<string, any>>({});
  const [ntpTime, setNtpTime] = useState<NtpOfficialTimeData | null>(null);
  const [mountedStorage, setMountedStorage] = useState<MountedStorageData | null>(null);
  const [probingService, setProbingService] = useState<string | null>(null);
  const [scanningAll, setScanningAll] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editIp, setEditIp] = useState<string>('');
  const [editPuerto, setEditPuerto] = useState<number>(0);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
    const timer = setInterval(fetchNtpTime, 15000);
    return () => clearInterval(timer);
  }, []);

  const loadAll = async () => {
    await Promise.allSettled([
      loadServicios(),
      fetchNtpTime(),
      loadMountedStorage(),
      runFullScan()
    ]);
  };

  const loadServicios = async () => {
    try {
      const data = await ApiService.getServiciosLinux();
      setServicios(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNtpTime = async () => {
    try {
      const data = await ApiService.getHoraOficialNtp();
      setNtpTime(data);
    } catch (e) {
      console.error('NTP sync error:', e);
    }
  };

  const loadMountedStorage = async () => {
    try {
      const data = await ApiService.getArchivosMontados();
      setMountedStorage(data);
    } catch (e) {
      console.error('Storage check error:', e);
    }
  };

  const runFullScan = async () => {
    setScanningAll(true);
    try {
      const liveList = await ApiService.getServiciosLinuxEnVivo();
      const map: Record<string, any> = {};
      liveList.forEach(item => {
        let key = 'cups';
        if (item.servicio.includes('NTP')) key = 'ntp';
        else if (item.servicio.includes('NFS')) key = 'nfs';
        else if (item.servicio.includes('NIS')) key = 'nis';
        else if (item.servicio.includes('Samba')) key = 'samba';
        map[key] = item;
      });
      setLiveProbes(map);
    } catch (e) {
      console.error(e);
    } finally {
      setScanningAll(false);
    }
  };

  const handleTestService = async (serviceId: string) => {
    setProbingService(serviceId);
    try {
      const res = await ApiService.probarServicioLinux(serviceId);
      setLiveProbes(prev => ({
        ...prev,
        [serviceId]: {
          estado: 'ACTIVO',
          latenciaMs: res.retardoRttMs || res.latenciaMs || 2,
          detalles: res.detalles || 'Conexión verificada con éxito',
          datosAdicionales: res
        }
      }));
      setMsg(`Prueba de protocolo completada para ${serviceId.toUpperCase()}`);
      setTimeout(() => setMsg(null), 3500);
      if (serviceId === 'ntp') fetchNtpTime();
      if (serviceId === 'nfs' || serviceId === 'samba') loadMountedStorage();
    } catch (err: any) {
      setLiveProbes(prev => ({
        ...prev,
        [serviceId]: {
          estado: 'INACTIVO',
          latenciaMs: 0,
          detalles: err.message || 'No fue posible conectar'
        }
      }));
    } finally {
      setProbingService(null);
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
      setMsg(`Servicio ${id.toUpperCase()} actualizado.`);
      setEditingId(null);
      loadServicios();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar');
    }
  };

  return (
    <div className="view-content">
      <div className="view-header">
        <div>
          <h2>Consolidación de Servicios en Servidor Linux (10.88.199.195)</h2>
          <p>Conexión por protocolos nativos (NTP UDP, NFS RPC, NIS Portmap, Samba CIFS, CUPS IPP) hacia la máquina <strong>sv-ani</strong>.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={loadMountedStorage} title="Verificar puntos de montura">
            <FolderOpen size={16} />
            <span>Verificar Monturas</span>
          </button>
          <button className="btn-primary" onClick={runFullScan} disabled={scanningAll}>
            <RefreshCw size={16} className={scanningAll ? 'spin-icon' : ''} />
            <span>{scanningAll ? 'Escaneando...' : 'Escanear Protocolos'}</span>
          </button>
        </div>
      </div>

      {/* Widget de Hora Oficial NTP */}
      <div className="callout-card" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', borderLeftColor: '#16a34a' }}>
        <div className="callout-icon" style={{ color: '#16a34a' }}>
          <Clock size={28} />
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h4 style={{ color: '#14532d' }}>Hora Oficial Legal de la Entidad (Sincronizada con NTP 10.88.199.195)</h4>
            <p style={{ color: '#166534', margin: '2px 0 0 0' }}>
              Sellado de tiempo RFC 5905 mediante socket UDP 123 hacia daemon <code>ntpsec</code>.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0c3c60', fontFamily: 'monospace' }}>
              {ntpTime ? new Date(ntpTime.horaOficialServidor).toLocaleTimeString() : 'Sincronizando...'}
            </div>
            <small style={{ color: '#15803d' }}>
              {ntpTime ? `Estrato: ${ntpTime.estrato} | RTT: ${ntpTime.retardoRttMs}ms | Offset: ${ntpTime.desviacionOffsetMs}ms` : 'Conectando con UDP 123...'}
            </small>
          </div>
        </div>
      </div>

      {msg && (
        <div className="alert-success">
          <Check size={18} />
          <span>{msg}</span>
        </div>
      )}

      {/* Grid de Servicios */}
      <div className="services-grid">
        {servicios.map((s) => {
          const Icon = getIcon(s.id);
          const isEditing = editingId === s.id;
          const live = liveProbes[s.id];
          const isProbing = probingService === s.id;

          const isActive = live?.estado === 'ACTIVO';
          const isDegraded = live?.estado === 'DEGRADADO';

          return (
            <div key={s.id} className="service-card">
              <div className="service-card-top">
                <div className="service-icon-wrapper">
                  <Icon size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="service-title-row">
                    <h3>{s.nombre}</h3>
                    <span className={isActive ? 'status-pill-ok' : isDegraded ? 'badge-notice' : 'status-badge-multipass'}>
                      {live?.estado || s.estado}
                    </span>
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
                  <span className="spec-label">Dirección IP (Servidor sv-ani):</span>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <input 
                        type="text" 
                        className="input-inline"
                        value={editIp}
                        onChange={(e) => setEditIp(e.target.value)}
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
                      <code className="ip-badge" style={{ background: '#ecfdf5', borderColor: '#10b981', color: '#047857' }}>
                        {s.ipPlaceholder}
                      </code>
                      <button className="btn-text-edit" onClick={() => startEdit(s)}>
                        <Edit3 size={14} />
                        <span>Editar</span>
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

              {/* Telemetría en Vivo */}
              <div style={{ marginTop: '12px', padding: '10px', background: '#f8fafc', borderRadius: '6px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>Diagnóstico de Protocolo en Vivo:</span>
                  {live?.latenciaMs !== undefined && (
                    <span style={{ color: '#0284c7', fontWeight: 600 }}>Latencia: {live.latenciaMs} ms</span>
                  )}
                </div>
                <p style={{ margin: 0, color: '#64748b' }}>
                  {live?.detalles || s.detalles}
                </p>
              </div>

              <div className="service-card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                <small className="text-muted">Socket: {s.ipPlaceholder}:{s.puerto}</small>
                <button 
                  className="btn-small-primary"
                  onClick={() => handleTestService(s.id)}
                  disabled={isProbing}
                >
                  <Activity size={14} style={{ marginRight: '4px' }} />
                  <span>{isProbing ? 'Probando...' : 'Probar Protocolo'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sección de Explorador de Archivos en Puntos de Montura */}
      <div className="dashboard-card" style={{ marginTop: '30px' }}>
        <div className="card-header-flex">
          <h3>📁 Explorador de Archivos en Volúmenes Montados (/mnt/ani y /mnt/samba)</h3>
          <span className="badge-count">Integración Sistema de Archivos Host</span>
        </div>
        <p className="card-desc">
          Archivos sincronizados directamente desde la máquina <strong>sv-ani</strong> (10.88.199.195) accesibles mediante el punto de montaje NFSv4 y el recurso Samba CIFS.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Volumen NFS */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <strong style={{ color: '#0c3c60' }}>Montaje NFSv4 (/mnt/ani)</strong>
              <span className="badge-public">10.88.199.195:/ani</span>
            </div>
            {mountedStorage?.nfs.archivos && mountedStorage.nfs.archivos.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem' }}>
                {mountedStorage.nfs.archivos.map((f, i) => (
                  <li key={i} style={{ padding: '6px 0', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileCheck size={15} className="text-green" />
                    <span>{f.nombre}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic' }}>
                Ruta local configurada en: {mountedStorage?.nfs.ruta || '/mnt/ani'}
              </p>
            )}
          </div>

          {/* Recurso Samba */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <strong style={{ color: '#0c3c60' }}>Recurso Samba (/mnt/samba)</strong>
              <span className="badge-public">//10.88.199.195/compartido</span>
            </div>
            {mountedStorage?.samba.archivos && mountedStorage.samba.archivos.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem' }}>
                {mountedStorage.samba.archivos.map((f, i) => (
                  <li key={i} style={{ padding: '6px 0', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FolderOpen size={15} className="text-blue" />
                    <span>{f.nombre}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic' }}>
                Ruta local configurada en: {mountedStorage?.samba.ruta || '/mnt/samba'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
