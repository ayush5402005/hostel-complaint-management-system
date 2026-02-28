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

    // For STUDENT — get their own complaints
    Page<Complaint> findByStudent(User student, Pageable pageable);

    // For STUDENT — filter by status
    Page<Complaint> findByStatusAndStudent(ComplaintStatus status, User student, Pageable pageable);

    // For WORKER — get assigned complaints
    Page<Complaint> findByAssignedWorker(User worker, Pageable pageable);

    // ✅ NEW — For WORKER — filter assigned complaints by status
    Page<Complaint> findByAssignedWorkerAndStatus(User worker, ComplaintStatus status, Pageable pageable);

    // For WARDEN/CARETAKER — filter all by status
    Page<Complaint> findByStatus(ComplaintStatus status, Pageable pageable);

    // For dashboard stats
    long countByStatus(ComplaintStatus status);

    // For student — count their complaints by status
    long countByStudentAndStatus(User student, ComplaintStatus status);

    // ✅ NEW — For student dashboard total count
    long countByStudent(User student);

    // ✅ NEW — For worker dashboard stats
    long countByAssignedWorkerAndStatus(User worker, ComplaintStatus status);

    // ✅ NEW — For dashboard stats list (no pagination needed for stats)
    List<Complaint> findByStudent(User student);
}
