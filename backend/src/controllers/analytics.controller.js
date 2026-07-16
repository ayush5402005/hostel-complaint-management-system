const asyncHandler = require('../utils/asyncHandler');
const analyticsService = require('../services/analytics.service');

const getDashboard = asyncHandler(async (req, res) => {
  res.json(await analyticsService.getDashboard(req.user.email));
});

module.exports = { getDashboard };
