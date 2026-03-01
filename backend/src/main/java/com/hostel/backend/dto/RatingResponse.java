package com.hostel.backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RatingResponse {
    private Long id;
    private Long complaintId;
    private Long workerId;
    private String workerName;
    private int rating;
    private String comment;
    private LocalDateTime createdAt;
}
