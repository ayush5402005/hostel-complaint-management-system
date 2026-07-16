const express = require('express');
const userController = require('../controllers/user.controller');

// Mounted at /api/users behind the global `authenticate` middleware.
const router = express.Router();

router.get('/workers', userController.getAllWorkers);
router.get('/me', userController.getMe);
router.put('/me', userController.updateMe);
router.put('/me/password', userController.changePassword);

module.exports = router;
