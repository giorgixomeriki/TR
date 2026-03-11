import api from './api';

export const getWorkouts      = ()           => api.get('/api/gym').then(r => r.data);
export const createWorkout    = (data)       => api.post('/api/gym', data).then(r => r.data);
export const updateWorkout    = (id, data)   => api.put(`/api/gym/${id}`, data).then(r => r.data);
export const deleteWorkout    = (id)         => api.delete(`/api/gym/${id}`);

export const getExercises     = ()           => api.get('/api/gym/exercises').then(r => r.data);

export const createSession    = (workoutId)  => api.post('/api/gym/sessions', { workoutId }).then(r => r.data);
export const completeSession  = (id, data)   => api.put(`/api/gym/sessions/${id}/complete`, data).then(r => r.data);

export const getGymStats      = ()           => api.get('/api/gym/stats').then(r => r.data);

export const getBodyStats     = ()           => api.get('/api/gym/body-stats').then(r => r.data);
export const addBodyStat      = (data)       => api.post('/api/gym/body-stats', data).then(r => r.data);
