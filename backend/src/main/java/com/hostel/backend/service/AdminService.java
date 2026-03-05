package com.hostel.backend.service;

import com.hostel.backend.dto.*;
import com.hostel.backend.entity.Department;
import com.hostel.backend.entity.User;
import com.hostel.backend.enums.ComplaintStatus;
import com.hostel.backend.enums.Role;
import com.hostel.backend.repository.ComplaintRepository;
import com.hostel.backend.repository.DepartmentRepository;
import com.hostel.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ComplaintRepository complaintRepository;
    private final DepartmentRepository departmentRepository; // ✅ NEW

    public AdminService(UserRepository userRepository,
                        PasswordEncoder passwordEncoder,
                        ComplaintRepository complaintRepository,
                        DepartmentRepository departmentRepository) { // ✅ NEW
        this.userRepository       = userRepository;
        this.passwordEncoder      = passwordEncoder;
        this.complaintRepository  = complaintRepository;
        this.departmentRepository = departmentRepository; // ✅ NEW
    }

    // ── User Creation ─────────────────────────────────────────────

    public User createUserWithRole(RegisterRequest request, Role role) {
        if (request.getName() == null || request.getEmail() == null ||
            request.getPassword() == null || request.getPhoneNumber() == null) {
            throw new RuntimeException("Required fields are missing");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("User with this email already exists");
        }

        User.UserBuilder builder = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .phoneNumber(request.getPhoneNumber())
                .active(true);

        // ✅ NEW — assign department if provided (for DEPT_HEAD)
        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Department not found"));
            builder.department(dept);
        }

        return userRepository.save(builder.build());
    }

    // ── User Queries ──────────────────────────────────────────────

    public List<AdminUserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::mapToAdminUserResponse)
                .collect(Collectors.toList());
    }

    public List<AdminUserResponse> getUsersByRole(Role role) {
        return userRepository.findAll()
                .stream()
                .filter(u -> u.getRole() == role)
                .map(this::mapToAdminUserResponse)
                .collect(Collectors.toList());
    }

    // ── User Updates ──────────────────────────────────────────────

    public User updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (request.getName() != null)        user.setName(request.getName());
        if (request.getPhoneNumber() != null)  user.setPhoneNumber(request.getPhoneNumber());
        if (request.getRoomNumber() != null)   user.setRoomNumber(request.getRoomNumber());
        return userRepository.save(user);
    }

    public void deactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        user.setActive(false);
        userRepository.save(user);
    }

    public void activateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        user.setActive(true);
        userRepository.save(user);
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        userRepository.delete(user);
    }

    // ── Departments ───────────────────────────────────────────────

    // ✅ NEW
    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    // ── Stats ─────────────────────────────────────────────────────

    public DashboardStatsResponse getDashboardStats() {
        long total      = complaintRepository.count();
        long created    = complaintRepository.countByStatus(ComplaintStatus.CREATED);
        long assigned   = complaintRepository.countByStatus(ComplaintStatus.ASSIGNED);
        long inProgress = complaintRepository.countByStatus(ComplaintStatus.IN_PROGRESS);
        long resolved   = complaintRepository.countByStatus(ComplaintStatus.RESOLVED);
        long closed     = complaintRepository.countByStatus(ComplaintStatus.CLOSED);
        long rejected   = complaintRepository.countByStatus(ComplaintStatus.REJECTED);
        return new DashboardStatsResponse(total, created, assigned, inProgress,
                                          resolved, closed, rejected);
    }

    private AdminUserResponse mapToAdminUserResponse(User user) {
        Double averageRating = null;
        if (user.getRole() == Role.WORKER) {
            Double raw = complaintRepository.findAverageRatingByWorker(user);
            if (raw != null) averageRating = Math.round(raw * 10.0) / 10.0;
        }
        return AdminUserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .phoneNumber(user.getPhoneNumber())
                .scholarNumber(user.getScholarNumber())
                .hostelBlock(user.getBlock() != null ? user.getBlock().getName() : null)
                .roomNumber(user.getRoomNumber())
                .department(user.getDepartment() != null ? user.getDepartment().getName() : null)
                .active(user.isActive())
                .averageRating(averageRating)
                .build();
    }
}
