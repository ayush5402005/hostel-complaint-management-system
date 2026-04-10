package com.hostel.backend.dto;

import com.hostel.backend.enums.ComplaintCategory;
import com.hostel.backend.enums.ComplaintPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class ComplaintRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200)
    private String title;

    @NotBlank(message = "Description is required")
    @Size(max = 1000)
    private String description;

    @NotNull(message = "Category is required")
    private ComplaintCategory category;

    private ComplaintPriority priority;

    // ✅ Max 3 photos — URLs from Cloudinary (uploaded on frontend before submitting)
    @Size(max = 3, message = "Maximum 3 photos allowed")
    private List<String> mediaUrls;

    // ── Availability slots ────────────────────────────────────────────────────
    private String slot1Day;
    private String slot1Time;
    private String slot2Day;
    private String slot2Time;
    private String slot3Day;
    private String slot3Time;
}