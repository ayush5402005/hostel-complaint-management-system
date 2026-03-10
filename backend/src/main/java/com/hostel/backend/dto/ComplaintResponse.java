package com.hostel.backend.dto;

import com.hostel.backend.enums.ComplaintCategory;
import com.hostel.backend.enums.ComplaintPriority;
import com.hostel.backend.enums.ComplaintStatus;
import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintResponse {

    private Long id;
    private String title;
    private String description;
    private ComplaintCategory category;
    private ComplaintPriority priority;
    private ComplaintStatus status;

    private String issuePhotoUrl;
    private String resolvedPhotoUrl;
    private String rejectionReason;

    private Integer rating;

    private boolean overdue;
    private boolean escalated;
    private UserSummaryDTO student;
    private UserSummaryDTO assignedWorker;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
