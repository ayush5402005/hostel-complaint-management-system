package com.hostel.backend.controller;

import com.hostel.backend.dto.*;
import com.hostel.backend.entity.Department;
import com.hostel.backend.entity.User;
import com.hostel.backend.enums.Role;
import com.hostel.backend.service.AdminService;
import com.hostel.backend.service.ComplaintService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final ComplaintService complaintService;

    public AdminController(AdminService adminService,
                           ComplaintService complaintService) {
        this.adminService     = adminService;
        this.complaintService = complaintService;
    }

    // ── User Creation ─────────────────────────────────────────────

    @PostMapping("/create-warden")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN')")
    public ResponseEntity<?> createWarden(@RequestBody RegisterRequest request) {
        User user = adminService.createUserWithRole(request, Role.WARDEN);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/create-caretaker")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN')")
    public ResponseEntity<?> createCaretaker(@RequestBody RegisterRequest request) {
        User user = adminService.createUserWithRole(request, Role.CARETAKER);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/create-worker")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN', 'CARETAKER')")
    public ResponseEntity<?> createWorker(@RequestBody RegisterRequest request) {
        User user = adminService.createUserWithRole(request, Role.WORKER);
        return ResponseEntity.ok(user);
    }

    // ── User Management ───────────────────────────────────────────

    @GetMapping("/users")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN')")
    public ResponseEntity<List<AdminUserResponse>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping("/users/role/{role}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN', 'CARETAKER')")
    public ResponseEntity<List<AdminUserResponse>> getUsersByRole(@PathVariable Role role) {
        return ResponseEntity.ok(adminService.getUsersByRole(role));
    }

    @GetMapping("/workers")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN', 'CARETAKER')")
    public ResponseEntity<List<AdminUserResponse>> getWorkers() {
        return ResponseEntity.ok(adminService.getUsersByRole(Role.WORKER));
    }

    @PutMapping("/users/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN')")
    public ResponseEntity<?> updateUser(@PathVariable Long id,
                                        @RequestBody UpdateUserRequest request) {
        User user = adminService.updateUser(id, request);
        return ResponseEntity.ok(user);
    }

    @PatchMapping("/users/{id}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN')")
    public ResponseEntity<?> deactivateUser(@PathVariable Long id) {
        adminService.deactivateUser(id);
        return ResponseEntity.ok(Map.of("message", "User deactivated successfully"));
    }

    @PatchMapping("/users/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN')")
    public ResponseEntity<?> activateUser(@PathVariable Long id) {
        adminService.activateUser(id);
        return ResponseEntity.ok(Map.of("message", "User activated successfully"));
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    // ── Departments ───────────────────────────────────────────────

    @GetMapping("/departments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Department>> getAllDepartments() {
        return ResponseEntity.ok(adminService.getAllDepartments());
    }

    // ── Stats ─────────────────────────────────────────────────────

    @GetMapping("/dashboard-stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN', 'CARETAKER')")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/workers/{id}/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN', 'CARETAKER')")
    public ResponseEntity<WorkerDashboardStatsResponse> getWorkerStats(
            @PathVariable Long id) {
        return ResponseEntity.ok(complaintService.getWorkerStatsByAdmin(id));
    }
}
