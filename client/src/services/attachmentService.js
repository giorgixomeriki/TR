import api from './api';

export const getAttachments    = async (taskId) => { const { data } = await api.get(`/api/tasks/${taskId}/attachments`); return data; };
export const uploadAttachment  = async (taskId, file) => {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post(`/api/tasks/${taskId}/upload`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};
export const deleteAttachment  = async (id)     => { const { data } = await api.delete(`/api/attachments/${id}`); return data; };
