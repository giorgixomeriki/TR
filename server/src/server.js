require('dotenv').config();
const app = require('./app');
const { seedExercises } = require('./services/gym.service');
const prisma = require('./lib/prisma');

// Railway injects PORT automatically. Fallback to 3000 for other environments.
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`\n🚀 TaskFlow server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health\n`);

  // Seed reference data (idempotent — safe to run on every start)
  await seedExercises().catch((e) => console.error('Exercise seed failed:', e));
  await seedSkills().catch((e) => console.error('Skills seed failed:', e));
});

async function seedSkills() {
  const SKILLS = [
    { name: 'Programming',   category: 'Technical', icon: '⌨',  color: '#3b82f6' },
    { name: 'Learning',      category: 'Growth',    icon: '📚', color: '#8b5cf6' },
    { name: 'Business',      category: 'Career',    icon: '💼', color: '#f59e0b' },
    { name: 'Communication', category: 'Social',    icon: '🗣',  color: '#10b981' },
    { name: 'Fitness',       category: 'Health',    icon: '💪', color: '#ef4444' },
    { name: 'Creativity',    category: 'Creative',  icon: '🎨', color: '#ec4899' },
    { name: 'Discipline',    category: 'Mindset',   icon: '🎯', color: '#64748b' },
  ];

  for (const skill of SKILLS) {
    await prisma.skill.upsert({
      where:  { name: skill.name },
      update: { category: skill.category, icon: skill.icon, color: skill.color },
      create: skill,
    });
  }
}
