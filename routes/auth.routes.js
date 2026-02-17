const express = require("express");
const router = express.Router();
const { validate } = require("../middlewares/validator");

const {
  registerSchema,
  loginSchema,
} = require("../validations/auth.validation");

const { register, login } = require("../controllers/auth.controller");

router.post("/signup", validate(registerSchema), register);

router.post("/login", validate(loginSchema), login);

module.exports = router;
