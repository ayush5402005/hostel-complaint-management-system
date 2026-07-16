const express = require('express');
const { authorize } = require('../middleware/auth');
const adminController = require('../controllers/admin.controller');
const studentProfileController = require('../controllers/studentProfile.controller');

// Mounted at /api/admin behind the global `authenticate` middleware
// (see routes/index.js). Role gates mirror each @PreAuthorize exactly.
const router = express.Router();

// Admin-created student — active immediately, no OTP (see admin.service.js
// #createStudent). ADMIN-only, matching the frontend's role-to-createable-role
// mapping (only ADMIN can create STUDENT accounts from the Create User form).
router.post('/create-student', authorize('ADMIN'), adminController.createStudent);
router.post('/create-warden', authorize('ADMIN', 'WARDEN'), adminController.createWarden);
router.post('/create-caretaker', authorize('ADMIN', 'WARDEN'), adminController.createCaretaker);
router.post('/create-worker', authorize('ADMIN', 'WARDEN', 'CARETAKER'), adminController.createWorker);

router.get('/users', authorize('ADMIN', 'WARDEN'), adminController.getAllUsers);
router.get('/users/role/:role', authorize('ADMIN', 'WARDEN', 'CARETAKER'), adminController.getUsersByRole);
router.get('/workers', authorize('ADMIN', 'WARDEN', 'CARETAKER'), adminController.getWorkers);

router.put('/users/:id', authorize('ADMIN', 'WARDEN'), adminController.updateUser);
router.patch('/users/:id/deactivate', authorize('ADMIN', 'WARDEN'), adminController.deactivateUser);
router.patch('/users/:id/activate', authorize('ADMIN', 'WARDEN'), adminController.activateUser);
router.delete('/users/:id', authorize('ADMIN'), adminController.deleteUser);

router.get('/departments', authorize('ADMIN'), adminController.getAllDepartments);

router.get('/dashboard-stats', authorize('ADMIN', 'WARDEN', 'CARETAKER'), adminController.getDashboardStats);
router.get('/workers/:id/stats', authorize('ADMIN', 'WARDEN', 'CARETAKER'), adminController.getWorkerStats);

// StudentProfileController's staff-facing endpoints (originally mapped at
// literal "/api/admin/students/**" with no class-level @PreAuthorize — role
// checks live inside studentProfile.service.js, so only `authenticate` is
// required here, same as the original).
router.get('/students', studentProfileController.getStudentList);
router.get('/students/vacancies', studentProfileController.getVacancies);
router.get('/students/export/csv', studentProfileController.exportCsv);
router.get('/students/export/pdf', studentProfileController.exportPdf);
router.get('/students/:userId/profile', studentProfileController.getStudentProfile);
router.put('/students/:userId/profile', studentProfileController.updateStudentProfile);

module.exports = router;
