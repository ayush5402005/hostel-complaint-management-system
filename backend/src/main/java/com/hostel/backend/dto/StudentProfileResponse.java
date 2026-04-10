package com.hostel.backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentProfileResponse {

    private Long    id;
    private Long    userId;
    private String  studentName;
    private String  email;
    private String  phoneNumber;
    private String  scholarNumber;
    private String  hostelName;
    private String  blockName;
    private String  roomNumber;

    private String  hostelFeeUtr;
    private Double  hostelFeeAmount;
    private String  hostelFeeScreenshotUrl;

    private String  messFeeUtr;
    private Double  messFeeAmount;
    private String  messFeeScreenshotUrl;

    private String  parentContact;
    private String  homeAddress;
    private String  profilePhotoUrl;
    private boolean profileComplete;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}