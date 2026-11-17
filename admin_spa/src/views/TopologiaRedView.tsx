import React from 'react';
import { Network, Server, Shield, CheckCircle2, HardDrive, Clock, FolderSync } from 'lucide-react';

export const TopologiaRedView: React.FC = () => {
  return (
    <div className="view-content">
      <div className="view-header">
        <div>
          <h2>Topología de Red & Arquitectura Consolidada (ANI)</h2>
          <p>Mapeo entre el Servidor Web / Backend y la máquina de servicios de red en Canonical Multipass (10.88.199.195).</p>
        </div>
      </div>

      {/* Explicación de la delimitación */}
      <div className="callout-card" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', borderLeftColor: '#16a34a' }}>
        <div className="callout-icon" style={{ color: '#16a34a' }}>
          <CheckCircle2 size={24} />
        </div>
        <div>
          <h4 style={{ color: '#14532d' }}>Infraestructura Conectada y Consolidada</h4>
          <p style={{ color: '#166534' }}>
            La máquina de servicios consolidados se encuentra activa bajo la IP interna <strong>10.88.199.195</strong> (instancia <code>sv-ani</code> en Multipass).
            El servidor host web ya posee montados los recursos de almacenamiento en <code>/mnt/ani</code> (NFSv4) y <code>/mnt/samba</code> (Samba con usuario <code>ubuntu:123</code>).
          </p>
        </div>
      </div>

      {/* Tarjetas de Arquitectura */}
      <div className="dashboard-columns">
        <div className="dashboard-card">
          <div className="card-header-flex">
            <h3>🌐 Servidor Web & Backend API</h3>
            <span className="badge-public">Puerto 3000 / 2500</span>
          </div>
          <p className="card-desc">Servidor de aplicaciones Express y portal institucional ANI.</p>
          <ul className="network-list">
            <li>
              <strong>Punto de Montura NFS:</strong> <code>/mnt/ani</code> mapeado desde <code>10.88.199.195:/ani</code>
            </li>
            <li>
              <strong>Punto de Montura Samba:</strong> <code>/mnt/samba</code> mapeado desde <code>//10.88.199.195/compartido</code>
            </li>
            <li>
              <strong>Portal Web Estático:</strong> Servido en <code>/</code> para la ciudadanía.
            </li>
            <li>
              <strong>Backend API REST:</strong> Rutas públicas (Proyectos y PQRSF) y privadas (Administración).
            </li>
            <li>
              <strong>Panel Admin SPA:</strong> Consola React en <code>/admin/</code> o puerto independiente 5173 / 3001.
            </li>
          </ul>
        </div>

        <div className="dashboard-card">
          <div className="card-header-flex">
            <h3>🐧 Servidor Linux sv-ani (Multipass)</h3>
            <span className="badge-public">10.88.199.195</span>
          </div>
          <p className="card-desc">Servicios nativos consolidados sobre Debian 13 en la zona virtual <code>zone1</code>.</p>
          <ul className="network-list">
            <li>
              <strong>NFS (2049/TCP):</strong> Exporta <code>/srv/nfs/ani</code> para clientes de la subred <code>10.88.199.0/24</code>.
            </li>
            <li>
              <strong>NTP (123/UDP):</strong> Demonio <code>ntpsec</code> Stratum 3 activo para sellado de tiempo legal.
            </li>
            <li>
              <strong>NIS (111/TCP & RPC):</strong> Demonio <code>ypserv</code> activo con dominio <code>labnis</code>.
            </li>
            <li>
              <strong>Samba (445/TCP):</strong> Demonio <code>smbd</code> compartiendo <code>[compartido]</code> para usuarios de red.
            </li>
            <li>
              <strong>CUPS (631/IPP):</strong> Servicio de impresión institucional centralizado.
            </li>
          </ul>
        </div>
      </div>

      {/* Comprobación de Sockets en Vivo */}
      <div className="dashboard-card" style={{ marginTop: '24px' }}>
        <div className="card-header-flex">
          <h3>📊 Resumen de Protocolos y Puertos Conectados a 10.88.199.195</h3>
          <span className="badge-count">5 Protocolos</span>
        </div>

        <div className="table-responsive" style={{ marginTop: '12px' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Protocolo / Capa</th>
                <th>Puerto</th>
                <th>Socket Destino</th>
                <th>Mapeo Local / Recurso</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>NTP</strong></td>
                <td>UDP / Datagrama RFC 5905</td>
                <td><span className="code-pill">123/UDP</span></td>
                <td><code>10.88.199.195:123</code></td>
                <td>Hora oficial de la entidad</td>
                <td><span className="status-pill-ok">ACTIVO (Stratum 3)</span></td>
              </tr>
              <tr>
                <td><strong>NFS</strong></td>
                <td>TCP / NFSv4 RPC</td>
                <td><span className="code-pill">2049/TCP</span></td>
                <td><code>10.88.199.195:2049</code></td>
                <td>Montado en <code>/mnt/ani</code></td>
                <td><span className="status-pill-ok">CONECTADO</span></td>
              </tr>
              <tr>
                <td><strong>NIS</strong></td>
                <td>RPC / Portmapper</td>
                <td><span className="code-pill">111/TCP</span></td>
                <td><code>10.88.199.195:111</code></td>
                <td>Dominio <code>labnis</code></td>
                <td><span className="status-pill-ok">ACTIVO</span></td>
              </tr>
              <tr>
                <td><strong>Samba</strong></td>
                <td>TCP / SMB 3.0</td>
                <td><span className="code-pill">445/TCP</span></td>
                <td><code>10.88.199.195:445</code></td>
                <td>Montado en <code>/mnt/samba</code></td>
                <td><span className="status-pill-ok">CONECTADO</span></td>
              </tr>
              <tr>
                <td><strong>CUPS</strong></td>
                <td>TCP / IPP HTTP</td>
                <td><span className="code-pill">631/TCP</span></td>
                <td><code>10.88.199.195:631</code></td>
                <td>Cola centralizada</td>
                <td><span className="badge-notice">CONFIGURADO</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
