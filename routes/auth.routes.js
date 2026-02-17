const express = require("express");
const router = express.Router();
const { validate } = require("../middlewares/validator");
const { validateClientHeaders } = require("../middlewares/validateClient");

const {
  registerSchema,
  loginSchema,
} = require("../validations/auth.validation");

const {
  register,
  login,
  refresh,
  logout,
  verify,
} = require("../controllers/auth.controller");

router.post(
  "/signup",
  validateClientHeaders,
  validate(registerSchema),
  register,
);
router.post("/login", validateClientHeaders, validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/verify", verify);

module.exports = router;
