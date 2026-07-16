const prisma = require('../config/prisma');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/AppError');

// Mirrors ComplaintRatingService.java. NOTE: this is the standalone
// `complaint_ratings` table / rating flow — separate from (and in addition
// to) the star rating stored directly on `complaints.rating` via the
// close-complaint flow in complaint.service.js. Both exist in the original
// app; neither one is removed here.

function toResponse(r, workerName) {
  return {
    id: r.id,
    complaintId: r.complaintId,
    workerId: r.workerId,
    workerName,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
  };
}

async function submitRating(complaintId, email, request) {
  const student = await prisma.user.findUnique({ where: { email } });
  if (!student) throw new NotFoundError('User not found');
  if (student.role !== 'STUDENT') throw new ForbiddenError('Only students can rate complaints');
  if (request.rating < 1 || request.rating > 5) throw new BadRequestError('Rating must be between 1 and 5');

  const complaint = await prisma.complaint.findUnique({ where: { id: BigInt(complaintId) } });
  if (!complaint) throw new NotFoundError('Complaint not found');
  if (complaint.studentId !== student.id) throw new ForbiddenError('You can only rate your own complaints');
  if (complaint.status !== 'CLOSED') throw new BadRequestError('You can only rate closed complaints');
  if (!complaint.workerId) throw new BadRequestError('No worker assigned to this complaint');

  const already = await prisma.complaintRating.findFirst({ where: { complaintId: complaint.id } });
  if (already) throw new BadRequestError('You have already rated this complaint');

  const rating = await prisma.complaintRating.create({
    data: {
      complaintId: complaint.id,
      workerId: complaint.workerId,
      studentId: student.id,
      rating: request.rating,
      comment: request.comment,
    },
  });

  const worker = await prisma.user.findUnique({ where: { id: complaint.workerId } });
  return toResponse(rating, worker.name);
}

async function getRatingForComplaint(complaintId) {
  const rating = await prisma.complaintRating.findFirst({ where: { complaintId: BigInt(complaintId) } });
  if (!rating) return null;
  const worker = await prisma.user.findUnique({ where: { id: rating.workerId } });
  return toResponse(rating, worker ? worker.name : 'Unknown');
}

async function getWorkerRatingSummary(workerId) {
  const worker = await prisma.user.findUnique({ where: { id: BigInt(workerId) }, include: { department: true } });
  if (!worker) throw new NotFoundError('Worker not found');

  const agg = await prisma.complaintRating.aggregate({
    where: { workerId: worker.id },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return {
    workerId: worker.id,
    workerName: worker.name,
    department: worker.department ? worker.department.name : null,
    averageRating: agg._avg.rating != null ? Math.round(agg._avg.rating * 10) / 10 : 0.0,
    totalRatings: agg._count.rating || 0,
  };
}

async function getAllWorkerRatings() {
  const workers = await prisma.user.findMany({ where: { role: 'WORKER' } });
  return Promise.all(workers.map((w) => getWorkerRatingSummary(w.id)));
}

module.exports = { submitRating, getRatingForComplaint, getWorkerRatingSummary, getAllWorkerRatings };
