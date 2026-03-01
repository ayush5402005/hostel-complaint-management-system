package com.hostel.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.hostel.backend.enums.Role;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder                      // ✅ NEW
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

    // ✅ NEW — soft delete / deactivate
    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;
    
}
