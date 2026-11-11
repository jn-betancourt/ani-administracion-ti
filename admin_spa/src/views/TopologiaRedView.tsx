import React from 'react';
import { Network, Server, Shield, Cloud, Terminal, CheckCircle } from 'lucide-react';

export const TopologiaRedView: React.FC = () => {
  return (
    <div className="view-content">
      <div className="view-header">
        <div>
          <h2>Topología de Red & Arquitectura Consolidada (ANI)</h2>
          <p>Mapeo entre la plataforma PaaS (Dokploy / Traefik) y el entorno de red de Servidor Linux (Multipass).</p>
        </div>
      </div>

      {/* Explicación de la delimitación */}
      <div className="callout-card">
        <div className="callout-icon">
          <Shield size={24} />
        </div>
        <div>
          <h4>Separación de Ambientes y Responsabilidades</h4>
          <p>
            El sistema se encuentra dividido de acuerdo al diagrama de servicios del proyecto final:
            <br />
            1. <strong>Zona PaaS (Dokploy / Traefik):</strong> Web Server Estático (Portal ANI), Backend API y este Panel de Administración SPA.
            <br />
            2. <strong>Zona Servidor Linux (Multipass):</strong> Servicios de red interna (NFS, NTP, NIS, Samba, CUPS) con direcciones IP en formato <code>placeholder</code> (ej. <code>10.88.199.x</code>) para tu propia consolidación en el host.
          </p>
        </div>
      </div>

      {/* Tarjetas de Arquitectura */}
      <div className="dashboard-columns">
        <div className="dashboard-card">
          <div className="card-header-flex">
            <h3>🌐 Perímetro Web (Dokploy / Traefik)</h3>
            <span className="badge-public">HTTPS / 80 & 443</span>
          </div>
          <p className="card-desc">Servicios gestionados por Traefik Reverse Proxy y Docker Swarm.</p>
          <ul className="network-list">
            <li>
              <strong>Portal Web Estático:</strong> Nginx enrutado a <code>Host(`ani.ingeniero.app`)</code> o <code>/</code>.
            </li>
            <li>
              <strong>Backend API:</strong> Express/Node.js enrutado a <code>Host(`api.ani.ingeniero.app`)</code>.
            </li>
            <li>
              <strong>Panel Admin SPA:</strong> React/Vite enrutado a <code>Host(`admin.ani.ingeniero.app`)</code>.
            </li>
          </ul>
        </div>

        <div className="dashboard-card">
          <div className="card-header-flex">
            <h3>🐧 Servidor Linux Local (Multipass LAN)</h3>
            <span className="badge-notice">Subred 10.88.199.0/24</span>
          </div>
          <p className="card-desc">Servicios de soporte corporativo con IPs placeholder configurables.</p>
          <ul className="network-list">
            <li>
              <strong>NFS (2049/TCP):</strong> Almacenamiento central montado por la API y clientes Linux.
            </li>
            <li>
              <strong>NTP (123/UDP):</strong> Sincronización horaria para radicados oficiales.
            </li>
            <li>
              <strong>NIS (111/TCP):</strong> Directorio de usuarios y cuentas de administración.
            </li>
            <li>
              <strong>Samba (445/TCP):</strong> Compartición documental hacia clientes Windows y macOS.
            </li>
            <li>
              <strong>CUPS (631/IPP):</strong> Impresión centralizada de minutas y expedientes.
            </li>
          </ul>
        </div>
      </div>

      {/* Comandos de referencia Multipass */}
      <div className="dashboard-card" style={{ marginTop: '24px' }}>
        <div className="card-header-flex">
          <h3>💻 Comandos de Referencia Rápida para Consolidación en Multipass</h3>
          <span className="badge-count">CLI Multipass</span>
        </div>
        <p className="card-desc">
          Comandos utilizados en tus prácticas para aprovisionar y verificar la conectividad de la instancia del Servidor Linux:
        </p>

        <div className="code-block-box">
          <code>
            # 1. Crear y arrancar la instancia del Servidor Linux<br />
            multipass launch --name srv-linux-ani 24.04 -c 2 -m 2G -d 15G<br /><br />
            # 2. Consultar la IP asignada por el switch virtual mpqemubr0<br />
            multipass list<br /><br />
            # 3. Acceder por consola interactiva para configurar NFS, NTP, NIS, CUPS y Samba<br />
            multipass shell srv-linux-ani<br /><br />
            # 4. Probar visibilidad bidireccional mediante ICMP Ping<br />
            ping 10.88.199.X -c 4
          </code>
        </div>
      </div>
    </div>
  );
};
