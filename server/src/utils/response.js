const buildMeta = (meta = {}) => ({
  timestamp: new Date().toISOString(),
  ...meta,
});

const sendSuccess = (res, data = null, message = "OK", statusCode = 200, meta = {}) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    meta: buildMeta(meta),
  });
};

const sendError = (
  res,
  {
    message = "Error",
    statusCode = 500,
    errorCode = "INTERNAL_ERROR",
    errors = null,
    meta = {},
  } = {}
) => {
  res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    errors,
    meta: buildMeta(meta),
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
