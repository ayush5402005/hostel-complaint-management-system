package com.hostel.backend.repository;

import com.hostel.backend.entity.Complaint;
import com.hostel.backend.entity.User;
import com.hostel.backend.enums.ComplaintStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    // For STUDENT — get their own complaints
    Page<Complaint> findByStudent(User student, Pageable pageable);

    // For STUDENT — filter by status
    Page<Complaint> findByStatusAndStudent(ComplaintStatus status, User student, Pageable pageable);

    // For WORKER — get assigned complaints
    Page<Complaint> findByAssignedWorker(User worker, Pageable pageable);

    // For WARDEN/CARETAKER — filter all by status
    Page<Complaint> findByStatus(ComplaintStatus status, Pageable pageable);

    // For dashboard stats
    long countByStatus(ComplaintStatus status);

    // For student — count their complaints by status
    long countByStudentAndStatus(User student, ComplaintStatus status);
}
