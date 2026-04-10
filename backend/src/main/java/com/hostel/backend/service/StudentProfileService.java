package com.hostel.backend.service;

import com.hostel.backend.dto.*;
import com.hostel.backend.entity.StudentProfile;
import com.hostel.backend.entity.User;
import com.hostel.backend.enums.Role;
import com.hostel.backend.exception.ResourceNotFoundException;
import com.hostel.backend.exception.UnauthorizedException;
import com.hostel.backend.repository.StudentProfileRepository;
import com.hostel.backend.repository.UserRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StudentProfileService {

    private final StudentProfileRepository profileRepository;
    private final UserRepository           userRepository;

    public StudentProfileService(StudentProfileRepository profileRepository,
                                 UserRepository userRepository) {
        this.profileRepository = profileRepository;
        this.userRepository    = userRepository;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    private boolean isStaff(Role role) {
        return role == Role.ADMIN || role == Role.WARDEN || role == Role.CARETAKER;
    }

    private StudentProfileResponse toResponse(StudentProfile p) {
        User u = p.getUser();
        return StudentProfileResponse.builder()
                .id(p.getId())
                .userId(u.getId())
                .studentName(u.getName())
                .email(u.getEmail())
                .phoneNumber(u.getPhoneNumber())
                .scholarNumber(u.getScholarNumber())
                .hostelName(u.getHostel() != null ? u.getHostel().getName() : null)
                .blockName(u.getBlock()  != null ? u.getBlock().getName()  : null)
                .roomNumber(u.getRoomNumber())
                .hostelFeeUtr(p.getHostelFeeUtr())
                .hostelFeeAmount(p.getHostelFeeAmount())
                .hostelFeeScreenshotUrl(p.getHostelFeeScreenshotUrl())
                .messFeeUtr(p.getMessFeeUtr())
                .messFeeAmount(p.getMessFeeAmount())
                .messFeeScreenshotUrl(p.getMessFeeScreenshotUrl())
                .parentContact(p.getParentContact())
                .homeAddress(p.getHomeAddress())
                .profilePhotoUrl(p.getProfilePhotoUrl())
                .profileComplete(p.isProfileComplete())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    // ─── Student: Submit Profile ──────────────────────────────────────────────

    @Transactional
    public StudentProfileResponse submitProfile(String email, StudentProfileRequest request) {
        User student = getUser(email);
        if (student.getRole() != Role.STUDENT) {
            throw new UnauthorizedException("Only students can submit profile");
        }

        // If already submitted, block re-entry
        if (profileRepository.existsByUserId(student.getId())) {
            StudentProfile existing = profileRepository.findByUserId(student.getId()).get();
            if (existing.isProfileComplete()) {
                throw new RuntimeException(
                    "Profile already submitted. Contact warden/caretaker to update UTR details.");
            }
        }

        // Check UTR uniqueness
        if (profileRepository.existsByHostelFeeUtr(request.getHostelFeeUtr())) {
            throw new RuntimeException(
                "Hostel fee UTR already registered. Contact warden if this is an error.");
        }
        if (profileRepository.existsByMessFeeUtr(request.getMessFeeUtr())) {
            throw new RuntimeException(
                "Mess fee UTR already registered. Contact warden if this is an error.");
        }
        if (request.getHostelFeeUtr().equals(request.getMessFeeUtr())) {
            throw new RuntimeException(
                "Hostel fee UTR and Mess fee UTR cannot be the same.");
        }

        StudentProfile profile = StudentProfile.builder()
                .user(student)
                .hostelFeeUtr(request.getHostelFeeUtr().trim())
                .hostelFeeAmount(request.getHostelFeeAmount())
                .hostelFeeScreenshotUrl(request.getHostelFeeScreenshotUrl())
                .messFeeUtr(request.getMessFeeUtr().trim())
                .messFeeAmount(request.getMessFeeAmount())
                .messFeeScreenshotUrl(request.getMessFeeScreenshotUrl())
                .parentContact(request.getParentContact().trim())
                .homeAddress(request.getHomeAddress().trim())
                .profilePhotoUrl(request.getProfilePhotoUrl())
                .profileComplete(true)
                .build();

        return toResponse(profileRepository.save(profile));
    }

    // ─── Student: Get Own Profile ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public StudentProfileResponse getMyProfile(String email) {
        User student = getUser(email);
        StudentProfile profile = profileRepository.findByUserId(student.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Profile not found. Please complete your profile."));
        return toResponse(profile);
    }

    // ─── Check Profile Completion ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public boolean isProfileComplete(String email) {
        User student = getUser(email);
        return profileRepository.findByUserId(student.getId())
                .map(StudentProfile::isProfileComplete)
                .orElse(false);
    }

    // ─── Staff: Update Any Field ──────────────────────────────────────────────

    @Transactional
    public StudentProfileResponse updateProfileByStaff(Long userId,
                                                        StudentProfileUpdateRequest request,
                                                        String staffEmail) {
        User staff = getUser(staffEmail);
        if (!isStaff(staff.getRole())) {
            throw new UnauthorizedException("Only warden/caretaker/admin can update student profiles");
        }

        User student = getUserById(userId);
        if (student.getRole() != Role.STUDENT) {
            throw new RuntimeException("User is not a student");
        }

        StudentProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for student"));

        // Check UTR uniqueness only if changing
        if (request.getHostelFeeUtr() != null
                && !request.getHostelFeeUtr().equals(profile.getHostelFeeUtr())
                && profileRepository.existsByHostelFeeUtrAndUserIdNot(
                        request.getHostelFeeUtr(), userId)) {
            throw new RuntimeException("Hostel UTR already in use by another student");
        }
        if (request.getMessFeeUtr() != null
                && !request.getMessFeeUtr().equals(profile.getMessFeeUtr())
                && profileRepository.existsByMessFeeUtrAndUserIdNot(
                        request.getMessFeeUtr(), userId)) {
            throw new RuntimeException("Mess UTR already in use by another student");
        }

        if (request.getHostelFeeUtr()          != null) profile.setHostelFeeUtr(request.getHostelFeeUtr().trim());
        if (request.getHostelFeeAmount()        != null) profile.setHostelFeeAmount(request.getHostelFeeAmount());
        if (request.getHostelFeeScreenshotUrl() != null) profile.setHostelFeeScreenshotUrl(request.getHostelFeeScreenshotUrl());
        if (request.getMessFeeUtr()             != null) profile.setMessFeeUtr(request.getMessFeeUtr().trim());
        if (request.getMessFeeAmount()          != null) profile.setMessFeeAmount(request.getMessFeeAmount());
        if (request.getMessFeeScreenshotUrl()   != null) profile.setMessFeeScreenshotUrl(request.getMessFeeScreenshotUrl());
        if (request.getParentContact()          != null) profile.setParentContact(request.getParentContact().trim());
        if (request.getHomeAddress()            != null) profile.setHomeAddress(request.getHomeAddress().trim());
        if (request.getProfilePhotoUrl()        != null) profile.setProfilePhotoUrl(request.getProfilePhotoUrl());

        return toResponse(profileRepository.save(profile));
    }

    // ─── Staff: Get Student Profile by ID ────────────────────────────────────

    @Transactional(readOnly = true)
    public StudentProfileResponse getStudentProfileByStaff(Long userId, String staffEmail) {
        User staff = getUser(staffEmail);
        if (!isStaff(staff.getRole())) throw new UnauthorizedException("Access denied");

        StudentProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));
        return toResponse(profile);
    }

    // ─── Staff: Student List with Filters ────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<StudentProfileResponse> getStudentList(String staffEmail,
                                                        Long blockId,
                                                        String roomNumber,
                                                        String name,
                                                        int page, int size) {
        User staff = getUser(staffEmail);
        if (!isStaff(staff.getRole())) throw new UnauthorizedException("Access denied");

        Pageable pageable = PageRequest.of(page, size, Sort.by("name"));
        Page<User> students = userRepository.findStudentsWithFilters(
                blockId, roomNumber, name, pageable);

        return students.map(u -> {
            StudentProfile profile = profileRepository.findByUserId(u.getId()).orElse(null);
            if (profile != null) return toResponse(profile);
            // Partial response if profile not yet submitted
            return StudentProfileResponse.builder()
                    .userId(u.getId())
                    .studentName(u.getName())
                    .email(u.getEmail())
                    .phoneNumber(u.getPhoneNumber())
                    .scholarNumber(u.getScholarNumber())
                    .hostelName(u.getHostel() != null ? u.getHostel().getName() : null)
                    .blockName(u.getBlock()  != null ? u.getBlock().getName()  : null)
                    .roomNumber(u.getRoomNumber())
                    .profileComplete(false)
                    .build();
        });
    }

    // ─── Staff: Vacancy List ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<VacancyResponse> getVacancyList(String staffEmail, Long blockId) {
        User staff = getUser(staffEmail);
        if (!isStaff(staff.getRole())) throw new UnauthorizedException("Access denied");

        List<Object[]> rows = userRepository.findVacantRooms(blockId);
        return rows.stream()
                .map(row -> {
                    String roomNumber = (String) row[0];
                    long   occupancy  = ((Number) row[1]).longValue();
                    return VacancyResponse.builder()
                            .roomNumber(roomNumber)
                            .occupiedSeats(occupancy)        // ✅ FIXED (was .occupancy())
                            .vacantSeats(2 - occupancy)
                            .build();
                })
                .collect(Collectors.toList());
    }

    // ─── CSV Export ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public byte[] exportAsCsv(String staffEmail, Long blockId, String roomNumber, String name) {
        User staff = getUser(staffEmail);
        if (!isStaff(staff.getRole())) throw new UnauthorizedException("Access denied");

        List<User> students = userRepository.findStudentsWithFiltersNoPaging(
                blockId, roomNumber, name);

        StringBuilder csv = new StringBuilder();
        csv.append("Name,Email,Phone,Scholar No,Hostel,Block,Room," +
                   "Hostel UTR,Hostel Fee,Mess UTR,Mess Fee," +
                   "Parent Contact,Home Address,Profile Complete\n");

        for (User u : students) {
            StudentProfile p = profileRepository.findByUserId(u.getId()).orElse(null);
            csv.append(escapeCsv(u.getName())).append(",")
               .append(escapeCsv(u.getEmail())).append(",")
               .append(escapeCsv(u.getPhoneNumber())).append(",")
               .append(escapeCsv(u.getScholarNumber())).append(",")
               .append(escapeCsv(u.getHostel() != null ? u.getHostel().getName() : "")).append(",")
               .append(escapeCsv(u.getBlock()  != null ? u.getBlock().getName()  : "")).append(",")
               .append(escapeCsv(u.getRoomNumber())).append(",")
               .append(p != null ? escapeCsv(p.getHostelFeeUtr())  : "").append(",")
               .append(p != null && p.getHostelFeeAmount() != null
                       ? p.getHostelFeeAmount() : "").append(",")
               .append(p != null ? escapeCsv(p.getMessFeeUtr())    : "").append(",")
               .append(p != null && p.getMessFeeAmount() != null
                       ? p.getMessFeeAmount() : "").append(",")
               .append(p != null ? escapeCsv(p.getParentContact()) : "").append(",")
               .append(p != null ? escapeCsv(p.getHomeAddress())   : "").append(",")
               .append(p != null && p.isProfileComplete() ? "Yes" : "No").append("\n");
        }

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    // ─── PDF Export ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public byte[] exportAsPdf(String staffEmail, Long blockId, String roomNumber, String name) {
        User staff = getUser(staffEmail);
        if (!isStaff(staff.getRole())) throw new UnauthorizedException("Access denied");

        List<User> students = userRepository.findStudentsWithFiltersNoPaging(
                blockId, roomNumber, name);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4.rotate());
            PdfWriter.getInstance(doc, baos);
            doc.open();

            Font titleFont  = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8);
            Font cellFont   = FontFactory.getFont(FontFactory.HELVETICA, 7);

            doc.add(new Paragraph("Student List", titleFont));
            doc.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(10);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{2f, 2.5f, 1.5f, 1.5f, 1.2f, 1f, 2f, 1.5f, 2f, 1.5f});

            String[] headers = {"Name", "Email", "Phone", "Scholar No",
                                "Block", "Room", "Hostel UTR", "Hostel Fee",
                                "Parent Contact", "Profile"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
                cell.setBackgroundColor(new java.awt.Color(200, 220, 240));
                cell.setPadding(4);
                table.addCell(cell);
            }

            for (User u : students) {
                StudentProfile p = profileRepository.findByUserId(u.getId()).orElse(null);
                table.addCell(new Phrase(safe(u.getName()), cellFont));
                table.addCell(new Phrase(safe(u.getEmail()), cellFont));
                table.addCell(new Phrase(safe(u.getPhoneNumber()), cellFont));
                table.addCell(new Phrase(safe(u.getScholarNumber()), cellFont));
                table.addCell(new Phrase(u.getBlock() != null ? u.getBlock().getName() : "", cellFont));
                table.addCell(new Phrase(safe(u.getRoomNumber()), cellFont));
                table.addCell(new Phrase(p != null ? safe(p.getHostelFeeUtr()) : "", cellFont));
                table.addCell(new Phrase(p != null && p.getHostelFeeAmount() != null
                        ? String.valueOf(p.getHostelFeeAmount()) : "", cellFont));
                table.addCell(new Phrase(p != null ? safe(p.getParentContact()) : "", cellFont));
                table.addCell(new Phrase(p != null && p.isProfileComplete()
                        ? "✓" : "Pending", cellFont));
            }

            doc.add(table);
            doc.close();
            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("PDF generation failed: " + e.getMessage());
        }
    }

    private String safe(String value) {
        return value != null ? value : "";
    }
}