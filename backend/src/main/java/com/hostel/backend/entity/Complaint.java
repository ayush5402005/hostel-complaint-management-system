package com.hostel.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.hostel.backend.enums.*;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
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
        @Index(name = "idx_complaint_hostel_id",      columnList = "hostel_id"),
        @Index(name = "idx_complaint_block_id",       columnList = "block_id")
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ComplaintPriority priority = ComplaintPriority.LOW;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ComplaintStatus status = ComplaintStatus.CREATED;

    // ── OLD single-photo columns removed ──────────────────────────────────
    // issuePhotoUrl    → now in complaint_media (uploadedBy = STUDENT)
    // resolvedPhotoUrl → now in complaint_media (uploadedBy = WORKER)

    @Column(length = 500)
    private String rejectionReason;

    // ── Student review (after resolution) ─────────────────────────────────
    @Column
    private Integer rating;             // 1–5 stars

    @Column(length = 1000)
    private String reviewText;          // ✅ written review by student

    // ── Dispute fields (when student flags as still unresolved) ───────────
    @Column(length = 500)
    private String disputeReason;       // ✅ why student says it's not resolved

    private LocalDateTime disputedAt;   // ✅ when student raised the dispute

    // ── SLA / escalation ──────────────────────────────────────────────────
    @Column(nullable = false)
    @Builder.Default
    private boolean isOverdue = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean isEscalated = false;

    private LocalDateTime lastSlaNotifiedAt;

    // ── Availability slots ────────────────────────────────────────────────
    @Column(length = 20)  private String slot1Day;
    @Column(length = 100) private String slot1Time;
    @Column(length = 20)  private String slot2Day;
    @Column(length = 100) private String slot2Time;
    @Column(length = 20)  private String slot3Day;
    @Column(length = 100) private String slot3Time;

    // ── Relationships ──────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User assignedWorker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hostel_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Hostel hostel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "block_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Block block;

    // ✅ NEW — replaces issuePhotoUrl & resolvedPhotoUrl
    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL,
               orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ComplaintMedia> mediaFiles = new ArrayList<>();

    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private List<ComplaintComment> comments;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}