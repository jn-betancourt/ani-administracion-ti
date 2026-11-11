import React, { useState } from 'react';
import { ApiService } from '../services/api';
import { Usuario } from '../types';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: Usuario) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@ani.gov.co');
  const [password, setPassword] = useState('adminANI2026!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await ApiService.login(email, password);
      onLoginSuccess(data.usuario);
    } catch (err: any) {
      setError(err.message || 'Error al autenticar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-box">
            <span style={{ fontSize: '2.4rem' }}>🛣️</span>
          </div>
          <h2>Agencia Nacional de Infraestructura</h2>
          <p>Panel Administrativo SPA — Consolidación TI</p>
        </div>

        {error && (
          <div className="alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Correo Electrónico Institucional</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input 
                type="email" 
                className="form-control"
                placeholder="usuario@ani.gov.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input 
                type="password" 
                className="form-control"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-login-submit"
            disabled={loading}
          >
            <span>{loading ? 'Validando Credenciales...' : 'Ingresar al Panel'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="demo-accounts-box">
          <span>Credenciales Preconfiguradas:</span>
          <div className="demo-badges-row">
            <button 
              type="button" 
              className="badge-demo-btn"
              onClick={() => handleFillDemo('admin@ani.gov.co', 'adminANI2026!')}
            >
              Admin TI
            </button>
            <button 
              type="button" 
              className="badge-demo-btn"
              onClick={() => handleFillDemo('documentacion@ani.gov.co', 'gestorANI2026!')}
            >
              Gestor Documental
            </button>
            <button 
              type="button" 
              className="badge-demo-btn"
              onClick={() => handleFillDemo('atencion@ani.gov.co', 'atencionANI2026!')}
            >
              Atención Ciudadana
            </button>
          </div>
        </div>

        <div className="login-footer-text">
          <small>Autenticación segura basada en tokens JWT con verificación de roles (RBAC).</small>
        </div>
      </div>
    </div>
  );
};
