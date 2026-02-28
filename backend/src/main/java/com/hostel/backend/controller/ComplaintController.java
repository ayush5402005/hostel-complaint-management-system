package com.hostel.backend.controller;

import com.hostel.backend.dto.*;
import com.hostel.backend.enums.ComplaintStatus;
import com.hostel.backend.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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
            Authentication authentication) {
        return ResponseEntity.ok(
                complaintService.closeComplaint(id, authentication.getName()));
    }

    @GetMapping
    public ResponseEntity<Page<ComplaintResponse>> getComplaints(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) ComplaintStatus status) {
        return ResponseEntity.ok(
                complaintService.getComplaintsByRole(authentication.getName(), page, size, status));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsResponse> getDashboard(Authentication authentication) {
        return ResponseEntity.ok(
                complaintService.getDashboardStats(authentication.getName()));
    }
    @GetMapping("/{id}")
public ResponseEntity<ComplaintResponse> getComplaintById(
        @PathVariable Long id,
        Authentication authentication) {
    return ResponseEntity.ok(complaintService.getComplaintById(id, authentication.getName()));
}

}
