const asyncHandler = require('../utils/asyncHandler');
const profileService = require('../services/studentProfile.service');

const submitProfile = asyncHandler(async (req, res) => {
  res.json(await profileService.submitProfile(req.user.email, req.body));
});

const getMyProfile = asyncHandler(async (req, res) => {
  res.json(await profileService.getMyProfile(req.user.email));
});

const checkProfileStatus = asyncHandler(async (req, res) => {
  const profileComplete = await profileService.isProfileComplete(req.user.email);
  res.json({ profileComplete });
});

// NOTE: `blockId` query param renamed to `block` ('A'/'B') — this app now
// serves one hostel, so blocks are no longer separate FK-addressable rows.
// Confirmed unused by the frontend before renaming. See
// docs/MIGRATION_NOTES.md "Hostel-10 scoping".
const getStudentList = asyncHandler(async (req, res) => {
  const { block, roomNumber, name } = req.query;
  const page = parseInt(req.query.page ?? '0', 10);
  const size = parseInt(req.query.size ?? '20', 10);
  res.json(await profileService.getStudentList(req.user.email, block, roomNumber, name, page, size));
});

const getStudentProfile = asyncHandler(async (req, res) => {
  res.json(await profileService.getStudentProfileByStaff(req.params.userId, req.user.email));
});

const updateStudentProfile = asyncHandler(async (req, res) => {
  res.json(await profileService.updateProfileByStaff(req.params.userId, req.body, req.user.email));
});

const getVacancies = asyncHandler(async (req, res) => {
  res.json(await profileService.getVacancyList(req.user.email, req.query.block));
});

const exportCsv = asyncHandler(async (req, res) => {
  const { block, roomNumber, name } = req.query;
  const csv = await profileService.exportAsCsv(req.user.email, block, roomNumber, name);
  res.setHeader('Content-Disposition', 'attachment; filename="students.csv"');
  res.setHeader('Content-Type', 'text/csv');
  res.send(csv);
});

const exportPdf = asyncHandler(async (req, res) => {
  const { block, roomNumber, name } = req.query;
  const pdf = await profileService.exportAsPdf(req.user.email, block, roomNumber, name);
  res.setHeader('Content-Disposition', 'attachment; filename="students.pdf"');
  res.setHeader('Content-Type', 'application/pdf');
  res.send(pdf);
});

module.exports = {
  submitProfile,
  getMyProfile,
  checkProfileStatus,
  getStudentList,
  getStudentProfile,
  updateStudentProfile,
  getVacancies,
  exportCsv,
  exportPdf,
};
