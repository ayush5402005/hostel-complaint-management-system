package com.hostel.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "student_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // ── Hostel Fee ─────────────────────────────────────
    @Column
    private String hostelFeeUtr;

    @Column
    private Double hostelFeeAmount;

    @Column
    private String hostelFeeScreenshotUrl;

    // ── Mess Fee ────────────────────────────────────────
    @Column
    private String messFeeUtr;

    @Column
    private Double messFeeAmount;

    @Column
    private String messFeeScreenshotUrl;

    // ── Personal Details ────────────────────────────────
    @Column
    private String parentContact;

    @Column(length = 500)
    private String homeAddress;

    @Column
    private String profilePhotoUrl;

    @Builder.Default
    @Column(nullable = false)
    private boolean profileComplete = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}