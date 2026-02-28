package com.hostel.backend.repository;

import com.hostel.backend.entity.Complaint;
import com.hostel.backend.entity.ComplaintComment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComplaintCommentRepository extends JpaRepository<ComplaintComment, Long> {
    List<ComplaintComment> findByComplaintOrderByCreatedAtAsc(Complaint complaint);
}
