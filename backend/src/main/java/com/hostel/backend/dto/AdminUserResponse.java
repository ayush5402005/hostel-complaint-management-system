package com.hostel.backend.dto;

import com.hostel.backend.enums.Role;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserResponse {
    private Long id;
    private String name;
    private String email;
    private Role role;
    private String phoneNumber;
    private String scholarNumber;
    private String hostelBlock;
    private String roomNumber;
    private String department;
    private boolean active;

    // ✅ NEW — only populated for WORKER role
    private Double averageRating;
}
