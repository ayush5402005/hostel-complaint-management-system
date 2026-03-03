package com.hostel.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "otp_verifications",
    indexes = {
        @Index(name = "idx_otp_email", columnList = "email") // ✅ OTP lookup by email
    }
)

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String otp;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Builder.Default
    private int attempts = 0;

    @Builder.Default
    private boolean used = false;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
