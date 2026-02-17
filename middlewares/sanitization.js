// middlewares/sanitization.js

const xss = require("xss");

// Recursively sanitize an object to prevent XSS
const sanitize = (obj) => {
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key in clone) {
    try {
      if (typeof clone[key] === "string") {
        clone[key] = xss(clone[key]);
      } else if (typeof clone[key] === "object" && clone[key] !== null) {
        clone[key] = sanitize(clone[key]);
      }
    } catch (error) {
      console.error(`❌ Error sanitizing key "${key}"`, error);
    }
  }

  return clone;
};

// XSS Sanitizer Middleware
const xssSanitizer = () => (req, res, next) => {
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

module.exports = {
  xssSanitizer: xssSanitizer(),
};
