export const XP_PER_LEVEL = 100;
export const MAX_LEVEL    = 10;

export const calcLevel    = (xp) => Math.min(MAX_LEVEL, Math.floor(xp / XP_PER_LEVEL) + 1);
export const xpIntoLevel  = (xp) => xp % XP_PER_LEVEL;
export const xpToNextLevel = (xp) => {
  if (calcLevel(xp) >= MAX_LEVEL) return 0;
  return XP_PER_LEVEL - xpIntoLevel(xp);
};
export const levelProgress = (xp) => {
  if (calcLevel(xp) >= MAX_LEVEL) return 1;
  return xpIntoLevel(xp) / XP_PER_LEVEL;
};

export const LEVEL_NAMES = [
  '', 'Novice', 'Beginner', 'Apprentice', 'Student', 'Skilled',
  'Practiced', 'Advanced', 'Expert', 'Master', 'Grandmaster',
];
