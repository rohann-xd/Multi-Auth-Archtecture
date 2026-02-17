const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");

// Find active client by clientId
const findActiveClient = async (clientId) => {
  return prisma.client.findFirst({
    where: {
      clientId,
      isActive: true,
    },
  });
};

// Compare client secret
const compareClientSecret = async (plain, hashed) => {
  return bcrypt.compare(plain, hashed);
};

// Create client (used by admin/seed only)
const createClient = async ({ clientId, clientName, clientSecret }) => {
  const hashedSecret = await bcrypt.hash(clientSecret, 10);

  return prisma.client.create({
    data: {
      clientId,
      clientName,
      clientSecret: hashedSecret,
      isActive: true,
    },
    select: {
      id: true,
      clientId: true,
      clientName: true,
      isActive: true,
      createdAt: true,
    },
  });
};

module.exports = {
  findActiveClient,
  compareClientSecret,
  createClient,
};
