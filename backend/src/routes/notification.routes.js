const express = require('express');
const notificationController = require('../controllers/notification.controller');

// Mounted at /api/notifications behind the global `authenticate` middleware.
const router = express.Router();

router.get('/stream', notificationController.stream);
router.get('/', notificationController.getMyNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);

module.exports = router;
