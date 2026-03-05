package com.hostel.backend.service;

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

    private final ComplaintRepository complaintRepository;
    private final ComplaintCommentRepository commentRepository;

    // ── Get complaints for dept head's department ─────────────────
    public Page<Complaint> getDeptComplaints(User deptHead, int page, int size, String status) {
        Long deptId = deptHead.getDepartment().getId();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        if (status != null && !status.isBlank()) {
            ComplaintStatus cs = ComplaintStatus.valueOf(status.toUpperCase());
            return complaintRepository.findByDepartmentIdAndStatus(deptId, cs, pageable);
        }
        return complaintRepository.findByDepartmentId(deptId, pageable);
    }

    // ── Get single complaint (must belong to dept head's dept) ────
    public Complaint getComplaintById(User deptHead, Long complaintId) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        validateDeptAccess(deptHead, complaint);
        return complaint;
    }

    // ── Update status ─────────────────────────────────────────────
    @Transactional
    public Complaint updateStatus(User deptHead, Long complaintId, String newStatus, String rejectionReason) {
        Complaint complaint = getComplaintById(deptHead, complaintId);

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

        return complaintRepository.save(complaint);
    }

    // ── Add comment/remark ────────────────────────────────────────
    @Transactional
    public ComplaintComment addComment(User deptHead, Long complaintId, String text) {
        Complaint complaint = getComplaintById(deptHead, complaintId);

        ComplaintComment comment = ComplaintComment.builder()
                .complaint(complaint)
                .user(deptHead)       // ✅ fixed: was .author()
                .message(text)        // ✅ fixed: was .text()
                .build();             // ✅ removed .createdAt() — auto by @CreationTimestamp

        return commentRepository.save(comment);
    }

    // ── Dashboard stats ───────────────────────────────────────────
    public Map<String, Long> getDashboardStats(User deptHead) {
        Long deptId = deptHead.getDepartment().getId();
        return Map.of(
            "total",      complaintRepository.countByDepartmentId(deptId),
            "created",    complaintRepository.countByDepartmentIdAndStatus(deptId, ComplaintStatus.CREATED),
            "inProgress", complaintRepository.countByDepartmentIdAndStatus(deptId, ComplaintStatus.IN_PROGRESS),
            "resolved",   complaintRepository.countByDepartmentIdAndStatus(deptId, ComplaintStatus.RESOLVED),
            "rejected",   complaintRepository.countByDepartmentIdAndStatus(deptId, ComplaintStatus.REJECTED)
        );
    }

    // ── Guard: complaint must belong to dept head's department ────
    private void validateDeptAccess(User deptHead, Complaint complaint) {
        if (complaint.getDepartment() == null ||
            !complaint.getDepartment().getId().equals(deptHead.getDepartment().getId())) {
            throw new RuntimeException("Access denied: complaint not in your department");
        }
    }
}
