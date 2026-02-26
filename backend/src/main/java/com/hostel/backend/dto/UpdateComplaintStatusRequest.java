package com.hostel.backend.dto;

import com.hostel.backend.enums.ComplaintStatus;
import lombok.Data;

@Data
public class UpdateComplaintStatusRequest {
    private ComplaintStatus status;
    private String resolvedPhotoUrl;
}