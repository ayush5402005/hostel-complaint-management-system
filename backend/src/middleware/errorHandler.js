const { AppError } = require('../utils/AppError');
const logger = require('../config/logger');

// Mirrors exception/GlobalExceptionHandler.java: a single JSON error shape
// { status, message, timestamp } for every error, with internal details
// hidden behind a generic message for anything unexpected (never leak stack
// traces / DB errors to the client).
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.statusCode,
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  }

  // express-validator / manual validation errors carry a `.statusCode` of
  // 400 and a pre-joined message — treat identically to Spring's
  // MethodArgumentNotValidException handler (comma-joined field errors).
  if (err.type === 'validation') {
    return res.status(400).json({
      status: 400,
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({
      status: 400,
      message: err.code === 'LIMIT_FILE_SIZE' ? 'File size must be less than 5MB' : err.message,
      timestamp: new Date().toISOString(),
    });
  }

  // Prisma known request errors (constraint violations, not-found, etc.)
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    logger.error('Prisma error', { code: err.code, message: err.message });
    return res.status(400).json({
      status: 400,
      message: 'The request could not be completed due to a data conflict.',
      timestamp: new Date().toISOString(),
    });
  }

  // Unexpected — log full detail server-side, never expose it to the client.
  logger.error(err.stack || err.message || err);
  return res.status(500).json({
    status: 500,
    message: 'Something went wrong. Please try again later.',
    timestamp: new Date().toISOString(),
  });
}

module.exports = errorHandler;
