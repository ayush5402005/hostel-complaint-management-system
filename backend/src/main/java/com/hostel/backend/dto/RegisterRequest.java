package com.hostel.backend.dto;

import com.hostel.backend.enums.Role;
import lombok.Data;

@Data
public class RegisterRequest {

    private String name;
    private String email;
    private String password;
    private Role role;
    private String phoneNumber;

    // ── Student fields ─────────────────────────────────
    private String scholarNumber;
    private String roomNumber;
    private Long hostelId;   // FK to hostels table
    private Long blockId;    // FK to blocks table

    // ── Staff fields ───────────────────────────────────
    private Long departmentId; // worker's department
}
