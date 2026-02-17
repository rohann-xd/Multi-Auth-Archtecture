const { AppError } = require("./errorHandler");

const validateClientHeaders = (req, res, next) => {
  const clientId = req.headers["x-client-id"];
  const clientSecret = req.headers["x-client-secret"];

  if (!clientId && !clientSecret) {
    throw new AppError("Client credentials are required.", 401);
  }

  if (!clientId) {
    throw new AppError("x-client-id header is required.", 401);
  }

  if (!clientSecret) {
    throw new AppError("x-client-secret header is required.", 401);
  }

  next();
};

module.exports = { validateClientHeaders };
