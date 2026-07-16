// Mirrors the original Spring Boot exception hierarchy exactly, so the global
// error handler can reproduce the same HTTP status codes and JSON shape.

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

// Java: ResourceNotFoundException -> 404
class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

// Java: UnauthorizedException -> 403 (FORBIDDEN, not 401 — matches
// GlobalExceptionHandler.handleUnauthorized exactly)
class ForbiddenError extends AppError {
  constructor(message) {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

// Java: bare `new RuntimeException(message)` -> 400 (handleRuntime)
class BadRequestError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'BadRequestError';
  }
}

module.exports = { AppError, NotFoundError, ForbiddenError, BadRequestError };
