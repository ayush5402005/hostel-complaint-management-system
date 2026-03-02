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

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    // REGISTER — Only STUDENT can self-register
    public User register(RegisterRequest request) {

        // 1. Block non-student self-registration
        if (request.getRole() != null && request.getRole() != Role.STUDENT) {
            throw new RuntimeException("Self-registration is only allowed for STUDENT role");
        }

        // 2. Basic mandatory validation
        if (request.getName() == null || request.getEmail() == null ||
            request.getPassword() == null || request.getPhoneNumber() == null) {
            throw new RuntimeException("Required fields are missing");
        }

        // 3. ✅ College email validation
        if (!request.getEmail().endsWith("@stu.manit.ac.in")) {
            throw new RuntimeException("Students must register with college email (@stu.manit.ac.in)");
        }

        // 4. Check duplicate email
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        // 5. Student-specific field validation
        if (request.getScholarNumber() == null ||
            request.getHostelBlock() == null ||
            request.getRoomNumber() == null) {
            throw new RuntimeException("Student must have scholarNumber, hostelBlock and roomNumber");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.STUDENT) // ✅ Always hardcoded
                .phoneNumber(request.getPhoneNumber())
                .scholarNumber(request.getScholarNumber())
                .hostelBlock(request.getHostelBlock())
                .roomNumber(request.getRoomNumber())
                .department(null)
                .active(true)
                .build();

        return userRepository.save(user);
    }

    // LOGIN → RETURN TOKEN + ROLE + NAME
    public Map<String, String> login(String email, String password) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isActive()) {
            throw new RuntimeException("Your account has been deactivated. Contact admin.");
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
