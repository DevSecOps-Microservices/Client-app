import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { incidentApi } from '../services/api';
import './Pages.css';

const priorityOrder = { CRITIQUE: 0, HAUTE: 1, NORMALE: 2, BASSE: 3 };

export default function IncidentList() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    incidentApi.getAll()
      .then(r => setIncidents(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statuses = ['ALL', 'NOUVEAU', 'ASSIGNE', 'EN_COURS', 'RESOLU', 'FERME'];

  const filtered = incidents
    .filter(i => filter === 'ALL' || i.statut?.code === filter)
    .filter(i => !search || i.titre?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (priorityOrder[a.priorite] ?? 99) - (priorityOrder[b.priorite] ?? 99));

  const stats = {
    total: incidents.length,
    ouverts: incidents.filter(i => ['NOUVEAU', 'ASSIGNE', 'EN_COURS'].includes(i.statut?.code)).length,
    resolus: incidents.filter(i => i.statut?.code === 'RESOLU').length,
    critiques: incidents.filter(i => i.priorite === 'CRITIQUE').length,
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>Chargement des incidents…</p>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mes Incidents</h1>
          <p className="page-sub">Suivi de vos demandes de support</p>
        </div>
        <Link to="/incidents/nouveau" className="btn btn-primary">
          + Créer un incident
        </Link>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-value">{stats.ouverts}</div>
          <div className="stat-label">En cours</div>
        </div>
        <div className="stat-card success">
          <div className="stat-value">{stats.resolus}</div>
          <div className="stat-label">Résolus</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-value">{stats.critiques}</div>
          <div className="stat-label">Critiques</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <input
          type="text" placeholder="Rechercher un incident…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
        <div className="filter-tabs">
          {statuses.map(s => (
            <button
              key={s}
              className={`filter-tab ${filter === s ? 'active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s === 'ALL' ? 'Tous' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents list */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>Aucun incident trouvé</h3>
          <p>Modifiez vos filtres ou créez votre premier incident.</p>
        </div>
      ) : (
        <div className="incidents-grid">
          {filtered.map(inc => (
            <Link to={`/incidents/${inc.id}`} key={inc.id} className="incident-card">
              <div className="incident-card-header">
                <span className={`badge badge-${inc.priorite?.toLowerCase()}`}>
                  {inc.priorite || 'N/A'}
                </span>
                <span className={`badge badge-${inc.statut?.code?.toLowerCase()}`}>
                  {inc.statut?.libelle || 'Nouveau'}
                </span>
              </div>
              <h3 className="incident-title">{inc.titre}</h3>
              <p className="incident-desc">{inc.description}</p>
              <div className="incident-footer">
                <span className="incident-id">#{inc.id}</span>
                <span className="incident-arrow">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
