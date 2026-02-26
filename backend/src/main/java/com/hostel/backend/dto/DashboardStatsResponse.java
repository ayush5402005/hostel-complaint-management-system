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
    private long closed;
    private long rejected;
}