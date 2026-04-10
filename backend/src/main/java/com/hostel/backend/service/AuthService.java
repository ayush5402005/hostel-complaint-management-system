package com.hostel.backend.service;

import com.hostel.backend.entity.Block;
import com.hostel.backend.entity.Hostel;
import com.hostel.backend.entity.User;
import com.hostel.backend.enums.Role;
import com.hostel.backend.exception.AppException;
import com.hostel.backend.repository.BlockRepository;
import com.hostel.backend.repository.HostelRepository;
import com.hostel.backend.repository.UserRepository;
import com.hostel.backend.dto.RegisterRequest;
import com.hostel.backend.security.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class AuthService {

    private final UserRepository    userRepository;
    private final PasswordEncoder   passwordEncoder;
    private final JwtUtil           jwtUtil;
    private final OtpService        otpService;
    private final HostelRepository  hostelRepository;
    private final BlockRepository   blockRepository;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       OtpService otpService,
                       HostelRepository hostelRepository,
                       BlockRepository blockRepository) {
        this.userRepository   = userRepository;
        this.passwordEncoder  = passwordEncoder;
        this.jwtUtil          = jwtUtil;
        this.otpService       = otpService;
        this.hostelRepository = hostelRepository;
        this.blockRepository  = blockRepository;
    }

    @Transactional
    public User register(RegisterRequest request) {

        // ── Role guard ─────────────────────────────────────────────────────
        if (request.getRole() != null && request.getRole() != Role.STUDENT) {
            throw new AppException("Self-registration is only allowed for STUDENT role", HttpStatus.FORBIDDEN);
        }

        // ── Required field validation ──────────────────────────────────────
        if (request.getName() == null || request.getEmail() == null ||
            request.getPassword() == null || request.getPhoneNumber() == null) {
            throw new AppException("Required fields are missing", HttpStatus.BAD_REQUEST);
        }

        // ── College email validation ───────────────────────────────────────
        if (!request.getEmail().endsWith("@stu.manit.ac.in")) {
            throw new AppException("Students must register with college email (@stu.manit.ac.in)", HttpStatus.BAD_REQUEST);
        }

        // ── Student-specific required fields ──────────────────────────────
        if (request.getScholarNumber() == null || request.getRoomNumber() == null) {
            throw new AppException("scholarNumber and roomNumber are required", HttpStatus.BAD_REQUEST);
        }
        if (request.getHostelId() == null || request.getBlockId() == null) {
            throw new AppException("hostelId and blockId are required", HttpStatus.BAD_REQUEST);
        }

        // ── Handle existing email ──────────────────────────────────────────
        userRepository.findByEmail(request.getEmail()).ifPresent(existing -> {
            if (existing.isActive()) {
                throw new AppException("Email already registered", HttpStatus.CONFLICT);
            }
            userRepository.delete(existing);
            userRepository.flush();
        });

        // ── Handle duplicate phone ─────────────────────────────────────────
        userRepository.findByPhoneNumber(request.getPhoneNumber()).ifPresent(existing -> {
            if (!existing.isActive()) {
                userRepository.delete(existing);
                userRepository.flush();
            } else {
                throw new AppException("Phone number already registered", HttpStatus.CONFLICT);
            }
        });

        // ── Hostel + Block lookup ──────────────────────────────────────────
        Hostel hostel = hostelRepository.findById(request.getHostelId())
                .orElseThrow(() -> new AppException("Hostel not found", HttpStatus.BAD_REQUEST));
        Block block = blockRepository.findById(request.getBlockId())
                .orElseThrow(() -> new AppException("Block not found", HttpStatus.BAD_REQUEST));

        // ── Block must belong to the selected hostel ───────────────────────
        if (!block.getHostel().getId().equals(hostel.getId())) {
            throw new AppException("Block does not belong to the selected hostel", HttpStatus.BAD_REQUEST);
        }

        // ✅ Room capacity check — max 2 active students per room in a block ─
        long occupants = userRepository.countByBlockIdAndRoomNumberAndActiveTrue(
                block.getId(), request.getRoomNumber());
        if (occupants >= 2) {
            throw new AppException(
                "Room " + request.getRoomNumber() + " in this block already has 2 students. " +
                "Please contact the caretaker if you believe this is an error.",
                HttpStatus.CONFLICT
            );
        }

        // ── Send OTP first — before saving user ───────────────────────────
        try {
            otpService.generateAndSendOtp(request.getEmail());
        } catch (Exception e) {
            throw new AppException("Failed to send OTP email. Please try again.", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // ── Save user only after OTP sent successfully ─────────────────────
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.STUDENT)
                .phoneNumber(request.getPhoneNumber())
                .scholarNumber(request.getScholarNumber())
                .roomNumber(request.getRoomNumber())
                .hostel(hostel)
                .block(block)
                .active(false)
                .build();

        return userRepository.save(user);
    }

    public Map<String, String> login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        if (!user.isActive()) {
            throw new AppException("Account not verified. Please verify your email first.", HttpStatus.FORBIDDEN);
        }
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new AppException("Invalid credentials", HttpStatus.UNAUTHORIZED);
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return Map.of(
            "token",  token,
            "role",   user.getRole().name(),
            "name",   user.getName(),
            "email",  user.getEmail()
        );
    }

    // ✅ FIXED — Forgot password now sends OTP via email correctly
    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException("No account found with this email", HttpStatus.NOT_FOUND));

        if (!user.isActive()) {
            throw new AppException("Account is not verified. Please complete email verification first.", HttpStatus.FORBIDDEN);
        }

        try {
            otpService.generateAndSendOtp(email);
        } catch (Exception e) {
            throw new AppException("Failed to send OTP email. Please try again.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ✅ FIXED — Reset password verifies the OTP then updates the password
    @Transactional
    public void resetPassword(String email, String otp, String newPassword) {
        // Verify OTP — throws AppException if invalid/expired
        otpService.verifyOtpForPasswordReset(email, otp);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        if (newPassword == null || newPassword.trim().length() < 6) {
            throw new AppException("Password must be at least 6 characters", HttpStatus.BAD_REQUEST);
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}