package com.hostel.backend.service;

import com.hostel.backend.entity.OtpVerification;
import com.hostel.backend.entity.User;
import com.hostel.backend.exception.AppException;
import com.hostel.backend.repository.OtpVerificationRepository;
import com.hostel.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
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

    @Transactional
    public void generateAndSendOtp(String email) {
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

    @Transactional
    public void verifyOtp(String email, String otp) {

        OtpVerification otpVerification = otpRepository.findByEmailAndUsedFalse(email)
                .orElseThrow(() -> new AppException("OTP not found. Please request a new one.", HttpStatus.NOT_FOUND));

        if (LocalDateTime.now().isAfter(otpVerification.getExpiresAt())) {
            otpRepository.delete(otpVerification);
            throw new AppException("OTP has expired. Please request a new one.", HttpStatus.GONE);
        }

        if (otpVerification.getAttempts() >= 3) {
            otpRepository.delete(otpVerification);
            throw new AppException("Too many failed attempts. Please request a new OTP.", HttpStatus.TOO_MANY_REQUESTS);
        }

        if (!otpVerification.getOtp().equals(otp)) {
            otpVerification.setAttempts(otpVerification.getAttempts() + 1);
            otpRepository.save(otpVerification);
            int remaining = 3 - otpVerification.getAttempts();
            throw new AppException("Invalid OTP. " + remaining + " attempt(s) remaining.", HttpStatus.BAD_REQUEST);
        }

        otpVerification.setUsed(true);
        otpRepository.save(otpVerification);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException("User not found.", HttpStatus.NOT_FOUND));
        user.setActive(true);
        userRepository.save(user);
    }
}
