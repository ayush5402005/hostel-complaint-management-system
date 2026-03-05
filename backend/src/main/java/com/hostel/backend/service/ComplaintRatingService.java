package com.hostel.backend.service;

import com.hostel.backend.dto.RatingRequest;
import com.hostel.backend.dto.RatingResponse;
import com.hostel.backend.dto.WorkerRatingSummary;
import com.hostel.backend.entity.Complaint;
import com.hostel.backend.entity.ComplaintRating;
import com.hostel.backend.entity.User;
import com.hostel.backend.enums.ComplaintStatus;
import com.hostel.backend.enums.Role;
import com.hostel.backend.exception.ResourceNotFoundException;
import com.hostel.backend.exception.UnauthorizedException;
import com.hostel.backend.repository.ComplaintRatingRepository;
import com.hostel.backend.repository.ComplaintRepository;
import com.hostel.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ComplaintRatingService {

    private final ComplaintRatingRepository ratingRepository;
    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;

    public ComplaintRatingService(ComplaintRatingRepository ratingRepository,
                                   ComplaintRepository complaintRepository,
                                   UserRepository userRepository) {
        this.ratingRepository    = ratingRepository;
        this.complaintRepository = complaintRepository;
        this.userRepository      = userRepository;
    }

    @Transactional
    public RatingResponse submitRating(Long complaintId, String email, RatingRequest request) {
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (student.getRole() != Role.STUDENT) {
            throw new UnauthorizedException("Only students can rate complaints");
        }
        if (request.getRating() < 1 || request.getRating() > 5) {
            throw new RuntimeException("Rating must be between 1 and 5");
        }
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));
        if (!complaint.getStudent().getId().equals(student.getId())) {
            throw new UnauthorizedException("You can only rate your own complaints");
        }
        if (complaint.getStatus() != ComplaintStatus.CLOSED) {
            throw new RuntimeException("You can only rate closed complaints");
        }
        if (complaint.getAssignedWorker() == null) {
            throw new RuntimeException("No worker assigned to this complaint");
        }
        if (ratingRepository.existsByComplaintId(complaintId)) {
            throw new RuntimeException("You have already rated this complaint");
        }
        ComplaintRating rating = ComplaintRating.builder()
                .complaintId(complaintId)
                .workerId(complaint.getAssignedWorker().getId())
                .studentId(student.getId())
                .rating(request.getRating())
                .comment(request.getComment())
                .build();
        return toResponse(ratingRepository.save(rating),
                complaint.getAssignedWorker().getName());
    }

    @Transactional(readOnly = true)
    public RatingResponse getRatingForComplaint(Long complaintId) {
        ComplaintRating rating = ratingRepository.findByComplaintId(complaintId)
                .orElse(null);
        if (rating == null) return null;
        User worker = userRepository.findById(rating.getWorkerId()).orElse(null);
        return toResponse(rating, worker != null ? worker.getName() : "Unknown");
    }

    @Transactional(readOnly = true)
    public WorkerRatingSummary getWorkerRatingSummary(Long workerId) {
        User worker = userRepository.findById(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Worker not found"));
        Double avg   = ratingRepository.getAverageRatingByWorkerId(workerId);
        Long   count = ratingRepository.getRatingCountByWorkerId(workerId);
        return WorkerRatingSummary.builder()
                .workerId(workerId)
                .workerName(worker.getName())
                .department(worker.getDepartment() != null
                        ? worker.getDepartment().getName() : null) // ✅ fixed
                .averageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0)
                .totalRatings(count != null ? count : 0L)
                .build();
    }

    @Transactional(readOnly = true)
    public List<WorkerRatingSummary> getAllWorkerRatings() {
        return userRepository.findByRole(Role.WORKER)
                .stream()
                .map(w -> getWorkerRatingSummary(w.getId()))
                .collect(Collectors.toList());
    }

    private RatingResponse toResponse(ComplaintRating r, String workerName) {
        return RatingResponse.builder()
                .id(r.getId())
                .complaintId(r.getComplaintId())
                .workerId(r.getWorkerId())
                .workerName(workerName)
                .rating(r.getRating())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
