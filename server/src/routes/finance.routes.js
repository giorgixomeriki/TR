'use strict';

const router      = require('express').Router();
const ctrl        = require('../controllers/finance.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

/* Summary */
router.get('/summary', ctrl.getSummary);

/* Expenses */
router.post('/expenses',     ctrl.createExpense);
router.get('/expenses',      ctrl.getExpenses);
router.delete('/expenses/:id', ctrl.deleteExpense);

/* Income */
router.post('/income',       ctrl.createIncome);
router.get('/income',        ctrl.getIncome);
router.delete('/income/:id', ctrl.deleteIncome);

/* Budgets */
router.post('/budgets', ctrl.upsertBudget);
router.get('/budgets',  ctrl.getBudgets);

/* Goals */
router.post('/goals',      ctrl.createGoal);
router.get('/goals',       ctrl.getGoals);
router.put('/goals/:id',   ctrl.updateGoal);
router.delete('/goals/:id', ctrl.deleteGoal);

/* Subscriptions */
router.post('/subscriptions',      ctrl.createSubscription);
router.get('/subscriptions',       ctrl.getSubscriptions);
router.delete('/subscriptions/:id', ctrl.deleteSubscription);

module.exports = router;
