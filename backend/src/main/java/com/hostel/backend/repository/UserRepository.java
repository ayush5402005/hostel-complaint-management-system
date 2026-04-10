package com.hostel.backend.repository;

import com.hostel.backend.entity.User;
import com.hostel.backend.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // ── Auth & lookup ─────────────────────────────────────────────────────────
    Optional<User> findByEmail(String email);
    Optional<User> findByPhoneNumber(String phoneNumber);
    boolean existsByEmail(String email);
    boolean existsByPhoneNumber(String phoneNumber);

    // ── Role-based queries ────────────────────────────────────────────────────
    List<User> findByRole(Role role);
    List<User> findByRoleIn(List<Role> roles);
    List<User> findAllByOrderByRoleAscNameAsc();

    // ── Room capacity check (registration + vacancy) ──────────────────────────
    long countByBlockIdAndRoomNumberAndActiveTrue(Long blockId, String roomNumber);

    // ── Simple filter queries ─────────────────────────────────────────────────
    List<User> findByRoleAndBlockIdAndActiveTrue(Role role, Long blockId);
    List<User> findByRoleAndHostelIdAndActiveTrue(Role role, Long hostelId);
    List<User> findByRoleAndBlockIdAndRoomNumberAndActiveTrue(
            Role role, Long blockId, String roomNumber);
    List<User> findByRoleAndBlockIdAndActiveTrueAndNameContainingIgnoreCase(
            Role role, Long blockId, String name);
    List<User> findByRoleAndActiveTrueAndNameContainingIgnoreCase(
            Role role, String name);
    List<User> findByRoleAndActiveTrueOrderByBlockIdAscRoomNumberAsc(Role role);

    // ── Feature #10: Dynamic filtered student list (PAGINATED) ───────────────
    // All params nullable — pass null to skip that filter
    @Query("SELECT u FROM User u WHERE u.role = 'STUDENT' AND u.active = true " +
           "AND (:blockId IS NULL OR u.block.id = :blockId) " +
           "AND (:roomNumber IS NULL OR u.roomNumber = :roomNumber) " +
           "AND (:name IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%', :name, '%')))")
    Page<User> findStudentsWithFilters(
            @Param("blockId")     Long blockId,
            @Param("roomNumber")  String roomNumber,
            @Param("name")        String name,
            Pageable pageable);

    // ── Feature #10: Dynamic filtered student list (NO PAGING — for CSV/PDF) ──
    @Query("SELECT u FROM User u WHERE u.role = 'STUDENT' AND u.active = true " +
           "AND (:blockId IS NULL OR u.block.id = :blockId) " +
           "AND (:roomNumber IS NULL OR u.roomNumber = :roomNumber) " +
           "AND (:name IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%', :name, '%'))) " +
           "ORDER BY u.block.id ASC, u.roomNumber ASC, u.name ASC")
    List<User> findStudentsWithFiltersNoPaging(
            @Param("blockId")     Long blockId,
            @Param("roomNumber")  String roomNumber,
            @Param("name")        String name);

    // ── Feature #10: Vacancy list — only rooms with < 2 students ─────────────
    // Returns [roomNumber, occupancyCount] for rooms that still have space
    @Query("SELECT u.roomNumber, COUNT(u) FROM User u " +
           "WHERE u.block.id = :blockId AND u.active = true " +
           "GROUP BY u.roomNumber " +
           "HAVING COUNT(u) < 2 " +
           "ORDER BY u.roomNumber ASC")
    List<Object[]> findVacantRooms(@Param("blockId") Long blockId);

    // ── Feature #10: All room occupancy (for full room status view) ───────────
    @Query("SELECT u.roomNumber, COUNT(u) FROM User u " +
           "WHERE u.block.id = :blockId AND u.active = true " +
           "GROUP BY u.roomNumber " +
           "ORDER BY u.roomNumber ASC")
    List<Object[]> findRoomOccupancyByBlock(@Param("blockId") Long blockId);

    // ── Feature #9: Find students missing profile submission ──────────────────
    @Query("SELECT u FROM User u WHERE u.role = 'STUDENT' " +
           "AND u.active = true " +
           "AND NOT EXISTS (SELECT sp FROM StudentProfile sp WHERE sp.user = u)")
    List<User> findStudentsWithoutProfile();
}