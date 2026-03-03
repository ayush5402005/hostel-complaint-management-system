package com.hostel.backend.service;

import com.hostel.backend.entity.PasswordResetToken;
import com.hostel.backend.entity.User;
import com.hostel.backend.exception.AppException;
import com.hostel.backend.repository.PasswordResetTokenRepository;
import com.hostel.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PasswordResetService {

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    public PasswordResetService(PasswordResetTokenRepository tokenRepository,
                                 UserRepository userRepository,
                                 EmailService emailService,
                                 PasswordEncoder passwordEncoder) {
        this.tokenRepository = tokenRepository;
        this.userRepository  = userRepository;
        this.emailService    = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void forgotPassword(String email) {

        // ✅ Check user exists — but don't reveal if email not found (security)
        userRepository.findByEmail(email).orElseThrow(
            () -> new AppException("If this email is registered, a reset link has been sent.", HttpStatus.OK)
        );

        // Delete any existing tokens for this email
        tokenRepository.deleteByEmail(email);

        // Generate secure token
        String token = UUID.randomUUID().toString();

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .email(email)
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .build();

        tokenRepository.save(resetToken);
        emailService.sendPasswordResetEmail(email, token);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {

        // 1. Validate password strength
        if (newPassword == null || newPassword.length() < 8) {
            throw new AppException("Password must be at least 8 characters", HttpStatus.BAD_REQUEST);
        }

        // 2. Find token
        PasswordResetToken resetToken = tokenRepository.findByTokenAndUsedFalse(token)
                .orElseThrow(() -> new AppException("Invalid or already used reset link", HttpStatus.BAD_REQUEST));

        // 3. Check expiry
        if (LocalDateTime.now().isAfter(resetToken.getExpiresAt())) {
            tokenRepository.delete(resetToken);
            throw new AppException("Reset link has expired. Please request a new one.", HttpStatus.GONE);
        }

        // 4. Find user and update password
        User user = userRepository.findByEmail(resetToken.getEmail())
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // 5. Mark token as used
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);
    }
}
