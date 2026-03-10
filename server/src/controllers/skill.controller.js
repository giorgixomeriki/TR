const prisma = require('../lib/prisma');

/* GET /api/skills — all available skills */
const getAllSkills = async (req, res, next) => {
  try {
    const skills = await prisma.skill.findMany({ orderBy: { name: 'asc' } });
    res.status(200).json(skills);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllSkills };
