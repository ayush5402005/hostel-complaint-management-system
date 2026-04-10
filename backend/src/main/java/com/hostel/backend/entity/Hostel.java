package com.hostel.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "hostels")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Hostel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, unique = true)
    private String code;

    @OneToMany(mappedBy = "hostel", cascade = CascadeType.ALL)
    @JsonIgnore   // ← ADD THIS
    private List<Block> blocks;
}
