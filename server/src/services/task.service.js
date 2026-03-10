const prisma = require('../lib/prisma');

const XP_PER_TASK  = 10;
const MAX_LEVEL    = 10;
const XP_PER_LEVEL = 100;

const calcLevel = (xp) => Math.min(MAX_LEVEL, Math.floor(xp / XP_PER_LEVEL) + 1);

/* ── Lightweight ownership check (no heavy includes) ── */
const findTask = async (id, userId) => {
  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) {
    const error = new Error('Task not found.');
    error.statusCode = 404;
    throw error;
  }
  return task;
};

/* ── Full task detail (workspace) ── */
const getTaskById = async (id, userId) => {
  const task = await prisma.task.findFirst({
    where: { id, userId },
    include: {
      subtasks:    { orderBy: { createdAt: 'asc' } },
      attachments: { orderBy: { createdAt: 'asc' } },
      taskSkills:  { include: { skill: true }, orderBy: { skill: { name: 'asc' } } },
    },
  });
  if (!task) {
    const error = new Error('Task not found.');
    error.statusCode = 404;
    throw error;
  }
  return task;
};

/* ── Kanban list (lean) ── */
const getAllTasks = async (userId) => {
  return prisma.task.findMany({
    where:   { userId },
    orderBy: { createdAt: 'asc' },
    include: {
      taskSkills: { select: { skillId: true } },
    },
  });
};

/* ── Create task (with optional skill tags) ── */
const createTask = async ({ title, description, status, dueDate, rewardCoins, skillIds, userId }) => {
  const resolvedStatus = status || 'TODO';
  const coinsAwarded   = resolvedStatus === 'DONE'; // never awarded on creation

  const task = await prisma.task.create({
    data: {
      title,
      description:  description || null,
      status:       resolvedStatus,
      dueDate:      dueDate ? new Date(dueDate) : null,
      rewardCoins:  rewardCoins ?? 10,
      coinsAwarded,
      userId,
    },
  });

  if (skillIds?.length > 0) {
    await prisma.taskSkill.createMany({
      data:           skillIds.map((skillId) => ({ taskId: task.id, skillId })),
      skipDuplicates: true,
    });
  }

  return task;
};

/* ── Update task (coins + XP in a single interactive transaction) ── */
const updateTask = async (id, userId, data) => {
  const existing = await findTask(id, userId);

  const patch = {};
  if (data.title       !== undefined) patch.title       = data.title;
  if (data.description !== undefined) patch.description = data.description;
  if (data.notes       !== undefined) patch.notes       = data.notes;
  if (data.status      !== undefined) patch.status      = data.status;
  if ('dueDate' in data)              patch.dueDate     = data.dueDate ? new Date(data.dueDate) : null;
  if (data.rewardCoins !== undefined) patch.rewardCoins = data.rewardCoins;

  const becomingDone = data.status === 'DONE' && existing.status !== 'DONE';
  const shouldAward  = becomingDone && !existing.coinsAwarded;
  if (shouldAward) patch.coinsAwarded = true;

  return prisma.$transaction(async (tx) => {
    // 1. Update task fields
    const updatedTask = await tx.task.update({ where: { id }, data: patch });

    // 2. Replace skill tags if provided
    if (data.skillIds !== undefined) {
      await tx.taskSkill.deleteMany({ where: { taskId: id } });
      if (data.skillIds.length > 0) {
        await tx.taskSkill.createMany({
          data:           data.skillIds.map((skillId) => ({ taskId: id, skillId })),
          skipDuplicates: true,
        });
      }
    }

    if (!shouldAward) {
      return { ...updatedTask, coinsEarned: 0, xpAwarded: [] };
    }

    // 3. Award coins
    await tx.user.update({
      where: { id: userId },
      data:  { totalCoins: { increment: existing.rewardCoins } },
    });

    // 4. Award XP to each tagged skill — idempotent via coinsAwarded gate
    const taskSkillRows = await tx.taskSkill.findMany({ where: { taskId: id } });
    const xpAwarded = [];

    for (const { skillId } of taskSkillRows) {
      const current = await tx.userSkill.findUnique({
        where: { userId_skillId: { userId, skillId } },
      });
      const prevXp   = current?.xp ?? 0;
      const newXp    = prevXp + XP_PER_TASK;
      const newLevel = calcLevel(newXp);
      const prevLevel = current?.level ?? 0;

      await tx.userSkill.upsert({
        where:  { userId_skillId: { userId, skillId } },
        create: { userId, skillId, xp: XP_PER_TASK, level: 1 },
        update: { xp: newXp, level: newLevel },
      });

      xpAwarded.push({ skillId, xpGained: XP_PER_TASK, newXp, newLevel, leveledUp: newLevel > prevLevel });
    }

    return { ...updatedTask, coinsEarned: existing.rewardCoins, xpAwarded };
  });
};

/* ── Delete task ── */
const deleteTask = async (id, userId) => {
  await findTask(id, userId);
  return prisma.task.delete({ where: { id } });
};

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask };
