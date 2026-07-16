// Wraps an async route handler so rejected promises reach Express's error
// pipeline instead of needing a try/catch in every controller.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
