package com.hostel.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "complaint_ratings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintRating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long complaintId;

    @Column(nullable = false)
    private Long workerId;

    @Column(nullable = false)
    private Long studentId;

    @Column(nullable = false)
    private int rating; // 1 to 5

    @Column(length = 300)
    private String comment;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
