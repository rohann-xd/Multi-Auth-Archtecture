const {
  registerUser,
  loginUser,
  refreshAuthTokens,
} = require("../services/auth.service");

const sendResponse = require("../utils/responseHandler");
const catchAsync = require("../middlewares/catchAsync");
const { NODE_ENV, COOKIE_SAMESITE } = require("../config/config");
const {
  getAccessTokenExpiry,
  getRefreshTokenExpiry,
} = require("../utils/jwt.utils");
const { AppError } = require("../middlewares/errorHandler");

// ===============================
// Register
// ===============================
const register = catchAsync(async (req, res) => {
  const { name, email, password } = req.body || {};

  const user = await registerUser({
    name,
    email,
    password,
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

  const device = req.headers["user-agent"] || "unknown";
  const ipAddress = req.ip || req.connection.remoteAddress || "unknown";

  const data = await loginUser({
    email,
    password,
    device,
    ipAddress,
  });

  // Cookie configuration
  const cookieOptions = {
    httpOnly: true,
    // ⚠️ FIX: Only use secure if actually using HTTPS
    secure: NODE_ENV === "production" && req.secure,
    sameSite: NODE_ENV === "production" ? "lax" : "lax",
  };

  // Set access token cookie
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

  // In development, also include tokens in the response body
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
  const { refreshToken, userId } = req.body || {};

  if (!refreshToken || !userId) {
    throw new AppError("Refresh token and userId are required.", 400);
  }

  const device = req.headers["user-agent"] || "unknown";
  const ipAddress = req.ip || req.connection.remoteAddress || "unknown";

  const data = await refreshAuthTokens({
    refreshToken,
    userId,
    device,
    ipAddress,
  });

  // Cookie configuration
  const cookieOptions = {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: COOKIE_SAMESITE,
  };

  // Set new access token cookie
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
  const responsePayload = {
    message: "Tokens refreshed successfully",
  };

  // In development, also include tokens in the response body
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

module.exports = {
  register,
  login,
  refresh,
};
