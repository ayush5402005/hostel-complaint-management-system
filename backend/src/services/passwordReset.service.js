const crypto = require('crypto');
const prisma = require('../config/prisma');
const { AppError } = require('../utils/AppError');
const { hashPassword } = require('../utils/password');
const emailService = require('./email.service');

// Mirrors PasswordResetService.java (the token-based reset flow) exactly.
// Wired to POST /api/auth/forgot-password and /reset-password — the
// original Spring Boot backend never wired this to a controller despite the
// frontend's "Forgot password?" link depending on it; fixed here since it's
// a real user-facing dead end, not an intentional behavior. See
// docs/MIGRATION_NOTES.md.
async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Original throws an AppException carrying HTTP 200 here specifically
    // so the caller's generic catch never turns it into a real error —
    // preserved as a no-op for parity.
    return;
  }

  await prisma.passwordResetToken.deleteMany({ where: { email } });

  const token = crypto.randomUUID();

  await prisma.passwordResetToken.create({
    data: {
      token,
      email,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      used: false,
    },
  });

  await emailService.sendPasswordResetEmail(email, token);
}

async function resetPassword(token, newPassword) {
  if (!newPassword || newPassword.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400);
  }

  const resetToken = await prisma.passwordResetToken.findFirst({
    where: { token, used: false },
  });
  if (!resetToken) throw new AppError('Invalid or already used reset link', 400);

  if (new Date() > resetToken.expiresAt) {
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
    throw new AppError('Reset link has expired. Please request a new one.', 410);
  }

  const user = await prisma.user.findUnique({ where: { email: resetToken.email } });
  if (!user) throw new AppError('User not found', 404);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await hashPassword(newPassword) },
  });

  await prisma.passwordResetToken.update({
    where: { id: resetToken.id },
    data: { used: true },
  });
}

module.exports = { forgotPassword, resetPassword };
