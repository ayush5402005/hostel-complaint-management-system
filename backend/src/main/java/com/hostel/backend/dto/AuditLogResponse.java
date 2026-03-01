package com.hostel.backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {
    private Long id;
    private Long complaintId;
    private String changedByName;
    private String changedByRole;
    private String fromStatus;
    private String toStatus;
    private String note;
    private LocalDateTime changedAt;
}
