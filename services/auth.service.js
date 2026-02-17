const userRepository = require("../repositories/user.repository");
const refreshTokenRepository = require("../repositories/refreshToken.repository");
const clientRepository = require("../repositories/client.repository");
const { AppError } = require("../middlewares/errorHandler");

const {
  generateAccessToken,
  generateRefreshTokenString,
  getRefreshTokenExpiry,
  decryptAndVerifyJWT
} = require("../utils/jwt.utils");

// ===============================
// Validate Client Helper
// ===============================
const validateClient = async (clientId, clientSecret) => {
  if (!clientId || !clientSecret) {
    throw new AppError("Client credentials are required.", 401);
  }

  const client = await clientRepository.findActiveClient(clientId);

  if (!client) {
    throw new AppError("Unauthorized client.", 401);
  }

  const isValidSecret = await clientRepository.compareClientSecret(
    clientSecret,
    client.clientSecret,
  );

  if (!isValidSecret) {
    throw new AppError("Unauthorized client.", 401);
  }

  return client;
};

// ===============================
// Register
// ===============================
const registerUser = async ({
  name,
  email,
  password,
  clientId,
  clientSecret,
}) => {
  if (!name || !email || !password) {
    throw new AppError("Name, email, and password are required.", 400);
  }

  // Validate client first
  await validateClient(clientId, clientSecret);

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
  clientId,
  clientSecret,
  device = "unknown",
  ipAddress = null,
}) => {
  if (!email || !password) {
    throw new AppError("Email and password are required.", 400);
  }

  // Validate client first
  await validateClient(clientId, clientSecret);

  const normalizedEmail = email.toLowerCase().trim();

  const user = await userRepository.findUserByEmail(normalizedEmail);

  if (!user) {
    throw new AppError("Invalid credentials.", 401);
  }

  // Check user is active and not deleted
  if (!user.isActive || user.isDeleted) {
    throw new AppError("Account is inactive or deleted.", 403);
  }

  const isPasswordValid = await userRepository.comparePassword(
    password,
    user.password,
  );

  if (!isPasswordValid) {
    throw new AppError("Invalid credentials.", 401);
  }

  // Generate access token with rich payload
  const accessToken = await generateAccessToken({
    userId: user.id,
    clientId,
    email: user.email,
    isActive: user.isActive,
  });

  // Generate refresh token
  const refreshTokenValue = generateRefreshTokenString();
  const refreshExpiresIn = getRefreshTokenExpiry();

  // Store refresh token linked to both user and client
  await refreshTokenRepository.createRefreshToken({
    userId: user.id,
    clientId,
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
  device = "unknown",
  ipAddress = null,
}) => {
  if (!refreshToken) {
    throw new AppError("Refresh token is required.", 400);
  }

  // Find valid token — userId comes from DB, not from request
  const validToken = await refreshTokenRepository.findValidRefreshToken({
    token: refreshToken,
  });

  if (!validToken) {
    throw new AppError("Invalid or expired refresh token.", 401);
  }

  // Full DB check on user
  const user = await userRepository.findUserById(validToken.userId);

  if (!user || !user.isActive || user.isDeleted) {
    throw new AppError("Account is inactive or deleted.", 403);
  }

  // Revoke old refresh token
  await refreshTokenRepository.revokeRefreshToken(refreshToken);

  // Issue new access token with fresh payload
  const newAccessToken = await generateAccessToken({
    userId: user.id,
    clientId: validToken.clientId,
    email: user.email,
    isActive: user.isActive,
  });

  // Issue new refresh token
  const newRefreshTokenValue = generateRefreshTokenString();
  const refreshExpiresIn = getRefreshTokenExpiry();

  await refreshTokenRepository.createRefreshToken({
    userId: user.id,
    clientId: validToken.clientId,
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

// ===============================
// Logout
// ===============================
const logoutUser = async ({ refreshToken }) => {
  if (!refreshToken) {
    throw new AppError("Refresh token is required.", 400);
  }

  const validToken = await refreshTokenRepository.findValidRefreshToken({
    token: refreshToken,
  });

  if (!validToken) {
    throw new AppError("Invalid or expired refresh token.", 401);
  }

  await refreshTokenRepository.revokeRefreshToken(refreshToken);

  return { success: true };
};

// ===============================
// Verify Token
// ===============================
const verifyToken = async ({ accessToken }) => {
  if (!accessToken) {
    throw new AppError("Access token is required.", 401);
  }

  const payload = await decryptAndVerifyJWT(accessToken);

  // Check isActive from payload
  if (!payload.isActive) {
    throw new AppError("Account is inactive.", 403);
  }

  return {
    userId: payload.id,
    clientId: payload.clientId,
    email: payload.email,
    isActive: payload.isActive,
  };
};

module.exports = {
  registerUser,
  loginUser,
  refreshAuthTokens,
  logoutUser,
  verifyToken,
};
