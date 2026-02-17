const prisma = require("../config/prisma");

const createRefreshToken = async ({
  userId,
  token,
  expiresIn,
  device,
  ipAddress,
}) => {
  return prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      device,
      ipAddress,
    },
  });
};

const findValidRefreshToken = async ({ token, userId }) => {
  return prisma.refreshToken.findFirst({
    where: {
      token,
      userId,
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
  });
};

const revokeRefreshToken = async (token) => {
  return prisma.refreshToken.updateMany({
    where: { token },
    data: { isRevoked: true },
  });
};

const revokeAllUserTokens = async (userId) => {
  return prisma.refreshToken.updateMany({
    where: { userId },
    data: { isRevoked: true },
  });
};

module.exports = {
  createRefreshToken,
  findValidRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
};
