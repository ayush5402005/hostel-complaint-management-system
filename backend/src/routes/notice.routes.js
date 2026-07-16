const express = require('express');
const noticeController = require('../controllers/notice.controller');

// Mounted at /api/notices behind the global `authenticate` middleware.
// Role checks (post/delete restricted to admin/warden/caretaker) live inside
// notice.service.js, matching the original controller.
const router = express.Router();

router.get('/', noticeController.getAll);
router.get('/:id', noticeController.getById);
router.post('/', noticeController.create);
router.delete('/:id', noticeController.remove);

module.exports = router;
