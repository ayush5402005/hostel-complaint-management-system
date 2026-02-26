package com.hostel.backend.dto;

import com.hostel.backend.enums.ComplaintCategory;
import com.hostel.backend.enums.ComplaintPriority;
import lombok.Data;

@Data
public class ComplaintRequest {

    private ComplaintCategory category;
    private ComplaintPriority priority;
    private String description;
    private String imageUrl;
}