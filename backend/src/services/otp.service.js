const crypto = require('crypto');
const prisma = require('../config/prisma');
const { AppError } = require('../utils/AppError');
const emailService = require('./email.service');

// Mirrors OtpService.java. One behavioral hardening vs. the original: the
// OTP digits use crypto.randomInt (CSPRNG) instead of java.util.Random,
// per the OWASP requirement for this migration — output shape (6-digit
// zero-padded string) and all timing/attempt rules are unchanged.
async function generateAndSendOtp(email) {
  await prisma.otpVerification.deleteMany({ where: { email } });

  const otp = String(crypto.randomInt(0, 1000000)).padStart(6, '0');

  await prisma.otpVerification.create({
    data: {
      email,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
      used: false,
    },
  });

  await emailService.sendOtpEmail(email, otp);
}

async function validateOtp(email, otp) {
  const record = await prisma.otpVerification.findFirst({
    where: { email, used: false },
  });
  if (!record) throw new AppError('OTP not found. Please request a new one.', 404);

  if (new Date() > record.expiresAt) {
    await prisma.otpVerification.delete({ where: { id: record.id } });
    throw new AppError('OTP has expired. Please request a new one.', 410);
  }

  if (record.attempts >= 3) {
    await prisma.otpVerification.delete({ where: { id: record.id } });
    throw new AppError('Too many failed attempts. Please request a new OTP.', 429);
  }

  if (record.otp !== otp) {
    const attempts = record.attempts + 1;
    await prisma.otpVerification.update({ where: { id: record.id }, data: { attempts } });
    const remaining = 3 - attempts;
    throw new AppError(`Invalid OTP. ${remaining} attempt(s) remaining.`, 400);
  }

  await prisma.otpVerification.update({ where: { id: record.id }, data: { used: true } });
}

// Used for REGISTRATION — validates OTP and activates the user account.
async function verifyOtp(email, otp) {
  await validateOtp(email, otp);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('User not found.', 404);
  await prisma.user.update({ where: { id: user.id }, data: { active: true } });
}

// Used for FORGOT PASSWORD — validates OTP only, does not touch `active`.
async function verifyOtpForPasswordReset(email, otp) {
  await validateOtp(email, otp);
}

module.exports = { generateAndSendOtp, verifyOtp, verifyOtpForPasswordReset };
