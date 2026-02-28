package com.hostel.backend.controller;

import com.hostel.backend.dto.UserSummaryDTO;
import com.hostel.backend.enums.Role;
import com.hostel.backend.entity.User;
import com.hostel.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
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
                        .department(u.getDepartment())
                        .build())
                .toList();
        return ResponseEntity.ok(workers);
    }

    @GetMapping("/me")
    public ResponseEntity<UserSummaryDTO> getMe(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow();
        return ResponseEntity.ok(UserSummaryDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .phoneNumber(user.getPhoneNumber())
                .hostelBlock(user.getHostelBlock())
                .roomNumber(user.getRoomNumber())
                .department(user.getDepartment())
                .build());
    }
}
