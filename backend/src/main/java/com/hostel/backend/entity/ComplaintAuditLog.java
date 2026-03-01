package com.hostel.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "complaint_audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long complaintId;

    @Column(nullable = false)
    private String changedByName;

    @Column(nullable = false)
    private String changedByRole;

    private String fromStatus;
    private String toStatus;

    @Column(length = 500)
    private String note;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime changedAt;
}
