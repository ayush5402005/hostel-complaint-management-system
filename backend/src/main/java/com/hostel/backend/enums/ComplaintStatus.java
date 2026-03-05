package com.hostel.backend.enums;

public enum ComplaintStatus {
    CREATED,      // Student raised complaint
    FORWARDED,    // Caretaker forwarded to department (INSTITUTE pipeline only)
    ASSIGNED,     // Worker assigned
    IN_PROGRESS,  // Worker started working
    RESOLVED,     // Worker marked done
    CLOSED,       // Student confirmed + rated
    REJECTED      // Invalid complaint with reason
}
