import api from './api';

export const getHabits      = ()            => api.get('/api/habits').then(r => r.data);
export const createHabit    = (data)        => api.post('/api/habits', data).then(r => r.data);
export const updateHabit    = (id, data)    => api.put(`/api/habits/${id}`, data).then(r => r.data);
export const deleteHabit    = (id)          => api.delete(`/api/habits/${id}`);
export const completeHabit  = (id)          => api.post(`/api/habits/${id}/complete`).then(r => r.data);
export const getHabitStats  = ()            => api.get('/api/habits/stats').then(r => r.data);
export const getHabitHeatmap = (weeks = 16) => api.get(`/api/habits/heatmap?weeks=${weeks}`).then(r => r.data);
