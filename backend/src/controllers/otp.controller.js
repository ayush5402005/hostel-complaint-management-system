const asyncHandler = require('../utils/asyncHandler');
const otpService = require('../services/otp.service');

const verifyOtp = asyncHandler(async (req, res) => {
  await otpService.verifyOtp(req.body.email, req.body.otp);
  res.json({ message: 'Email verified successfully. You can now login.' });
});

const resendOtp = asyncHandler(async (req, res) => {
  await otpService.generateAndSendOtp(req.body.email);
  res.json({ message: 'OTP resent successfully.' });
});

module.exports = { verifyOtp, resendOtp };
