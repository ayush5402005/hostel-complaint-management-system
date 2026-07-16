const express = require('express');
const complaintController = require('../controllers/complaint.controller');
const auditLogController = require('../controllers/complaintAuditLog.controller');
const commentController = require('../controllers/complaintComment.controller');
const ratingController = require('../controllers/complaintRating.controller');
const validateReq = require('../middleware/validate');
const { createComplaintRules, closeComplaintRules, updateStatusRules } = require('../validators/complaint.validators');

// Mounted at /api/complaints behind the global `authenticate` middleware.
// Role checks for assign/reject/status/close/dispute live inside
// complaint.service.js, matching the original controller (which relies on
// service-layer checks rather than @PreAuthorize).
const router = express.Router();

router.post('/', createComplaintRules, validateReq, complaintController.createComplaint);
router.put('/:id/assign', complaintController.assignWorker);
router.put('/:id/reassign', complaintController.reassignWorker);
router.put('/:id/reject', complaintController.rejectComplaint);
router.put('/:id/status', updateStatusRules, validateReq, complaintController.updateStatus);
router.put('/:id/close', closeComplaintRules, validateReq, complaintController.closeComplaint);
router.put('/:id/dispute', complaintController.disputeComplaint);

router.get('/', complaintController.getComplaints);
router.get('/dashboard', complaintController.getDashboard);
router.get('/dashboard/student', complaintController.getStudentDashboard);
router.get('/dashboard/worker', complaintController.getWorkerDashboard);
router.get('/:id', complaintController.getComplaintById);

// Sub-resources — mirrors ComplaintAuditLogController / ComplaintCommentController
// / ComplaintRatingController's nested @RequestMapping paths.
router.get('/:complaintId/audit', auditLogController.getAuditLogs);
router.get('/:complaintId/comments', commentController.getComments);
router.post('/:complaintId/comments', commentController.addComment);
router.post('/:complaintId/rating', ratingController.submitRating);
router.get('/:complaintId/rating', ratingController.getRating);

module.exports = router;
