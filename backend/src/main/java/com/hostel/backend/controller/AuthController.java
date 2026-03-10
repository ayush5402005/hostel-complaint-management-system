package com.hostel.backend.controller;

import com.hostel.backend.dto.RegisterRequest;
import com.hostel.backend.dto.LoginRequest;
import com.hostel.backend.entity.Block;
import com.hostel.backend.entity.Hostel;
import com.hostel.backend.entity.User;
import com.hostel.backend.repository.BlockRepository;
import com.hostel.backend.repository.HostelRepository;
import com.hostel.backend.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService      authService;
    private final HostelRepository hostelRepository;
    private final BlockRepository  blockRepository;

    public AuthController(AuthService authService,
                          HostelRepository hostelRepository,
                          BlockRepository blockRepository) {
        this.authService      = authService;
        this.hostelRepository = hostelRepository;
        this.blockRepository  = blockRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Map<String, String> response = authService.login(request.getEmail(), request.getPassword());
        return ResponseEntity.ok(response);
    }

    // ── Public dropdown endpoints for registration form ───────────

    @GetMapping("/hostels")
    public ResponseEntity<List<Hostel>> getHostels() {
        return ResponseEntity.ok(hostelRepository.findAll());
    }

    @GetMapping("/hostels/{hostelId}/blocks")
    public ResponseEntity<List<Block>> getBlocksByHostel(@PathVariable Long hostelId) {
        return ResponseEntity.ok(blockRepository.findByHostelId(hostelId));
    }
}
