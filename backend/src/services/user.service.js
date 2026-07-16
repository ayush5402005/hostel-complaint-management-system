const prisma = require('../config/prisma');
const { hashPassword } = require('../utils/password');
const { toUserSummary, userSummaryInclude } = require('../utils/mappers');

// Mirrors UserController.java's inline repository logic exactly.

async function getAllWorkers() {
  const workers = await prisma.user.findMany({
    where: { role: 'WORKER' },
    include: { department: true },
  });
  return workers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department ? u.department.name : null,
  }));
}

async function getMe(email) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
    include: userSummaryInclude,
  });
  return toUserSummary(user);
}

async function updateMe(email, request) {
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });

  const data = {};
  if (request.name != null) data.name = request.name;
  if (request.phoneNumber != null) data.phoneNumber = request.phoneNumber;
  if (request.roomNumber != null) data.roomNumber = request.roomNumber;

  const saved = await prisma.user.update({
    where: { id: user.id },
    data,
    include: userSummaryInclude,
  });
  return toUserSummary(saved);
}

async function changePassword(email, newPassword) {
  if (!newPassword || newPassword.length < 6) {
    return { ok: false, message: 'Password must be at least 6 characters' };
  }
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  await prisma.user.update({
    where: { id: user.id },
    data: { password: await hashPassword(newPassword) },
  });
  return { ok: true };
}

module.exports = { getAllWorkers, getMe, updateMe, changePassword };
