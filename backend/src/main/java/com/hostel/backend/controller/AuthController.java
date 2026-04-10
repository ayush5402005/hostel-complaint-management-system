package com.hostel.backend.controller;

import com.hostel.backend.dto.*;
import com.hostel.backend.repository.BlockRepository;
import com.hostel.backend.repository.HostelRepository;
import com.hostel.backend.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
    public ResponseEntity<Map<String, String>> register(@RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok(Map.of("message", "OTP sent to your email. Please verify."));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Map<String, String> response = authService.login(request.getEmail(), request.getPassword());
        return ResponseEntity.ok(response);
    }

    // ── Public dropdown endpoints ─────────────────────────────────

    @GetMapping("/hostels")
    public ResponseEntity<List<HostelResponse>> getHostels() {
        List<HostelResponse> hostels = hostelRepository.findAll()
                .stream()
                .map(h -> new HostelResponse(h.getId(), h.getName(), h.getCode()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(hostels);
    }

    @GetMapping("/hostels/{hostelId}/blocks")
    public ResponseEntity<List<BlockResponse>> getBlocksByHostel(@PathVariable Long hostelId) {
        List<BlockResponse> blocks = blockRepository.findByHostelId(hostelId)
                .stream()
                .map(b -> new BlockResponse(b.getId(), b.getName()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(blocks);
    }
}
