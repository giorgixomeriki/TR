import api from './api';

const qs = (month, year) => `?month=${month}&year=${year}`;

export const getSummary          = (m, y)       => api.get(`/api/finance/summary${qs(m, y)}`).then(r => r.data);

export const getExpenses         = (m, y)       => api.get(`/api/finance/expenses${qs(m, y)}`).then(r => r.data);
export const createExpense       = (data)       => api.post('/api/finance/expenses', data).then(r => r.data);
export const deleteExpense       = (id)         => api.delete(`/api/finance/expenses/${id}`);

export const getIncome           = (m, y)       => api.get(`/api/finance/income${qs(m, y)}`).then(r => r.data);
export const createIncome        = (data)       => api.post('/api/finance/income', data).then(r => r.data);
export const deleteIncome        = (id)         => api.delete(`/api/finance/income/${id}`);

export const getBudgets          = (m, y)       => api.get(`/api/finance/budgets${qs(m, y)}`).then(r => r.data);
export const upsertBudget        = (data)       => api.post('/api/finance/budgets', data).then(r => r.data);

export const getGoals            = ()           => api.get('/api/finance/goals').then(r => r.data);
export const createGoal          = (data)       => api.post('/api/finance/goals', data).then(r => r.data);
export const updateGoal          = (id, data)   => api.put(`/api/finance/goals/${id}`, data).then(r => r.data);
export const deleteGoal          = (id)         => api.delete(`/api/finance/goals/${id}`);

export const getSubscriptions    = ()           => api.get('/api/finance/subscriptions').then(r => r.data);
export const createSubscription  = (data)       => api.post('/api/finance/subscriptions', data).then(r => r.data);
export const deleteSubscription  = (id)         => api.delete(`/api/finance/subscriptions/${id}`);
