import api from './api';

export const startFocusSession    = (taskId)                       => api.post('/api/focus/start',    { taskId }).then((r) => r.data);
export const completeFocusSession = (sessionId, duration, note)    => api.post('/api/focus/complete', { sessionId, duration, note }).then((r) => r.data);
export const getFocusStats        = ()                              => api.get('/api/focus/stats').then((r) => r.data);
