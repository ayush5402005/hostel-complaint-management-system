package com.hostel.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VacancyResponse {
    private Long   blockId;
    private String blockName;
    private String roomNumber;
    private long   occupiedSeats;  // 0 or 1
    private long   vacantSeats;    // 1 or 2
}