package com.hostel.backend.dto;

import lombok.Data;

@Data
public class UpdateUserRequest {
    private String name;
    private String phoneNumber;
    private String department;
    private String hostelBlock;
    private String roomNumber;
}
