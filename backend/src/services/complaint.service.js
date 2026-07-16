const prisma = require('../config/prisma');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/AppError');
const { toUserSummary } = require('../utils/mappers');
const { toPage } = require('../utils/pagination');
const auditLogService = require('./complaintAuditLog.service');
const notificationService = require('./notification.service');

const STAFF_ROLES = ['ADMIN', 'WARDEN', 'CARETAKER'];
const isStaff = (role) => STAFF_ROLES.includes(role);

// `block` is a plain enum column on User now, not a relation — only
// `department` needs an include. See docs/MIGRATION_NOTES.md "Hostel-10 scoping".
const personInclude = {
  department: true,
};

const complaintInclude = {
  student: { include: personInclude },
  assignedWorker: { include: personInclude },
};

async function getUserByEmail(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new NotFoundError(`User not found: ${email}`);
  return user;
}

async function getComplaintOrThrow(id, include = complaintInclude) {
  const complaint = await prisma.complaint.findUnique({ where: { id: BigInt(id) }, include });
  if (!complaint) throw new NotFoundError(`Complaint not found: ${id}`);
  return complaint;
}

async function toResponse(complaint) {
  const media = await prisma.complaintMedia.findMany({ where: { complaintId: complaint.id } });
  const mediaUrls = media.filter((m) => m.uploadedBy === 'STUDENT').map((m) => m.mediaUrl);
  const resolvedMediaUrls = media.filter((m) => m.uploadedBy === 'WORKER').map((m) => m.mediaUrl);

  return {
    id: complaint.id,
    title: complaint.title,
    description: complaint.description,
    category: complaint.category,
    priority: complaint.priority,
    status: complaint.status,
    mediaUrls,
    resolvedMediaUrls,
    rejectionReason: complaint.rejectionReason,
    rating: complaint.rating,
    reviewText: complaint.reviewText,
    disputeReason: complaint.disputeReason,
    disputedAt: complaint.disputedAt,
    overdue: complaint.isOverdue,
    escalated: complaint.isEscalated,
    slot1Day: complaint.slot1Day,
    slot1Time: complaint.slot1Time,
    slot2Day: complaint.slot2Day,
    slot2Time: complaint.slot2Time,
    slot3Day: complaint.slot3Day,
    slot3Time: complaint.slot3Time,
    student: toUserSummary(complaint.student),
    assignedWorker: toUserSummary(complaint.assignedWorker),
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt,
  };
}

// ─── Create ─────────────────────────────────────────────────────────────────

async function createComplaint(email, request) {
  const user = await getUserByEmail(email);
  if (user.role !== 'STUDENT') throw new ForbiddenError('Only students can create complaints');
  if (request.mediaUrls && request.mediaUrls.length > 3) {
    throw new BadRequestError('Maximum 3 photos allowed');
  }

  const saved = await prisma.complaint.create({
    data: {
      title: request.title,
      category: request.category,
      priority: request.priority || 'LOW',
      description: request.description,
      status: 'CREATED',
      block: user.block,
      studentId: user.id,
      slot1Day: request.slot1Day,
      slot1Time: request.slot1Time,
      slot2Day: request.slot2Day,
      slot2Time: request.slot2Time,
      slot3Day: request.slot3Day,
      slot3Time: request.slot3Time,
      isOverdue: false,
      isEscalated: false,
    },
    include: complaintInclude,
  });

  const mediaUrls = (request.mediaUrls || []).filter((u) => u && u.trim());
  if (mediaUrls.length) {
    await prisma.complaintMedia.createMany({
      data: mediaUrls.map((mediaUrl) => ({
        complaintId: saved.id,
        mediaUrl,
        uploadedBy: 'STUDENT',
      })),
    });
  }

  await auditLogService.log(saved.id, user, null, 'CREATED', 'Complaint filed by student');

  const staff = await prisma.user.findMany({ where: { role: { in: ['WARDEN', 'CARETAKER', 'ADMIN'] } } });
  await Promise.all(
    staff.map((s) =>
      notificationService.sendNotification(s, `${user.name} filed a new complaint: ${saved.title}`, 'COMPLAINT_CREATED')
    )
  );

  return toResponse(saved);
}

