package com.hostel.backend.service;

import com.hostel.backend.dto.AuditLogResponse;
import com.hostel.backend.entity.ComplaintAuditLog;
import com.hostel.backend.entity.User;
import com.hostel.backend.repository.ComplaintAuditLogRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ComplaintAuditLogService {

    private final ComplaintAuditLogRepository auditLogRepository;

    public ComplaintAuditLogService(ComplaintAuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(Long complaintId, User changedBy,
                    String fromStatus, String toStatus, String note) {
        ComplaintAuditLog log = ComplaintAuditLog.builder()
                .complaintId(complaintId)
                .changedByName(changedBy.getName())
                .changedByRole(changedBy.getRole().name())
                .fromStatus(fromStatus)
                .toStatus(toStatus)
                .note(note)
                .build();
        auditLogRepository.save(log);
    }

    public List<AuditLogResponse> getLogsForComplaint(Long complaintId) {
        return auditLogRepository
                .findByComplaintIdOrderByChangedAtAsc(complaintId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    private AuditLogResponse toResponse(ComplaintAuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .complaintId(log.getComplaintId())
                .changedByName(log.getChangedByName())
                .changedByRole(log.getChangedByRole())
                .fromStatus(log.getFromStatus())
                .toStatus(log.getToStatus())
                .note(log.getNote())
                .changedAt(log.getChangedAt())
                .build();
    }
}
