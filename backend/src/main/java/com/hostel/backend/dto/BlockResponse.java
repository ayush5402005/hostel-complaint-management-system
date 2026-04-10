package com.hostel.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BlockResponse {
    private Long id;
    private String name;
}
