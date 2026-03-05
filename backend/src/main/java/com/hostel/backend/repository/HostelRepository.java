// HostelRepository.java
package com.hostel.backend.repository;
import com.hostel.backend.entity.Hostel;
import org.springframework.data.jpa.repository.JpaRepository;
public interface HostelRepository extends JpaRepository<Hostel, Long> {
    boolean existsByCode(String code);
}
