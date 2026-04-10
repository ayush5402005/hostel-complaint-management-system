package com.hostel.backend.controller;

import com.hostel.backend.dto.*;
import com.hostel.backend.service.StudentProfileService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class StudentProfileController {

    private final StudentProfileService profileService;

    public StudentProfileController(StudentProfileService profileService) {
        this.profileService = profileService;
    }

    // ── Student endpoints ─────────────────────────────────────────────────────

    @PostMapping("/api/profile")
    public ResponseEntity<StudentProfileResponse> submitProfile(
            @Valid @RequestBody StudentProfileRequest request,
            Authentication auth) {
        return ResponseEntity.ok(profileService.submitProfile(auth.getName(), request));
    }

    @GetMapping("/api/profile")
    public ResponseEntity<StudentProfileResponse> getMyProfile(Authentication auth) {
        return ResponseEntity.ok(profileService.getMyProfile(auth.getName()));
    }

    @GetMapping("/api/profile/status")
    public ResponseEntity<Map<String, Boolean>> checkProfileStatus(Authentication auth) {
        boolean complete = profileService.isProfileComplete(auth.getName());
        return ResponseEntity.ok(Map.of("profileComplete", complete));
    }

    // ── Staff endpoints ───────────────────────────────────────────────────────

    @GetMapping("/api/admin/students")
    public ResponseEntity<Page<StudentProfileResponse>> getStudentList(
            Authentication auth,
            @RequestParam(required = false) Long blockId,
            @RequestParam(required = false) String roomNumber,
            @RequestParam(required = false) String name,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
                profileService.getStudentList(auth.getName(), blockId, roomNumber, name, page, size));
    }

    @GetMapping("/api/admin/students/{userId}/profile")
    public ResponseEntity<StudentProfileResponse> getStudentProfile(
            @PathVariable Long userId, Authentication auth) {
        return ResponseEntity.ok(profileService.getStudentProfileByStaff(userId, auth.getName()));
    }

    @PutMapping("/api/admin/students/{userId}/profile")
    public ResponseEntity<StudentProfileResponse> updateStudentProfile(
            @PathVariable Long userId,
            @RequestBody StudentProfileUpdateRequest request,
            Authentication auth) {
        return ResponseEntity.ok(
                profileService.updateProfileByStaff(userId, request, auth.getName()));
    }

    @GetMapping("/api/admin/students/vacancies")
    public ResponseEntity<List<VacancyResponse>> getVacancies(
            @RequestParam Long blockId,
            Authentication auth) {
        return ResponseEntity.ok(profileService.getVacancyList(auth.getName(), blockId));
    }

    @GetMapping("/api/admin/students/export/csv")
    public ResponseEntity<byte[]> exportCsv(
            Authentication auth,
            @RequestParam(required = false) Long blockId,
            @RequestParam(required = false) String roomNumber,
            @RequestParam(required = false) String name) {
        byte[] csv = profileService.exportAsCsv(auth.getName(), blockId, roomNumber, name);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"students.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @GetMapping("/api/admin/students/export/pdf")
    public ResponseEntity<byte[]> exportPdf(
            Authentication auth,
            @RequestParam(required = false) Long blockId,
            @RequestParam(required = false) String roomNumber,
            @RequestParam(required = false) String name) {
        byte[] pdf = profileService.exportAsPdf(auth.getName(), blockId, roomNumber, name);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"students.pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}