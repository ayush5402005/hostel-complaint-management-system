package com.hostel.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.hostel.backend.enums.Role;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "users",
    indexes = {
        @Index(name = "idx_user_email",         columnList = "email"),
        @Index(name = "idx_user_role",           columnList = "role"),
        @Index(name = "idx_user_active",         columnList = "active"),
        @Index(name = "idx_user_scholar_number", columnList = "scholarNumber")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false, unique = true)
    private String phoneNumber;

    @Column(unique = true)
    private String scholarNumber;

    // ── Student fields ─────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hostel_id")
    private Hostel hostel;                // student's hostel

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "block_id")
    private Block block;                  // student's block

    @Column
    private String roomNumber;

    // ── Warden / Caretaker scope ───────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_hostel_id")
    private Hostel assignedHostel;        // sees all complaints in this hostel

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_block_id")
    private Block assignedBlock;          // sees only this block's complaints

    // ── Worker department ──────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;        // worker's department for categorization

    // ── Common ─────────────────────────────────────────
    @Builder.Default
    @Column(nullable = false)
    private boolean appEnabled = true;    // false = offline worker

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;
}
