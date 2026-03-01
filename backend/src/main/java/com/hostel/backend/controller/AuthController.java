package com.hostel.backend.controller;

import com.hostel.backend.dto.RegisterRequest;
import com.hostel.backend.dto.LoginRequest;
import com.hostel.backend.entity.User;
import com.hostel.backend.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // ✅ REGISTER
    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    // ✅ LOGIN — returns token + role + name for frontend routing
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Map<String, String> response = authService.login(request.getEmail(), request.getPassword());
        return ResponseEntity.ok(response);
    }
}
