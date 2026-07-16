const prisma = require('../config/prisma');
const { NotFoundError, ForbiddenError } = require('../utils/AppError');
const { toPage } = require('../utils/pagination');

// Mirrors NotificationService.java, including its SSE emitter map (here:
// user id -> Express `res`). Single-process, in-memory — same scaling
// caveat as the original `ConcurrentHashMap<Long, SseEmitter>` (works for one
// instance; a multi-instance deployment would need a pub/sub backplane).
const emitters = new Map();

function subscribe(userId, res) {
  const key = String(userId);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  emitters.set(key, res);
  res.write('event: CONNECTED\ndata: connected\n\n');

  res.on('close', () => {
    if (emitters.get(key) === res) emitters.delete(key);
  });
}

function toResponse(n) {
  return {
    id: n.id,
    message: n.message,
    type: n.type,
    isRead: n.isRead,
    createdAt: n.createdAt,
  };
}

async function sendNotification(user, message, type) {
  const saved = await prisma.notification.create({
    data: { userId: user.id, message, type, isRead: false },
  });

  const res = emitters.get(String(user.id));
  if (res) {
    try {
      const payload = JSON.stringify(toResponse(saved));
      res.write(`event: ${type}\ndata: ${payload}\n\n`);
    } catch {
      emitters.delete(String(user.id));
    }
  }
}

async function getMyNotifications(email, page, size) {
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      skip: page * size,
      take: size,
    }),
    prisma.notification.count({ where: { userId: user.id } }),
  ]);
  return toPage(items.map(toResponse), total, page, size);
}

async function getUnreadCount(email) {
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  return prisma.notification.count({ where: { userId: user.id, isRead: false } });
}

async function markAsRead(notificationId, email) {
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  const notification = await prisma.notification.findUnique({ where: { id: BigInt(notificationId) } });
  if (!notification) throw new NotFoundError('Notification not found');
  if (notification.userId !== user.id) throw new ForbiddenError('Cannot access this notification');
  await prisma.notification.update({ where: { id: notification.id }, data: { isRead: true } });
}

async function markAllAsRead(email) {
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  await prisma.notification.updateMany({ where: { userId: user.id }, data: { isRead: true } });
}

module.exports = {
  subscribe,
  sendNotification,
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  // exposed for the SSE route to key the emitter map identically to `subscribe`
  emitterKey: (userId) => String(userId),
};
