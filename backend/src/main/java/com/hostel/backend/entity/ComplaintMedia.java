package com.hostel.backend.entity;

import com.hostel.backend.enums.MediaUploadedBy;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "complaint_media",
    indexes = {
        @Index(name = "idx_media_complaint_id",  columnList = "complaint_id"),
        @Index(name = "idx_media_uploaded_by",   columnList = "uploadedBy")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id", nullable = false)
    private Complaint complaint;

    @Column(nullable = false, length = 500)
    private String mediaUrl;               // Cloudinary URL

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MediaUploadedBy uploadedBy;    // STUDENT or WORKER

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}