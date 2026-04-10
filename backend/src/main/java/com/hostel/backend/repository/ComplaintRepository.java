package com.hostel.backend.repository;

import com.hostel.backend.entity.Complaint;
import com.hostel.backend.entity.Hostel;
import com.hostel.backend.entity.User;
import com.hostel.backend.enums.ComplaintCategory;
import com.hostel.backend.enums.ComplaintStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long>,
        JpaSpecificationExecutor<Complaint> {

    // ── Student ───────────────────────────────────────────────────────────────

    Page<Complaint> findByStudent(User student, Pageable pageable);
    Page<Complaint> findByStatusAndStudent(ComplaintStatus status, User student, Pageable pageable);
    List<Complaint> findByStudent(User student);

    long countByStudent(User student);
    long countByStudentAndStatus(User student, ComplaintStatus status);


    // ── Worker ────────────────────────────────────────────────────────────────

    Page<Complaint> findByAssignedWorker(User worker, Pageable pageable);
    Page<Complaint> findByAssignedWorkerAndStatus(User worker, ComplaintStatus status, Pageable pageable);

    long countByAssignedWorker(User worker);
    long countByAssignedWorkerAndStatus(User worker, ComplaintStatus status);

    @Query("SELECT AVG(c.rating) FROM Complaint c " +
           "WHERE c.assignedWorker = :worker AND c.rating IS NOT NULL")
    Double findAverageRatingByWorker(@Param("worker") User worker);

    @Query("SELECT COUNT(c) FROM Complaint c " +
           "WHERE c.assignedWorker = :worker AND c.rating IS NOT NULL")
    long countRatedComplaintsByWorker(@Param("worker") User worker);


    // ── Admin / Global ────────────────────────────────────────────────────────

    Page<Complaint> findByStatus(ComplaintStatus status, Pageable pageable);
    long countByStatus(ComplaintStatus status);
    List<Complaint> findByStatusIn(List<ComplaintStatus> statuses);

    // Derived query — works if Complaint has boolean `overdue` field
   long countByIsOverdueTrue();

    // Derived query — works if Complaint has String `disputeReason` field
    long countByDisputeReasonIsNotNull();


    // ── Analytics: Status breakdown ───────────────────────────────────────────

    /** Used by AnalyticsService.buildStatusMap() */
    @Query("SELECT c.status, COUNT(c) FROM Complaint c GROUP BY c.status")
    List<Object[]> countGroupByStatus();

    @Query("SELECT c.status, COUNT(c) FROM Complaint c " +
           "WHERE c.student.hostel = :hostel GROUP BY c.status")
    List<Object[]> countGroupByStatusForHostel(@Param("hostel") Hostel hostel);


    // ── Analytics: Category breakdown ────────────────────────────────────────

    /** Used by AnalyticsService.buildCategoryMap() */
    @Query("SELECT c.category, COUNT(c) FROM Complaint c GROUP BY c.category")
    List<Object[]> countGroupByCategory();

    @Query("SELECT c.category, COUNT(c) FROM Complaint c " +
           "WHERE c.student.hostel = :hostel GROUP BY c.category")
    List<Object[]> countGroupByCategoryForHostel(@Param("hostel") Hostel hostel);


    // ── Analytics: Block breakdown ────────────────────────────────────────────

    /** Used by AnalyticsService.buildBlockStats() */
    @Query("SELECT c.student.block.name, COUNT(c) FROM Complaint c " +
           "GROUP BY c.student.block.name ORDER BY COUNT(c) DESC")
    List<Object[]> countGroupByBlock();

    @Query("SELECT c.student.block.name, COUNT(c) FROM Complaint c " +
           "WHERE c.student.hostel = :hostel " +
           "GROUP BY c.student.block.name ORDER BY COUNT(c) DESC")
    List<Object[]> countGroupByBlockForHostel(@Param("hostel") Hostel hostel);


    // ── Analytics: Monthly trend ──────────────────────────────────────────────

    /**
     * Used by AnalyticsService.buildMonthlyTrend().
     * Returns [year, month, count] ordered chronologically.
     */
    @Query("SELECT YEAR(c.createdAt), MONTH(c.createdAt), COUNT(c) FROM Complaint c " +
           "WHERE c.createdAt >= :from " +
           "GROUP BY YEAR(c.createdAt), MONTH(c.createdAt) " +
           "ORDER BY YEAR(c.createdAt), MONTH(c.createdAt)")
    List<Object[]> countByMonthSince(@Param("from") LocalDateTime from);

    @Query("SELECT YEAR(c.createdAt), MONTH(c.createdAt), COUNT(c) FROM Complaint c " +
           "WHERE c.student.hostel = :hostel AND c.createdAt >= :from " +
           "GROUP BY YEAR(c.createdAt), MONTH(c.createdAt) " +
           "ORDER BY YEAR(c.createdAt), MONTH(c.createdAt)")
    List<Object[]> countByMonthSinceForHostel(@Param("hostel") Hostel hostel,
                                              @Param("from") LocalDateTime from);


    // ── Analytics: Resolution time ────────────────────────────────────────────

    @Query("SELECT AVG(TIMESTAMPDIFF(HOUR, c.createdAt, c.resolvedAt)) FROM Complaint c " +
           "WHERE c.status = 'RESOLVED' AND c.resolvedAt IS NOT NULL")
    Double avgResolutionHoursGlobal();

    @Query("SELECT AVG(TIMESTAMPDIFF(HOUR, c.createdAt, c.resolvedAt)) FROM Complaint c " +
           "WHERE c.student.hostel = :hostel " +
           "AND c.status = 'RESOLVED' AND c.resolvedAt IS NOT NULL")
    Double avgResolutionHoursForHostel(@Param("hostel") Hostel hostel);


    // ── Analytics: Worker leaderboard ─────────────────────────────────────────

    /**
     * Used by AnalyticsService.buildTopWorkers().
     * Returns [workerId, workerName, resolvedCount, avgRating].
     */
    @Query("SELECT c.assignedWorker.id, c.assignedWorker.name, COUNT(c), AVG(c.rating) " +
           "FROM Complaint c " +
           "WHERE c.status = 'RESOLVED' AND c.assignedWorker IS NOT NULL " +
           "GROUP BY c.assignedWorker.id, c.assignedWorker.name " +
           "ORDER BY COUNT(c) DESC")
    List<Object[]> findTopWorkersByResolvedCount(Pageable pageable);

    @Query("SELECT c.assignedWorker.id, c.assignedWorker.name, COUNT(c), AVG(c.rating) " +
           "FROM Complaint c " +
           "WHERE c.student.hostel = :hostel " +
           "AND c.status = 'RESOLVED' AND c.assignedWorker IS NOT NULL " +
           "GROUP BY c.assignedWorker.id, c.assignedWorker.name " +
           "ORDER BY COUNT(c) DESC")
    List<Object[]> findTopWorkersByResolvedCountForHostel(@Param("hostel") Hostel hostel,
                                                          Pageable pageable);


    // ── Disputes ──────────────────────────────────────────────────────────────

    Page<Complaint> findByDisputeReasonIsNotNull(Pageable pageable);

    Page<Complaint> findByDisputeReasonIsNotNullAndStudent_Hostel(Hostel hostel, Pageable pageable);
}