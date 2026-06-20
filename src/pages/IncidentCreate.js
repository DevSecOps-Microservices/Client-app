import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentApi } from '../services/api';
import './Pages.css';

// FIX: list must match DB CHECK constraint exactly: BASSE | NORMALE | HAUTE | CRITIQUE
const PRIORITIES = [
  { value: 'BASSE',    label: '🟢 Basse — Peut attendre' },
  { value: 'NORMALE',  label: '🔵 Normale — Impact limité' },
  { value: 'HAUTE',    label: '🟡 Haute — Impact significatif' },
  { value: 'CRITIQUE', label: '🔴 Critique — Bloquant' },
];

export default function IncidentCreate() {
  const navigate = useNavigate();
  // FIX: default is now 'BASSE' — the first option shown — so state and <select> are always in sync
  const [form, setForm]     = useState({ titre: '', description: '', priorite: 'BASSE' });
  const [file, setFile]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const compressImage = (file, maxSizeMB = 2) => new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, Math.sqrt((maxSizeMB * 1024 * 1024) / file.size));
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.85);
    };
    img.src = URL.createObjectURL(file);
  });

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.titre.trim()) { setError('Le titre est obligatoire.'); return; }
    setLoading(true); setError('');
    try {
      const res = await incidentApi.create(form);
      const id = res.data.id;
      if (file) {
        const compressed = await compressImage(file);
        await incidentApi.uploadCapture(id, compressed);
      }
      navigate(`/incidents/${id}`);
    } catch (err) {
      const msg = err.response?.data?.message
          || (typeof err.response?.data === 'string' ? err.response.data : null)
          || `Erreur ${err.response?.status ?? 'réseau'} — réessayez.`;
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Nouvel Incident</h1>
            <p className="page-sub">Décrire votre problème en détail</p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Retour</button>
        </div>

        <div className="form-card">
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="form-group">
              <label>Titre *</label>
              <input
                  name="titre" value={form.titre} onChange={handleChange}
                  placeholder="Ex: Impossibilité de se connecter au VPN"
                  required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                  name="description" value={form.description} onChange={handleChange}
                  placeholder="Décrivez le problème en détail : quand, comment, ce que vous avez essayé…"
                  rows={5}
              />
            </div>

            <div className="form-group">
              <label>Priorité</label>
              {/* FIX: options are now driven by the PRIORITIES constant above */}
              <select name="priorite" value={form.priorite} onChange={handleChange}>
                {PRIORITIES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Capture d'écran (optionnel)</label>
              <div
                  className="file-drop"
                  onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                  onDragLeave={e => e.currentTarget.classList.remove('drag-over')}
                  onDrop={e => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('drag-over');
                    const f = e.dataTransfer.files[0];
                    if (f) setFile(f);
                  }}
                  onClick={() => document.getElementById('file-input').click()}
              >
                <input
                    id="file-input" type="file" accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => setFile(e.target.files[0])}
                />
                {file ? (
                    <div className="file-preview">
                      <span>📎 {file.name}</span>
                      <button type="button" onClick={e => { e.stopPropagation(); setFile(null); }}>✕</button>
                    </div>
                ) : (
                    <div className="file-placeholder">
                      <span>🖼️</span>
                      <p>Glissez une image ou cliquez pour sélectionner</p>
                    </div>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
                Annuler
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Envoi…' : "✓ Soumettre l'incident"}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}