package com.hostel.backend.controller;

import com.hostel.backend.entity.*;
import com.hostel.backend.repository.UserRepository;
import com.hostel.backend.service.DeptHeadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dept-head")
@RequiredArgsConstructor
public class DeptHeadController {

    private final DeptHeadService deptHeadService;
    private final UserRepository userRepository;

    private User getCurrentUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // GET /api/dept-head/dashboard
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('DEPT_HEAD')")
    public ResponseEntity<?> getDashboard(Authentication auth) {
        return ResponseEntity.ok(deptHeadService.getDashboardStats(getCurrentUser(auth)));
    }

    // GET /api/dept-head/complaints?page=0&size=10&status=CREATED
    @GetMapping("/complaints")
    @PreAuthorize("hasRole('DEPT_HEAD')")
    public ResponseEntity<?> getComplaints(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false)    String status,
            Authentication auth) {
        return ResponseEntity.ok(
            deptHeadService.getDeptComplaints(getCurrentUser(auth), page, size, status)
        );
    }

    // GET /api/dept-head/complaints/{id}
    @GetMapping("/complaints/{id}")
    @PreAuthorize("hasRole('DEPT_HEAD')")
    public ResponseEntity<?> getComplaintById(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(deptHeadService.getComplaintById(getCurrentUser(auth), id));
    }

    // PUT /api/dept-head/complaints/{id}/status
    // Body: { "status": "IN_PROGRESS", "rejectionReason": "..." }
    @PutMapping("/complaints/{id}/status")
    @PreAuthorize("hasRole('DEPT_HEAD')")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        String status          = body.get("status");
        String rejectionReason = body.get("rejectionReason");
        return ResponseEntity.ok(
            deptHeadService.updateStatus(getCurrentUser(auth), id, status, rejectionReason)
        );
    }

    // POST /api/dept-head/complaints/{id}/comment
    // Body: { "text": "Working on it..." }
    @PostMapping("/complaints/{id}/comment")
    @PreAuthorize("hasRole('DEPT_HEAD')")
    public ResponseEntity<?> addComment(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        return ResponseEntity.ok(
            deptHeadService.addComment(getCurrentUser(auth), id, body.get("text"))
        );
    }
}
