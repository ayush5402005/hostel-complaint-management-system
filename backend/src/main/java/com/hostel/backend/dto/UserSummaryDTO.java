package com.hostel.backend.dto;

import com.hostel.backend.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryDTO {
    private Long id;
    private String name;
    private String email;
    private Role role;
    private String phoneNumber;
    private String hostelBlock;
    private String roomNumber;
    private String department;
    // ✅ NEW — for student profile display
    private String scholarNumber;
}
