const multer = require('multer');

// Mirrors FileUploadController.java's constraints. Files are buffered in
// memory so the controller can inspect magic bytes before writing to disk —
// same order of checks as the original (empty -> size -> mime -> extension
// -> magic bytes -> save).
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

module.exports = { upload, MAX_FILE_SIZE };
