import React, { useState, useEffect } from 'react';
import { ApiService } from './services/api';
import { Usuario } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './views/DashboardView';
import { DocumentosView } from './views/DocumentosView';
import { PqrsfView } from './views/PqrsfView';
import { UsuariosView } from './views/UsuariosView';
import { ServiciosLinuxView } from './views/ServiciosLinuxView';
import { ClientesLANView } from './views/ClientesLANView';
import { TopologiaRedView } from './views/TopologiaRedView';
import { LoginView } from './views/LoginView';

export const App: React.FC = () => {
  const [user, setUser] = useState<Usuario | null>(ApiService.getStoredUser());
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [serverStatus, setServerStatus] = useState<string>('Conectando...');

  useEffect(() => {
    checkHealth();
    if (user) {
      validateSession();
    }
  }, []);

  const checkHealth = async () => {
    try {
      const data = await ApiService.getHealth();
      if (data.estado === 'saludable') {
        setServerStatus('Operativo (Online)');
      } else {
        setServerStatus('Degradado');
      }
    } catch {
      setServerStatus('Sin Conexión API');
    }
  };

  const validateSession = async () => {
    try {
      const me = await ApiService.getMe();
      setUser(me);
    } catch {
      handleLogout();
    }
  };

  const handleLoginSuccess = (authenticatedUser: Usuario) => {
    setUser(authenticatedUser);
  };

  const handleLogout = () => {
    ApiService.removeToken();
    setUser(null);
  };

  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'documentos':
        return <DocumentosView />;
      case 'pqrsf':
        return <PqrsfView />;
      case 'usuarios':
        return <UsuariosView />;
      case 'servicios_linux':
        return <ServiciosLinuxView />;
      case 'clientes_lan':
        return <ClientesLANView />;
      case 'topologia_red':
        return <TopologiaRedView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="admin-layout">
      <Sidebar 
        currentTab={currentTab} 
        onSelectTab={setCurrentTab} 
        onLogout={handleLogout} 
      />

      <div className="main-content-wrapper">
        <Header user={user} serverStatus={serverStatus} />
        <main className="view-container">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

export default App;
