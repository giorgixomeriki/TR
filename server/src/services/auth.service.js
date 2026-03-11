const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { generateToken } = require('../utils/jwt');

const register = async ({ name, email, password }) => {
  // Normalise: strip whitespace and force lowercase so "User@Test.com " matches "user@test.com"
  const normalisedEmail = email.trim().toLowerCase();

  console.log(`[register] attempt — email: "${normalisedEmail}"`);

  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.user.create({
      data: { name: name.trim(), email: normalisedEmail, password: hashedPassword },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    console.log(`[register] success — userId: ${user.id}`);
    const token = generateToken(user.id);
    return { user, token };
  } catch (err) {
    // P2002 = Prisma unique constraint violation
    if (err.code === 'P2002') {
      console.log(`[register] conflict — "${normalisedEmail}" already exists`);
      const conflict = new Error('An account with this email already exists.');
      conflict.statusCode = 409;
      throw conflict;
    }
    throw err;
  }
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user.id);
  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
};

module.exports = { register, login };
