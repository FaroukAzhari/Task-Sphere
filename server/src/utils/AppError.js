class AppError extends Error {
  constructor(message, statusCode = 500, details = null, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.errorCode = errorCode;
    this.isOperational = true;
  }
}

module.exports = AppError;
