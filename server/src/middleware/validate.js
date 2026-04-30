const { validationResult } = require("express-validator");
const { sendError } = require("../utils/response");

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return sendError(res, "Validation failed", 400, errors.array());
  }

  return next();
};

module.exports = validate;
