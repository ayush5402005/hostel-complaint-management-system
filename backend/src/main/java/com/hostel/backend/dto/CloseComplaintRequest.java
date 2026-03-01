package com.hostel.backend.dto;

import lombok.Data;

@Data
public class CloseComplaintRequest {
    private Integer rating; // 1–5, optional
}
