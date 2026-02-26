package com.hostel.backend.service;

import com.hostel.backend.dto.ComplaintRequest;
import com.hostel.backend.dto.DashboardStatsResponse;
import com.hostel.backend.dto.UpdateComplaintStatusRequest;
import com.hostel.backend.entity.Complaint;
import com.hostel.backend.entity.User;
import com.hostel.backend.enums.ComplaintStatus;
import com.hostel.backend.enums.Role;
import com.hostel.backend.repository.ComplaintRepository;
import com.hostel.backend.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;

    public ComplaintService(ComplaintRepository complaintRepository,
                            UserRepository userRepository) {
        this.complaintRepository = complaintRepository;
        this.userRepository = userRepository;
    }

    // ================================
    // CREATE COMPLAINT (Student)
    // ================================
    public Complaint createComplaint(String email, ComplaintRequest request) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != Role.STUDENT) {
            throw new RuntimeException("Only students can create complaints");
        }

        Complaint complaint = Complaint.builder()
                .title("Hostel Issue")
                .category(request.getCategory())
                .priority(request.getPriority())
                .description(request.getDescription())
                .issuePhotoUrl(request.getImageUrl())
                .status(ComplaintStatus.CREATED)
                .student(user)
                .build();

        return complaintRepository.save(complaint);
    }

    // ================================
    // ASSIGN WORKER (Warden / Caretaker)
    // ================================
    public Complaint assignWorker(Long complaintId, Long workerId, String email) {

        User assignedBy = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (assignedBy.getRole() != Role.CARETAKER &&
                assignedBy.getRole() != Role.WARDEN) {
            throw new RuntimeException("Only caretaker or warden can assign worker");
        }

        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        User worker = userRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found"));

        if (worker.getRole() != Role.WORKER) {
            throw new RuntimeException("Assigned user is not a worker");
        }

        complaint.setAssignedWorker(worker);
        complaint.setStatus(ComplaintStatus.ASSIGNED);

        return complaintRepository.save(complaint);
    }

    // ================================
    // WORKER UPDATE STATUS
    // ================================
    public Complaint updateStatus(Long complaintId,
                                  UpdateComplaintStatusRequest request,
                                  String email) {

        User worker = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (worker.getRole() != Role.WORKER) {
            throw new RuntimeException("Only worker can update complaint");
        }

        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        if (complaint.getAssignedWorker() == null ||
                !complaint.getAssignedWorker().getId().equals(worker.getId())) {
            throw new RuntimeException("You are not assigned to this complaint");
        }

        complaint.setStatus(request.getStatus());

        if (request.getResolvedPhotoUrl() != null) {
            complaint.setResolvedPhotoUrl(request.getResolvedPhotoUrl());
        }

        return complaintRepository.save(complaint);
    }

    // ================================
    // STUDENT CLOSE COMPLAINT
    // ================================
    public Complaint closeComplaint(Long complaintId, String email) {

        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (student.getRole() != Role.STUDENT) {
            throw new RuntimeException("Only student can close complaint");
        }

        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        if (!complaint.getStudent().getId().equals(student.getId())) {
            throw new RuntimeException("You cannot close this complaint");
        }

        if (complaint.getStatus() != ComplaintStatus.RESOLVED) {
            throw new RuntimeException("Complaint must be resolved first");
        }

        complaint.setStatus(ComplaintStatus.CLOSED);

        return complaintRepository.save(complaint);
    }

    // ================================
    // PAGINATION BASED ON ROLE
    // ================================
    public Page<Complaint> getComplaintsByRole(String email,
                                               int page,
                                               int size,
                                               ComplaintStatus status) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Pageable pageable = PageRequest.of(page, size);

        switch (user.getRole()) {

            case STUDENT:
                if (status != null) {
                    return complaintRepository
                            .findByStatusAndStudent(status, user, pageable);
                }
                return complaintRepository
                        .findByStudent(user, pageable);

            case WORKER:
                return complaintRepository
                        .findByAssignedWorker(user, pageable);

            case CARETAKER:
            case WARDEN:
                if (status != null) {
                    return complaintRepository
                            .findByStatus(status, pageable);
                }
                return complaintRepository.findAll(pageable);

            default:
                throw new RuntimeException("Invalid role");
        }
    }
    public DashboardStatsResponse getDashboardStats(String email) {

    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

    if (user.getRole() != Role.CARETAKER &&
        user.getRole() != Role.WARDEN) {
        throw new RuntimeException("Access denied");
    }

    long total = complaintRepository.count();

    long created = complaintRepository.countByStatus(ComplaintStatus.CREATED);
    long assigned = complaintRepository.countByStatus(ComplaintStatus.ASSIGNED);
    long inProgress = complaintRepository.countByStatus(ComplaintStatus.IN_PROGRESS);
    long resolved = complaintRepository.countByStatus(ComplaintStatus.RESOLVED);
    long closed = complaintRepository.countByStatus(ComplaintStatus.CLOSED);
    long rejected = complaintRepository.countByStatus(ComplaintStatus.REJECTED);

    return new DashboardStatsResponse(
            total,
            created,
            assigned,
            inProgress,
            resolved,
            closed,
            rejected
    );
}
}