package com.hostel.backend.entity;

import com.hostel.backend.enums.Role;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ================= BASIC INFO =================

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false, unique = true)
    private String phoneNumber;

    // ================= STUDENT SPECIFIC =================

    @Column(unique = true)
    private String scholarNumber;  // Only for STUDENT

    private String hostelBlock;    // Only for STUDENT

    private String roomNumber;     // NOT unique (2 students per room)

    // ================= STAFF SPECIFIC =================

    private String department;     // Only required for WORKER
}