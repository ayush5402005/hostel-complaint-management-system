const prisma = require('../config/prisma');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/AppError');

// Mirrors ComplaintCommentService.java.

function checkAccess(user, complaint) {
  if (user.role === 'STUDENT' && complaint.studentId !== user.id) {
    throw new ForbiddenError('Access denied');
  }
  if (user.role === 'WORKER') {
    if (!complaint.workerId || complaint.workerId !== user.id) {
      throw new ForbiddenError('Access denied');
    }
  }
  // Warden/Caretaker/Admin — full access, no check needed.
}

function toResponse(c) {
  return {
    id: c.id,
    message: c.message,
    userName: c.user.name,
    userRole: c.user.role,
    userId: c.user.id,
    createdAt: c.createdAt,
  };
}

async function addComment(complaintId, email, request) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new NotFoundError('User not found');

  const complaint = await prisma.complaint.findUnique({ where: { id: BigInt(complaintId) } });
  if (!complaint) throw new NotFoundError('Complaint not found');

  checkAccess(user, complaint);

  if (!request.message || !request.message.trim()) {
    throw new BadRequestError('Message cannot be empty');
  }

  const comment = await prisma.complaintComment.create({
    data: { complaintId: complaint.id, userId: user.id, message: request.message.trim() },
    include: { user: true },
  });

  return toResponse(comment);
}

async function getComments(complaintId, email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new NotFoundError('User not found');

  const complaint = await prisma.complaint.findUnique({ where: { id: BigInt(complaintId) } });
  if (!complaint) throw new NotFoundError('Complaint not found');

  checkAccess(user, complaint);

  const comments = await prisma.complaintComment.findMany({
    where: { complaintId: complaint.id },
    orderBy: { createdAt: 'asc' },
    include: { user: true },
  });

  return comments.map(toResponse);
}

module.exports = { addComment, getComments };
