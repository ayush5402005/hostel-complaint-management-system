package com.hostel.backend.repository;

import com.hostel.backend.entity.Complaint;
import com.hostel.backend.entity.User;
import com.hostel.backend.enums.ComplaintStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    // ── Student ───────────────────────────────────────────────────
    Page<Complaint> findByStudent(User student, Pageable pageable);
    Page<Complaint> findByStatusAndStudent(ComplaintStatus status, User student, Pageable pageable);
    List<Complaint> findByStudent(User student);

    long countByStudent(User student);
    long countByStudentAndStatus(User student, ComplaintStatus status);

    // ── Worker ────────────────────────────────────────────────────
    Page<Complaint> findByAssignedWorker(User worker, Pageable pageable);
    Page<Complaint> findByAssignedWorkerAndStatus(User worker, ComplaintStatus status, Pageable pageable);

    long countByAssignedWorkerAndStatus(User worker, ComplaintStatus status);

    @Query("SELECT AVG(c.rating) FROM Complaint c WHERE c.assignedWorker = :worker AND c.rating IS NOT NULL")
    Double findAverageRatingByWorker(@Param("worker") User worker);

    // ── Admin / Global ────────────────────────────────────────────
    Page<Complaint> findByStatus(ComplaintStatus status, Pageable pageable);

    long countByStatus(ComplaintStatus status);

    List<Complaint> findByStatusIn(List<ComplaintStatus> statuses);
}
