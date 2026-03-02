package com.hostel.backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class NoticeResponse {
    private Long          id;
    private String        title;
    private String        content;
    private String        imageUrl;      // ✅ NEW
    private String        postedByName;
    private String        postedByRole;
    private LocalDateTime createdAt;
}
