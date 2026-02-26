package com.hostel.backend.controller;

import com.hostel.backend.dto.RegisterRequest;
import com.hostel.backend.dto.LoginRequest;   // 🔥 ADD THIS
import com.hostel.backend.entity.User;
import com.hostel.backend.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    // ✅ LOGIN  (ADD THIS METHOD)
    @PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequest request) {

    String token = authService.login(
            request.getEmail(),
            request.getPassword()
    );

    return ResponseEntity.ok().body(
            java.util.Map.of("token", token)
    );
}
}
