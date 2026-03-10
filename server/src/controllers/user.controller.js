const prisma = require('../lib/prisma');

const getCoins = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { totalCoins: true },
    });
    res.status(200).json({ totalCoins: user?.totalCoins ?? 0 });
  } catch (error) {
    next(error);
  }
};

/* GET /api/user/skills — user's skill progress with skill metadata */
const getUserSkills = async (req, res, next) => {
  try {
    const userSkills = await prisma.userSkill.findMany({
      where:   { userId: req.user.id },
      include: { skill: true },
      orderBy: { skill: { name: 'asc' } },
    });
    res.status(200).json(userSkills);
  } catch (error) {
    next(error);
  }
};

module.exports = { getCoins, getUserSkills };