// ─── Assign ─────────────────────────────────────────────────────────────────

async function assignWorker(complaintId, workerId, email) {
  const assignedBy = await getUserByEmail(email);
  if (!isStaff(assignedBy.role)) throw new ForbiddenError('Only admin, caretaker or warden can assign worker');

  const complaint = await getComplaintOrThrow(complaintId);
  const worker = await prisma.user.findUnique({ where: { id: BigInt(workerId) } });
  if (!worker) throw new NotFoundError(`Worker not found: ${workerId}`);
  if (worker.role !== 'WORKER') throw new ForbiddenError('Assigned user is not a worker');

  const prevStatus = complaint.status;
  const saved = await prisma.complaint.update({
    where: { id: complaint.id },
    data: { workerId: worker.id, status: 'ASSIGNED' },
    include: complaintInclude,
  });

  await auditLogService.log(saved.id, assignedBy, prevStatus, 'ASSIGNED', `Assigned to worker: ${worker.name}`);

  await notificationService.sendNotification(worker, `You have been assigned complaint: ${saved.title}`, 'COMPLAINT_ASSIGNED');
  await notificationService.sendNotification(
    saved.student,
    `Your complaint '${saved.title}' has been assigned to ${worker.name}`,
    'COMPLAINT_ASSIGNED'
  );

  return toResponse(saved);
}

// ─── Reassign ───────────────────────────────────────────────────────────────

async function reassignWorker(complaintId, newWorkerId, email) {
  const assignedBy = await getUserByEmail(email);
  if (!isStaff(assignedBy.role)) throw new ForbiddenError('Only admin, caretaker or warden can reassign worker');

  const complaint = await getComplaintOrThrow(complaintId);
  const newWorker = await prisma.user.findUnique({ where: { id: BigInt(newWorkerId) } });
  if (!newWorker) throw new NotFoundError(`Worker not found: ${newWorkerId}`);
  if (newWorker.role !== 'WORKER') throw new ForbiddenError('Assigned user is not a worker');

  const oldWorker = complaint.assignedWorker;
  const prevStatus = complaint.status;

  const saved = await prisma.complaint.update({
    where: { id: complaint.id },
    data: { workerId: newWorker.id, status: 'ASSIGNED' },
    include: complaintInclude,
  });

  await auditLogService.log(
    saved.id,
    assignedBy,
    prevStatus,
    'ASSIGNED',
    `Reassigned from ${oldWorker ? oldWorker.name : 'nobody'} to ${newWorker.name}`
  );

  if (oldWorker) {
    await notificationService.sendNotification(oldWorker, `Complaint '${saved.title}' has been reassigned from you`, 'COMPLAINT_ASSIGNED');
  }
  await notificationService.sendNotification(newWorker, `Complaint '${saved.title}' has been reassigned to you`, 'COMPLAINT_ASSIGNED');
  await notificationService.sendNotification(
    saved.student,
    `Your complaint '${saved.title}' reassigned to ${newWorker.name}`,
    'COMPLAINT_ASSIGNED'
  );

  return toResponse(saved);
}

// ─── Reject ─────────────────────────────────────────────────────────────────

