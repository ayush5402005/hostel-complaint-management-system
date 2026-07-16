const { validationResult } = require('express-validator');

// Mirrors GlobalExceptionHandler.handleValidation(): joins all field errors
// with ", " into a single 400 message, same as Spring's
// MethodArgumentNotValidException handler.
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const message = result
    .array({ onlyFirstError: false })
    .map((e) => e.msg)
    .join(', ');

  const err = new Error(message);
  err.type = 'validation';
  return next(err);
}

module.exports = validate;
