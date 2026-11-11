import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { SystemMetrics } from '../types';
import { 
  Server, 
  Cpu, 
  HardDrive, 
  Clock, 
  FolderArchive, 
  Inbox, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [docCount, setDocCount] = useState<number>(0);
  const [pqrsfCount, setPqrsfCount] = useState<number>(0);
  const [linuxServices, setLinuxServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [healthRes, docs, pqrsfs, services] = await Promise.all([
        ApiService.getHealth(),
        ApiService.getDocumentos(),
        ApiService.getPqrsf(),
        ApiService.getServiciosLinux()
      ]);

      if (healthRes.telemetria) {
        setMetrics(healthRes.telemetria);
      }
      setDocCount(docs.length);
      setPqrsfCount(pqrsfs.length);
      setLinuxServices(services);
    } catch (e) {
      console.error('Error al cargar datos de dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-content">
      <div className="view-header">
        <div>
          <h2>Panel de Monitoreo & Control de Servicios</h2>
          <p>Supervisión consolidada de la plataforma PaaS (Dokploy / Traefik) y del Servidor Linux.</p>
        </div>
        <button className="btn-primary" onClick={loadData}>Actualizar Métricas</button>
      </div>

      {/* Grid de Métricas Principales */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-box bg-blue">
            <Server size={24} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Plataforma Host</span>
            <strong className="metric-val">{metrics?.plataforma || 'Ubuntu Linux'}</strong>
            <small className="metric-sub">Node.js {metrics?.nodeVersion || 'v22'}</small>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box bg-green">
            <Clock size={24} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Tiempo de Actividad (Uptime)</span>
            <strong className="metric-val">{metrics?.uptimeFormato || 'Calculando...'}</strong>
            <small className="metric-sub">Cero caídas (Zero-Downtime)</small>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box bg-purple">
            <HardDrive size={24} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Memoria RAM Asignada</span>
            <strong className="metric-val">
              {metrics ? `${metrics.memoria.usadaMiB} / ${metrics.memoria.totalMiB} MiB` : 'Cargando...'}
            </strong>
            <small className="metric-sub">{metrics?.memoria.porcentajeUso}% en uso</small>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box bg-amber">
            <Cpu size={24} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Cómputo CPU</span>
            <strong className="metric-val">{metrics?.cpus.cantidadNucleos || 2} vCPUs</strong>
            <small className="metric-sub">Carga: {metrics?.cpus.loadAverage[0].toFixed(2)}</small>
          </div>
        </div>
      </div>

      {/* Resumen de Servicios */}
      <div className="dashboard-columns">
        <div className="dashboard-card">
          <div className="card-header-flex">
            <h3>📂 Almacenamiento Documental (NFS Simulado)</h3>
            <span className="badge-count">{docCount} Docs</span>
          </div>
          <p className="card-desc">
            Expedientes de proyectos y pliegos de contratación montados en <code>/var/ani/documentos</code>.
          </p>
          <div className="nfs-status-box">
            <CheckCircle size={20} className="text-green" />
            <div>
              <strong>Punto de Enlace NFS v4:</strong>
              <div className="code-tag">10.88.199.PLACEHOLDER_IP:/srv/nfs/ani_docs</div>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header-flex">
            <h3>📬 Ventanilla de Radicación PQRSF</h3>
            <span className="badge-count">{pqrsfCount} Trámites</span>
          </div>
          <p className="card-desc">
            Atención ciudadana y cumplimiento de la Ley 1755 de 2015 para la ANI.
          </p>
          <div className="pqrsf-summary-box">
            <div className="pqrsf-stat">
              <span className="dot-yellow"></span>
              <span>En Trámite: <strong>1</strong></span>
            </div>
            <div className="pqrsf-stat">
              <span className="dot-green"></span>
              <span>Respondidos: <strong>1</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Servicios Linux Consolidados */}
      <div className="dashboard-card" style={{ marginTop: '24px' }}>
        <div className="card-header-flex">
          <h3>🐧 Estado de Servicios de Servidor Linux (Consolidación LAN)</h3>
          <span className="badge-notice">Configurable vía Multipass</span>
        </div>
        <p className="card-desc">
          Los servicios de soporte local (NFS, NTP, NIS, CUPS, Samba) tienen sus IPs parametrizadas en formato <strong>placeholder</strong> para que sean enlazadas cuando aprovisiones la máquina virtual en Multipass.
        </p>

        <div className="services-table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Tipo de Servicio</th>
                <th>Protocolo/Puerto</th>
                <th>IP de Conexión (Placeholder)</th>
                <th>Estado de Enlace</th>
              </tr>
            </thead>
            <tbody>
              {linuxServices.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.nombre}</strong></td>
                  <td>{s.tipoServicio}</td>
                  <td><span className="code-pill">{s.protocolo} :{s.puerto}</span></td>
                  <td><code className="text-accent">{s.ipPlaceholder}</code></td>
                  <td>
                    <span className="status-badge-multipass">
                      {s.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
