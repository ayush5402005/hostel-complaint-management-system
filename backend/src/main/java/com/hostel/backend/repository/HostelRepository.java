package com.hostel.backend.repository;

import com.hostel.backend.entity.Hostel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HostelRepository extends JpaRepository<Hostel, Long> {
    boolean existsByCode(String code);
}
