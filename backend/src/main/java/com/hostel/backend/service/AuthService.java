package com.hostel.backend.service;

import com.hostel.backend.entity.User;
import com.hostel.backend.enums.Role;
import com.hostel.backend.exception.AppException;
import com.hostel.backend.repository.UserRepository;
import com.hostel.backend.dto.RegisterRequest;
import com.hostel.backend.security.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final OtpService otpService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       OtpService otpService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.otpService = otpService;
    }

    public User register(RegisterRequest request) {

        if (request.getRole() != null && request.getRole() != Role.STUDENT) {
            throw new AppException("Self-registration is only allowed for STUDENT role", HttpStatus.FORBIDDEN);
        }

        if (request.getName() == null || request.getEmail() == null ||
            request.getPassword() == null || request.getPhoneNumber() == null) {
            throw new AppException("Required fields are missing", HttpStatus.BAD_REQUEST);
        }

        if (!request.getEmail().endsWith("@stu.manit.ac.in")) {
            throw new AppException("Students must register with college email (@stu.manit.ac.in)", HttpStatus.BAD_REQUEST);
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new AppException("Email already registered", HttpStatus.CONFLICT);
        }

        if (request.getScholarNumber() == null ||
            request.getHostelBlock() == null ||
            request.getRoomNumber() == null) {
            throw new AppException("scholarNumber, hostelBlock and roomNumber are required", HttpStatus.BAD_REQUEST);
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
                .active(false)
                .build();

        User savedUser = userRepository.save(user);
        otpService.generateAndSendOtp(request.getEmail());
        return savedUser;
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
            "token", token,
            "role", user.getRole().name(),
            "name", user.getName(),
            "email", user.getEmail()
        );
    }
}
