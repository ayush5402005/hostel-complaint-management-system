package com.hostel.backend.repository;

import com.hostel.backend.entity.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {

    Optional<StudentProfile> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    boolean existsByHostelFeeUtrAndUserIdNot(String utr, Long userId);

    boolean existsByMessFeeUtrAndUserIdNot(String utr, Long userId);

    boolean existsByHostelFeeUtr(String utr);
// Add this one line to fix the N+1 in CSV/PDF export:
List<StudentProfile> findByUserIdIn(List<Long> userIds);
    boolean existsByMessFeeUtr(String utr);
}