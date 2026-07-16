const express = require('express');
const authController = require('../controllers/auth.controller');
const otpController = require('../controllers/otp.controller');

// Mounted at /api/auth — matches SecurityConfig's
// `.requestMatchers("/api/auth/**").permitAll()`: no auth middleware here.
//
// NOTE: the original GET /hostels and GET /hostels/:hostelId/blocks dropdown
// endpoints are gone — this app now serves exactly one hostel (Hostel 10),
// so there's nothing left to pick from. See docs/MIGRATION_NOTES.md
// "Hostel-10 scoping".
const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

router.post('/verify-otp', otpController.verifyOtp);
router.post('/resend-otp', otpController.resendOtp);

router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
