const express = require('express');
const { upload } = require('../middleware/upload');
const fileUploadController = require('../controllers/fileUpload.controller');

// Mounted at /api/files behind the global `authenticate` middleware
// (the original FileUploadController has no permitAll rule, so it requires
// a valid JWT same as any other /api/** route).
const router = express.Router();

router.post('/upload', upload.single('file'), fileUploadController.uploadFile);

module.exports = router;
