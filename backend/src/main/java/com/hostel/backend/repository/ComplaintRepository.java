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

    Page<Complaint> findByStudent(User student, Pageable pageable);
    Page<Complaint> findByStatusAndStudent(ComplaintStatus status, User student, Pageable pageable);
    Page<Complaint> findByAssignedWorker(User worker, Pageable pageable);
    Page<Complaint> findByAssignedWorkerAndStatus(User worker, ComplaintStatus status, Pageable pageable);
    Page<Complaint> findByStatus(ComplaintStatus status, Pageable pageable);

    long countByStatus(ComplaintStatus status);
    long countByStudentAndStatus(User student, ComplaintStatus status);
    long countByStudent(User student);

    // ✅ Only ONE definition here — removed duplicate
    long countByAssignedWorkerAndStatus(User worker, ComplaintStatus status);

    List<Complaint> findByStudent(User student);
    List<Complaint> findByStatusIn(List<ComplaintStatus> statuses);

    // ✅ Average rating for a worker
    @Query("SELECT AVG(c.rating) FROM Complaint c WHERE c.assignedWorker = :worker AND c.rating IS NOT NULL")
    Double findAverageRatingByWorker(@Param("worker") User worker);
}
