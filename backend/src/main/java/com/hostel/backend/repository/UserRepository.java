package com.hostel.backend.repository;

import com.hostel.backend.entity.User;
import com.hostel.backend.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByRole(Role role);
    List<User> findByRoleIn(List<Role> roles);                        // ✅ NEW
    List<User> findAllByOrderByRoleAscNameAsc();                      // ✅ NEW
    boolean existsByEmail(String email);                              // ✅ NEW
    boolean existsByPhoneNumber(String phoneNumber);                  // ✅ NEW
}
