package com.hostel.backend.service;

import com.hostel.backend.entity.User;
import com.hostel.backend.enums.Role;
import com.hostel.backend.repository.UserRepository;
import com.hostel.backend.dto.RegisterRequest;
import com.hostel.backend.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final OtpService otpService; // ✅ NEW

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       OtpService otpService) { // ✅ NEW
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.otpService = otpService; // ✅ NEW
    }

    public User register(RegisterRequest request) {

        if (request.getRole() != null && request.getRole() != Role.STUDENT) {
            throw new RuntimeException("Self-registration is only allowed for STUDENT role");
        }

        if (request.getName() == null || request.getEmail() == null ||
            request.getPassword() == null || request.getPhoneNumber() == null) {
            throw new RuntimeException("Required fields are missing");
        }

        if (!request.getEmail().endsWith("@stu.manit.ac.in")) {
            throw new RuntimeException("Students must register with college email (@stu.manit.ac.in)");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        if (request.getScholarNumber() == null ||
            request.getHostelBlock() == null ||
            request.getRoomNumber() == null) {
            throw new RuntimeException("Student must have scholarNumber, hostelBlock and roomNumber");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.STUDENT)
                .phoneNumber(request.getPhoneNumber())
                .scholarNumber(request.getScholarNumber())
                .hostelBlock(request.getHostelBlock())
                .roomNumber(request.getRoomNumber())
                .department(null)
                .active(false) // ✅ CHANGED — inactive until OTP verified
                .build();

        User savedUser = userRepository.save(user);

        // ✅ NEW — Generate and send OTP
        otpService.generateAndSendOtp(request.getEmail());

        return savedUser;
    }

    public Map<String, String> login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isActive()) {
            throw new RuntimeException("Account not verified. Please verify your email first.");
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        return Map.of(
            "token", token,
            "role", user.getRole().name(),
            "name", user.getName(),
            "email", user.getEmail()
        );
    }
}
