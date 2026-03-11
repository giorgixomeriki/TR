'use strict';

const prisma = require('../lib/prisma');

const XP_PER_WORKOUT = 10;
const XP_PER_LEVEL   = 100;

/* ── Default exercise library ───────────────────────── */
const DEFAULT_EXERCISES = [
  { name: 'Bench Press',       muscleGroup: 'Chest',     description: 'Barbell bench press — classic chest compound' },
  { name: 'Incline Dumbbell Press', muscleGroup: 'Chest', description: 'Upper chest focus with dumbbells' },
  { name: 'Push-Up',           muscleGroup: 'Chest',     description: 'Bodyweight chest press' },
  { name: 'Pull-Up',           muscleGroup: 'Back',      description: 'Bodyweight vertical pull' },
  { name: 'Barbell Row',       muscleGroup: 'Back',      description: 'Horizontal pull for mid-back thickness' },
  { name: 'Lat Pulldown',      muscleGroup: 'Back',      description: 'Cable pulldown for lat width' },
  { name: 'Deadlift',          muscleGroup: 'Back',      description: 'Full posterior chain compound' },
  { name: 'Overhead Press',    muscleGroup: 'Shoulders', description: 'Barbell or dumbbell press overhead' },
  { name: 'Lateral Raise',     muscleGroup: 'Shoulders', description: 'Medial delt isolation' },
  { name: 'Face Pull',         muscleGroup: 'Shoulders', description: 'Rear delt and rotator cuff' },
  { name: 'Barbell Curl',      muscleGroup: 'Arms',      description: 'Classic bicep barbell curl' },
  { name: 'Tricep Pushdown',   muscleGroup: 'Arms',      description: 'Cable pushdown for tricep isolation' },
  { name: 'Hammer Curl',       muscleGroup: 'Arms',      description: 'Brachialis and bicep curl' },
  { name: 'Squat',             muscleGroup: 'Legs',      description: 'Barbell back squat — king of leg exercises' },
  { name: 'Romanian Deadlift', muscleGroup: 'Legs',      description: 'Hamstring hinge movement' },
  { name: 'Leg Press',         muscleGroup: 'Legs',      description: 'Machine quad-dominant press' },
  { name: 'Leg Curl',          muscleGroup: 'Legs',      description: 'Hamstring isolation machine' },
  { name: 'Calf Raise',        muscleGroup: 'Legs',      description: 'Standing or seated calf isolation' },
  { name: 'Plank',             muscleGroup: 'Core',      description: 'Isometric core stability hold' },
  { name: 'Cable Crunch',      muscleGroup: 'Core',      description: 'Weighted ab flexion' },
];

/* ── Seed exercises (idempotent) ─────────────────────── */
const seedExercises = async () => {
  await prisma.gymExercise.createMany({
    data:           DEFAULT_EXERCISES,
    skipDuplicates: true,
  });
};

