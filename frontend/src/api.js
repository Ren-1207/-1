import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const projectsApi = {
  list: (params) => api.get('/projects', { params }).then((r) => r.data),
  stats: () => api.get('/projects/stats').then((r) => r.data),
  get: (id) => api.get(`/projects/${id}`).then((r) => r.data),
  create: (data) => api.post('/projects', data).then((r) => r.data),
  update: (id, data) => api.put(`/projects/${id}`, data).then((r) => r.data),
  updateStage: (id, stage) => api.patch(`/projects/${id}/stage`, { stage }).then((r) => r.data),
  delete: (id) => api.delete(`/projects/${id}`).then((r) => r.data),
};

export const notesApi = {
  list: (month) => api.get('/notes', { params: { month } }).then((r) => r.data),
  today: () => api.get('/notes/today').then((r) => r.data),
  get: (date) => api.get(`/notes/${date}`).then((r) => r.data),
  save: (date, data) => api.put(`/notes/${date}`, data).then((r) => r.data),
};

export const settingsApi = {
  get: () => api.get('/settings').then((r) => r.data),
  save: (data) => api.put('/settings', data).then((r) => r.data),
  testEmail: () => api.post('/settings/test-email').then((r) => r.data),
};

export const remindersApi = {
  logs: () => api.get('/reminders/logs').then((r) => r.data),
  preview: () => api.get('/reminders/preview').then((r) => r.data),
  sendNow: () => api.post('/reminders/send-now').then((r) => r.data),
};
