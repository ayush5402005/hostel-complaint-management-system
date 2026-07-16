const nodemailer = require('nodemailer');
const env = require('../config/env');
const { AppError } = require('../utils/AppError');
const logger = require('../config/logger');

const transporter = nodemailer.createTransport({
  host: env.mail.host,
  port: env.mail.port,
  secure: false, // STARTTLS on port 587, matches spring.mail.properties.mail.smtp.starttls.enable=true
  requireTLS: true,
  auth: {
    user: env.mail.username,
    pass: env.mail.password,
  },
});

async function sendOtpEmail(to, otp) {
  try {
    await transporter.sendMail({
      from: env.mail.username,
      to,
      subject: 'HostelDesk — Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #4f46e5;">🏠 HostelDesk</h2>
            <p>Your email verification OTP is:</p>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4f46e5; padding: 16px 0;">
                ${otp}
            </div>
            <p style="color: #64748b;">This OTP is valid for <strong>10 minutes</strong>.</p>
            <p style="color: #64748b;">Max <strong>3 attempts</strong> allowed.</p>
            <hr style="border-color: #e2e8f0;"/>
            <p style="color: #94a3b8; font-size: 12px;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    logger.error('Failed to send OTP email', err);
    throw new AppError('Failed to send OTP email', 500);
  }
}

async function sendPasswordResetEmail(to, token) {
  try {
    const resetUrl = `${env.frontendResetUrl}?token=${token}`;
    await transporter.sendMail({
      from: env.mail.username,
      to,
      subject: 'HostelDesk — Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #4f46e5;">🏠 HostelDesk</h2>
            <p>You requested a password reset. Click the button below:</p>
            <a href="${resetUrl}"
               style="display: inline-block; margin: 16px 0; background: #4f46e5; color: white;
                      padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Reset Password
            </a>
            <p style="color: #64748b;">This link is valid for <strong>30 minutes</strong>.</p>
            <p style="color: #64748b;">If you didn't request this, ignore this email.</p>
            <hr style="border-color: #e2e8f0;"/>
            <p style="color: #94a3b8; font-size: 12px;">${resetUrl}</p>
        </div>
      `,
    });
  } catch (err) {
    logger.error('Failed to send password reset email', err);
    throw new AppError('Failed to send reset email', 500);
  }
}

module.exports = { sendOtpEmail, sendPasswordResetEmail };
