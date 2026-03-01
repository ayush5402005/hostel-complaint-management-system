package com.hostel.backend.repository;

import com.hostel.backend.entity.ComplaintRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface ComplaintRatingRepository extends JpaRepository<ComplaintRating, Long> {

    Optional<ComplaintRating> findByComplaintId(Long complaintId);

    List<ComplaintRating> findByWorkerId(Long workerId);

    boolean existsByComplaintId(Long complaintId);

    @Query("SELECT AVG(r.rating) FROM ComplaintRating r WHERE r.workerId = :workerId")
    Double getAverageRatingByWorkerId(Long workerId);

    @Query("SELECT COUNT(r) FROM ComplaintRating r WHERE r.workerId = :workerId")
    Long getRatingCountByWorkerId(Long workerId);
}
