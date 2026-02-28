package com.hostel.backend.service;

import com.hostel.backend.dto.CommentRequest;
import com.hostel.backend.dto.CommentResponse;
import com.hostel.backend.entity.Complaint;
import com.hostel.backend.entity.ComplaintComment;
import com.hostel.backend.entity.User;
import com.hostel.backend.enums.Role;
import com.hostel.backend.exception.ResourceNotFoundException;
import com.hostel.backend.exception.UnauthorizedException;
import com.hostel.backend.repository.ComplaintCommentRepository;
import com.hostel.backend.repository.ComplaintRepository;
import com.hostel.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ComplaintCommentService {

    private final ComplaintCommentRepository commentRepository;
    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;

    public ComplaintCommentService(ComplaintCommentRepository commentRepository,
                                   ComplaintRepository complaintRepository,
                                   UserRepository userRepository) {
        this.commentRepository  = commentRepository;
        this.complaintRepository = complaintRepository;
        this.userRepository     = userRepository;
    }

    private void checkAccess(User user, Complaint complaint) {
        // Student — only own complaints
        if (user.getRole() == Role.STUDENT &&
                !complaint.getStudent().getId().equals(user.getId())) {
            throw new UnauthorizedException("Access denied");
        }
        // Worker — only assigned complaints
        if (user.getRole() == Role.WORKER) {
            if (complaint.getAssignedWorker() == null ||
                    !complaint.getAssignedWorker().getId().equals(user.getId())) {
                throw new UnauthorizedException("Access denied");
            }
        }
        // Warden/Caretaker — full access (no check needed)
    }

    @Transactional
    public CommentResponse addComment(Long complaintId, String email, CommentRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        checkAccess(user, complaint);

        if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            throw new RuntimeException("Message cannot be empty");
        }

        ComplaintComment comment = ComplaintComment.builder()
                .complaint(complaint)
                .user(user)
                .message(request.getMessage().trim())
                .build();

        return toResponse(commentRepository.save(comment));
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(Long complaintId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        checkAccess(user, complaint);

        return commentRepository.findByComplaintOrderByCreatedAtAsc(complaint)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    private CommentResponse toResponse(ComplaintComment c) {
        return CommentResponse.builder()
                .id(c.getId())
                .message(c.getMessage())
                .userName(c.getUser().getName())
                .userRole(c.getUser().getRole().name())
                .userId(c.getUser().getId())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
