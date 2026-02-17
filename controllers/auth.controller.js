const {
  registerUser,
  loginUser,
  refreshAuthTokens,
  logoutUser,
  verifyToken,
} = require("../services/auth.service");

const sendResponse = require("../utils/responseHandler");
const catchAsync = require("../middlewares/catchAsync");
const { NODE_ENV, COOKIE_DOMAIN } = require("../config/config");
const { getAccessTokenExpiry } = require("../utils/jwt.utils");
const { AppError } = require("../middlewares/errorHandler");

// ===============================
// Shared Cookie Options
// ===============================
const getCookieOptions = (req) => ({
  httpOnly: true,
  secure: NODE_ENV === "production" && req.secure,
  sameSite: "lax",
  ...(NODE_ENV === "production" && COOKIE_DOMAIN && { domain: COOKIE_DOMAIN }),
});

// ===============================
// Register
// ===============================
const register = catchAsync(async (req, res) => {
  const { name, email, password } = req.body || {};

  const clientId = req.headers["x-client-id"];
  const clientSecret = req.headers["x-client-secret"];

  const user = await registerUser({
    name,
    email,
    password,
    clientId,
    clientSecret,
  });

  return sendResponse(res, 201, true, "User registered successfully", {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
});

// ===============================
// Login
// ===============================
const login = catchAsync(async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    throw new AppError("All fields (email, password) are required.", 400);
  }

  const { email, password } = req.body;

  const clientId = req.headers["x-client-id"];
  const clientSecret = req.headers["x-client-secret"];

  const device = req.headers["user-agent"] || "unknown";
  const ipAddress = req.ip || req.connection.remoteAddress || "unknown";

  const data = await loginUser({
    email,
    password,
    clientId,
    clientSecret,
    device,
    ipAddress,
  });

  const cookieOptions = getCookieOptions(req);

  res.cookie("accessToken", data.accessToken, {
    ...cookieOptions,
    maxAge: getAccessTokenExpiry() * 1000,
  });

  // Set refresh token cookie
  res.cookie("refreshToken", data.refreshToken, {
    ...cookieOptions,
    maxAge: data.refreshTokenExpiresIn * 1000,
  });

  // Build response payload
  const responsePayload = {
    user: {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
    },
  };

  // In development, also include tokens in response body
  if (NODE_ENV !== "production") {
    responsePayload.tokens = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      accessTokenExpiresIn: getAccessTokenExpiry(),
      refreshTokenExpiresIn: data.refreshTokenExpiresIn,
    };
  }

  return sendResponse(res, 200, true, "Login successful", responsePayload);
});

// ===============================
// Refresh Tokens
// ===============================
const refresh = catchAsync(async (req, res) => {
  // Read refresh token from cookie, not request body
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    throw new AppError("Refresh token is required.", 400);
  }

  const device = req.headers["user-agent"] || "unknown";
  const ipAddress = req.ip || req.connection.remoteAddress || "unknown";

  const data = await refreshAuthTokens({
    refreshToken,
    device,
    ipAddress,
  });

  const cookieOptions = getCookieOptions(req);

  res.cookie("accessToken", data.accessToken, {
    ...cookieOptions,
    maxAge: getAccessTokenExpiry() * 1000,
  });

  // Set new refresh token cookie
  res.cookie("refreshToken", data.refreshToken, {
    ...cookieOptions,
    maxAge: data.refreshTokenExpiresIn * 1000,
  });

  // Build response payload
  const responsePayload = {};

  // In development, also include tokens in response body
  if (NODE_ENV !== "production") {
    responsePayload.tokens = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      accessTokenExpiresIn: getAccessTokenExpiry(),
      refreshTokenExpiresIn: data.refreshTokenExpiresIn,
    };
  }

  return sendResponse(
    res,
    200,
    true,
    "Tokens refreshed successfully",
    responsePayload,
  );
});

// ===============================
// Logout
// ===============================
const logout = catchAsync(async (req, res) => {
  // Read refresh token from cookie
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    throw new AppError("Refresh token is required.", 400);
  }

  await logoutUser({ refreshToken });

  const cookieOptions = getCookieOptions(req);

  // Clear both cookies with same domain so browser removes correct cookie
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  return sendResponse(res, 200, true, "Logged out successfully", null);
});

// ===============================
// Verify Token
// ===============================
const verify = catchAsync(async (req, res) => {
  // Read access token from cookie
  const accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    throw new AppError("Access token is required.", 401);
  }

  const data = await verifyToken({ accessToken });

  return sendResponse(res, 200, true, "Token is valid", {
    userId: data.userId,
    clientId: data.clientId,
    email: data.email,
    isActive: data.isActive,
  });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  verify,
};
