const { sendError } = require("../utils/response");
const AppError = require("../utils/AppError");

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.name === "ValidationError") {
    return sendError(res, "Validation failed", 400, err.errors);
  }

  if (err.name === "CastError") {
    return sendError(res, "Invalid resource id", 400);
  }

  if (err.code === 11000) {
    return sendError(res, "Duplicate value error", 409, err.keyValue);
  }

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.details);
  }

  console.error(err);
  return sendError(res, "Internal server error", 500);
};

module.exports = errorHandler;
