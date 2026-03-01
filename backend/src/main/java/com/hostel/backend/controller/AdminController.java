package com.hostel.backend.controller;

import com.hostel.backend.dto.*;
import com.hostel.backend.entity.User;
import com.hostel.backend.enums.Role;
import com.hostel.backend.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    // ✅ Only ADMIN + WARDEN can create WARDEN
    @PostMapping("/create-warden")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN')")
    public ResponseEntity<?> createWarden(@RequestBody RegisterRequest request) {
        User user = adminService.createUserWithRole(request, Role.WARDEN);
        return ResponseEntity.ok(user);
    }

    // ✅ Only ADMIN + WARDEN can create CARETAKER
    @PostMapping("/create-caretaker")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN')")
    public ResponseEntity<?> createCaretaker(@RequestBody RegisterRequest request) {
        User user = adminService.createUserWithRole(request, Role.CARETAKER);
        return ResponseEntity.ok(user);
    }

    // ✅ ADMIN + WARDEN + CARETAKER can create WORKER
    @PostMapping("/create-worker")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN', 'CARETAKER')")
    public ResponseEntity<?> createWorker(@RequestBody RegisterRequest request) {
        User user = adminService.createUserWithRole(request, Role.WORKER);
        return ResponseEntity.ok(user);
    }

    // ✅ Get all users — ADMIN only
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminUserResponse>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    // ✅ Get users by role — ADMIN + WARDEN + CARETAKER
    @GetMapping("/users/role/{role}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN', 'CARETAKER')")
    public ResponseEntity<List<AdminUserResponse>> getUsersByRole(@PathVariable Role role) {
        return ResponseEntity.ok(adminService.getUsersByRole(role));
    }

    // ✅ Get workers list — for complaint assignment
    @GetMapping("/workers")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN', 'CARETAKER')")
    public ResponseEntity<List<AdminUserResponse>> getWorkers() {
        return ResponseEntity.ok(adminService.getUsersByRole(Role.WORKER));
    }

    // ✅ Update user — ADMIN + WARDEN
    @PutMapping("/users/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN')")
    public ResponseEntity<?> updateUser(@PathVariable Long id,
                                        @RequestBody UpdateUserRequest request) {
        User user = adminService.updateUser(id, request);
        return ResponseEntity.ok(user);
    }

    // ✅ Deactivate user — ADMIN + WARDEN
    @PatchMapping("/users/{id}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN')")
    public ResponseEntity<?> deactivateUser(@PathVariable Long id) {
        adminService.deactivateUser(id);
        return ResponseEntity.ok(Map.of("message", "User deactivated successfully"));
    }

    // ✅ Activate user — ADMIN + WARDEN
    @PatchMapping("/users/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN')")
    public ResponseEntity<?> activateUser(@PathVariable Long id) {
        adminService.activateUser(id);
        return ResponseEntity.ok(Map.of("message", "User activated successfully"));
    }

    // ✅ Delete user permanently — ADMIN only
    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    // ✅ Dashboard stats — ADMIN + WARDEN + CARETAKER
    @GetMapping("/dashboard-stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN', 'CARETAKER')")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }
}
