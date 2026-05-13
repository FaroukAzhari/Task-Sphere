const { validationResult } = require("express-validator");
const { sendError } = require("../utils/response");
const { normalizeValidationErrors } = require("../utils/errorPayload");

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return sendError(res, {
      message: "Please correct the highlighted fields and try again.",
      statusCode: 400,
      errorCode: "VALIDATION_ERROR",
      errors: normalizeValidationErrors(errors.array()),
    });
  }

  return next();
};

module.exports = validate;