async function rejectComplaint(complaintId, reason, email) {
  const rejectedBy = await getUserByEmail(email);
  if (!isStaff(rejectedBy.role)) throw new ForbiddenError('Only admin, caretaker or warden can reject complaints');
  if (!reason || !reason.trim()) throw new BadRequestError('Rejection reason is required');

  const complaint = await getComplaintOrThrow(complaintId);
  if (complaint.status === 'CLOSED') throw new BadRequestError('Cannot reject a closed complaint');

  const prevStatus = complaint.status;
  const saved = await prisma.complaint.update({
    where: { id: complaint.id },
    data: { status: 'REJECTED', rejectionReason: reason.trim() },
    include: complaintInclude,
  });

  await auditLogService.log(saved.id, rejectedBy, prevStatus, 'REJECTED', `Rejected. Reason: ${reason.trim()}`);
  await notificationService.sendNotification(
    saved.student,
    `Your complaint '${saved.title}' was rejected. Reason: ${reason}`,
    'STATUS_UPDATED'
  );

  return toResponse(saved);
}

// ─── Update status (worker) ─────────────────────────────────────────────────

async function updateStatus(complaintId, request, email) {
  const worker = await getUserByEmail(email);
  if (worker.role !== 'WORKER') throw new ForbiddenError('Only worker can update complaint status');

  const complaint = await getComplaintOrThrow(complaintId);
  if (!complaint.workerId || complaint.workerId !== worker.id) {
    throw new ForbiddenError('You are not assigned to this complaint');
  }

  const prevStatus = complaint.status;
  const data = { status: request.status };

  if (request.status === 'RESOLVED' && request.resolvedMediaUrls && request.resolvedMediaUrls.length) {
    if (request.resolvedMediaUrls.length > 3) throw new BadRequestError('Maximum 3 proof photos allowed');

    await prisma.complaintMedia.deleteMany({
      where: { complaintId: complaint.id, uploadedBy: 'WORKER' },
    });

    const urls = request.resolvedMediaUrls.filter((u) => u && u.trim());
    if (urls.length) {
      await prisma.complaintMedia.createMany({
        data: urls.map((mediaUrl) => ({ complaintId: complaint.id, mediaUrl, uploadedBy: 'WORKER' })),
      });
    }
  }

  // NOTE: the original ComplaintService.updateStatus() never sets
  // `resolvedAt` even though the column exists (it's used only by two
  // unused AnalyticsService repository queries) — left unset here too, for
  // exact parity. See docs/MIGRATION_NOTES.md.
  const saved = await prisma.complaint.update({ where: { id: complaint.id }, data, include: complaintInclude });

  await auditLogService.log(
    saved.id,
    worker,
    prevStatus,
    request.status,
    request.status === 'IN_PROGRESS' ? 'Worker started working' : 'Worker marked as resolved'
  );

  if (request.status === 'IN_PROGRESS') {
    await notificationService.sendNotification(saved.student, `Work has started on your complaint: ${saved.title}`, 'STATUS_UPDATED');
  } else if (request.status === 'RESOLVED') {
    await notificationService.sendNotification(
      saved.student,
      `Your complaint '${saved.title}' is resolved. Please close it or flag if still unresolved.`,
      'STATUS_UPDATED'
    );
  }

  return toResponse(saved);
}

// ─── Close ──────────────────────────────────────────────────────────────────

async function closeComplaint(complaintId, request, email) {
  const student = await getUserByEmail(email);
  if (student.role !== 'STUDENT') throw new ForbiddenError('Only student can close complaint');

  const complaint = await getComplaintOrThrow(complaintId);
  if (complaint.studentId !== student.id) throw new ForbiddenError('You cannot close this complaint');
  if (complaint.status !== 'RESOLVED') throw new BadRequestError('Complaint must be RESOLVED before closing');

  const data = { status: 'CLOSED' };
  if (request) {
    if (request.rating != null) {
      const r = request.rating;
      if (r < 1 || r > 5) throw new BadRequestError('Rating must be between 1 and 5');
      data.rating = r;
    }
    if (request.reviewText && request.reviewText.trim()) {
      data.reviewText = request.reviewText.trim();
    }
  }

  const saved = await prisma.complaint.update({ where: { id: complaint.id }, data, include: complaintInclude });

  await auditLogService.log(
    saved.id,
    student,
    'RESOLVED',
    'CLOSED',
    'Closed by student' + (saved.rating != null ? ` | Rating: ${saved.rating}/5` : '') + (saved.reviewText ? ' | Review given' : '')
  );

  if (saved.assignedWorker) {
    const ratingText = saved.rating != null ? ` (Rated ${saved.rating}/5)` : '';
    await notificationService.sendNotification(
      saved.assignedWorker,
      `Complaint '${saved.title}' was closed by the student${ratingText}`,
      'COMPLAINT_CLOSED'
    );
  }

  return toResponse(saved);
}

