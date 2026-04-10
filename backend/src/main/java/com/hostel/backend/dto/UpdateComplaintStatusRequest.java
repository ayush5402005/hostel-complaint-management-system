package com.hostel.backend.dto;

import com.hostel.backend.enums.ComplaintStatus;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class UpdateComplaintStatusRequest {

    private ComplaintStatus status;

    // ✅ Worker proof photos (max 3) — uploaded to Cloudinary on frontend
    @Size(max = 3, message = "Maximum 3 proof photos allowed")
    private List<String> resolvedMediaUrls;
}