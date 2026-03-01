package com.hostel.backend.controller;

import com.hostel.backend.dto.AuditLogResponse;
import com.hostel.backend.service.ComplaintAuditLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/complaints/{complaintId}/audit")
public class ComplaintAuditLogController {

    private final ComplaintAuditLogService auditLogService;

    public ComplaintAuditLogController(ComplaintAuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<List<AuditLogResponse>> getAuditLogs(
            @PathVariable Long complaintId) {
        return ResponseEntity.ok(auditLogService.getLogsForComplaint(complaintId));
    }
}
