const asyncHandler = require('../utils/asyncHandler');
const noticeService = require('../services/notice.service');

const getAll = asyncHandler(async (req, res) => {
  res.json(await noticeService.getAllNotices());
});

const getById = asyncHandler(async (req, res) => {
  res.json(await noticeService.getNoticeById(req.params.id));
});

const create = asyncHandler(async (req, res) => {
  res.json(await noticeService.createNotice(req.user.email, req.body));
});

const remove = asyncHandler(async (req, res) => {
  await noticeService.deleteNotice(req.params.id, req.user.email);
  res.status(204).send();
});

module.exports = { getAll, getById, create, remove };
