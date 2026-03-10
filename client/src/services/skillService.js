import api from './api';

export const getAllSkills  = async () => { const { data } = await api.get('/api/skills'); return data; };
export const getUserSkills = async () => { const { data } = await api.get('/api/user/skills'); return data; };
