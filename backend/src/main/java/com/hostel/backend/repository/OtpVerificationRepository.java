package com.hostel.backend.repository;

import com.hostel.backend.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {
    Optional<OtpVerification> findByEmailAndUsedFalse(String email);
    void deleteByEmail(String email);
}
