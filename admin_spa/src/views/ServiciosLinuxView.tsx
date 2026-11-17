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
  FileCheck,
  Upload,
  Download,
  Trash2,
  Zap
} from 'lucide-react';

export const ServiciosLinuxView: React.FC = () => {
  const [servicios, setServicios] = useState<ServicioLinuxConfig[]>([]);
  const [liveProbes, setLiveProbes] = useState<Record<string, any>>({});
  const [ntpTime, setNtpTime] = useState<NtpOfficialTimeData | null>(null);
  const [mountedStorage, setMountedStorage] = useState<MountedStorageData | null>(null);
  const [probingService, setProbingService] = useState<string | null>(null);
  const [testingVolume, setTestingVolume] = useState<'nfs' | 'samba' | null>(null);
  const [ioTestResult, setIoTestResult] = useState<any | null>(null);
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

  const handleTestVolumeIO = async (volumen: 'nfs' | 'samba') => {
    setTestingVolume(volumen);
    try {
      const res = await ApiService.probarEscrituraVolumen(volumen);
      setIoTestResult(res);
      setMsg(`Prueba I/O exitosa en ${volumen.toUpperCase()}: archivo ${res.archivoPrueba} verificado con NTP.`);
      await loadMountedStorage();
      setTimeout(() => setMsg(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Error en prueba I/O');
    } finally {
      setTestingVolume(null);
    }
  };

  const handleUploadToVolume = async (volumen: 'nfs' | 'samba', e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setTestingVolume(volumen);
    try {
      const res = await ApiService.subirArchivoVolumen(volumen, selected);
      setMsg(`Archivo [${res.nombre}] subido exitosamente a ${res.rutaMontura}`);
      await loadMountedStorage();
      setTimeout(() => setMsg(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Error al subir archivo');
    } finally {
      setTestingVolume(null);
      e.target.value = '';
    }
  };

  const handleDownloadVolumeFile = async (volumen: 'nfs' | 'samba', nombre: string) => {
    try {
      await ApiService.descargarArchivoVolumen(volumen, nombre);
    } catch (err: any) {
      alert(err.message || 'Error al descargar');
    }
  };

  const handleDeleteVolumeFile = async (volumen: 'nfs' | 'samba', nombre: string) => {
    if (!confirm(`¿Desea eliminar el archivo [${nombre}] del volumen ${volumen.toUpperCase()}?`)) return;
    try {
      await ApiService.eliminarArchivoVolumen(volumen, nombre);
      setMsg(`Archivo [${nombre}] eliminado de ${volumen.toUpperCase()}.`);
      await loadMountedStorage();
      setTimeout(() => setMsg(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
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

      {/* Sección de Explorador y Operación en Volúmenes Montados (Capa de Abstracción) */}
      <div className="dashboard-card" style={{ marginTop: '30px' }}>
        <div className="card-header-flex">
          <div>
            <h3 style={{ margin: 0 }}>📁 Capa de Abstracción: Sistemas de Archivos Montados (/mnt/ani y /mnt/samba)</h3>
            <small style={{ color: '#64748b' }}>
              Servidor Web Dokploy (<strong>10.88.199.214</strong>) ↔ Servidor Servicios ANI (<strong>10.88.199.195</strong>) — Sincronizado con NTP
            </small>
          </div>
          <span className="badge-count" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #10b981' }}>
            ✓ {mountedStorage?.nfs.modo === 'MONTURA_KERNEL_ACTIVA' ? 'Montura Kernel Activa (10.88.199.214)' : 'Capa Abstracción Conectada (10.88.199.195)'}
          </span>
        </div>

        {ioTestResult && (
          <div style={{ marginTop: '14px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <strong style={{ color: '#166534' }}>
                ✓ Verificación de Lectura/Escritura (I/O) en {ioTestResult.volumen?.toUpperCase()} ({ioTestResult.rutaMontura})
              </strong>
              <button className="btn-text-edit" onClick={() => setIoTestResult(null)}>Cerrar</button>
            </div>
            <div style={{ color: '#15803d', marginBottom: '6px' }}>
              Archivo creado: <code>{ioTestResult.archivoPrueba}</code> | Latencia I/O: <strong>{ioTestResult.latenciaEscrituraLecturaMs} ms</strong> | Timestamp NTP (10.88.199.195): <code>{ioTestResult.timestampNtpOficial}</code>
            </div>
            <pre style={{ margin: 0, padding: '8px', background: '#0f172a', color: '#e2e8f0', borderRadius: '6px', overflowX: 'auto', fontSize: '0.75rem' }}>
              {ioTestResult.contenidoVerificado}
            </pre>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginTop: '16px' }}>
          {/* Volumen NFS */}
          <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', background: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <strong style={{ color: '#0c3c60', display: 'block' }}>Montaje NFSv4 (/mnt/ani)</strong>
                <small style={{ color: '#64748b', display: 'block' }}>Origen: {mountedStorage?.nfs.origenRemoto || '10.88.199.195:/ani'}</small>
                <small style={{ color: '#0284c7', fontSize: '0.75rem' }}>Modo: {mountedStorage?.nfs.modo || 'ACTIVO'}</small>
              </div>
              <span className="badge-public" style={{ background: '#dbeafe', color: '#1e40af' }}>
                {mountedStorage?.nfs.archivos?.length || 0} archivos
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <button
                className="btn-small-primary"
                onClick={() => handleTestVolumeIO('nfs')}
                disabled={testingVolume === 'nfs'}
              >
                <Zap size={13} style={{ marginRight: '4px' }} />
                <span>{testingVolume === 'nfs' ? 'Verificando...' : 'Probar I/O + NTP'}</span>
              </button>
              <label className="btn-small-success" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', margin: 0 }}>
                <Upload size={13} style={{ marginRight: '4px' }} />
                <span>Subir a /mnt/ani</span>
                <input
                  type="file"
                  style={{ display: 'none' }}
                  onChange={(e) => handleUploadToVolume('nfs', e)}
                />
              </label>
            </div>

            {mountedStorage?.nfs.archivos && mountedStorage.nfs.archivos.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.84rem', maxHeight: '280px', overflowY: 'auto' }}>
                {mountedStorage.nfs.archivos.map((f, i) => (
                  <li key={i} style={{ padding: '7px 0', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      {f.esDirectorio ? <FolderOpen size={16} className="text-blue" /> : <FileCheck size={16} className="text-green" />}
                      <span title={f.nombre} style={{ fontWeight: f.esDirectorio ? 600 : 400, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {f.nombre}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      {f.tamano && (
                        <span style={{ fontSize: '0.72rem', color: '#64748b', background: '#ffffff', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                          {f.tamano}
                        </span>
                      )}
                      {!f.esDirectorio && (
                        <>
                          <button
                            className="btn-text-edit"
                            title="Descargar desde /mnt/ani"
                            onClick={() => handleDownloadVolumeFile('nfs', f.nombre)}
                          >
                            <Download size={14} />
                          </button>
                          <button
                            className="btn-text-edit"
                            title="Eliminar de /mnt/ani"
                            style={{ color: '#dc2626' }}
                            onClick={() => handleDeleteVolumeFile('nfs', f.nombre)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic' }}>
                Ruta configurada en: {mountedStorage?.nfs.rutaMonturaObjetivo || '/mnt/ani'}
              </p>
            )}
          </div>

          {/* Recurso Samba */}
          <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', background: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <strong style={{ color: '#0c3c60', display: 'block' }}>Recurso Samba (/mnt/samba)</strong>
                <small style={{ color: '#64748b', display: 'block' }}>Origen: {mountedStorage?.samba.origenRemoto || '//10.88.199.195/compartido'}</small>
                <small style={{ color: '#0284c7', fontSize: '0.75rem' }}>Modo: {mountedStorage?.samba.modo || 'ACTIVO'}</small>
              </div>
              <span className="badge-public" style={{ background: '#dbeafe', color: '#1e40af' }}>
                {mountedStorage?.samba.archivos?.length || 0} archivos
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <button
                className="btn-small-primary"
                onClick={() => handleTestVolumeIO('samba')}
                disabled={testingVolume === 'samba'}
              >
                <Zap size={13} style={{ marginRight: '4px' }} />
                <span>{testingVolume === 'samba' ? 'Verificando...' : 'Probar I/O + NTP'}</span>
              </button>
              <label className="btn-small-success" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', margin: 0 }}>
                <Upload size={13} style={{ marginRight: '4px' }} />
                <span>Subir a /mnt/samba</span>
                <input
                  type="file"
                  style={{ display: 'none' }}
                  onChange={(e) => handleUploadToVolume('samba', e)}
                />
              </label>
            </div>

            {mountedStorage?.samba.archivos && mountedStorage.samba.archivos.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.84rem', maxHeight: '280px', overflowY: 'auto' }}>
                {mountedStorage.samba.archivos.map((f, i) => (
                  <li key={i} style={{ padding: '7px 0', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      {f.esDirectorio ? <FolderOpen size={16} className="text-blue" /> : <FileCheck size={16} className="text-green" />}
                      <span title={f.nombre} style={{ fontWeight: f.esDirectorio ? 600 : 400, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {f.nombre}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      {f.tamano && (
                        <span style={{ fontSize: '0.72rem', color: '#64748b', background: '#ffffff', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                          {f.tamano}
                        </span>
                      )}
                      {!f.esDirectorio && (
                        <>
                          <button
                            className="btn-text-edit"
                            title="Descargar desde /mnt/samba"
                            onClick={() => handleDownloadVolumeFile('samba', f.nombre)}
                          >
                            <Download size={14} />
                          </button>
                          <button
                            className="btn-text-edit"
                            title="Eliminar de /mnt/samba"
                            style={{ color: '#dc2626' }}
                            onClick={() => handleDeleteVolumeFile('samba', f.nombre)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic' }}>
                Ruta configurada en: {mountedStorage?.samba.rutaMonturaObjetivo || '/mnt/samba'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
