package com.hostel.backend.enums;

public enum Role {
    STUDENT,    // Raises and tracks own complaints
    WORKER,     // Resolves assigned complaints
    CARETAKER,  // Manages complaints across Hostel-10 A&B
    WARDEN,     // Monitors complaints — all / Block-A / Block-B view
    ADMIN       // Full access
}
