import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import './Layout.css';

const NavItem = ({ to, icon, label }) => {
  const { pathname } = useLocation();
  const active = pathname.startsWith(to);
  return (
    <Link to={to} className={`nav-item ${active ? 'active' : ''}`}>
      <span className="nav-icon">{icon}</span>
      <span className="nav-label">{label}</span>
    </Link>
  );
};

export default function Layout({ children }) {
  const { keycloak } = useKeycloak();
  const user = keycloak.tokenParsed;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">⚡</div>
          <div>
            <div className="logo-name">IncidentHub</div>
            <div className="logo-sub">Portail Client</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavItem to="/incidents" icon="📋" label="Mes Incidents" />
          <NavItem to="/chat" icon="💬" label="Support IA" />
        </nav>

        <div className="sidebar-footer">
          <Link to="/incidents/nouveau" className="btn btn-primary new-btn">
            + Nouvel Incident
          </Link>
          <div className="user-info">
            <div className="user-avatar">
              {user?.given_name?.[0]?.toUpperCase() || user?.preferred_username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.given_name || user?.preferred_username}</span>
              <span className="user-role">Utilisateur</span>
            </div>
            <button
              className="logout-btn"
              onClick={() => keycloak.logout()}
              title="Déconnexion"
            >⎋</button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
