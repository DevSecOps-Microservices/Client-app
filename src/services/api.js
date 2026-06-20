import axios from 'axios';
import keycloak from '../keycloak';

const API_BASE = process.env.REACT_APP_API_URL || '';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(async (config) => {
  if (keycloak.authenticated) {
    try { await keycloak.updateToken(30); }
    catch { keycloak.login(); return Promise.reject('Session expirée'); }
  }
  if (keycloak.token) config.headers.Authorization = `Bearer ${keycloak.token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401) {
      await keycloak.updateToken(30).catch(() => keycloak.login());
    }
    return Promise.reject(error);
  }
);

// Incidents
export const incidentApi = {
  getAll: () => api.get('/api/incidents'),
  getById: (id) => api.get(`/api/incidents/${id}`),
  create: (data) => api.post('/api/incidents', data),
  update: (id, data) => api.put(`/api/incidents/${id}`, data),
  delete: (id) => api.delete(`/api/incidents/${id}`),
  uploadCapture: (id, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/api/incidents/${id}/capture`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getCaptureUrl: (id) => api.get(`/api/incidents/${id}/capture/url`),
};

// Comments
export const commentApi = {
  getByIncident: (incidentId) => api.get(`/api/commentaires/incident/${incidentId}`),
  create: (data) => api.post('/api/commentaires', data),
  update: (id, data) => api.put(`/api/commentaires/${id}`, data),
  delete: (id) => api.delete(`/api/commentaires/${id}`),
  addAttachment: (id, file) => {
    const fd = new FormData();
    fd.append('fichier', file);
    return api.post(`/api/commentaires/${id}/pieces-jointes`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Chat
export const chatApi = {
  start: (data) => api.post('/api/chat/demarrer', data),
  send: (data) => api.post('/api/chat/message', data),
  getConversation: (id) => api.get(`/api/chat/conversation/${id}`),
  getConversations: (userId) => api.get(`/api/chat/conversations/${userId}`),
  welcome: () => api.get('/api/chat/accueil'),
};

export default api;
