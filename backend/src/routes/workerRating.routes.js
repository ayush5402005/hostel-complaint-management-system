const express = require('express');
const ratingController = require('../controllers/complaintRating.controller');

// Mirrors ComplaintRatingController.java's class-level @RequestMapping("/api")
// with method paths "/workers/{workerId}/rating" and "/workers/ratings" —
// i.e. these live directly under /api, not under /api/complaints.
const router = express.Router();

router.get('/workers/:workerId/rating', ratingController.getWorkerRating);
router.get('/workers/ratings', ratingController.getAllWorkerRatings);

module.exports = router;
