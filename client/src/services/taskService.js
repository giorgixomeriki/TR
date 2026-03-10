import api from './api';

export const getTasks = async () => {
  const { data } = await api.get('/api/tasks');
  return data;
};

export const getTask = async (id) => {
  const { data } = await api.get(`/api/tasks/${id}`);
  return data;
};

export const createTask = async ({ title, description, status, dueDate, rewardCoins, skillIds }) => {
  const { data } = await api.post('/api/tasks', { title, description, status, dueDate, rewardCoins, skillIds });
  return data;
};

export const updateTask = async (id, updates) => {
  const { data } = await api.put(`/api/tasks/${id}`, updates);
  return data;
};

export const deleteTask = async (id) => {
  const { data } = await api.delete(`/api/tasks/${id}`);
  return data;
};
