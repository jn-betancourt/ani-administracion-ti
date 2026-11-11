import React from 'react';
import { Usuario } from '../types';
import { ShieldCheck, UserCheck, Activity } from 'lucide-react';

interface HeaderProps {
  user: Usuario | null;
  serverStatus: string;
}

export const Header: React.FC<HeaderProps> = ({ user, serverStatus }) => {
  return (
    <header className="top-header">
      <div className="header-breadcrumbs">
        <span className="crumb-root">Administración TI</span>
        <span className="crumb-separator">/</span>
        <span className="crumb-current">Panel de Control Consolidado</span>
      </div>

      <div className="header-status-group">
        <div className="status-indicator">
          <Activity size={16} className="pulse-green" />
          <span>API: <strong>{serverStatus}</strong></span>
        </div>

        {user && (
          <div className="user-profile-badge">
            <div className="user-avatar">
              <UserCheck size={18} />
            </div>
            <div className="user-details">
              <strong>{user.nombreCompleto}</strong>
              <div className="user-role-tag">
                <ShieldCheck size={12} />
                <span>{user.rol}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
