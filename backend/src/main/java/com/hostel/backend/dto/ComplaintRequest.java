package com.hostel.backend.dto;

import com.hostel.backend.enums.ComplaintCategory;
import com.hostel.backend.enums.ComplaintPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ComplaintRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 5, max = 200, message = "Title must be 5-200 characters")
    private String title;

    @NotNull(message = "Category is required")
    private ComplaintCategory category;

    @NotNull(message = "Priority is required")
    private ComplaintPriority priority;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 1000, message = "Description must be 10-1000 characters")
    private String description;

    private String imageUrl;
}
