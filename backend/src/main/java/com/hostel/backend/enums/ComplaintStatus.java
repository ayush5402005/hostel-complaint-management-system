package com.hostel.backend.enums;

public enum ComplaintStatus {
    CREATED,      // Just submitted by student
    ASSIGNED,     // Caretaker assigned to a worker
    IN_PROGRESS,  // Worker is actively working on it
    RESOLVED,     // Worker marked as done, pending student confirmation
    DISPUTED,     // Student flagged it as still not resolved
    CLOSED,       // Warden/Caretaker confirmed resolution
    REJECTED      // Caretaker rejected with a reason
}