package com.hostel.backend.service;

import com.hostel.backend.entity.User;
import com.hostel.backend.repository.UserRepository;
import com.hostel.backend.dto.RegisterRequest;
import com.hostel.backend.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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

    // REGISTER
    public User register(RegisterRequest request) {

    // 1️⃣ Basic mandatory validation
    if (request.getName() == null || request.getEmail() == null ||
        request.getPassword() == null || request.getRole() == null ||
        request.getPhoneNumber() == null) {

        throw new RuntimeException("Required fields are missing");
    }

    // 2️⃣ Role-based validation & cleanup
    switch (request.getRole()) {

        case STUDENT:
            if (request.getScholarNumber() == null ||
                request.getHostelBlock() == null ||
                request.getRoomNumber() == null) {

                throw new RuntimeException("Student must have scholarNumber, hostelBlock and roomNumber");
            }

            // Ignore department for student
            request.setDepartment(null);
            break;

        case WORKER:
            if (request.getDepartment() == null) {
                throw new RuntimeException("Worker must have department");
            }

            // Remove student-specific fields
            request.setScholarNumber(null);
            request.setHostelBlock(null);
            request.setRoomNumber(null);
            break;

        case CARETAKER:
        case WARDEN:
        case MESS_CONVENOR:

            // Remove student fields
            request.setScholarNumber(null);
            request.setHostelBlock(null);
            request.setRoomNumber(null);

            // Department not required
            break;

        default:
            throw new RuntimeException("Invalid role");
    }

    // 3️⃣ Create User entity
    User user = new User();

    user.setName(request.getName());
    user.setEmail(request.getEmail());
    user.setRole(request.getRole());
    user.setPhoneNumber(request.getPhoneNumber());
    user.setScholarNumber(request.getScholarNumber());
    user.setHostelBlock(request.getHostelBlock());
    user.setRoomNumber(request.getRoomNumber());
    user.setDepartment(request.getDepartment());

    user.setPassword(passwordEncoder.encode(request.getPassword()));

    return userRepository.save(user);
}

    // LOGIN → RETURN TOKEN
    public String login(String email, String password) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        return jwtUtil.generateToken(user.getEmail(), user.getRole().name());
    }
}