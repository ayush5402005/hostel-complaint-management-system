package com.hostel.backend.dto;

import com.hostel.backend.enums.Role;
import lombok.Data;

@Data
public class RegisterRequest {

    private String name;
    private String email;
    private String password;
    private Role role;

    private String phoneNumber;   // ✅ new

    // 👇 Student fields
    private String scholarNumber;
    private String hostelBlock;
    private String roomNumber;

    // 👇 Staff fields
    private String department;    // ✅ new
}