package com.hostel.backend.controller;

import com.hostel.backend.dto.AssignWorkerRequest;
import com.hostel.backend.dto.ComplaintRequest;
import com.hostel.backend.dto.DashboardStatsResponse;
import com.hostel.backend.dto.UpdateComplaintStatusRequest;
import com.hostel.backend.entity.Complaint;
import com.hostel.backend.service.ComplaintService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import com.hostel.backend.enums.ComplaintStatus;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @PostMapping
    public Complaint createComplaint(@RequestBody ComplaintRequest request,
                                     Authentication authentication) {

        String email = authentication.getName(); // from JWT
        return complaintService.createComplaint(email, request);
    }
    @PutMapping("/{id}/assign")
public Complaint assignWorker(@PathVariable Long id,
                              @RequestBody AssignWorkerRequest request,
                              Authentication authentication) {

    String email = authentication.getName();
    return complaintService.assignWorker(id, request.getWorkerId(), email);
}
@PutMapping("/{id}/status")
public Complaint updateStatus(@PathVariable Long id,
                              @RequestBody UpdateComplaintStatusRequest request,
                              Authentication authentication) {

    String email = authentication.getName();
    return complaintService.updateStatus(id, request, email);
}
@PutMapping("/{id}/close")
public Complaint closeComplaint(@PathVariable Long id,
                                Authentication authentication) {

    String email = authentication.getName();
    return complaintService.closeComplaint(id, email);
}

@GetMapping
public Page<Complaint> getComplaints(Authentication authentication,
                                     @RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "5") int size,
                                     @RequestParam(required = false) ComplaintStatus status) {

    String email = authentication.getName();

    return complaintService.getComplaintsByRole(email, page, size, status);
}
@GetMapping("/dashboard")
public DashboardStatsResponse getDashboard(Authentication authentication) {

    String email = authentication.getName();
    return complaintService.getDashboardStats(email);
}
}