package com.hostel.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class HostelResponse {
    private Long id;
    private String name;
    private String code;
}
