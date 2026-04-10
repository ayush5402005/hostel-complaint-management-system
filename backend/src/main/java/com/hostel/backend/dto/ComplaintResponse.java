package com.hostel.backend.dto;

import com.hostel.backend.enums.ComplaintCategory;
import com.hostel.backend.enums.ComplaintPriority;
import com.hostel.backend.enums.ComplaintStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintResponse {

    private Long              id;
    private String            title;
    private String            description;
    private ComplaintCategory category;
    private ComplaintPriority priority;
    private ComplaintStatus   status;

    // ✅ Multiple media — student photos (issue proof)
    private List<String> mediaUrls;
    // ✅ Multiple media — worker photos (resolution proof)
    private List<String> resolvedMediaUrls;

    private String rejectionReason;

    // ── Review ────────────────────────────────────────────────────────────────
    private Integer rating;
    private String  reviewText;     // ✅ written review by student

    // ── Dispute ───────────────────────────────────────────────────────────────
    private String        disputeReason;  // ✅ student's reason for flagging
    private LocalDateTime disputedAt;

    // ── Flags ─────────────────────────────────────────────────────────────────
    private boolean overdue;
    private boolean escalated;

    // ── Availability slots ────────────────────────────────────────────────────
    private String slot1Day;
    private String slot1Time;
    private String slot2Day;
    private String slot2Time;
    private String slot3Day;
    private String slot3Time;

    // ── People ────────────────────────────────────────────────────────────────
    private UserSummaryDTO student;
    private UserSummaryDTO assignedWorker;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}