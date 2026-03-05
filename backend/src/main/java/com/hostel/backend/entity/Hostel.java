package com.hostel.backend.entity;

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
    private String name;          // e.g. "Hostel 1", "Hostel 10 A-B"

    @Column(nullable = false, unique = true)
    private String code;          // e.g. "H1", "H10AB"

    @OneToMany(mappedBy = "hostel", cascade = CascadeType.ALL)
    private List<Block> blocks;
}
