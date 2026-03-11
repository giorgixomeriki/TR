'use strict';

const prisma = require('../lib/prisma');

/* ── Date helpers ─────────────────────────────────────── */
function monthRange(month, year) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end   = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

/* ── Summary ──────────────────────────────────────────── */
const getMonthlySummary = async (userId, month, year) => {
  const { start, end } = monthRange(month, year);

  const [incomeAgg, expenseAgg] = await Promise.all([
    prisma.income.aggregate({
      where: { userId, date: { gte: start, lt: end } },
      _sum:  { amount: true },
    }),
    prisma.expense.aggregate({
      where: { userId, date: { gte: start, lt: end } },
      _sum:  { amount: true },
    }),
  ]);

  const totalIncome   = incomeAgg._sum.amount   ?? 0;
  const totalExpenses = expenseAgg._sum.amount  ?? 0;

  return { totalIncome, totalExpenses, balance: totalIncome - totalExpenses, month, year };
};

/* ── Expenses ─────────────────────────────────────────── */
const createExpense = async (userId, { title, amount, category, date }) => {
  return prisma.expense.create({
    data: {
      userId,
      title,
      amount:   parseFloat(amount),
      category: category || 'Other',
      date:     date ? new Date(date) : new Date(),
    },
  });
};

const getExpenses = async (userId, month, year) => {
  const { start, end } = monthRange(month, year);
  return prisma.expense.findMany({
    where:   { userId, date: { gte: start, lt: end } },
    orderBy: { date: 'desc' },
  });
};

const deleteExpense = async (userId, id) => {
  const expense = await prisma.expense.findFirst({ where: { id, userId } });
  if (!expense) {
    const err = new Error('Expense not found.');
    err.status = 404;
    throw err;
  }
  return prisma.expense.delete({ where: { id } });
};

/* ── Income ───────────────────────────────────────────── */
const createIncome = async (userId, { source, amount, date }) => {
  return prisma.income.create({
    data: {
      userId,
      source,
      amount: parseFloat(amount),
      date:   date ? new Date(date) : new Date(),
    },
  });
};

const getIncome = async (userId, month, year) => {
  const { start, end } = monthRange(month, year);
  return prisma.income.findMany({
    where:   { userId, date: { gte: start, lt: end } },
    orderBy: { date: 'desc' },
  });
};

const deleteIncome = async (userId, id) => {
  const record = await prisma.income.findFirst({ where: { id, userId } });
  if (!record) {
    const err = new Error('Income record not found.');
    err.status = 404;
    throw err;
  }
  return prisma.income.delete({ where: { id } });
};

/* ── Budgets ──────────────────────────────────────────── */
const upsertBudget = async (userId, { category, limit, month, year }) => {
  return prisma.budget.upsert({
    where:  { userId_category_month_year: { userId, category, month: +month, year: +year } },
    update: { limit: parseFloat(limit) },
    create: { userId, category, limit: parseFloat(limit), month: +month, year: +year },
  });
};

const getBudgets = async (userId, month, year) => {
  const { start, end } = monthRange(month, year);

  const budgets = await prisma.budget.findMany({
    where:   { userId, month: +month, year: +year },
    orderBy: { category: 'asc' },
  });

  // Attach current spending for each budget's category
  const result = await Promise.all(
    budgets.map(async (b) => {
      const agg = await prisma.expense.aggregate({
        where: { userId, category: b.category, date: { gte: start, lt: end } },
        _sum:  { amount: true },
      });
      return { ...b, spent: agg._sum.amount ?? 0 };
    }),
  );

  return result;
};

/* ── Financial Goals ──────────────────────────────────── */
const createGoal = async (userId, { title, targetAmount }) => {
  return prisma.financialGoal.create({
    data: { userId, title, targetAmount: parseFloat(targetAmount), currentAmount: 0 },
  });
};

const getGoals = async (userId) => {
  return prisma.financialGoal.findMany({
    where:   { userId },
    orderBy: { createdAt: 'desc' },
  });
};

const updateGoal = async (userId, id, { currentAmount }) => {
  const goal = await prisma.financialGoal.findFirst({ where: { id, userId } });
  if (!goal) {
    const err = new Error('Goal not found.');
    err.status = 404;
    throw err;
  }
  return prisma.financialGoal.update({
    where: { id },
    data:  { currentAmount: Math.min(parseFloat(currentAmount), goal.targetAmount) },
  });
};

const deleteGoal = async (userId, id) => {
  const goal = await prisma.financialGoal.findFirst({ where: { id, userId } });
  if (!goal) {
    const err = new Error('Goal not found.');
    err.status = 404;
    throw err;
  }
  return prisma.financialGoal.delete({ where: { id } });
};

/* ── Subscriptions ────────────────────────────────────── */
const createSubscription = async (userId, { serviceName, amount, billingCycle, nextPaymentDate }) => {
  return prisma.subscription.create({
    data: {
      userId,
      serviceName,
      amount:          parseFloat(amount),
      billingCycle:    billingCycle || 'monthly',
      nextPaymentDate: new Date(nextPaymentDate),
    },
  });
};

const getSubscriptions = async (userId) => {
  return prisma.subscription.findMany({
    where:   { userId },
    orderBy: { nextPaymentDate: 'asc' },
  });
};

const deleteSubscription = async (userId, id) => {
  const sub = await prisma.subscription.findFirst({ where: { id, userId } });
  if (!sub) {
    const err = new Error('Subscription not found.');
    err.status = 404;
    throw err;
  }
  return prisma.subscription.delete({ where: { id } });
};

module.exports = {
  getMonthlySummary,
  createExpense, getExpenses, deleteExpense,
  createIncome,  getIncome,   deleteIncome,
  upsertBudget,  getBudgets,
  createGoal,    getGoals,    updateGoal,   deleteGoal,
  createSubscription, getSubscriptions, deleteSubscription,
};
