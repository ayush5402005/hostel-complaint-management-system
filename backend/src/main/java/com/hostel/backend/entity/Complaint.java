package com.hostel.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.hostel.backend.enums.*;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(
    name = "complaints",
    indexes = {
        @Index(name = "idx_complaint_student_id",     columnList = "student_id"),
        @Index(name = "idx_complaint_worker_id",      columnList = "worker_id"),
        @Index(name = "idx_complaint_status",         columnList = "status"),
        @Index(name = "idx_complaint_priority",       columnList = "priority"),
        @Index(name = "idx_complaint_created_at",     columnList = "createdAt"),
        @Index(name = "idx_complaint_student_status", columnList = "student_id,status"),
        @Index(name = "idx_complaint_hostel_id",      columnList = "hostel_id"),   // ✅ NEW
        @Index(name = "idx_complaint_block_id",       columnList = "block_id"),    // ✅ NEW
        @Index(name = "idx_complaint_pipeline",       columnList = "pipeline")     // ✅ NEW
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ComplaintCategory category;

    @Column(length = 200)
    private String subCategory;                    // ✅ NEW — e.g. "Tubelight not working"

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private ComplaintPipeline pipeline = ComplaintPipeline.HOSTEL; // ✅ NEW — set by caretaker

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ComplaintPriority priority = ComplaintPriority.LOW;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ComplaintStatus status = ComplaintStatus.CREATED;

    @Column(length = 500)
    private String issuePhotoUrl;

    @Column(length = 500)
    private String resolvedPhotoUrl;

    @Column(length = 500)
    private String rejectionReason;

    @Column
    private Integer rating;

    @Column(length = 1000)
    private String reviewText;                     // ✅ NEW — optional text review by student

    @Column(nullable = false)
    @Builder.Default
    private boolean isOverdue = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean isEscalated = false;

    private LocalDateTime lastSlaNotifiedAt;

    // ── Availability slots (optional, for room visits) ─────────────────────
    @Column(length = 20)
    private String slot1Day;                       // ✅ NEW — Today / Tomorrow / Day after

    @Column(length = 100)
    private String slot1Time;                      // ✅ NEW — e.g. "2:00 PM - 4:00 PM"

    @Column(length = 20)
    private String slot2Day;

    @Column(length = 100)
    private String slot2Time;

    @Column(length = 20)
    private String slot3Day;

    @Column(length = 100)
    private String slot3Time;

    // ── Relationships ───────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User assignedWorker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hostel_id")                // ✅ NEW — copied from student at creation
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Hostel hostel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "block_id")                 // ✅ NEW — copied from student at creation
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Block block;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")            // ✅ NEW — set when caretaker forwards to dept
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "forwarded_by_id")          // ✅ NEW — caretaker who forwarded
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User forwardedBy;

    @Column
    private LocalDateTime forwardedAt;             // ✅ NEW — when it was forwarded

    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private List<ComplaintComment> comments;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
