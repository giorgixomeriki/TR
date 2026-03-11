'use strict';

const prisma = require('../lib/prisma');

/* ── XP per difficulty ─────────────────────────────────── */
const XP_MAP = { EASY: 3, MEDIUM: 5, HARD: 10 };
const XP_PER_LEVEL = 500;

/* ── UTC midnight for today ────────────────────────────── */
function todayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/* ── getHabits ─────────────────────────────────────────── */
const getHabits = async (userId) => {
  const today    = todayUTC();
  const tomorrow = new Date(today.getTime() + 86_400_000);

  const habits = await prisma.habit.findMany({
    where:   { userId },
    include: {
      skill: { select: { id: true, name: true, icon: true, color: true } },
      completions: { where: { date: { gte: today, lt: tomorrow } } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return habits.map(({ completions, ...h }) => ({
    ...h,
    completedToday: completions.length > 0,
  }));
};

/* ── createHabit ───────────────────────────────────────── */
const createHabit = async (userId, { title, category, skillId, difficulty }) => {
  if (!title?.trim()) {
    const err = new Error('Title is required.');
    err.status = 400;
    throw err;
  }
  return prisma.habit.create({
    data: {
      userId,
      title:      title.trim(),
      category:   category || 'General',
      skillId:    skillId  || null,
      difficulty: difficulty || 'MEDIUM',
    },
    include: { skill: { select: { id: true, name: true, icon: true, color: true } } },
  });
};

/* ── updateHabit ───────────────────────────────────────── */
const updateHabit = async (userId, habitId, data) => {
  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
  if (!habit) {
    const err = new Error('Habit not found.');
    err.status = 404;
    throw err;
  }
  return prisma.habit.update({
    where: { id: habitId },
    data: {
      ...(data.title      !== undefined && { title:      data.title.trim() }),
      ...(data.category   !== undefined && { category:   data.category }),
      ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
      ...(data.skillId    !== undefined && { skillId:    data.skillId || null }),
    },
    include: { skill: { select: { id: true, name: true, icon: true, color: true } } },
  });
};

/* ── deleteHabit ───────────────────────────────────────── */
const deleteHabit = async (userId, habitId) => {
  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
  if (!habit) {
    const err = new Error('Habit not found.');
    err.status = 404;
    throw err;
  }
  return prisma.habit.delete({ where: { id: habitId } });
};

/* ── completeHabit (toggle) ────────────────────────────── */
const completeHabit = async (userId, habitId) => {
  const habit = await prisma.habit.findFirst({
    where:   { id: habitId, userId },
    include: { skill: { select: { id: true, name: true, icon: true, color: true } } },
  });
  if (!habit) {
    const err = new Error('Habit not found.');
    err.status = 404;
    throw err;
  }

  const today    = todayUTC();
  const tomorrow = new Date(today.getTime() + 86_400_000);

  return prisma.$transaction(async (tx) => {
    /* Check existing completion for today */
    const existing = await tx.habitCompletion.findFirst({
      where: { habitId, date: { gte: today, lt: tomorrow } },
    });

    /* ── UNCHECK: remove today's completion ── */
    if (existing) {
      await tx.habitCompletion.delete({ where: { id: existing.id } });

      /* Recalculate streak from completions before today */
      const newStreak = await _streakBeforeToday(tx, habitId, today);
      await tx.habit.update({
        where: { id: habitId },
        data:  { currentStreak: newStreak },
      });
      return { completedToday: false, currentStreak: newStreak, xpGained: 0 };
    }

    /* ── CHECK: create today's completion ── */
    await tx.habitCompletion.create({ data: { habitId, date: today } });

    /* Streak: if yesterday was completed, continue; else reset to 1 */
    const yesterday = new Date(today.getTime() - 86_400_000);
    const hadYesterday = await tx.habitCompletion.findFirst({
      where: { habitId, date: { gte: yesterday, lt: today } },
    });

    const newStreak = hadYesterday ? habit.currentStreak + 1 : 1;
    const newBest   = Math.max(habit.bestStreak, newStreak);

    await tx.habit.update({
      where: { id: habitId },
      data:  { currentStreak: newStreak, bestStreak: newBest },
    });

    /* Award XP to connected skill */
    let xpGained = 0;
    let xpResult = null;

    if (habit.skillId) {
      xpGained = XP_MAP[habit.difficulty] ?? 5;

      const existingSkill = await tx.userSkill.findUnique({
        where: { userId_skillId: { userId, skillId: habit.skillId } },
      });

      const oldXp    = existingSkill?.xp    ?? 0;
      const oldLevel = existingSkill?.level ?? 1;
      const newXp    = oldXp + xpGained;
      const newLevel = Math.max(1, Math.floor(newXp / XP_PER_LEVEL) + 1);

      await tx.userSkill.upsert({
        where:  { userId_skillId: { userId, skillId: habit.skillId } },
        update: { xp: newXp, level: newLevel },
        create: { userId, skillId: habit.skillId, xp: newXp, level: newLevel },
      });

      xpResult = {
        skillId:   habit.skillId,
        skillName: habit.skill?.name,
        skillIcon: habit.skill?.icon,
        skillColor: habit.skill?.color,
        xpGained,
        newXp,
        newLevel,
        leveled: newLevel > oldLevel,
      };
    }

    return { completedToday: true, currentStreak: newStreak, bestStreak: newBest, xpGained, xpResult };
  });
};

/* ── getStats ──────────────────────────────────────────── */
const getStats = async (userId) => {
  const today    = todayUTC();
  const tomorrow = new Date(today.getTime() + 86_400_000);

  const habits = await prisma.habit.findMany({
    where:   { userId },
    include: { completions: { where: { date: { gte: today, lt: tomorrow } } } },
  });

  const completedToday     = habits.filter((h) => h.completions.length > 0).length;
  const totalHabits        = habits.length;
  const bestCurrentStreak  = habits.reduce((m, h) => Math.max(m, h.currentStreak), 0);
  const bestEverStreak     = habits.reduce((m, h) => Math.max(m, h.bestStreak), 0);

  return { completedToday, totalHabits, bestCurrentStreak, bestEverStreak };
};

/* ── getHeatmap ────────────────────────────────────────── */
const getHeatmap = async (userId, weeks = 16) => {
  const days    = weeks * 7;
  const today   = todayUTC();
  const fromDay = new Date(today.getTime() - (days - 1) * 86_400_000);

  const completions = await prisma.habitCompletion.findMany({
    where:  { habit: { userId }, date: { gte: fromDay } },
    select: { date: true },
  });

  /* Count completions per UTC-date string */
  const map = {};
  for (const { date } of completions) {
    const key = date.toISOString().split('T')[0];
    map[key] = (map[key] || 0) + 1;
  }

  /* Return every day in the window (gaps = 0) */
  const result = [];
  for (let i = 0; i < days; i++) {
    const d   = new Date(fromDay.getTime() + i * 86_400_000);
    const key = d.toISOString().split('T')[0];
    result.push({ date: key, count: map[key] || 0 });
  }
  return result;
};

/* ── _streakBeforeToday (internal) ────────────────────── */
async function _streakBeforeToday(tx, habitId, today) {
  const completions = await tx.habitCompletion.findMany({
    where:   { habitId, date: { lt: today } },
    orderBy: { date: 'desc' },
    select:  { date: true },
  });

  if (completions.length === 0) return 0;

  const yesterday = new Date(today.getTime() - 86_400_000);
  const diff = Math.round(
    (yesterday.getTime() - completions[0].date.getTime()) / 86_400_000,
  );
  if (diff !== 0) return 0; // most recent completion wasn't yesterday

  let streak = 1;
  for (let i = 1; i < completions.length; i++) {
    const prev = completions[i - 1].date;
    const curr = completions[i].date;
    const d    = Math.round((prev.getTime() - curr.getTime()) / 86_400_000);
    if (d === 1) streak++;
    else break;
  }
  return streak;
}

module.exports = { getHabits, createHabit, updateHabit, deleteHabit, completeHabit, getStats, getHeatmap };
