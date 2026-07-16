const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../config/prisma');
const notificationService = require('../services/notification.service');

const stream = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { email: req.user.email } });
  notificationService.subscribe(user.id, res);
});

const getMyNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page ?? '0', 10);
  const size = parseInt(req.query.size ?? '10', 10);
  res.json(await notificationService.getMyNotifications(req.user.email, page, size));
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await notificationService.getUnreadCount(req.user.email);
  res.json({ unreadCount });
});

const markAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAsRead(req.params.id, req.user.email);
  res.json({});
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user.email);
  res.json({});
});

module.exports = { stream, getMyNotifications, getUnreadCount, markAsRead, markAllAsRead };
