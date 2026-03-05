package com.hostel.backend.enums;

public enum Role {
    STUDENT,      // Raises complaints
    WORKER,       // Resolves assigned complaints
    CARETAKER,    // Manages hostel complaints + forwards institute ones
    WARDEN,       // Monitors complaints in their hostel/block
    DEPT_HEAD,    // Receives institute complaints, assigns institute workers
    ADMIN         // Full access
}
