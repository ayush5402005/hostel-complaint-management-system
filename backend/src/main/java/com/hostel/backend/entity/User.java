package com.hostel.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.hostel.backend.enums.Role;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "users",
    indexes = {
        @Index(name = "idx_user_email",         columnList = "email"),        // ✅ login lookup
        @Index(name = "idx_user_role",           columnList = "role"),         // ✅ filter by role
        @Index(name = "idx_user_active",         columnList = "active"),       // ✅ active users filter
        @Index(name = "idx_user_scholar_number", columnList = "scholarNumber") // ✅ student lookup
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

    private String hostelBlock;
    private String roomNumber;
    private String department;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;
}
