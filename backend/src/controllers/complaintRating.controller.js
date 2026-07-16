const asyncHandler = require('../utils/asyncHandler');
const ratingService = require('../services/complaintRating.service');

const submitRating = asyncHandler(async (req, res) => {
  res.json(await ratingService.submitRating(req.params.complaintId, req.user.email, req.body));
});

const getRating = asyncHandler(async (req, res) => {
  res.json(await ratingService.getRatingForComplaint(req.params.complaintId));
});

const getWorkerRating = asyncHandler(async (req, res) => {
  res.json(await ratingService.getWorkerRatingSummary(req.params.workerId));
});

const getAllWorkerRatings = asyncHandler(async (req, res) => {
  res.json(await ratingService.getAllWorkerRatings());
});

module.exports = { submitRating, getRating, getWorkerRating, getAllWorkerRatings };
