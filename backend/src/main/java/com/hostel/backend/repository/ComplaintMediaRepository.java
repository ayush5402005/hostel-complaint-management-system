package com.hostel.backend.repository;

import com.hostel.backend.entity.ComplaintMedia;
import com.hostel.backend.enums.MediaUploadedBy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintMediaRepository extends JpaRepository<ComplaintMedia, Long> {

    List<ComplaintMedia> findByComplaintId(Long complaintId);

    List<ComplaintMedia> findByComplaintIdAndUploadedBy(
            Long complaintId, MediaUploadedBy uploadedBy);

    // Used to enforce max 3 photos per uploader type
    long countByComplaintIdAndUploadedBy(
            Long complaintId, MediaUploadedBy uploadedBy);

    void deleteByComplaintId(Long complaintId);
}