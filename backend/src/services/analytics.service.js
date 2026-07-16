const prisma = require('../config/prisma');
const { ForbiddenError, NotFoundError } = require('../utils/AppError');

const STAFF_ROLES = ['ADMIN', 'WARDEN', 'CARETAKER'];

const STATUS_VALUES = ['CREATED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'DISPUTED', 'CLOSED', 'REJECTED'];
const CATEGORY_VALUES = [
  'BUILDING_CIVIL',
  'CLEANING',
  'ELECTRICAL',
  'FURNITURE',
  'GEYSER',
  'LIBRARY',
  'OTHER',
  'PLUMBING',
  'ROOM_REPAIR',
  'WATER_COOLER',
  'WIFI_INTERNET',
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

async function checkStaff(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new NotFoundError('User not found');
  if (!STAFF_ROLES.includes(user.role)) throw new ForbiddenError('Access denied');
}

async function buildStatusMap() {
  const map = {};
  for (const s of STATUS_VALUES) map[s] = 0;
  const rows = await prisma.complaint.groupBy({ by: ['status'], _count: { status: true } });
  rows.forEach((r) => {
    map[r.status] = r._count.status;
  });
  return map;
}

async function buildCategoryMap() {
  const map = {};
  for (const c of CATEGORY_VALUES) map[c] = 0;
  const rows = await prisma.complaint.groupBy({ by: ['category'], _count: { category: true } });
  rows.forEach((r) => {
    map[r.category] = r._count.category;
  });
  return map;
}

async function buildBlockStats() {
  // `block` is a plain enum column now (A/B) — see docs/MIGRATION_NOTES.md
  // "Hostel-10 scoping".
  const rows = await prisma.complaint.groupBy({ by: ['block'], where: { block: { not: null } }, _count: { block: true } });
  const counts = new Map();
  rows.forEach((r) => {
    if (!r.block) return;
    counts.set(r.block, r._count.block);
  });
  return [...counts.entries()]
    .map(([blockName, count]) => ({ blockName, count }))
    .sort((a, b) => b.count - a.count);
}

async function buildMonthlyTrend() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const rows = await prisma.complaint.findMany({
    where: { createdAt: { gte: from } },
    select: { createdAt: true },
  });

  const dbMap = new Map();
  rows.forEach((r) => {
    if (!r.createdAt) return;
    const key = `${r.createdAt.getFullYear()}-${r.createdAt.getMonth()}`;
    dbMap.set(key, (dbMap.get(key) || 0) + 1);
  });

  const result = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    result.push({ month: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`, count: dbMap.get(key) || 0 });
  }
  return result;
}

async function buildTopWorkers() {
  const rows = await prisma.complaint.groupBy({
    by: ['workerId'],
    where: { status: 'RESOLVED', workerId: { not: null } },
    _count: { workerId: true },
    _avg: { rating: true },
    orderBy: { _count: { workerId: 'desc' } },
    take: 10,
  });

  const workers = await prisma.user.findMany({ where: { id: { in: rows.map((r) => r.workerId) } } });
  const nameById = new Map(workers.map((w) => [String(w.id), w.name]));

  return rows.map((r) => ({
    workerId: r.workerId,
    workerName: nameById.get(String(r.workerId)) || 'Unknown',
    resolvedCount: r._count.workerId,
    avgRating: r._avg.rating != null ? Math.round(r._avg.rating * 10) / 10 : null,
  }));
}

async function buildProfileStat() {
  const [total, completed] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT', active: true } }),
    prisma.studentProfile.count({ where: { profileComplete: true } }),
  ]);
  const pending = total - completed;
  const rate = total > 0 ? Math.round((completed * 100 * 10) / total) / 10 : 0;
  return { totalStudents: total, completedProfiles: completed, pendingProfiles: pending, completionRate: rate };
}

async function getDashboard(staffEmail) {
  await checkStaff(staffEmail);

  const [totalComplaints, totalResolved, totalOverdue, totalDisputed, byStatus, byCategory, byBlock, monthlyTrend, topWorkers, profileCompletion] =
    await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: 'RESOLVED' } }),
      prisma.complaint.count({ where: { isOverdue: true } }),
      prisma.complaint.count({ where: { disputeReason: { not: null } } }),
      buildStatusMap(),
      buildCategoryMap(),
      buildBlockStats(),
      buildMonthlyTrend(),
      buildTopWorkers(),
      buildProfileStat(),
    ]);

  return {
    totalComplaints,
    totalResolved,
    totalPending: totalComplaints - totalResolved,
    totalOverdue,
    totalDisputed,
    byStatus,
    byCategory,
    byBlock,
    monthlyTrend,
    topWorkers,
    profileCompletion,
  };
}

module.exports = { getDashboard };
