package com.hostel.backend.repository;

import com.hostel.backend.entity.Complaint;
import com.hostel.backend.entity.User;
import com.hostel.backend.enums.ComplaintStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

   Page<Complaint> findByStudent(User student, Pageable pageable);

Page<Complaint> findByAssignedWorker(User worker, Pageable pageable);

Page<Complaint> findByStatus(ComplaintStatus status, Pageable pageable);

Page<Complaint> findByStatusAndStudent(ComplaintStatus status,
                                       User student,
                                       Pageable pageable);
                                    long countByStatus(ComplaintStatus status);
                                }