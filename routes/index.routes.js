// routes/index.routes.js
const express = require("express");
const router = express.Router();
const sendResponse = require("../utils/responseHandler");

// Health check route
router.get("/", (req, res) => {
  return sendResponse(res, 200, true, "System Works");
});

// 404 Routes
router.use((req, res) => {
  return sendResponse(res, 404, false, "Route not found");
});

module.exports = router;
