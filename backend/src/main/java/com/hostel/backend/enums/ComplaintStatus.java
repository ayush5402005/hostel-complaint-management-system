package com.hostel.backend.enums;

public enum ComplaintStatus {
    CREATED,      // Student raised complaint
    ASSIGNED,     // Worker assigned by caretaker
    IN_PROGRESS,  // Worker started working
    RESOLVED,     // Worker marked done
    CLOSED,       // Student confirmed + rated
    REJECTED      // Invalid complaint with reason
}