// ─── Dispute ────────────────────────────────────────────────────────────────

async function disputeComplaint(complaintId, request, email) {
  const student = await getUserByEmail(email);
  if (student.role !== 'STUDENT') throw new ForbiddenError('Only student can dispute a complaint');

  const complaint = await getComplaintOrThrow(complaintId);
  if (complaint.studentId !== student.id) throw new ForbiddenError('You cannot dispute this complaint');
  if (complaint.status !== 'RESOLVED') throw new BadRequestError('You can only dispute a RESOLVED complaint');
  if (!request.disputeReason || !request.disputeReason.trim()) {
    throw new BadRequestError('Please provide a reason for disputing');
  }

  const reason = request.disputeReason.trim();
  const saved = await prisma.complaint.update({
    where: { id: complaint.id },
    data: { status: 'DISPUTED', disputeReason: reason, disputedAt: new Date() },
    include: complaintInclude,
  });

  await auditLogService.log(saved.id, student, 'RESOLVED', 'DISPUTED', `Student disputed: ${reason}`);

  const toNotify = await prisma.user.findMany({ where: { role: { in: ['CARETAKER', 'WARDEN'] } } });
  if (saved.assignedWorker) toNotify.push(saved.assignedWorker);
  await Promise.all(
    toNotify.map((u) =>
      notificationService.sendNotification(u, `⚠️ Student disputed complaint '${saved.title}'. Reason: ${reason}`, 'COMPLAINT_DISPUTED')
    )
  );

  return toResponse(saved);
}

// ─── Queries ────────────────────────────────────────────────────────────────

function buildDateRange(dateFrom, dateTo) {
  const range = {};
  if (dateFrom) range.gte = new Date(`${dateFrom}T00:00:00`);
  if (dateTo) range.lte = new Date(`${dateTo}T23:59:59`);
  return Object.keys(range).length ? range : undefined;
}

async function getComplaintsByRole(email, page, size, filters) {
  const { status, blockName, category, priority, dateFrom, dateTo } = filters;
  const user = await getUserByEmail(email);

  const where = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (priority) where.priority = priority;
  const createdAt = buildDateRange(dateFrom, dateTo);
  if (createdAt) where.createdAt = createdAt;

  if (user.role === 'STUDENT') {
    where.studentId = user.id;
  } else if (user.role === 'WORKER') {
    where.workerId = user.id;
  } else if (isStaff(user.role)) {
    // `blockName` kept as the query param name for API compatibility; its
    // value is now just the Block enum ('A'/'B') rather than a joined
    // Block.name — see docs/MIGRATION_NOTES.md "Hostel-10 scoping".
    if (blockName) where.block = blockName;
  } else {
    throw new ForbiddenError('Invalid role for this operation');
  }

  const [rows, total] = await Promise.all([
    prisma.complaint.findMany({
      where,
      include: complaintInclude,
      orderBy: { createdAt: 'desc' },
      skip: page * size,
      take: size,
    }),
    prisma.complaint.count({ where }),
  ]);

  const content = await Promise.all(rows.map(toResponse));
  return toPage(content, total, page, size);
}

