package com.hostel.backend.repository;

import com.hostel.backend.entity.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface NoticeRepository extends JpaRepository<Notice, Long> {

    // ✅ Only fetch non-deleted notices
    List<Notice> findByDeletedFalseOrderByCreatedAtDesc();

    // ✅ Find non-deleted by id
    Optional<Notice> findByIdAndDeletedFalse(Long id);
}
