package com.hostel.backend.service;

import com.hostel.backend.dto.ComplaintResponse;
import com.hostel.backend.dto.UserSummaryDTO;
import com.hostel.backend.entity.*;
import com.hostel.backend.enums.ComplaintStatus;
import com.hostel.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class DeptHeadService {

    private final ComplaintRepository    complaintRepository;
    private final ComplaintCommentRepository commentRepository;

    // ── Get complaints for dept head's department ─────────────────

    @Transactional(readOnly = true)  // ✅ keeps session open
    public Page<ComplaintResponse> getDeptComplaints(User deptHead, int page, int size, String status) {
        Long deptId = deptHead.getDepartment().getId();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        if (status != null && !status.isBlank()) {
            ComplaintStatus cs = ComplaintStatus.valueOf(status.toUpperCase());
            return complaintRepository.findByDepartmentIdAndStatus(deptId, cs, pageable)
                    .map(this::toResponse);
        }
        return complaintRepository.findByDepartmentId(deptId, pageable)
                .map(this::toResponse);
    }

    // ── Get single complaint ──────────────────────────────────────

    @Transactional(readOnly = true)  // ✅ keeps session open
    public ComplaintResponse getComplaintById(User deptHead, Long complaintId) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        validateDeptAccess(deptHead, complaint);
        return toResponse(complaint);
    }

    // ── Update status ─────────────────────────────────────────────

    @Transactional
    public ComplaintResponse updateStatus(User deptHead, Long complaintId,
                                          String newStatus, String rejectionReason) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        validateDeptAccess(deptHead, complaint);

        ComplaintStatus cs = ComplaintStatus.valueOf(newStatus.toUpperCase());

        if (cs != ComplaintStatus.IN_PROGRESS &&
            cs != ComplaintStatus.RESOLVED &&
            cs != ComplaintStatus.REJECTED) {
            throw new RuntimeException("DEPT_HEAD can only set: IN_PROGRESS, RESOLVED, REJECTED");
        }

        complaint.setStatus(cs);

        if (cs == ComplaintStatus.REJECTED && rejectionReason != null) {
            complaint.setRejectionReason(rejectionReason);
        }

        return toResponse(complaintRepository.save(complaint));
    }

    // ── Add comment/remark ────────────────────────────────────────

    @Transactional
    public ComplaintComment addComment(User deptHead, Long complaintId, String text) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        validateDeptAccess(deptHead, complaint);

        return commentRepository.save(ComplaintComment.builder()
                .complaint(complaint)
                .user(deptHead)
                .message(text)
                .build());
    }

    // ── Dashboard stats ───────────────────────────────────────────

    public Map<String, Long> getDashboardStats(User deptHead) {
        Long deptId = deptHead.getDepartment().getId();
        return Map.of(
            "total",      complaintRepository.countByDepartmentId(deptId),
            "forwarded",  complaintRepository.countByDepartmentIdAndStatus(deptId, ComplaintStatus.FORWARDED),
            "inProgress", complaintRepository.countByDepartmentIdAndStatus(deptId, ComplaintStatus.IN_PROGRESS),
            "resolved",   complaintRepository.countByDepartmentIdAndStatus(deptId, ComplaintStatus.RESOLVED),
            "rejected",   complaintRepository.countByDepartmentIdAndStatus(deptId, ComplaintStatus.REJECTED)
        );
    }

    // ── Mapper ────────────────────────────────────────────────────

    private ComplaintResponse toResponse(Complaint c) {
        return ComplaintResponse.builder()
                .id(c.getId())
                .title(c.getTitle())
                .description(c.getDescription())
                .category(c.getCategory())
                .priority(c.getPriority())
                .status(c.getStatus())
                .pipeline(c.getPipeline())
                .department(c.getDepartment() != null ? c.getDepartment().getName() : null)
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

    private UserSummaryDTO toUserSummary(User user) {
        if (user == null) return null;
        return UserSummaryDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .phoneNumber(user.getPhoneNumber())
                .hostelBlock(user.getBlock() != null ? user.getBlock().getName() : null)
                .roomNumber(user.getRoomNumber())
                .department(user.getDepartment() != null ? user.getDepartment().getName() : null)
                .build();
    }

    // ── Guard ─────────────────────────────────────────────────────

    private void validateDeptAccess(User deptHead, Complaint complaint) {
        if (complaint.getDepartment() == null ||
            !complaint.getDepartment().getId().equals(deptHead.getDepartment().getId())) {
            throw new RuntimeException("Access denied: complaint not in your department");
        }
    }
}
