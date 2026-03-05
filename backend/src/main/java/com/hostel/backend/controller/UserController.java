package com.hostel.backend.controller;

import com.hostel.backend.dto.UserSummaryDTO;
import com.hostel.backend.dto.UpdateProfileRequest;
import com.hostel.backend.dto.ChangePasswordRequest;
import com.hostel.backend.enums.Role;
import com.hostel.backend.entity.User;
import com.hostel.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/workers")
    public ResponseEntity<List<UserSummaryDTO>> getAllWorkers(Authentication authentication) {
        List<UserSummaryDTO> workers = userRepository.findByRole(Role.WORKER)
                .stream()
                .map(u -> UserSummaryDTO.builder()
                        .id(u.getId())
                        .name(u.getName())
                        .email(u.getEmail())
                        .role(u.getRole())
                        .department(u.getDepartment() != null
                                ? u.getDepartment().getName() : null) // ✅
                        .build())
                .toList();
        return ResponseEntity.ok(workers);
    }

    @GetMapping("/me")
    public ResponseEntity<UserSummaryDTO> getMe(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(UserSummaryDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .phoneNumber(user.getPhoneNumber())
                .hostelBlock(user.getBlock() != null
                        ? user.getBlock().getName() : null)           // ✅
                .roomNumber(user.getRoomNumber())
                .department(user.getDepartment() != null
                        ? user.getDepartment().getName() : null)      // ✅
                .build());
    }

    @PutMapping("/me")
    public ResponseEntity<UserSummaryDTO> updateMe(
            @RequestBody UpdateProfileRequest request,
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        if (request.getName() != null)        user.setName(request.getName());
        if (request.getPhoneNumber() != null)  user.setPhoneNumber(request.getPhoneNumber());
        if (request.getRoomNumber() != null)   user.setRoomNumber(request.getRoomNumber());
        User saved = userRepository.save(user);
        return ResponseEntity.ok(UserSummaryDTO.builder()
                .id(saved.getId())
                .name(saved.getName())
                .email(saved.getEmail())
                .role(saved.getRole())
                .phoneNumber(saved.getPhoneNumber())
                .hostelBlock(saved.getBlock() != null
                        ? saved.getBlock().getName() : null)          // ✅
                .roomNumber(saved.getRoomNumber())
                .department(saved.getDepartment() != null
                        ? saved.getDepartment().getName() : null)     // ✅
                .build());
    }

    @PutMapping("/me/password")
    public ResponseEntity<String> changePassword(
            @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            return ResponseEntity.badRequest().body("Password must be at least 6 characters");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return ResponseEntity.ok("Password updated successfully");
    }
}
