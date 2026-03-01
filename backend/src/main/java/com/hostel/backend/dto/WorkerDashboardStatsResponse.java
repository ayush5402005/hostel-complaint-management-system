package com.hostel.backend.dto;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WorkerDashboardStatsResponse {
    private long assigned;
    private long inProgress;
    private long resolved;
    private long closed;
    private Double averageRating;  // null if no ratings yet
}