/* ── Workout CRUD ────────────────────────────────────── */
const getWorkouts = async (userId) => {
  return prisma.workout.findMany({
    where:   { userId },
    include: {
      exercises: {
        include: { exercise: true },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
};

const createWorkout = async (userId, { title, dayOfWeek, exercises = [] }) => {
  return prisma.workout.create({
    data: {
      userId,
      title,
      dayOfWeek: dayOfWeek || null,
      exercises: {
        create: exercises.map((ex, i) => ({
          exerciseId: ex.exerciseId,
          sets:       ex.sets  ?? 3,
          reps:       ex.reps  ?? 10,
          weight:     ex.weight ?? null,
          order:      i,
        })),
      },
    },
    include: {
      exercises: { include: { exercise: true }, orderBy: { order: 'asc' } },
    },
  });
};

const updateWorkout = async (userId, workoutId, { title, dayOfWeek, exercises }) => {
  // Verify ownership
  const existing = await prisma.workout.findFirst({ where: { id: workoutId, userId } });
  if (!existing) throw Object.assign(new Error('Not found'), { status: 404 });

  return prisma.$transaction(async (tx) => {
    await tx.workout.update({
      where: { id: workoutId },
      data:  { title, dayOfWeek: dayOfWeek ?? null },
    });

    if (exercises !== undefined) {
      // Replace all exercises
      await tx.workoutExercise.deleteMany({ where: { workoutId } });
      if (exercises.length > 0) {
        await tx.workoutExercise.createMany({
          data: exercises.map((ex, i) => ({
            workoutId,
            exerciseId: ex.exerciseId,
            sets:       ex.sets  ?? 3,
            reps:       ex.reps  ?? 10,
            weight:     ex.weight ?? null,
            order:      i,
          })),
        });
      }
    }

    return tx.workout.findUnique({
      where:   { id: workoutId },
      include: { exercises: { include: { exercise: true }, orderBy: { order: 'asc' } } },
    });
  });
};

const deleteWorkout = async (userId, workoutId) => {
  const existing = await prisma.workout.findFirst({ where: { id: workoutId, userId } });
  if (!existing) throw Object.assign(new Error('Not found'), { status: 404 });
  await prisma.workout.delete({ where: { id: workoutId } });
};

/* ── Exercise library ────────────────────────────────── */
const getExercises = async () => {
  return prisma.gymExercise.findMany({ orderBy: [{ muscleGroup: 'asc' }, { name: 'asc' }] });
};

/* ── Sessions ────────────────────────────────────────── */
const createSession = async (userId, workoutId) => {
  const data = { userId, date: new Date() };
  if (workoutId) data.workoutId = workoutId;

  return prisma.workoutSession.create({
    data,
    include: {
      workout: {
        include: { exercises: { include: { exercise: true }, orderBy: { order: 'asc' } } },
      },
    },
  });
};

const completeSession = async (userId, sessionId, { durationMin, notes, sets = [] }) => {
  const session = await prisma.workoutSession.findFirst({ where: { id: sessionId, userId } });
  if (!session) throw Object.assign(new Error('Not found'), { status: 404 });

  return prisma.$transaction(async (tx) => {
    // Save sets
    if (sets.length > 0) {
      await tx.sessionSet.deleteMany({ where: { sessionId } });
      await tx.sessionSet.createMany({
        data: sets.map((s) => ({
          sessionId,
          exerciseId: s.exerciseId,
          setNumber:  s.setNumber,
          reps:       s.reps    ?? null,
          weight:     s.weight  ?? null,
          completed:  s.completed ?? true,
        })),
      });
    }

    // Mark session complete
    const updated = await tx.workoutSession.update({
      where: { id: sessionId },
      data:  { completed: true, durationMin: durationMin ?? null, notes: notes ?? null },
    });

    // Award XP to Fitness skill
    const fitnessSkill = await tx.skill.upsert({
      where:  { name: 'Fitness' },
      create: { name: 'Fitness', category: 'fitness', icon: '💪', color: '#f59e0b' },
      update: {},
    });

    const current = await tx.userSkill.findUnique({
      where: { userId_skillId: { userId, skillId: fitnessSkill.id } },
    });

    const newXp    = (current?.xp ?? 0) + XP_PER_WORKOUT;
    const newLevel = Math.min(10, Math.floor(newXp / XP_PER_LEVEL) + 1);

    await tx.userSkill.upsert({
      where:  { userId_skillId: { userId, skillId: fitnessSkill.id } },
      create: { userId, skillId: fitnessSkill.id, xp: XP_PER_WORKOUT, level: 1 },
      update: { xp: newXp, level: newLevel },
    });

    return { ...updated, xpEarned: XP_PER_WORKOUT };
  });
};

/* ── Stats ───────────────────────────────────────────── */
const getStats = async (userId) => {
  const now       = new Date();
  const todayUTC  = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const weekStart = new Date(todayUTC.getTime() - 6 * 86_400_000);

  const [allSessions, weeklySessions] = await Promise.all([
    prisma.workoutSession.findMany({
      where:   { userId, completed: true },
      select:  { date: true },
      orderBy: { date: 'desc' },
    }),
    prisma.workoutSession.count({
      where: { userId, completed: true, date: { gte: weekStart } },
    }),
  ]);

  // Streak — consecutive unique days
  const uniqueDays = [
    ...new Set(
      allSessions.map((s) => {
        const d = new Date(s.date);
        return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      })
    ),
  ].sort((a, b) => b - a);

  let streak = 0;
  if (uniqueDays.length > 0) {
    const todayMs     = todayUTC.getTime();
    const yesterdayMs = todayMs - 86_400_000;
    if (uniqueDays[0] === todayMs || uniqueDays[0] === yesterdayMs) {
      streak = 1;
      for (let i = 1; i < uniqueDays.length; i++) {
        if (uniqueDays[i - 1] - uniqueDays[i] === 86_400_000) streak++;
        else break;
      }
    }
  }

  return {
    streak,
    weeklySessions,
    totalSessions: allSessions.length,
  };
};

/* ── Body stats ──────────────────────────────────────── */
const getBodyStats = async (userId) => {
  return prisma.bodyStat.findMany({
    where:   { userId },
    orderBy: { createdAt: 'desc' },
    take:    30,
  });
};

const addBodyStat = async (userId, data) => {
  return prisma.bodyStat.create({
    data: {
      userId,
      weight:  data.weight  ?? null,
      bodyFat: data.bodyFat ?? null,
      chest:   data.chest   ?? null,
      arms:    data.arms    ?? null,
      waist:   data.waist   ?? null,
    },
  });
};

module.exports = {
  seedExercises,
  getWorkouts,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  getExercises,
  createSession,
  completeSession,
  getStats,
  getBodyStats,
  addBodyStat,
};
