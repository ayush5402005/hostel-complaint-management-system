package com.hostel.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "notices",
    indexes = {
        @Index(name = "idx_notice_created_at", columnList = "createdAt"),  // ✅ sort by date
        @Index(name = "idx_notice_deleted",    columnList = "deleted")     // ✅ filter deleted
    }
)
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Notice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column
    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "posted_by", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User postedBy;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    // ✅ NEW — soft delete flag
    @Builder.Default
    @Column(nullable = false)
    private boolean deleted = false;

    // ✅ NEW — when was it deleted
    private LocalDateTime deletedAt;
}
