package com.hostel.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DashboardStatsResponse {

    private long total;
    private long created;
    private long assigned;
    private long inProgress;
    private long resolved;
    private long disputed;   // ← ADD THIS (it's the 6th arg you're already passing)
    private long closed;
    private long rejected;
}