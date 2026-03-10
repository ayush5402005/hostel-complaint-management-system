package com.hostel.backend.controller;

import com.hostel.backend.dto.*;
import com.hostel.backend.enums.ComplaintCategory;
import com.hostel.backend.enums.ComplaintPriority;
import com.hostel.backend.enums.ComplaintStatus;
import com.hostel.backend.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @PostMapping
    public ResponseEntity<ComplaintResponse> createComplaint(
            @Valid @RequestBody ComplaintRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(
                complaintService.createComplaint(authentication.getName(), request));
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<ComplaintResponse> assignWorker(
            @PathVariable Long id,
            @RequestBody AssignWorkerRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(
                complaintService.assignWorker(id, request.getWorkerId(), authentication.getName()));
    }

    @PutMapping("/{id}/reassign")
    public ResponseEntity<ComplaintResponse> reassignWorker(
            @PathVariable Long id,
            @RequestBody AssignWorkerRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(
                complaintService.reassignWorker(id, request.getWorkerId(), authentication.getName()));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ComplaintResponse> rejectComplaint(
            @PathVariable Long id,
            @RequestBody RejectComplaintRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(
                complaintService.rejectComplaint(id, request.getReason(), authentication.getName()));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ComplaintResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody UpdateComplaintStatusRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(
                complaintService.updateStatus(id, request, authentication.getName()));
    }

    @PutMapping("/{id}/close")
    public ResponseEntity<ComplaintResponse> closeComplaint(
            @PathVariable Long id,
            @RequestBody(required = false) CloseComplaintRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(
                complaintService.closeComplaint(id, request, authentication.getName()));
    }

    @GetMapping
    public ResponseEntity<Page<ComplaintResponse>> getComplaints(
            Authentication authentication,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) ComplaintStatus status,
            @RequestParam(required = false) String blockName,
            @RequestParam(required = false) ComplaintCategory category,
            @RequestParam(required = false) ComplaintPriority priority,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        return ResponseEntity.ok(
                complaintService.getComplaintsByRole(
                        authentication.getName(), page, size,
                        status, blockName, category, priority, dateFrom, dateTo));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsResponse> getDashboard(Authentication authentication) {
        return ResponseEntity.ok(
                complaintService.getDashboardStats(authentication.getName()));
    }

    @GetMapping("/dashboard/student")
    public ResponseEntity<StudentDashboardStatsResponse> getStudentDashboard(
            Authentication authentication) {
        return ResponseEntity.ok(
                complaintService.getStudentDashboardStats(authentication.getName()));
    }

    @GetMapping("/dashboard/worker")
    public ResponseEntity<WorkerDashboardStatsResponse> getWorkerDashboard(
            Authentication authentication) {
        return ResponseEntity.ok(
                complaintService.getWorkerDashboardStats(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ComplaintResponse> getComplaintById(
            @PathVariable Long id,
            Authentication authentication) {
        return ResponseEntity.ok(
                complaintService.getComplaintById(id, authentication.getName()));
    }
}
