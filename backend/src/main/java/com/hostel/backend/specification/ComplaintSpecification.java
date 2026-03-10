package com.hostel.backend.specification;

import com.hostel.backend.entity.Complaint;
import com.hostel.backend.entity.User;
import com.hostel.backend.enums.ComplaintCategory;
import com.hostel.backend.enums.ComplaintPriority;
import com.hostel.backend.enums.ComplaintStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class ComplaintSpecification {

    // ── For STUDENT ───────────────────────────────────────────────
    public static Specification<Complaint> forStudent(
            User student,
            ComplaintStatus status,
            ComplaintCategory category,
            ComplaintPriority priority,
            LocalDate dateFrom,
            LocalDate dateTo) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("student"), student));
            if (status   != null) predicates.add(cb.equal(root.get("status"),   status));
            if (category != null) predicates.add(cb.equal(root.get("category"), category));
            if (priority != null) predicates.add(cb.equal(root.get("priority"), priority));
            if (dateFrom != null) predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), dateFrom.atStartOfDay()));
            if (dateTo   != null) predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"),   dateTo.atTime(23, 59, 59)));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    // ── For WORKER ────────────────────────────────────────────────
    public static Specification<Complaint> forWorker(
            User worker,
            ComplaintStatus status,
            ComplaintCategory category,
            ComplaintPriority priority,
            LocalDate dateFrom,
            LocalDate dateTo) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("assignedWorker"), worker));
            if (status   != null) predicates.add(cb.equal(root.get("status"),   status));
            if (category != null) predicates.add(cb.equal(root.get("category"), category));
            if (priority != null) predicates.add(cb.equal(root.get("priority"), priority));
            if (dateFrom != null) predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), dateFrom.atStartOfDay()));
            if (dateTo   != null) predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"),   dateTo.atTime(23, 59, 59)));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    // ── For ADMIN / CARETAKER / WARDEN ────────────────────────────
    public static Specification<Complaint> forStaff(
            ComplaintStatus status,
            String blockName,
            ComplaintCategory category,
            ComplaintPriority priority,
            LocalDate dateFrom,
            LocalDate dateTo) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status    != null)                    predicates.add(cb.equal(root.get("status"),              status));
            if (category  != null)                    predicates.add(cb.equal(root.get("category"),            category));
            if (priority  != null)                    predicates.add(cb.equal(root.get("priority"),            priority));
            if (blockName != null && !blockName.isBlank()) predicates.add(cb.equal(root.get("block").get("name"), blockName));
            if (dateFrom  != null)                    predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), dateFrom.atStartOfDay()));
            if (dateTo    != null)                    predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"),   dateTo.atTime(23, 59, 59)));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
