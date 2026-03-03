package com.hostel.backend.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtpEmail(String to, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setTo(to);
            helper.setSubject("HostelDesk — Email Verification OTP");
            helper.setText("""
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #4f46e5;">🏠 HostelDesk</h2>
                    <p>Your email verification OTP is:</p>
                    <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4f46e5; padding: 16px 0;">
                        %s
                    </div>
                    <p style="color: #64748b;">This OTP is valid for <strong>10 minutes</strong>.</p>
                    <p style="color: #64748b;">Max <strong>3 attempts</strong> allowed.</p>
                    <hr style="border-color: #e2e8f0;"/>
                    <p style="color: #94a3b8; font-size: 12px;">If you didn't request this, ignore this email.</p>
                </div>
            """.formatted(otp), true);
            mailSender.send(message);
        } catch (Exception e) {
            throw new AppException("Failed to send OTP email", org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ✅ NEW — Password reset email
    public void sendPasswordResetEmail(String to, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setTo(to);
            helper.setSubject("HostelDesk — Password Reset Request");
            // ✅ Frontend reset page URL
            String resetUrl = "http://localhost:5173/reset-password?token=" + token;
            helper.setText("""
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #4f46e5;">🏠 HostelDesk</h2>
                    <p>You requested a password reset. Click the button below:</p>
                    <a href="%s"
                       style="display: inline-block; margin: 16px 0; background: #4f46e5; color: white;
                              padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                        Reset Password
                    </a>
                    <p style="color: #64748b;">This link is valid for <strong>30 minutes</strong>.</p>
                    <p style="color: #64748b;">If you didn't request this, ignore this email.</p>
                    <hr style="border-color: #e2e8f0;"/>
                    <p style="color: #94a3b8; font-size: 12px;">%s</p>
                </div>
            """.formatted(resetUrl, resetUrl), true);
            mailSender.send(message);
        } catch (Exception e) {
            throw new AppException("Failed to send reset email", org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
