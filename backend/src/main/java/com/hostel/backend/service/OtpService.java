package com.hostel.backend.service;

import com.hostel.backend.entity.OtpVerification;
import com.hostel.backend.entity.User;
import com.hostel.backend.repository.OtpVerificationRepository;
import com.hostel.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class OtpService {

    private final OtpVerificationRepository otpRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public OtpService(OtpVerificationRepository otpRepository,
                      UserRepository userRepository,
                      EmailService emailService) {
        this.otpRepository = otpRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    // Generate and send OTP
    @Transactional
    public void generateAndSendOtp(String email) {
        // Delete any existing OTP for this email
        otpRepository.deleteByEmail(email);

        String otp = String.format("%06d", new Random().nextInt(999999));

        OtpVerification otpVerification = OtpVerification.builder()
                .email(email)
                .otp(otp)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .build();

        otpRepository.save(otpVerification);
        emailService.sendOtpEmail(email, otp);
    }

    // Verify OTP
    @Transactional
    public void verifyOtp(String email, String otp) {
        OtpVerification otpVerification = otpRepository.findByEmailAndUsedFalse(email)
                .orElseThrow(() -> new RuntimeException("OTP not found. Please request a new one."));

        // Check expiry
        if (LocalDateTime.now().isAfter(otpVerification.getExpiresAt())) {
            otpRepository.delete(otpVerification);
            throw new RuntimeException("OTP has expired. Please request a new one.");
        }

        // Check max attempts
        if (otpVerification.getAttempts() >= 3) {
            otpRepository.delete(otpVerification);
            throw new RuntimeException("Too many failed attempts. Please request a new OTP.");
        }

        // Check OTP value
        if (!otpVerification.getOtp().equals(otp)) {
            otpVerification.setAttempts(otpVerification.getAttempts() + 1);
            otpRepository.save(otpVerification);
            int remaining = 3 - otpVerification.getAttempts();
            throw new RuntimeException("Invalid OTP. " + remaining + " attempt(s) remaining.");
        }

        // ✅ OTP correct — mark as used
        otpVerification.setUsed(true);
        otpRepository.save(otpVerification);

        // ✅ Activate user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found."));
        user.setActive(true);
        userRepository.save(user);
    }
}
