import api from './api';

export const registerUser = async ({ name, email, password }) => {
  const { data } = await api.post('/api/auth/register', { name, email, password });
  return data; // { user, token }
};

export const loginUser = async ({ email, password }) => {
  const { data } = await api.post('/api/auth/login', { email, password });
  return data; // { user, token }
};

export const getCurrentUser = async () => {
  const { data } = await api.get('/api/auth/me');
  return data; // { user }
};
