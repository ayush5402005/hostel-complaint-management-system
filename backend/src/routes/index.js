const express = require('express');
const { authenticate } = require('../middleware/auth');
const testController = require('../controllers/test.controller');

const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const complaintRoutes = require('./complaint.routes');
const workerRatingRoutes = require('./workerRating.routes');
const userRoutes = require('./user.routes');
const noticeRoutes = require('./notice.routes');
const notificationRoutes = require('./notification.routes');
const filesRoutes = require('./files.routes');
const analyticsRoutes = require('./analytics.routes');
const profileRoutes = require('./profile.routes');

// Mirrors SecurityConfig.java's authorizeHttpRequests exactly:
//   /api/auth/**  -> permitAll
//   everything else under /api -> authenticated
const router = express.Router();

router.use('/auth', authRoutes);

router.use(authenticate);

router.get('/test', testController.test);
router.use('/admin', adminRoutes);
router.use('/complaints', complaintRoutes);
router.use('/', workerRatingRoutes); // /api/workers/:id/rating, /api/workers/ratings
router.use('/users', userRoutes);
router.use('/notices', noticeRoutes);
router.use('/notifications', notificationRoutes);
router.use('/files', filesRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/profile', profileRoutes);

module.exports = router;
