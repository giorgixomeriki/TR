import api from './api';

export const getSubtasks  = async (taskId)            => { const { data } = await api.get(`/api/tasks/${taskId}/subtasks`); return data; };
export const createSubtask = async (taskId, title)    => { const { data } = await api.post(`/api/tasks/${taskId}/subtasks`, { title }); return data; };
export const updateSubtask = async (id, patch)        => { const { data } = await api.put(`/api/subtasks/${id}`, patch); return data; };
export const deleteSubtask = async (id)               => { const { data } = await api.delete(`/api/subtasks/${id}`); return data; };
