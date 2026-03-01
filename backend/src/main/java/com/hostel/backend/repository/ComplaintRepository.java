package com.hostel.backend.repository;

import com.hostel.backend.entity.Complaint;
import com.hostel.backend.entity.User;
import com.hostel.backend.enums.ComplaintStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
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
    long countByAssignedWorkerAndStatus(User worker, ComplaintStatus status);

    List<Complaint> findByStudent(User student);
    List<Complaint> findByStatusIn(List<ComplaintStatus> statuses);

    // ✅ NEW — for calculating worker average rating
    List<Complaint> findByAssignedWorkerAndStatusAndRatingIsNotNull(User worker, ComplaintStatus status);
}
