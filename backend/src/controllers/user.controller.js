const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/user.service');

const getAllWorkers = asyncHandler(async (req, res) => {
  res.json(await userService.getAllWorkers());
});

const getMe = asyncHandler(async (req, res) => {
  res.json(await userService.getMe(req.user.email));
});

const updateMe = asyncHandler(async (req, res) => {
  res.json(await userService.updateMe(req.user.email, req.body));
});

const changePassword = asyncHandler(async (req, res) => {
  const result = await userService.changePassword(req.user.email, req.body.newPassword);
  if (!result.ok) return res.status(400).send(result.message);
  res.send('Password updated successfully');
});

module.exports = { getAllWorkers, getMe, updateMe, changePassword };
