const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SKILLS = [
  { name: 'Programming',    category: 'Technical', icon: '⌨',  color: '#3b82f6' },
  { name: 'Learning',       category: 'Growth',    icon: '📚', color: '#8b5cf6' },
  { name: 'Business',       category: 'Career',    icon: '💼', color: '#f59e0b' },
  { name: 'Communication',  category: 'Social',    icon: '🗣',  color: '#10b981' },
  { name: 'Fitness',        category: 'Health',    icon: '💪', color: '#ef4444' },
  { name: 'Creativity',     category: 'Creative',  icon: '🎨', color: '#ec4899' },
  { name: 'Discipline',     category: 'Mindset',   icon: '🎯', color: '#64748b' },
];

async function main() {
  console.log('Seeding skills...');
  for (const skill of SKILLS) {
    await prisma.skill.upsert({
      where:  { name: skill.name },
      update: { category: skill.category, icon: skill.icon, color: skill.color },
      create: skill,
    });
  }
  console.log(`✓ ${SKILLS.length} skills seeded.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
