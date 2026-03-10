package com.hostel.backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {
    private Long id;
    private String message;
    private String userName;
    private String userRole;
    private Long userId;
    private LocalDateTime createdAt;
}
