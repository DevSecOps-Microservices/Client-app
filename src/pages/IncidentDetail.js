import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import { incidentApi, commentApi } from '../services/api';
import './Pages.css';

export default function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { keycloak } = useKeycloak();
  const [incident, setIncident] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const fetchAll = async () => {
    const [inc, cmts] = await Promise.all([
      incidentApi.getById(id),
      commentApi.getByIncident(id),
    ]);
    const incidentData = inc.data;

    // Fetch fresh presigned URL if capture exists
    if (incidentData.captureUrl) {
      try {
        const urlRes = await incidentApi.getCaptureUrl(id);
        if (urlRes.data) incidentData.captureUrl = urlRes.data;
      } catch (e) { console.error(e); }
    }

    setIncident(incidentData);
    setComments(cmts.data?.content || cmts.data || []);
  };

  useEffect(() => {
    fetchAll().catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const postComment = async () => {
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      const user = keycloak.tokenParsed;
      await commentApi.create({
        incidentId: Number(id),
        auteurId: user?.sub,
        auteurNom: user?.given_name || user?.preferred_username,
        contenu: newComment,
      });
      setNewComment('');
      await fetchAll();
    } catch (e) { console.error(e); }
    finally { setPosting(false); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!incident) return <div className="page"><p>Incident non trouvé.</p></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← Retour</button>
          <h1 className="page-title" style={{ marginTop: 8 }}>{incident.titre}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <span className={`badge badge-${incident.priorite?.toLowerCase()}`}>{incident.priorite}</span>
            <span className={`badge badge-${incident.statut?.code?.toLowerCase()}`}>{incident.statut?.libelle}</span>
            <span className="badge" style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}>#{incident.id}</span>
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 12, color: 'var(--text-muted)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Description</h3>
            <p style={{ color: 'var(--text)', lineHeight: 1.8 }}>{incident.description || 'Aucune description.'}</p>
          </div>

          {incident.captureUrl && (
            <div className="card" style={{ marginBottom: 24 }}>
              <h3 style={{ marginBottom: 12, color: 'var(--text-muted)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Capture d'écran</h3>
              <img src={incident.captureUrl} alt="capture" style={{ maxWidth: '100%', borderRadius: 8 }} />
            </div>
          )}

          {/* Comments */}
          <div className="card">
            <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>
              Commentaires ({comments.length})
            </h3>

            <div className="comments-list">
              {comments.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
                  Aucun commentaire pour l'instant.
                </p>
              )}
              {comments.map(c => (
                <div key={c.id} className="comment">
                  <div className="comment-avatar">{c.auteurNom?.[0]?.toUpperCase() || '?'}</div>
                  <div className="comment-body">
                    <div className="comment-meta">
                      <span className="comment-author">{c.auteurNom || 'Inconnu'}</span>
                      <span className="comment-date">{c.dateCreation ? new Date(c.dateCreation).toLocaleString('fr-FR') : ''}</span>
                    </div>
                    <p className="comment-content">{c.contenu}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="comment-form">
              <textarea
                placeholder="Ajouter un commentaire…"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                rows={3}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={postComment}
                  disabled={posting || !newComment.trim()}
                >
                  {posting ? 'Envoi…' : 'Commenter'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="detail-side">
          <div className="card">
            <h3 style={{ marginBottom: 16, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)' }}>Détails</h3>
            <div className="detail-prop">
              <span>Statut</span>
              <span className={`badge badge-${incident.statut?.code?.toLowerCase()}`}>{incident.statut?.libelle}</span>
            </div>
            <div className="detail-prop">
              <span>Priorité</span>
              <span className={`badge badge-${incident.priorite?.toLowerCase()}`}>{incident.priorite}</span>
            </div>
            <div className="detail-prop">
              <span>ID</span>
              <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>#{incident.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
