package com.hostel.backend.controller;

import com.hostel.backend.dto.ForgotPasswordRequest;
import com.hostel.backend.dto.ResetPasswordRequest;
import com.hostel.backend.service.PasswordResetService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    public PasswordResetController(PasswordResetService passwordResetService) {
        this.passwordResetService = passwordResetService;
    }

    // ✅ Step 1 — Request reset link
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        passwordResetService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(Map.of(
            "message", "If this email is registered, a reset link has been sent."
        ));
    }

    // ✅ Step 2 — Reset with token
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(Map.of(
            "message", "Password reset successfully. You can now login."
        ));
    }
}
