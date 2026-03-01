package com.hostel.backend.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkerRatingSummary {
    private Long workerId;
    private String workerName;
    private String department;
    private double averageRating;
    private long totalRatings;
}
