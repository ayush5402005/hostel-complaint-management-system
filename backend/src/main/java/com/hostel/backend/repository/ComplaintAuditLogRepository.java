package com.hostel.backend.repository;

import com.hostel.backend.entity.ComplaintAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComplaintAuditLogRepository extends JpaRepository<ComplaintAuditLog, Long> {
    List<ComplaintAuditLog> findByComplaintIdOrderByChangedAtAsc(Long complaintId);
}
