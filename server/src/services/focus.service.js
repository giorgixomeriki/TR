'use strict';

const prisma = require('../lib/prisma');

const FOCUS_COINS    = 10;
const BONUS_COINS    = 20;  // awarded every 3rd completed session per day
const XP_PER_SESSION = 50;  // XP per skill tag per session
const XP_PER_LEVEL   = 500; // XP required per level

/* ── startSession ─────────────────────────────────────── */
const startSession = async (userId, taskId) => {
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) {
    const err = new Error('Task not found or access denied.');
    err.status = 404;
    throw err;
  }
  return prisma.focusSession.create({
    data: { userId, taskId, duration: 0, completed: false },
  });
};

/* ── completeSession ──────────────────────────────────── */
const completeSession = async (sessionId, userId, { duration, note }) => {
  const session = await prisma.focusSession.findFirst({ where: { id: sessionId, userId } });
  if (!session) {
    const err = new Error('Session not found.');
    err.status = 404;
    throw err;
  }
  if (session.completed) {
    const err = new Error('Session already completed.');
    err.status = 409;
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    /* 1. Mark session complete */
    const updated = await tx.focusSession.update({
      where: { id: sessionId },
      data: {
        duration:  Math.max(1, duration ?? 1),
        note:      note || null,
        completed: true,
      },
    });

    /* 2. Award base coins */
    await tx.user.update({
      where: { id: userId },
      data:  { totalCoins: { increment: FOCUS_COINS } },
    });

    /* 3. Streak bonus — every 3rd completed session today */
    const now   = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const end   = new Date(start.getTime() + 86_400_000);
    const todayCount = await tx.focusSession.count({
      where: { userId, completed: true, createdAt: { gte: start, lt: end } },
    });

    let bonusCoins = 0;
    if (todayCount % 3 === 0) {
      bonusCoins = BONUS_COINS;
      await tx.user.update({ where: { id: userId }, data: { totalCoins: { increment: BONUS_COINS } } });
      await tx.focusSession.update({ where: { id: sessionId }, data: { bonusCoins: BONUS_COINS } });
    }

    /* 4. Award XP to each skill tagged on this task */
    const taskWithSkills = await tx.task.findUnique({
      where:   { id: session.taskId },
      include: { taskSkills: { include: { skill: true } } },
    });

    const xpGains = [];
    for (const ts of taskWithSkills?.taskSkills ?? []) {
      const existing = await tx.userSkill.findUnique({
        where: { userId_skillId: { userId, skillId: ts.skillId } },
      });

      const oldXp    = existing?.xp    ?? 0;
      const oldLevel = existing?.level ?? 1;
      const newXp    = oldXp + XP_PER_SESSION;
      const newLevel = Math.max(1, Math.floor(newXp / XP_PER_LEVEL) + 1);

      await tx.userSkill.upsert({
        where:  { userId_skillId: { userId, skillId: ts.skillId } },
        update: { xp: newXp, level: newLevel },
        create: { userId, skillId: ts.skillId, xp: newXp, level: newLevel },
      });

      xpGains.push({
        skillId:   ts.skillId,
        skillName: ts.skill.name,
        skillIcon: ts.skill.icon,
        skillColor: ts.skill.color,
        xpGained:  XP_PER_SESSION,
        newXp,
        newLevel,
        leveled:   newLevel > oldLevel,
      });
    }

    return {
      session:     updated,
      coinsEarned: FOCUS_COINS,
      bonusCoins,
      xpGains,
      todaySessions: todayCount,
    };
  });
};

/* ── getStats ─────────────────────────────────────────── */
const getStats = async (userId) => {
  const now   = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end   = new Date(start.getTime() + 86_400_000);

  const todaySessions = await prisma.focusSession.findMany({
    where: { userId, completed: true, createdAt: { gte: start, lt: end } },
  });

  const todayMinutes = Math.floor(
    todaySessions.reduce((s, ses) => s + ses.duration, 0) / 60,
  );

  const [streak, totalSessions] = await Promise.all([
    _calcStreak(userId),
    prisma.focusSession.count({ where: { userId, completed: true } }),
  ]);

  return {
    todayMinutes,
    todaySessions: todaySessions.length,
    streak,
    totalSessions,
  };
};

/* ── _calcStreak (internal) ───────────────────────────── */
const _calcStreak = async (userId) => {
  const rows = await prisma.focusSession.findMany({
    where:   { userId, completed: true },
    select:  { createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  if (rows.length === 0) return 0;

  const dates = [
    ...new Set(rows.map((r) => r.createdAt.toISOString().split('T')[0])),
  ];

  const today     = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];

  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = Math.round((prev - curr) / 86_400_000);
    if (diff === 1) streak++;
    else break;
  }

  return streak;
};

module.exports = { startSession, completeSession, getStats };
