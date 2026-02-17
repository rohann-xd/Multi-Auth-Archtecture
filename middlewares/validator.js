const sendResponse = require("../utils/responseHandler");

/**
 * Generic middleware to validate request data using Joi schema
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} property - request property to validate: 'body'|'params'|'query'
 */
const validate =
  (schema, property = "body") =>
  (req, res, next) => {
    const data = req[property];

    const { error } = schema.validate(data);

    if (error) {
      return sendResponse(res, 400, false, error.details[0].message);
    }

    next();
  };

module.exports = { validate };
