const express = require('express');
const studentProfileController = require('../controllers/studentProfile.controller');
const validateReq = require('../middleware/validate');
const { submitProfileRules } = require('../validators/studentProfile.validators');

// Mounted at /api/profile behind the global `authenticate` middleware —
// the student-facing half of StudentProfileController.java (its
// admin-facing half lives in routes/admin.routes.js under /api/admin/students).
const router = express.Router();

router.post('/', submitProfileRules, validateReq, studentProfileController.submitProfile);
router.get('/', studentProfileController.getMyProfile);
router.get('/status', studentProfileController.checkProfileStatus);

module.exports = router;
