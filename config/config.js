// config/config.js
require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 5000,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  DB_SSL: process.env.DB_SSL || "false",
  DATABASE_URL: process.env.DATABASE_URL,

  // JWT
  JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY,
  JWT_PUBLIC_KEY: process.env.JWT_PUBLIC_KEY,
  JWT_ACCESS_TOKEN_EXPIRE: process.env.JWT_ACCESS_TOKEN_EXPIRE,
  JWT_REFRESH_TOKEN_EXPIRE: process.env.JWT_REFRESH_TOKEN_EXPIRE,

  // ENV
  NODE_ENV: process.env.NODE_ENV || "development",
  DOMAIN: process.env.DOMAIN || "http://localhost",

  // Cookie Configuration
  COOKIE_SAMESITE: process.env.COOKIE_SAMESITE || "lax",

  // Clients
  HRM_CLIENT_ID: process.env.HRM_CLIENT_ID,
  HRM_CLIENT_SECRET: process.env.HRM_CLIENT_SECRET,
  CRM_CLIENT_ID: process.env.CRM_CLIENT_ID,
  CRM_CLIENT_SECRET: process.env.CRM_CLIENT_SECRET,
};
