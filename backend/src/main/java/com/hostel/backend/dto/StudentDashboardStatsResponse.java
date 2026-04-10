package com.hostel.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentDashboardStatsResponse {
    private long total;
    private long pending;
    private long resolved;
    private long closed;
    private long rejected;
    private long disputed;   // ← ADD THIS
}