import React from 'react';
import { 
  LayoutDashboard, 
  FolderArchive, 
  Inbox, 
  Users, 
  Server, 
  Monitor, 
  Network,
  LogOut,
  ExternalLink
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard & Telemetría', icon: LayoutDashboard },
    { id: 'documentos', label: 'Gestión Documental (NFS)', icon: FolderArchive },
    { id: 'pqrsf', label: 'Bandeja Trámites PQRSF', icon: Inbox },
    { id: 'usuarios', label: 'Usuarios y Permisos RBAC', icon: Users },
    { id: 'servicios_linux', label: 'Servicios Servidor Linux', icon: Server, badge: 'Multipass' },
    { id: 'clientes_lan', label: 'Clientes de Red LAN', icon: Monitor },
    { id: 'topologia_red', label: 'Topología & Placeholders', icon: Network }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">🛣️</div>
        <div>
          <h2>ANI Panel TI</h2>
          <p>Consolidación de Servicios</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <a 
          href="/" 
          target="_blank" 
          rel="noreferrer"
          className="portal-link"
        >
          <ExternalLink size={16} />
          <span>Ver Portal Público ANI</span>
        </a>
        <button className="logout-btn" onClick={onLogout}>
          <LogOut size={16} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
