'use strict';

const svc = require('../services/finance.service');

/* ── Shared month/year extraction ─────────────────────── */
function getMonthYear(query) {
  const now   = new Date();
  const month = parseInt(query.month) || (now.getMonth() + 1);
  const year  = parseInt(query.year)  || now.getFullYear();
  return { month, year };
}

/* ── Summary ──────────────────────────────────────────── */
const getSummary = async (req, res, next) => {
  try {
    const { month, year } = getMonthYear(req.query);
    const data = await svc.getMonthlySummary(req.user.id, month, year);
    res.json(data);
  } catch (err) { next(err); }
};

/* ── Expenses ─────────────────────────────────────────── */
const createExpense = async (req, res, next) => {
  try {
    const expense = await svc.createExpense(req.user.id, req.body);
    res.status(201).json(expense);
  } catch (err) { next(err); }
};

const getExpenses = async (req, res, next) => {
  try {
    const { month, year } = getMonthYear(req.query);
    const expenses = await svc.getExpenses(req.user.id, month, year);
    res.json(expenses);
  } catch (err) { next(err); }
};

const deleteExpense = async (req, res, next) => {
  try {
    await svc.deleteExpense(req.user.id, req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
};

/* ── Income ───────────────────────────────────────────── */
const createIncome = async (req, res, next) => {
  try {
    const income = await svc.createIncome(req.user.id, req.body);
    res.status(201).json(income);
  } catch (err) { next(err); }
};

const getIncome = async (req, res, next) => {
  try {
    const { month, year } = getMonthYear(req.query);
    const income = await svc.getIncome(req.user.id, month, year);
    res.json(income);
  } catch (err) { next(err); }
};

const deleteIncome = async (req, res, next) => {
  try {
    await svc.deleteIncome(req.user.id, req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
};

/* ── Budgets ──────────────────────────────────────────── */
const upsertBudget = async (req, res, next) => {
  try {
    const budget = await svc.upsertBudget(req.user.id, req.body);
    res.status(200).json(budget);
  } catch (err) { next(err); }
};

const getBudgets = async (req, res, next) => {
  try {
    const { month, year } = getMonthYear(req.query);
    const budgets = await svc.getBudgets(req.user.id, month, year);
    res.json(budgets);
  } catch (err) { next(err); }
};

/* ── Goals ────────────────────────────────────────────── */
const createGoal = async (req, res, next) => {
  try {
    const goal = await svc.createGoal(req.user.id, req.body);
    res.status(201).json(goal);
  } catch (err) { next(err); }
};

const getGoals = async (req, res, next) => {
  try {
    const goals = await svc.getGoals(req.user.id);
    res.json(goals);
  } catch (err) { next(err); }
};

const updateGoal = async (req, res, next) => {
  try {
    const goal = await svc.updateGoal(req.user.id, req.params.id, req.body);
    res.json(goal);
  } catch (err) { next(err); }
};

const deleteGoal = async (req, res, next) => {
  try {
    await svc.deleteGoal(req.user.id, req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
};

/* ── Subscriptions ────────────────────────────────────── */
const createSubscription = async (req, res, next) => {
  try {
    const sub = await svc.createSubscription(req.user.id, req.body);
    res.status(201).json(sub);
  } catch (err) { next(err); }
};

const getSubscriptions = async (req, res, next) => {
  try {
    const subs = await svc.getSubscriptions(req.user.id);
    res.json(subs);
  } catch (err) { next(err); }
};

const deleteSubscription = async (req, res, next) => {
  try {
    await svc.deleteSubscription(req.user.id, req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
};

module.exports = {
  getSummary,
  createExpense, getExpenses, deleteExpense,
  createIncome,  getIncome,   deleteIncome,
  upsertBudget,  getBudgets,
  createGoal,    getGoals,    updateGoal,   deleteGoal,
  createSubscription, getSubscriptions, deleteSubscription,
};
