package com.hostel.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CloseComplaintRequest {

    @Min(1) @Max(5)
    private Integer rating;

    // ✅ Optional written review alongside star rating
    @Size(max = 1000, message = "Review text cannot exceed 1000 characters")
    private String reviewText;
}