const asyncHandler = require('../utils/asyncHandler');
const adminService = require('../services/admin.service');
const complaintService = require('../services/complaint.service');

const createStudent = asyncHandler(async (req, res) => {
  res.json(await adminService.createStudent(req.body));
});
const createWarden = asyncHandler(async (req, res) => {
  res.json(await adminService.createUserWithRole(req.body, 'WARDEN'));
});
const createCaretaker = asyncHandler(async (req, res) => {
  res.json(await adminService.createUserWithRole(req.body, 'CARETAKER'));
});
const createWorker = asyncHandler(async (req, res) => {
  res.json(await adminService.createUserWithRole(req.body, 'WORKER'));
});

const getAllUsers = asyncHandler(async (req, res) => {
  res.json(await adminService.getAllUsers());
});
const getUsersByRole = asyncHandler(async (req, res) => {
  res.json(await adminService.getUsersByRole(req.params.role));
});
const getWorkers = asyncHandler(async (req, res) => {
  res.json(await adminService.getUsersByRole('WORKER'));
});

const updateUser = asyncHandler(async (req, res) => {
  res.json(await adminService.updateUser(req.params.id, req.body));
});
const deactivateUser = asyncHandler(async (req, res) => {
  await adminService.deactivateUser(req.params.id);
  res.json({ message: 'User deactivated successfully' });
});
const activateUser = asyncHandler(async (req, res) => {
  await adminService.activateUser(req.params.id);
  res.json({ message: 'User activated successfully' });
});
const deleteUser = asyncHandler(async (req, res) => {
  await adminService.deleteUser(req.params.id);
  res.json({ message: 'User deleted successfully' });
});

const getAllDepartments = asyncHandler(async (req, res) => {
  res.json(await adminService.getAllDepartments());
});

const getDashboardStats = asyncHandler(async (req, res) => {
  res.json(await adminService.getDashboardStats());
});

const getWorkerStats = asyncHandler(async (req, res) => {
  res.json(await complaintService.getWorkerStatsByAdmin(req.params.id));
});

module.exports = {
  createStudent,
  createWarden,
  createCaretaker,
  createWorker,
  getAllUsers,
  getUsersByRole,
  getWorkers,
  updateUser,
  deactivateUser,
  activateUser,
  deleteUser,
  getAllDepartments,
  getDashboardStats,
  getWorkerStats,
};
