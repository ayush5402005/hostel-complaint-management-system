package com.hostel.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentListResponse {
    // ── User fields ──────────────────────────────────
    private Long   id;
    private String name;
    private String email;
    private String phoneNumber;
    private String scholarNumber;
    private String hostelName;
    private String blockName;
    private String roomNumber;

    // ── Profile fields ────────────────────────────────
    private boolean profileComplete;
    private String  hostelFeeUtr;
    private Double  hostelFeeAmount;
    private String  hostelFeeScreenshotUrl;
    private String  messFeeUtr;
    private Double  messFeeAmount;
    private String  messFeeScreenshotUrl;
    private String  parentContact;
    private String  homeAddress;
    private String  profilePhotoUrl;
    private LocalDateTime profileCreatedAt;
    private LocalDateTime profileUpdatedAt;
}