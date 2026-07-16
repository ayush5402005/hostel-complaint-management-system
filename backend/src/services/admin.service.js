const prisma = require('../config/prisma');
const { AppError, NotFoundError } = require('../utils/AppError');
const { hashPassword } = require('../utils/password');
const { omitPassword } = require('../utils/mappers');
const authService = require('./auth.service');

// Admin-created student accounts skip the OTP/self-verification flow and
// are active immediately — same as admin-created warden/caretaker/worker
// accounts always have been. Distinct from the public self-registration
// endpoint (`/auth/register`), which still requires OTP verification.
async function createStudent(request) {
  const user = await authService.createStudentAccount(request, { sendOtp: false });
  return omitPassword(user);
}

// Mirrors AdminService.java `createUserWithRole()`.
async function createUserWithRole(request, role) {
  const { name, email, password, phoneNumber, departmentId } = request;
  if (!name || !email || !password || !phoneNumber) {
    throw new AppError('Required fields are missing', 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('User with this email already exists', 400);

  let department;
  if (departmentId) {
    department = await prisma.department.findUnique({ where: { id: BigInt(departmentId) } });
    if (!department) throw new AppError('Department not found', 400);
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: await hashPassword(password),
      role,
      phoneNumber,
      active: true,
      appEnabled: true,
      departmentId: department ? department.id : undefined,
    },
  });
  return omitPassword(user);
}

async function averageRatingByWorker(workerId) {
  const result = await prisma.complaint.aggregate({
    where: { workerId, rating: { not: null } },
    _avg: { rating: true },
  });
  return result._avg.rating;
}

async function mapToAdminUserResponse(user) {
  let averageRating = null;
  if (user.role === 'WORKER') {
    const raw = await averageRatingByWorker(user.id);
    if (raw != null) averageRating = Math.round(raw * 10) / 10;
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phoneNumber: user.phoneNumber,
    scholarNumber: user.scholarNumber,
    hostelBlock: user.block || null,
    roomNumber: user.roomNumber,
    department: user.department ? user.department.name : null,
    active: user.active,
    averageRating,
  };
}

async function getAllUsers() {
  const users = await prisma.user.findMany({ include: { department: true } });
  return Promise.all(users.map(mapToAdminUserResponse));
}

async function getUsersByRole(role) {
  const users = await prisma.user.findMany({
    where: { role },
    include: { department: true },
  });
  return Promise.all(users.map(mapToAdminUserResponse));
}

async function updateUser(id, request) {
  const user = await prisma.user.findUnique({ where: { id: BigInt(id) } });
  if (!user) throw new NotFoundError('User not found');

  const data = {};
  if (request.name != null) data.name = request.name;
  if (request.phoneNumber != null) data.phoneNumber = request.phoneNumber;
  if (request.roomNumber != null) data.roomNumber = request.roomNumber;

  const saved = await prisma.user.update({ where: { id: user.id }, data });
  return omitPassword(saved);
}

async function deactivateUser(id) {
  const user = await prisma.user.findUnique({ where: { id: BigInt(id) } });
  if (!user) throw new AppError(`User not found with id: ${id}`, 400);
  await prisma.user.update({ where: { id: user.id }, data: { active: false } });
}

async function activateUser(id) {
  const user = await prisma.user.findUnique({ where: { id: BigInt(id) } });
  if (!user) throw new AppError(`User not found with id: ${id}`, 400);
  await prisma.user.update({ where: { id: user.id }, data: { active: true } });
}

async function deleteUser(id) {
  const user = await prisma.user.findUnique({ where: { id: BigInt(id) } });
  if (!user) throw new AppError('User not found', 400);
  await prisma.user.delete({ where: { id: user.id } });
}

async function getAllDepartments() {
  return prisma.department.findMany();
}

// Mirrors AdminService.java `getDashboardStats()` EXACTLY — including its
// pre-existing field-order bug (this is a *different* method from
// ComplaintService.getDashboardStats(), used by GET /api/admin/dashboard-stats
// rather than GET /api/complaints/dashboard). The original passes
// (total, created, assigned, inProgress, resolved, closed, rejected, 0) into
// a DTO whose 6th/7th/8th fields are actually (disputed, closed, rejected),
// so `disputed` reports the closed-count, `closed` reports the
// rejected-count, and `rejected` is always 0. See
// docs/MIGRATION_NOTES.md "Known gaps carried over" — preserved verbatim
// because this task's constraint is 100% behavioral parity, not bug fixes.
async function getDashboardStats() {
  const [total, created, assigned, inProgress, resolved, closed, rejected] = await Promise.all([
    prisma.complaint.count(),
    prisma.complaint.count({ where: { status: 'CREATED' } }),
    prisma.complaint.count({ where: { status: 'ASSIGNED' } }),
    prisma.complaint.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.complaint.count({ where: { status: 'RESOLVED' } }),
    prisma.complaint.count({ where: { status: 'CLOSED' } }),
    prisma.complaint.count({ where: { status: 'REJECTED' } }),
  ]);
  return {
    total,
    created,
    assigned,
    inProgress,
    resolved,
    disputed: closed, // scrambled — see note above
    closed: rejected, // scrambled — see note above
    rejected: 0, // scrambled — see note above
  };
}

module.exports = {
  createStudent,
  createUserWithRole,
  getAllUsers,
  getUsersByRole,
  updateUser,
  deactivateUser,
  activateUser,
  deleteUser,
  getAllDepartments,
  getDashboardStats,
  averageRatingByWorker,
};
