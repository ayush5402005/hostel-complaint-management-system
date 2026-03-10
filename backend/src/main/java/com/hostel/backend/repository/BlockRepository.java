package com.hostel.backend.repository;

import com.hostel.backend.entity.Block;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BlockRepository extends JpaRepository<Block, Long> {
    List<Block> findByHostelId(Long hostelId);
}
