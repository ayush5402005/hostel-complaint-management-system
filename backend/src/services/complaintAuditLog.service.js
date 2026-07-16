const prisma = require('../config/prisma');

// Mirrors ComplaintAuditLogService.java.
async function log(complaintId, changedBy, fromStatus, toStatus, note) {
  await prisma.complaintAuditLog.create({
    data: {
      complaintId: BigInt(complaintId),
      changedByName: changedBy.name,
      changedByRole: changedBy.role,
      fromStatus,
      toStatus,
      note,
    },
  });
}

function toResponse(log_) {
  return {
    id: log_.id,
    complaintId: log_.complaintId,
    changedByName: log_.changedByName,
    changedByRole: log_.changedByRole,
    fromStatus: log_.fromStatus,
    toStatus: log_.toStatus,
    note: log_.note,
    changedAt: log_.changedAt,
  };
}

async function getLogsForComplaint(complaintId) {
  const logs = await prisma.complaintAuditLog.findMany({
    where: { complaintId: BigInt(complaintId) },
    orderBy: { changedAt: 'asc' },
  });
  return logs.map(toResponse);
}

module.exports = { log, getLogsForComplaint };
