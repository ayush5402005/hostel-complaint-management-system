package com.hostel.backend.controller;

import com.hostel.backend.dto.VerifyOtpRequest;
import com.hostel.backend.service.OtpService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class OtpController {

    private final OtpService otpService;

    public OtpController(OtpService otpService) {
        this.otpService = otpService;
    }

    // ✅ Verify OTP
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpRequest request) {
        otpService.verifyOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(Map.of("message", "Email verified successfully. You can now login."));
    }

    // ✅ Resend OTP
    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        otpService.generateAndSendOtp(email);
        return ResponseEntity.ok(Map.of("message", "OTP resent successfully."));
    }
}
