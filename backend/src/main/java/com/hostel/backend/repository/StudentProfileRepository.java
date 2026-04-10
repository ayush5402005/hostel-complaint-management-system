package com.hostel.backend.repository;

import com.hostel.backend.entity.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {

    Optional<StudentProfile> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    boolean existsByHostelFeeUtrAndUserIdNot(String utr, Long userId);

    boolean existsByMessFeeUtrAndUserIdNot(String utr, Long userId);

    boolean existsByHostelFeeUtr(String utr);

    boolean existsByMessFeeUtr(String utr);
}