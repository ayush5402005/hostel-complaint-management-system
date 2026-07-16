const asyncHandler = require('../utils/asyncHandler');
const commentService = require('../services/complaintComment.service');

const getComments = asyncHandler(async (req, res) => {
  res.json(await commentService.getComments(req.params.complaintId, req.user.email));
});

const addComment = asyncHandler(async (req, res) => {
  res.json(await commentService.addComment(req.params.complaintId, req.user.email, req.body));
});

module.exports = { getComments, addComment };
