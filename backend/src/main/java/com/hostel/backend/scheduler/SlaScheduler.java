package com.hostel.backend.scheduler;

import com.hostel.backend.entity.Complaint;
import com.hostel.backend.entity.User;
import com.hostel.backend.enums.ComplaintPriority;
import com.hostel.backend.enums.ComplaintStatus;
import com.hostel.backend.enums.Role;
import com.hostel.backend.repository.ComplaintRepository;
import com.hostel.backend.repository.UserRepository;
import com.hostel.backend.service.NotificationService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class SlaScheduler {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public SlaScheduler(ComplaintRepository complaintRepository,
                        UserRepository userRepository,
                        NotificationService notificationService) {
        this.complaintRepository = complaintRepository;
        this.userRepository      = userRepository;
        this.notificationService = notificationService;
    }

    // Runs every hour
    @Scheduled(fixedRate = 3_600_000)
    @Transactional
    public void checkSlaBreaches() {
        LocalDateTime now          = LocalDateTime.now();
        LocalDateTime overdueCutoff    = now.minusDays(7);
        LocalDateTime escalationCutoff = now.minusHours(24);

        List<User> staff = userRepository.findByRole(Role.WARDEN);
        staff.addAll(userRepository.findByRole(Role.CARETAKER));

        List<ComplaintStatus> activeStatuses = List.of(
                ComplaintStatus.CREATED,
                ComplaintStatus.ASSIGNED,
                ComplaintStatus.IN_PROGRESS);

        List<Complaint> activeComplaints =
                complaintRepository.findByStatusIn(activeStatuses);

        for (Complaint c : activeComplaints) {

            // ── S5: Mark OVERDUE if older than 7 days ──────────────────────
            if (!c.isOverdue() && c.getCreatedAt().isBefore(overdueCutoff)) {
                c.setOverdue(true);
                c.setLastSlaNotifiedAt(now);
                complaintRepository.save(c);

                String msg = "🔴 Complaint #" + c.getId() + " '" + c.getTitle()
                        + "' is OVERDUE (>7 days unresolved)";
                staff.forEach(s -> notificationService.sendNotification(s, msg, "SLA_OVERDUE"));
                notificationService.sendNotification(c.getStudent(), msg, "SLA_OVERDUE");
            }

            // ── S10: Escalate HIGH priority not assigned within 24hrs ───────
            if (!c.isEscalated()
                    && c.getPriority() == ComplaintPriority.HIGH
                    && c.getStatus() == ComplaintStatus.CREATED
                    && c.getCreatedAt().isBefore(escalationCutoff)) {
                c.setEscalated(true);
                c.setLastSlaNotifiedAt(now);
                complaintRepository.save(c);

                String msg = "🚨 HIGH priority complaint #" + c.getId()
                        + " '" + c.getTitle() + "' is unassigned for >24 hours!";
                staff.forEach(s -> notificationService.sendNotification(s, msg, "ESCALATED"));
            }
        }
    }
}
