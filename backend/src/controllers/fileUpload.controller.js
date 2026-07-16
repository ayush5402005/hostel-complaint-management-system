const asyncHandler = require('../utils/asyncHandler');
const fileUploadService = require('../services/fileUpload.service');

const uploadFile = asyncHandler(async (req, res) => {
  const url = await fileUploadService.saveUploadedFile(req.file);
  res.json({ url });
});

module.exports = { uploadFile };
