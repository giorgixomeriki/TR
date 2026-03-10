import api from './api';

export const getTaskAdvice = async ({ title, description }) => {
  const { data } = await api.post('/api/ai/task-advice', { title, description });
  return data; // { breakdown, steps, timeEstimate, skills }
};
