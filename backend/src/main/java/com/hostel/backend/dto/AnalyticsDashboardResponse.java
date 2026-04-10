package com.hostel.backend.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AnalyticsDashboardResponse {

    // ── Summary ───────────────────────────────────────────────────────────────
    private long totalComplaints;
    private long totalResolved;
    private long totalPending;
    private long totalOverdue;
    private long totalDisputed;

    // ── Breakdown ─────────────────────────────────────────────────────────────
    private Map<String, Long>  byStatus;
    private Map<String, Long>  byCategory;
    private List<BlockStat>    byBlock;

    // ── Trends + Workers ──────────────────────────────────────────────────────
    private List<MonthlyTrend> monthlyTrend;
    private List<WorkerStat>   topWorkers;

    // ── Profile ───────────────────────────────────────────────────────────────
    private ProfileCompletionStat profileCompletion;

    // ── Nested DTOs ───────────────────────────────────────────────────────────

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class BlockStat {
        private String blockName;
        private long   count;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MonthlyTrend {
        private String month;   // "Jan 2026"
        private long   count;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class WorkerStat {
        private Long   workerId;
        private String workerName;
        private long   resolvedCount;
        private Double avgRating;   // null if no ratings yet
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ProfileCompletionStat {
        private long   totalStudents;
        private long   completedProfiles;
        private long   pendingProfiles;
        private double completionRate;  // 0.0 – 100.0
    }
}