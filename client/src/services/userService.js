import api from './api';

export const getCoins = async () => {
  const { data } = await api.get('/api/user/coins');
  return data.totalCoins;
};
