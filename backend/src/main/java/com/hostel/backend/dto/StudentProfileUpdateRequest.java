package com.hostel.backend.dto;

import lombok.Data;

@Data
public class StudentProfileUpdateRequest {
    private String hostelFeeUtr;
    private Double hostelFeeAmount;
    private String hostelFeeScreenshotUrl;
    private String messFeeUtr;
    private Double messFeeAmount;
    private String messFeeScreenshotUrl;
    private String parentContact;
    private String homeAddress;
    private String profilePhotoUrl;
}