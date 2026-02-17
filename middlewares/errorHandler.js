// middlewares/errorHandler.js
const sendResponse = require("../utils/responseHandler");
const { NODE_ENV } = require("../config/config");

// Central error handler middleware
const errorHandler = (err, req, res, next) => {
  // console.error("Error:", err.stack);

  // Determine status code (default to 500 if not set)
  const statusCode = err.statusCode || 500;

  // Format error message
  const message = err.message || "Internal Server Error";

  // Additional error data
  const errorData =
    NODE_ENV === "development" ? { stack: err.stack, ...err.data } : err.data;

  return sendResponse(res, statusCode, false, message);
};

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, data = null) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { errorHandler, AppError };
