const userRepository = require("../repositories/user.repository");
const refreshTokenRepository = require("../repositories/refreshToken.repository");
const { AppError } = require("../middlewares/errorHandler");

const {
  generateAccessToken,
  generateRefreshTokenString,
  getRefreshTokenExpiry,
} = require("../utils/jwt.utils");

// ===============================
// Register
// ===============================
const registerUser = async ({ name, email, password }) => {
  if (!name || !email || !password) {
    throw new AppError("Name, email, and password are required.", 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await userRepository.findUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new AppError("User with this email already exists.", 409);
  }

  const user = await userRepository.createUser({
    name,
    email: normalizedEmail,
    password,
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
};

// ===============================
// Login
// ===============================
const loginUser = async ({
  email,
  password,
  device = "unknown",
  ipAddress = null,
}) => {
  if (!email || !password) {
    throw new AppError("Email and password are required.", 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await userRepository.findUserByEmail(normalizedEmail);

  if (!user) {
    throw new AppError("Invalid credentials.", 401);
  }

  const isPasswordValid = await userRepository.comparePassword(
    password,
    user.password,
  );

  if (!isPasswordValid) {
    throw new AppError("Invalid credentials.", 401);
  }

  // 1. Generate access token
  const accessToken = await generateAccessToken(user.id);

  // 2. Generate refresh token (random string)
  const refreshTokenValue = generateRefreshTokenString();
  const refreshExpiresIn = getRefreshTokenExpiry();

  // 3. Store refresh token in DB
  await refreshTokenRepository.createRefreshToken({
    userId: user.id,
    token: refreshTokenValue,
    expiresIn: refreshExpiresIn,
    device,
    ipAddress,
  });

  return {
    accessToken,
    refreshToken: refreshTokenValue,
    refreshTokenExpiresIn: refreshExpiresIn,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
};

// ===============================
// Refresh Tokens (Rotation)
// ===============================
const refreshAuthTokens = async ({
  refreshToken,
  userId,
  device = "unknown",
  ipAddress = null,
}) => {
  if (!refreshToken || !userId) {
    throw new AppError("Refresh token and userId are required.", 400);
  }

  const validToken = await refreshTokenRepository.findValidRefreshToken({
    token: refreshToken,
    userId,
  });

  if (!validToken) {
    throw new AppError("Invalid or expired refresh token.", 401);
  }

  // 1. Revoke old refresh token
  await refreshTokenRepository.revokeRefreshToken(refreshToken);

  // 2. Issue new access token
  const newAccessToken = await generateAccessToken(userId);

  // 3. Issue new refresh token
  const newRefreshTokenValue = generateRefreshTokenString();
  const refreshExpiresIn = getRefreshTokenExpiry();

  await refreshTokenRepository.createRefreshToken({
    userId,
    token: newRefreshTokenValue,
    expiresIn: refreshExpiresIn,
    device,
    ipAddress,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshTokenValue,
    refreshTokenExpiresIn: refreshExpiresIn,
  };
};

module.exports = {
  registerUser,
  loginUser,
  refreshAuthTokens,
};
