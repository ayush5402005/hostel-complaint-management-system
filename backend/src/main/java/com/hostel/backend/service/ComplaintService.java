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

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ComplaintService(ComplaintRepository complaintRepository,
                            UserRepository userRepository,
                            NotificationService notificationService) {
        this.complaintRepository = complaintRepository;
        this.userRepository      = userRepository;
        this.notificationService = notificationService;
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private Complaint getComplaint(Long id) {
        return complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found: " + id));
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

    private ComplaintResponse toResponse(Complaint complaint) {
        return ComplaintResponse.builder()
                .id(complaint.getId())
                .title(complaint.getTitle())
                .description(complaint.getDescription())
                .category(complaint.getCategory())
                .priority(complaint.getPriority())
                .status(complaint.getStatus())
                .issuePhotoUrl(complaint.getIssuePhotoUrl())
                .resolvedPhotoUrl(complaint.getResolvedPhotoUrl())
                .rejectionReason(complaint.getRejectionReason())
                .student(toUserSummary(complaint.getStudent()))
                .assignedWorker(toUserSummary(complaint.getAssignedWorker()))
                .createdAt(complaint.getCreatedAt())
                .updatedAt(complaint.getUpdatedAt())
                .build();
    }

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

        // Notify all wardens + caretakers
        List<User> staff = userRepository.findByRole(Role.WARDEN);
        staff.addAll(userRepository.findByRole(Role.CARETAKER));
        staff.forEach(s -> notificationService.sendNotification(s,
                user.getName() + " filed a new complaint: " + saved.getTitle(),
                "COMPLAINT_CREATED"));

        return toResponse(saved);
    }

    @Transactional
    public ComplaintResponse assignWorker(Long complaintId, Long workerId, String email) {
        User assignedBy = getUser(email);
        if (assignedBy.getRole() != Role.CARETAKER &&
                assignedBy.getRole() != Role.WARDEN) {
            throw new UnauthorizedException("Only caretaker or warden can assign worker");
        }
        Complaint complaint = getComplaint(complaintId);
        User worker = userRepository.findById(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Worker not found: " + workerId));
        if (worker.getRole() != Role.WORKER) {
            throw new UnauthorizedException("Assigned user is not a worker");
        }
        complaint.setAssignedWorker(worker);
        complaint.setStatus(ComplaintStatus.ASSIGNED);
        Complaint saved = complaintRepository.save(complaint);

        // Notify worker + student
        notificationService.sendNotification(worker,
                "You have been assigned complaint: " + saved.getTitle(),
                "COMPLAINT_ASSIGNED");
        notificationService.sendNotification(saved.getStudent(),
                "Your complaint '" + saved.getTitle() + "' has been assigned to " + worker.getName(),
                "COMPLAINT_ASSIGNED");

        return toResponse(saved);
    }

    @Transactional
    public ComplaintResponse reassignWorker(Long complaintId, Long newWorkerId, String email) {
        User assignedBy = getUser(email);
        if (assignedBy.getRole() != Role.CARETAKER &&
                assignedBy.getRole() != Role.WARDEN) {
            throw new UnauthorizedException("Only caretaker or warden can reassign worker");
        }
        Complaint complaint = getComplaint(complaintId);
        User newWorker = userRepository.findById(newWorkerId)
                .orElseThrow(() -> new ResourceNotFoundException("Worker not found: " + newWorkerId));
        if (newWorker.getRole() != Role.WORKER) {
            throw new UnauthorizedException("Assigned user is not a worker");
        }
        User oldWorker = complaint.getAssignedWorker();
        complaint.setAssignedWorker(newWorker);
        complaint.setStatus(ComplaintStatus.ASSIGNED);
        Complaint saved = complaintRepository.save(complaint);

        // Notify old worker, new worker, student
        if (oldWorker != null) {
            notificationService.sendNotification(oldWorker,
                    "Complaint '" + saved.getTitle() + "' has been reassigned from you",
                    "COMPLAINT_ASSIGNED");
        }
        notificationService.sendNotification(newWorker,
                "Complaint '" + saved.getTitle() + "' has been reassigned to you",
                "COMPLAINT_ASSIGNED");
        notificationService.sendNotification(saved.getStudent(),
                "Your complaint '" + saved.getTitle() + "' has been reassigned to " + newWorker.getName(),
                "COMPLAINT_ASSIGNED");

        return toResponse(saved);
    }

    @Transactional
    public ComplaintResponse rejectComplaint(Long complaintId, String reason, String email) {
        User rejectedBy = getUser(email);
        if (rejectedBy.getRole() != Role.CARETAKER &&
                rejectedBy.getRole() != Role.WARDEN) {
            throw new UnauthorizedException("Only caretaker or warden can reject complaints");
        }
        if (reason == null || reason.trim().isEmpty()) {
            throw new RuntimeException("Rejection reason is required");
        }
        Complaint complaint = getComplaint(complaintId);
        if (complaint.getStatus() == ComplaintStatus.CLOSED) {
            throw new RuntimeException("Cannot reject a closed complaint");
        }
        complaint.setStatus(ComplaintStatus.REJECTED);
        complaint.setRejectionReason(reason.trim());
        Complaint saved = complaintRepository.save(complaint);

        // Notify student
        notificationService.sendNotification(saved.getStudent(),
                "Your complaint '" + saved.getTitle() + "' was rejected. Reason: " + reason,
                "STATUS_UPDATED");

        return toResponse(saved);
    }

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
        complaint.setStatus(request.getStatus());
        if (request.getResolvedPhotoUrl() != null) {
            complaint.setResolvedPhotoUrl(request.getResolvedPhotoUrl());
        }
        Complaint saved = complaintRepository.save(complaint);

        // Notify student on progress + resolution
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

    @Transactional
    public ComplaintResponse closeComplaint(Long complaintId, String email) {
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
        complaint.setStatus(ComplaintStatus.CLOSED);
        return toResponse(complaintRepository.save(complaint));
    }

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
            case CARETAKER, WARDEN -> status != null
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

    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats(String email) {
        User user = getUser(email);
        if (user.getRole() != Role.CARETAKER && user.getRole() != Role.WARDEN) {
            throw new UnauthorizedException("Access denied: Dashboard only for Caretaker/Warden");
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
}