async function getStudentDashboardStats(email) {
  const user = await getUserByEmail(email);
  if (user.role !== 'STUDENT') throw new ForbiddenError('Access denied');

  const [total, created, assigned, inProgress, resolved, closed, rejected, disputed] = await Promise.all([
    prisma.complaint.count({ where: { studentId: user.id } }),
    prisma.complaint.count({ where: { studentId: user.id, status: 'CREATED' } }),
    prisma.complaint.count({ where: { studentId: user.id, status: 'ASSIGNED' } }),
    prisma.complaint.count({ where: { studentId: user.id, status: 'IN_PROGRESS' } }),
    prisma.complaint.count({ where: { studentId: user.id, status: 'RESOLVED' } }),
    prisma.complaint.count({ where: { studentId: user.id, status: 'CLOSED' } }),
    prisma.complaint.count({ where: { studentId: user.id, status: 'REJECTED' } }),
    prisma.complaint.count({ where: { studentId: user.id, status: 'DISPUTED' } }),
  ]);

  return {
    total,
    pending: created + assigned + inProgress,
    resolved,
    closed,
    rejected,
    disputed,
  };
}

async function averageRatingForWorker(workerId) {
  const result = await prisma.complaint.aggregate({
    where: { workerId, rating: { not: null } },
    _avg: { rating: true },
  });
  return result._avg.rating;
}

async function workerDashboardStats(workerId) {
  const [assigned, inProgress, resolved, closed, avg] = await Promise.all([
    prisma.complaint.count({ where: { workerId, status: 'ASSIGNED' } }),
    prisma.complaint.count({ where: { workerId, status: 'IN_PROGRESS' } }),
    prisma.complaint.count({ where: { workerId, status: 'RESOLVED' } }),
    prisma.complaint.count({ where: { workerId, status: 'CLOSED' } }),
    averageRatingForWorker(workerId),
  ]);
  return {
    assigned,
    inProgress,
    resolved,
    closed,
    averageRating: avg != null ? Math.round(avg * 10) / 10 : null,
  };
}

async function getWorkerDashboardStats(email) {
  const worker = await getUserByEmail(email);
  if (worker.role !== 'WORKER') throw new ForbiddenError('Access denied');
  return workerDashboardStats(worker.id);
}

async function getWorkerStatsByAdmin(workerId) {
  const worker = await prisma.user.findUnique({ where: { id: BigInt(workerId) } });
  if (!worker) throw new NotFoundError('Worker not found');
  return workerDashboardStats(worker.id);
}

async function getDashboardStats(email) {
  const user = await getUserByEmail(email);
  if (!isStaff(user.role)) throw new ForbiddenError('Access denied');

  const [total, created, assigned, inProgress, resolved, disputed, closed, rejected] = await Promise.all([
    prisma.complaint.count(),
    prisma.complaint.count({ where: { status: 'CREATED' } }),
    prisma.complaint.count({ where: { status: 'ASSIGNED' } }),
    prisma.complaint.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.complaint.count({ where: { status: 'RESOLVED' } }),
    prisma.complaint.count({ where: { status: 'DISPUTED' } }),
    prisma.complaint.count({ where: { status: 'CLOSED' } }),
    prisma.complaint.count({ where: { status: 'REJECTED' } }),
  ]);

  return { total, created, assigned, inProgress, resolved, disputed, closed, rejected };
}

async function getComplaintById(id, email) {
  const user = await getUserByEmail(email);
  const complaint = await getComplaintOrThrow(id);
  if (user.role === 'STUDENT' && complaint.studentId !== user.id) {
    throw new ForbiddenError('Access denied');
  }
  return toResponse(complaint);
}

module.exports = {
  createComplaint,
  assignWorker,
  reassignWorker,
  rejectComplaint,
  updateStatus,
  closeComplaint,
  disputeComplaint,
  getComplaintsByRole,
  getStudentDashboardStats,
  getWorkerDashboardStats,
  getDashboardStats,
  getComplaintById,
  getWorkerStatsByAdmin,
  isStaff,
};
