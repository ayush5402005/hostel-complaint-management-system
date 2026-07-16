const prisma = require('../config/prisma');
const { AppError } = require('../utils/AppError');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const otpService = require('./otp.service');

const VALID_BLOCKS = ['A', 'B'];

// Shared by the public self-registration flow (`register`, below — OTP
// required, starts inactive, matching the original Java behavior exactly)
// and admin-created student accounts (`admin.service.js#createStudent` —
// no OTP, active immediately, since an admin creating the account already
// vouches for it, the same way admin-created warden/caretaker/worker
// accounts always have been). `sendOtp: false` skips the email step and
// activates the account right away instead.
async function createStudentAccount(request, { sendOtp = true } = {}) {
  const { name, email, password, phoneNumber, scholarNumber, roomNumber, block } = request;

  if (!name || !email || !password || !phoneNumber) {
    throw new AppError('Required fields are missing', 400);
  }
  if (!email.endsWith('@stu.manit.ac.in')) {
    throw new AppError('Students must register with college email (@stu.manit.ac.in)', 400);
  }
  if (!scholarNumber || !roomNumber) {
    throw new AppError('scholarNumber and roomNumber are required', 400);
  }
  if (!block || !VALID_BLOCKS.includes(block)) {
    throw new AppError('block is required and must be A or B', 400);
  }

  const existingByEmail = await prisma.user.findUnique({ where: { email } });
  if (existingByEmail) {
    if (existingByEmail.active) throw new AppError('Email already registered', 409);
    await prisma.user.delete({ where: { id: existingByEmail.id } });
  }

  const existingByPhone = await prisma.user.findUnique({ where: { phoneNumber } });
  if (existingByPhone) {
    if (!existingByPhone.active) {
      await prisma.user.delete({ where: { id: existingByPhone.id } });
    } else {
      throw new AppError('Phone number already registered', 409);
    }
  }

  const occupants = await prisma.user.count({
    where: { block, roomNumber, active: true },
  });
  if (occupants >= 2) {
    throw new AppError(
      `Room ${roomNumber} in this block already has 2 students. Please contact the caretaker if you believe this is an error.`,
      409
    );
  }

  // Send OTP first — before saving the user, same order as the original.
  if (sendOtp) {
    await otpService.generateAndSendOtp(email);
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: await hashPassword(password),
      role: 'STUDENT',
      phoneNumber,
      scholarNumber,
      roomNumber,
      block,
      active: !sendOtp,
      appEnabled: true,
    },
  });

  return user;
}

// Mirrors AuthService.java `register()`, minus the hostel/block foreign-key
// lookups — this app now serves exactly one hostel (Hostel 10), so `block`
// is a plain 'A'|'B' enum value instead of a hostelId+blockId pair that had
// to be resolved and cross-checked against a Hostel/Block table. See
// docs/MIGRATION_NOTES.md "Hostel-10 scoping" for why those tables are gone.
async function register(request) {
  if (request.role && request.role !== 'STUDENT') {
    throw new AppError('Self-registration is only allowed for STUDENT role', 403);
  }
  return createStudentAccount(request, { sendOtp: true });
}

async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('User not found', 404);

  if (!user.active) {
    throw new AppError('Account not verified. Please verify your email first.', 403);
  }
  if (!(await comparePassword(password, user.password))) {
    throw new AppError('Invalid credentials', 401);
  }

  const token = generateToken(user.email, user.role);
  return { token, role: user.role, name: user.name, email: user.email };
}

// Mirrors AuthService.java's forgotPassword/resetPassword (OTP-based)
// exactly. Unlike passwordReset.service.js's token-based flow, no frontend
// page ever called this variant — the "Forgot password?" link uses the
// token-based flow instead (see auth.controller.js). Kept unwired/unused,
// same as the original Spring Boot app, since removing it isn't necessary
// and two parallel reset flows already existed pre-migration.
async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('No account found with this email', 404);
  if (!user.active) {
    throw new AppError('Account is not verified. Please complete email verification first.', 403);
  }
  await otpService.generateAndSendOtp(email);
}

async function resetPassword(email, otp, newPassword) {
  await otpService.verifyOtpForPasswordReset(email, otp);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('User not found', 404);

  if (!newPassword || newPassword.trim().length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await hashPassword(newPassword) },
  });
}

module.exports = { register, login, forgotPassword, resetPassword, createStudentAccount };
