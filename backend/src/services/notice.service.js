const prisma = require('../config/prisma');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/AppError');

const POSTER_ROLES = ['ADMIN', 'WARDEN', 'CARETAKER'];

function toResponse(n) {
  return {
    id: n.id,
    title: n.title,
    content: n.content,
    imageUrl: n.imageUrl,
    postedByName: n.poster.name,
    postedByRole: n.poster.role,
    createdAt: n.createdAt,
  };
}

async function getUserByEmail(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new NotFoundError(`User not found: ${email}`);
  return user;
}

async function createNotice(email, request) {
  const user = await getUserByEmail(email);
  if (!POSTER_ROLES.includes(user.role)) {
    throw new ForbiddenError('Only admin, warden or caretaker can post notices');
  }
  if (!request.title || !request.title.trim()) throw new BadRequestError('Title is required');
  if (!request.content || !request.content.trim()) throw new BadRequestError('Content is required');

  const notice = await prisma.notice.create({
    data: {
      title: request.title.trim(),
      content: request.content.trim(),
      imageUrl: request.imageUrl,
      postedBy: user.id,
      deleted: false,
    },
    include: { poster: true },
  });

  return toResponse(notice);
}

async function getAllNotices() {
  const notices = await prisma.notice.findMany({
    where: { deleted: false },
    orderBy: { createdAt: 'desc' },
    include: { poster: true },
  });
  return notices.map(toResponse);
}

async function getNoticeById(id) {
  const notice = await prisma.notice.findFirst({
    where: { id: BigInt(id), deleted: false },
    include: { poster: true },
  });
  if (!notice) throw new NotFoundError(`Notice not found: ${id}`);
  return toResponse(notice);
}

async function deleteNotice(id, email) {
  const user = await getUserByEmail(email);
  if (!POSTER_ROLES.includes(user.role)) {
    throw new ForbiddenError('Only admin, warden or caretaker can delete notices');
  }

  const notice = await prisma.notice.findFirst({ where: { id: BigInt(id), deleted: false } });
  if (!notice) throw new NotFoundError(`Notice not found: ${id}`);

  await prisma.notice.update({
    where: { id: notice.id },
    data: { deleted: true, deletedAt: new Date() },
  });
}

module.exports = { createNotice, getAllNotices, getNoticeById, deleteNotice };
