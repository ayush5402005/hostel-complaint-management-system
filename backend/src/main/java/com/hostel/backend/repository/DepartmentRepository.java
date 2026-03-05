// DepartmentRepository.java
package com.hostel.backend.repository;
import com.hostel.backend.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    List<Department> findByActiveTrue();
}
