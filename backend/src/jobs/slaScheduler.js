const cron = require('node-cron');
const prisma = require('../config/prisma');
const logger = require('../config/logger');
const notificationService = require('../services/notification.service');

const ACTIVE_STATUSES = ['CREATED', 'ASSIGNED', 'IN_PROGRESS'];

// Mirrors scheduler/SlaScheduler.java exactly: runs every hour, flags
// complaints unresolved >7 days as overdue, and unassigned HIGH-priority
// complaints older than 24h as escalated.
async function checkSlaBreaches() {
  const now = new Date();
  const overdueCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const escalationCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const staff = await prisma.user.findMany({ where: { role: { in: ['WARDEN', 'CARETAKER'] } } });
  const activeComplaints = await prisma.complaint.findMany({
    where: { status: { in: ACTIVE_STATUSES } },
    include: { student: true },
  });

  for (const c of activeComplaints) {
    // S5: mark OVERDUE if older than 7 days
    if (!c.isOverdue && c.createdAt && c.createdAt < overdueCutoff) {
      await prisma.complaint.update({
        where: { id: c.id },
        data: { isOverdue: true, lastSlaNotifiedAt: now },
      });

      const msg = `🔴 Complaint #${c.id} '${c.title}' is OVERDUE (>7 days unresolved)`;
      await Promise.all(staff.map((s) => notificationService.sendNotification(s, msg, 'SLA_OVERDUE')));
      await notificationService.sendNotification(c.student, msg, 'SLA_OVERDUE');
    }

    // S10: escalate HIGH priority not assigned within 24h
    if (!c.isEscalated && c.priority === 'HIGH' && c.status === 'CREATED' && c.createdAt && c.createdAt < escalationCutoff) {
      await prisma.complaint.update({
        where: { id: c.id },
        data: { isEscalated: true, lastSlaNotifiedAt: now },
      });

      const msg = `🚨 HIGH priority complaint #${c.id} '${c.title}' is unassigned for >24 hours!`;
      await Promise.all(staff.map((s) => notificationService.sendNotification(s, msg, 'ESCALATED')));
    }
  }
}

function startSlaScheduler() {
  // Original: @Scheduled(fixedRate = 3_600_000) — every hour, on the hour.
  cron.schedule('0 * * * *', () => {
    checkSlaBreaches().catch((err) => logger.error('SLA scheduler run failed', err));
  });
  logger.info('SLA scheduler started (runs hourly)');
}

module.exports = { startSlaScheduler, checkSlaBreaches };
