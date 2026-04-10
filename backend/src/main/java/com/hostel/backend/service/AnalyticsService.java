package com.hostel.backend.service;

import com.hostel.backend.dto.AnalyticsDashboardResponse;
import com.hostel.backend.dto.AnalyticsDashboardResponse.*;
import com.hostel.backend.enums.ComplaintCategory;
import com.hostel.backend.enums.ComplaintStatus;
import com.hostel.backend.enums.Role;
import com.hostel.backend.exception.ResourceNotFoundException;
import com.hostel.backend.exception.UnauthorizedException;
import com.hostel.backend.repository.ComplaintRepository;
import com.hostel.backend.repository.StudentProfileRepository;
import com.hostel.backend.repository.UserRepository;
import com.hostel.backend.entity.User;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final ComplaintRepository      complaintRepository;
    private final UserRepository           userRepository;
    private final StudentProfileRepository profileRepository;

    public AnalyticsService(ComplaintRepository complaintRepository,
                            UserRepository userRepository,
                            StudentProfileRepository profileRepository) {
        this.complaintRepository = complaintRepository;
        this.userRepository      = userRepository;
        this.profileRepository   = profileRepository;
    }

    // ── Auth guard ────────────────────────────────────────────────────────────

    private void checkStaff(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getRole() != Role.ADMIN
                && user.getRole() != Role.WARDEN
                && user.getRole() != Role.CARETAKER) {
            throw new UnauthorizedException("Access denied");
        }
    }

    // ── Main dashboard ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AnalyticsDashboardResponse getDashboard(String staffEmail) {
        checkStaff(staffEmail);

        return AnalyticsDashboardResponse.builder()
                .totalComplaints(complaintRepository.count())
                .totalResolved(complaintRepository.countByStatus(ComplaintStatus.RESOLVED))
                .totalPending(complaintRepository.count()
                        - complaintRepository.countByStatus(ComplaintStatus.RESOLVED))
                .totalOverdue(complaintRepository.countByIsOverdueTrue())
                .totalDisputed(complaintRepository.countByDisputeReasonIsNotNull())
                .byStatus(buildStatusMap())
                .byCategory(buildCategoryMap())
                .byBlock(buildBlockStats())
                .monthlyTrend(buildMonthlyTrend())
                .topWorkers(buildTopWorkers())
                .profileCompletion(buildProfileStat())
                .build();
    }

    // ── Private builders ──────────────────────────────────────────────────────

    private Map<String, Long> buildStatusMap() {
        // Pre-fill all statuses with 0 so frontend always gets complete map
        Map<String, Long> map = new LinkedHashMap<>();
        for (ComplaintStatus s : ComplaintStatus.values()) map.put(s.name(), 0L);

        complaintRepository.countGroupByStatus()
                .forEach(row -> map.put(
                        ((ComplaintStatus) row[0]).name(),
                        ((Number) row[1]).longValue()));
        return map;
    }

    private Map<String, Long> buildCategoryMap() {
        Map<String, Long> map = new LinkedHashMap<>();
        for (ComplaintCategory c : ComplaintCategory.values()) map.put(c.name(), 0L);

        complaintRepository.countGroupByCategory()
                .forEach(row -> map.put(
                        ((ComplaintCategory) row[0]).name(),
                        ((Number) row[1]).longValue()));
        return map;
    }

    private List<BlockStat> buildBlockStats() {
        return complaintRepository.countGroupByBlock().stream()
                .map(row -> BlockStat.builder()
                        .blockName((String) row[0])
                        .count(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());
    }

    private List<MonthlyTrend> buildMonthlyTrend() {
        LocalDateTime from = YearMonth.now().minusMonths(5)
                .atDay(1).atStartOfDay();

        // DB result → map keyed by "2026-01"
        Map<String, Long> dbMap = new LinkedHashMap<>();
        complaintRepository.countByMonthSince(from)
                .forEach(row -> {
                    String key = YearMonth.of(
                            ((Number) row[0]).intValue(),
                            ((Number) row[1]).intValue()).toString();
                    dbMap.put(key, ((Number) row[2]).longValue());
                });

        // Fill all 6 months — even months with 0 complaints
        List<MonthlyTrend> result = new ArrayList<>();
        YearMonth now = YearMonth.now();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym    = now.minusMonths(i);
            String    label = ym.getMonth()
                    .getDisplayName(TextStyle.SHORT, Locale.ENGLISH)
                    + " " + ym.getYear();
            result.add(MonthlyTrend.builder()
                    .month(label)
                    .count(dbMap.getOrDefault(ym.toString(), 0L))
                    .build());
        }
        return result;
    }

    private List<WorkerStat> buildTopWorkers() {
        return complaintRepository
                .findTopWorkersByResolvedCount(PageRequest.of(0, 10))
                .stream()
                .map(row -> WorkerStat.builder()
                        .workerId(((Number) row[0]).longValue())
                        .workerName((String) row[1])
                        .resolvedCount(((Number) row[2]).longValue())
                        .avgRating(row[3] != null
                                ? Math.round(((Number) row[3]).doubleValue() * 10.0) / 10.0
                                : null)
                        .build())
                .collect(Collectors.toList());
    }

    private ProfileCompletionStat buildProfileStat() {
        long total     = userRepository.countByRoleAndActiveTrue(Role.STUDENT);
        long completed = profileRepository.countByProfileCompleteTrue();
        long pending   = total - completed;
        double rate    = total > 0
                ? Math.round((completed * 100.0 / total) * 10.0) / 10.0
                : 0.0;

        return ProfileCompletionStat.builder()
                .totalStudents(total)
                .completedProfiles(completed)
                .pendingProfiles(pending)
                .completionRate(rate)
                .build();
    }
}