const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");

// Create user
const createUser = async ({ name, email, password }) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });
};

// Find user by email
const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: {
      email: email.toLowerCase().trim(),
    },
  });
};

// Compare password
const comparePassword = async (plain, hashed) => {
  return bcrypt.compare(plain, hashed);
};

// Find user by Id
const findUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
  });
};

module.exports = {
  createUser,
  findUserByEmail,
  comparePassword,
  findUserById,
};
