const express = require('express');
const analyticsController = require('../controllers/analytics.controller');

// Mounted at /api/analytics behind the global `authenticate` middleware.
// Role check (staff-only) lives inside analytics.service.js.
const router = express.Router();

router.get('/dashboard', analyticsController.getDashboard);

module.exports = router;
