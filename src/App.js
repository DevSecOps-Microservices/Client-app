import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import Layout from './components/Layout';
import IncidentList from './pages/IncidentList';
import IncidentCreate from './pages/IncidentCreate';
import IncidentDetail from './pages/IncidentDetail';
import ChatPage from './pages/ChatPage';

const ADMIN_URL = process.env.REACT_APP_ADMIN_URL || 'http://localhost:4200';

function ProtectedRoute({ children }) {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Connexion en cours…</p>
      </div>
  );

  if (!keycloak.authenticated) {
    keycloak.login();
    return null;
  }

  const roles = keycloak.tokenParsed?.realm_access?.roles || [];

  // Admins and technicians should use the admin dashboard
  if (roles.includes('ADMIN') || roles.includes('TECHNICIEN')) {
    window.location.href = ADMIN_URL;
    return null;
  }

  return children;
}

export default function App() {
  return (
      <BrowserRouter>
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/incidents" replace />} />
              <Route path="/incidents" element={<IncidentList />} />
              <Route path="/incidents/nouveau" element={<IncidentCreate />} />
              <Route path="/incidents/:id" element={<IncidentDetail />} />
              <Route path="/chat" element={<ChatPage />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      </BrowserRouter>
  );
}
