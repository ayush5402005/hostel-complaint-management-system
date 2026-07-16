const asyncHandler = require('../utils/asyncHandler');
const auditLogService = require('../services/complaintAuditLog.service');

const getAuditLogs = asyncHandler(async (req, res) => {
  res.json(await auditLogService.getLogsForComplaint(req.params.complaintId));
});

module.exports = { getAuditLogs };
