const { sendError } = require("../utils/response");
const AppError = require("../utils/AppError");
const {
  normalizeMongooseValidationErrors,
  normalizeDuplicateKeyErrors,
  inferErrorCode,
  getUserFacingMessage,
} = require("../utils/errorPayload");

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.name === "ValidationError") {
    return sendError(res, {
      message: "Please correct the highlighted fields and try again.",
      statusCode: 400,
      errorCode: "VALIDATION_ERROR",
      errors: normalizeMongooseValidationErrors(err.errors),
    });
  }

  if (err.name === "CastError") {
    return sendError(res, {
      message: "The requested item could not be found because its identifier is invalid.",
      statusCode: 400,
      errorCode: "INVALID_RESOURCE_ID",
    });
  }

  if (err.code === 11000) {
    return sendError(res, {
      message: err.keyPattern?.email
        ? "This email is already registered."
        : "This value is already in use.",
      statusCode: 409,
      errorCode: "DUPLICATE_VALUE",
      errors: normalizeDuplicateKeyErrors(err.keyValue),
    });
  }

  if (err instanceof AppError) {
    return sendError(res, {
      message: getUserFacingMessage({ message: err.message, statusCode: err.statusCode }),
      statusCode: err.statusCode,
      errorCode: err.errorCode || inferErrorCode({ message: err.message, statusCode: err.statusCode, fallback: "APP_ERROR" }),
      errors: err.details,
    });
  }

  console.error(err);
  return sendError(res, {
    message: getUserFacingMessage({ message: "Internal server error", statusCode: 500 }),
    statusCode: 500,
    errorCode: "INTERNAL_ERROR",
  });
};

module.exports = errorHandler;
