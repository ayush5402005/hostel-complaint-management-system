const asyncHandler = require('../utils/asyncHandler');
const complaintService = require('../services/complaint.service');

const createComplaint = asyncHandler(async (req, res) => {
  res.json(await complaintService.createComplaint(req.user.email, req.body));
});

const assignWorker = asyncHandler(async (req, res) => {
  res.json(await complaintService.assignWorker(req.params.id, req.body.workerId, req.user.email));
});

const reassignWorker = asyncHandler(async (req, res) => {
  res.json(await complaintService.reassignWorker(req.params.id, req.body.workerId, req.user.email));
});

const rejectComplaint = asyncHandler(async (req, res) => {
  res.json(await complaintService.rejectComplaint(req.params.id, req.body.reason, req.user.email));
});

const updateStatus = asyncHandler(async (req, res) => {
  res.json(await complaintService.updateStatus(req.params.id, req.body, req.user.email));
});

const closeComplaint = asyncHandler(async (req, res) => {
  res.json(await complaintService.closeComplaint(req.params.id, req.body, req.user.email));
});

const disputeComplaint = asyncHandler(async (req, res) => {
  res.json(await complaintService.disputeComplaint(req.params.id, req.body, req.user.email));
});

const getComplaints = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page ?? '0', 10);
  const size = parseInt(req.query.size ?? '10', 10);
  const { status, blockName, category, priority, dateFrom, dateTo } = req.query;
  res.json(
    await complaintService.getComplaintsByRole(req.user.email, page, size, {
      status,
      blockName,
      category,
      priority,
      dateFrom,
      dateTo,
    })
  );
});

const getDashboard = asyncHandler(async (req, res) => {
  res.json(await complaintService.getDashboardStats(req.user.email));
});

const getStudentDashboard = asyncHandler(async (req, res) => {
  res.json(await complaintService.getStudentDashboardStats(req.user.email));
});

const getWorkerDashboard = asyncHandler(async (req, res) => {
  res.json(await complaintService.getWorkerDashboardStats(req.user.email));
});

const getComplaintById = asyncHandler(async (req, res) => {
  res.json(await complaintService.getComplaintById(req.params.id, req.user.email));
});

module.exports = {
  createComplaint,
  assignWorker,
  reassignWorker,
  rejectComplaint,
  updateStatus,
  closeComplaint,
  disputeComplaint,
  getComplaints,
  getDashboard,
  getStudentDashboard,
  getWorkerDashboard,
  getComplaintById,
};
