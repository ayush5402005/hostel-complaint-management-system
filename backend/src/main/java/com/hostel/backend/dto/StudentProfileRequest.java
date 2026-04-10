package com.hostel.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StudentProfileRequest {

    @NotBlank(message = "Hostel fee UTR is required")
    private String hostelFeeUtr;

    @NotNull(message = "Hostel fee amount is required")
    private Double hostelFeeAmount;

    @NotBlank(message = "Hostel fee screenshot is required")
    private String hostelFeeScreenshotUrl;

    @NotBlank(message = "Mess fee UTR is required")
    private String messFeeUtr;

    @NotNull(message = "Mess fee amount is required")
    private Double messFeeAmount;

    @NotBlank(message = "Mess fee screenshot is required")
    private String messFeeScreenshotUrl;

    @NotBlank(message = "Parent contact is required")
    private String parentContact;

    @NotBlank(message = "Home address is required")
    private String homeAddress;

    @NotBlank(message = "Profile photo is required")
    private String profilePhotoUrl;
}