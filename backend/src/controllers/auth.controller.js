const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');
const passwordResetService = require('../services/passwordReset.service');

const register = asyncHandler(async (req, res) => {
  await authService.register(req.body);
  res.json({ message: 'OTP sent to your email. Please verify.' });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.json(result);
});

// Token-based flow (ForgotPasswordPage/ResetPasswordPage send { email } and
// { token, newPassword } respectively) — backed by passwordReset.service.js,
// which mirrors the original PasswordResetService.java. This was previously
// unwired on both the Java and Node backends (see MIGRATION_NOTES.md), but
// the frontend has always had a working "Forgot password?" link pointing at
// it, so it 404'd for any real user. authService.forgotPassword/resetPassword
// is a separate OTP-code-based flow that no frontend page ever called.
const forgotPassword = asyncHandler(async (req, res) => {
  await passwordResetService.forgotPassword(req.body.email);
  res.json({ message: 'If this email is registered, a reset link has been sent.' });
});

const resetPassword = asyncHandler(async (req, res) => {
  await passwordResetService.resetPassword(req.body.token, req.body.newPassword);
  res.json({ message: 'Password reset successfully.' });
});

module.exports = { register, login, forgotPassword, resetPassword };
