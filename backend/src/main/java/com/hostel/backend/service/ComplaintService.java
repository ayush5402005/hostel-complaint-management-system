package com.hostel.backend.service;

import com.hostel.backend.dto.*;
import com.hostel.backend.entity.Complaint;
import com.hostel.backend.entity.User;
import com.hostel.backend.enums.ComplaintStatus;
import com.hostel.backend.enums.Role;
import com.hostel.backend.exception.ResourceNotFoundException;
import com.hostel.backend.exception.UnauthorizedException;
import com.hostel.backend.repository.ComplaintRepository;
import com.hostel.backend.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ComplaintService {

    private final ComplaintRepository      complaintRepository;
    private final UserRepository           userRepository;
    private final NotificationService      notificationService;
    private final ComplaintAuditLogService auditLogService;

    public ComplaintService(ComplaintRepository complaintRepository,
                            UserRepository userRepository,
                            NotificationService notificationService,
                            ComplaintAuditLogService auditLogService) {
        this.complaintRepository = complaintRepository;
        this.userRepository      = userRepository;
        this.notificationService = notificationService;
        this.auditLogService     = auditLogService;
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private Complaint getComplaint(Long id) {
        return complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found: " + id));
    }

    private boolean isStaff(Role role) {
        return role == Role.ADMIN || role == Role.WARDEN || role == Role.CARETAKER;
    }

    private UserSummaryDTO toUserSummary(User user) {
        if (user == null) return null;
        return UserSummaryDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .phoneNumber(user.getPhoneNumber())
                .hostelBlock(user.getHostelBlock())
                .roomNumber(user.getRoomNumber())
                .department(user.getDepartment())
                .build();
    }

    private ComplaintResponse toResponse(Complaint c) {
        return ComplaintResponse.builder()
                .id(c.getId())
                .title(c.getTitle())
                .description(c.getDescription())
                .category(c.getCategory())
                .priority(c.getPriority())
                .status(c.getStatus())
                .issuePhotoUrl(c.getIssuePhotoUrl())
                .resolvedPhotoUrl(c.getResolvedPhotoUrl())
                .rejectionReason(c.getRejectionReason())
                .rating(c.getRating())
                .overdue(c.isOverdue())
                .escalated(c.isEscalated())
                .student(toUserSummary(c.getStudent()))
                .assignedWorker(toUserSummary(c.getAssignedWorker()))
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    // ─── Create ─────────────────────────────────────────────────────────────

    @Transactional
    public ComplaintResponse createComplaint(String email, ComplaintRequest request) {
        User user = getUser(email);
        if (user.getRole() != Role.STUDENT) {
            throw new UnauthorizedException("Only students can create complaints");
        }
        Complaint complaint = Complaint.builder()
                .title(request.getTitle())
                .category(request.getCategory())
                .priority(request.getPriority())
                .description(request.getDescription())
                .issuePhotoUrl(request.getImageUrl())
                .status(ComplaintStatus.CREATED)
                .student(user)
                .build();
        Complaint saved = complaintRepository.save(complaint);

        auditLogService.log(saved.getId(), user,
                null, ComplaintStatus.CREATED.name(),
                "Complaint filed by student");

        List<User> staff = userRepository.findByRole(Role.WARDEN);
        staff.addAll(userRepository.findByRole(Role.CARETAKER));
        staff.addAll(userRepository.findByRole(Role.ADMIN));
        staff.forEach(s -> notificationService.sendNotification(s,
                user.getName() + " filed a new complaint: " + saved.getTitle(),
                "COMPLAINT_CREATED"));

        return toResponse(saved);
    }

    // ─── Assign ─────────────────────────────────────────────────────────────

    @Transactional
    public ComplaintResponse assignWorker(Long complaintId, Long workerId, String email) {
        User assignedBy = getUser(email);
        if (!isStaff(assignedBy.getRole())) {
            throw new UnauthorizedException("Only admin, caretaker or warden can assign worker");
        }
        Complaint complaint = getComplaint(complaintId);
        User worker = userRepository.findById(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Worker not found: " + workerId));
        if (worker.getRole() != Role.WORKER) {
            throw new UnauthorizedException("Assigned user is not a worker");
        }

        String prevStatus = complaint.getStatus().name();
        complaint.setAssignedWorker(worker);
        complaint.setStatus(ComplaintStatus.ASSIGNED);
        Complaint saved = complaintRepository.save(complaint);

        auditLogService.log(saved.getId(), assignedBy,
                prevStatus, ComplaintStatus.ASSIGNED.name(),
                "Assigned to worker: " + worker.getName());

        notificationService.sendNotification(worker,
                "You have been assigned complaint: " + saved.getTitle(),
                "COMPLAINT_ASSIGNED");
        notificationService.sendNotification(saved.getStudent(),
                "Your complaint '" + saved.getTitle() + "' has been assigned to " + worker.getName(),
                "COMPLAINT_ASSIGNED");

        return toResponse(saved);
    }

    // ─── Reassign ───────────────────────────────────────────────────────────

    @Transactional
    public ComplaintResponse reassignWorker(Long complaintId, Long newWorkerId, String email) {
        User assignedBy = getUser(email);
        if (!isStaff(assignedBy.getRole())) {
            throw new UnauthorizedException("Only admin, caretaker or warden can reassign worker");
        }
        Complaint complaint = getComplaint(complaintId);
        User newWorker = userRepository.findById(newWorkerId)
                .orElseThrow(() -> new ResourceNotFoundException("Worker not found: " + newWorkerId));
        if (newWorker.getRole() != Role.WORKER) {
            throw new UnauthorizedException("Assigned user is not a worker");
        }

        User oldWorker    = complaint.getAssignedWorker();
        String prevStatus = complaint.getStatus().name();
        complaint.setAssignedWorker(newWorker);
        complaint.setStatus(ComplaintStatus.ASSIGNED);
        Complaint saved = complaintRepository.save(complaint);

        auditLogService.log(saved.getId(), assignedBy,
                prevStatus, ComplaintStatus.ASSIGNED.name(),
                "Reassigned from " +
                (oldWorker != null ? oldWorker.getName() : "nobody") +
                " to " + newWorker.getName());

        if (oldWorker != null) {
            notificationService.sendNotification(oldWorker,
                    "Complaint '" + saved.getTitle() + "' has been reassigned from you",
                    "COMPLAINT_ASSIGNED");
        }
        notificationService.sendNotification(newWorker,
                "Complaint '" + saved.getTitle() + "' has been reassigned to you",
                "COMPLAINT_ASSIGNED");
        notificationService.sendNotification(saved.getStudent(),
                "Your complaint '" + saved.getTitle() + "' reassigned to " + newWorker.getName(),
                "COMPLAINT_ASSIGNED");

        return toResponse(saved);
    }

    // ─── Reject ─────────────────────────────────────────────────────────────

    @Transactional
    public ComplaintResponse rejectComplaint(Long complaintId, String reason, String email) {
        User rejectedBy = getUser(email);
        if (!isStaff(rejectedBy.getRole())) {
            throw new UnauthorizedException("Only admin, caretaker or warden can reject complaints");
        }
        if (reason == null || reason.trim().isEmpty()) {
            throw new RuntimeException("Rejection reason is required");
        }
        Complaint complaint = getComplaint(complaintId);
        if (complaint.getStatus() == ComplaintStatus.CLOSED) {
            throw new RuntimeException("Cannot reject a closed complaint");
        }

        String prevStatus = complaint.getStatus().name();
        complaint.setStatus(ComplaintStatus.REJECTED);
        complaint.setRejectionReason(reason.trim());
        Complaint saved = complaintRepository.save(complaint);

        auditLogService.log(saved.getId(), rejectedBy,
                prevStatus, ComplaintStatus.REJECTED.name(),
                "Rejected. Reason: " + reason.trim());

        notificationService.sendNotification(saved.getStudent(),
                "Your complaint '" + saved.getTitle() + "' was rejected. Reason: " + reason,
                "STATUS_UPDATED");

        return toResponse(saved);
    }

    // ─── Update Status (worker) ──────────────────────────────────────────────

    @Transactional
    public ComplaintResponse updateStatus(Long complaintId,
                                          UpdateComplaintStatusRequest request,
                                          String email) {
        User worker = getUser(email);
        if (worker.getRole() != Role.WORKER) {
            throw new UnauthorizedException("Only worker can update complaint status");
        }
        Complaint complaint = getComplaint(complaintId);
        if (complaint.getAssignedWorker() == null ||
                !complaint.getAssignedWorker().getId().equals(worker.getId())) {
            throw new UnauthorizedException("You are not assigned to this complaint");
        }

        String prevStatus = complaint.getStatus().name();
        complaint.setStatus(request.getStatus());
        if (request.getResolvedPhotoUrl() != null) {
            complaint.setResolvedPhotoUrl(request.getResolvedPhotoUrl());
        }
        Complaint saved = complaintRepository.save(complaint);

        auditLogService.log(saved.getId(), worker,
                prevStatus, request.getStatus().name(),
                request.getStatus() == ComplaintStatus.IN_PROGRESS
                        ? "Worker started working"
                        : "Worker marked as resolved");

        if (request.getStatus() == ComplaintStatus.IN_PROGRESS) {
            notificationService.sendNotification(saved.getStudent(),
                    "Work has started on your complaint: " + saved.getTitle(),
                    "STATUS_UPDATED");
        } else if (request.getStatus() == ComplaintStatus.RESOLVED) {
            notificationService.sendNotification(saved.getStudent(),
                    "Your complaint '" + saved.getTitle() + "' is resolved. Please close it.",
                    "STATUS_UPDATED");
        }

        return toResponse(saved);
    }

    // ─── Close + Rate ────────────────────────────────────────────────────────

    @Transactional
    public ComplaintResponse closeComplaint(Long complaintId,
                                            CloseComplaintRequest request,
                                            String email) {
        User student = getUser(email);
        if (student.getRole() != Role.STUDENT) {
            throw new UnauthorizedException("Only student can close complaint");
        }
        Complaint complaint = getComplaint(complaintId);
        if (!complaint.getStudent().getId().equals(student.getId())) {
            throw new UnauthorizedException("You cannot close this complaint");
        }
        if (complaint.getStatus() != ComplaintStatus.RESOLVED) {
            throw new RuntimeException("Complaint must be RESOLVED before closing");
        }

        if (request != null && request.getRating() != null) {
            int r = request.getRating();
            if (r < 1 || r > 5) throw new RuntimeException("Rating must be between 1 and 5");
            complaint.setRating(r);
        }

        complaint.setStatus(ComplaintStatus.CLOSED);
        Complaint saved = complaintRepository.save(complaint);

        auditLogService.log(saved.getId(), student,
                ComplaintStatus.RESOLVED.name(), ComplaintStatus.CLOSED.name(),
                "Closed by student" + (saved.getRating() != null
                        ? " | Rating: " + saved.getRating() + "/5" : ""));

        return toResponse(saved);
    }

    // ─── Queries ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ComplaintResponse> getComplaintsByRole(String email, int page,
                                                        int size, ComplaintStatus status) {
        User user = getUser(email);
        Pageable pageable = PageRequest.of(page, size);
        return switch (user.getRole()) {
            case STUDENT -> status != null
                    ? complaintRepository.findByStatusAndStudent(status, user, pageable).map(this::toResponse)
                    : complaintRepository.findByStudent(user, pageable).map(this::toResponse);
            case WORKER -> status != null
                    ? complaintRepository.findByAssignedWorkerAndStatus(user, status, pageable).map(this::toResponse)
                    : complaintRepository.findByAssignedWorker(user, pageable).map(this::toResponse);
            case ADMIN, CARETAKER, WARDEN -> status != null
                    ? complaintRepository.findByStatus(status, pageable).map(this::toResponse)
                    : complaintRepository.findAll(pageable).map(this::toResponse);
            default -> throw new UnauthorizedException("Invalid role for this operation");
        };
    }

    @Transactional(readOnly = true)
    public StudentDashboardStatsResponse getStudentDashboardStats(String email) {
        User user = getUser(email);
        if (user.getRole() != Role.STUDENT) {
            throw new UnauthorizedException("Access denied");
        }
        return new StudentDashboardStatsResponse(
                complaintRepository.countByStudent(user),
                complaintRepository.countByStudentAndStatus(user, ComplaintStatus.CREATED)
                + complaintRepository.countByStudentAndStatus(user, ComplaintStatus.ASSIGNED)
                + complaintRepository.countByStudentAndStatus(user, ComplaintStatus.IN_PROGRESS),
                complaintRepository.countByStudentAndStatus(user, ComplaintStatus.RESOLVED),
                complaintRepository.countByStudentAndStatus(user, ComplaintStatus.CLOSED),
                complaintRepository.countByStudentAndStatus(user, ComplaintStatus.REJECTED)
        );
    }

    // ✅ Worker dashboard stats — uses @Query AVG, no list fetch
    @Transactional(readOnly = true)
    public WorkerDashboardStatsResponse getWorkerDashboardStats(String email) {
        User worker = getUser(email);
        if (worker.getRole() != Role.WORKER) {
            throw new UnauthorizedException("Access denied");
        }

        long assigned   = complaintRepository.countByAssignedWorkerAndStatus(worker, ComplaintStatus.ASSIGNED);
        long inProgress = complaintRepository.countByAssignedWorkerAndStatus(worker, ComplaintStatus.IN_PROGRESS);
        long resolved   = complaintRepository.countByAssignedWorkerAndStatus(worker, ComplaintStatus.RESOLVED);
        long closed     = complaintRepository.countByAssignedWorkerAndStatus(worker, ComplaintStatus.CLOSED);

        // ✅ Fixed — use @Query method, no list fetching
        Double raw = complaintRepository.findAverageRatingByWorker(worker);
        Double averageRating = raw != null ? Math.round(raw * 10.0) / 10.0 : null;

        return new WorkerDashboardStatsResponse(assigned, inProgress, resolved, closed, averageRating);
    }

    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats(String email) {
        User user = getUser(email);
        if (!isStaff(user.getRole())) {
            throw new UnauthorizedException("Access denied");
        }
        return new DashboardStatsResponse(
                complaintRepository.count(),
                complaintRepository.countByStatus(ComplaintStatus.CREATED),
                complaintRepository.countByStatus(ComplaintStatus.ASSIGNED),
                complaintRepository.countByStatus(ComplaintStatus.IN_PROGRESS),
                complaintRepository.countByStatus(ComplaintStatus.RESOLVED),
                complaintRepository.countByStatus(ComplaintStatus.CLOSED),
                complaintRepository.countByStatus(ComplaintStatus.REJECTED)
        );
    }

    @Transactional(readOnly = true)
    public ComplaintResponse getComplaintById(Long id, String email) {
        User user = getUser(email);
        Complaint complaint = getComplaint(id);
        if (user.getRole() == Role.STUDENT &&
                !complaint.getStudent().getId().equals(user.getId())) {
            throw new UnauthorizedException("Access denied");
        }
        return toResponse(complaint);
    }

    // ─── Worker Stats by Admin ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public WorkerDashboardStatsResponse getWorkerStatsByAdmin(Long workerId) {
        User worker = userRepository.findById(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Worker not found"));

        long assigned   = complaintRepository.countByAssignedWorkerAndStatus(worker, ComplaintStatus.ASSIGNED);
        long inProgress = complaintRepository.countByAssignedWorkerAndStatus(worker, ComplaintStatus.IN_PROGRESS);
        long resolved   = complaintRepository.countByAssignedWorkerAndStatus(worker, ComplaintStatus.RESOLVED);
        long closed     = complaintRepository.countByAssignedWorkerAndStatus(worker, ComplaintStatus.CLOSED);

        Double raw = complaintRepository.findAverageRatingByWorker(worker);
        Double averageRating = raw != null ? Math.round(raw * 10.0) / 10.0 : null;

        return new WorkerDashboardStatsResponse(assigned, inProgress, resolved, closed, averageRating);
    }
}
