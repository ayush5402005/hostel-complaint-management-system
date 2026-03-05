package com.hostel.backend.enums;

public enum ComplaintCategory {

    // ── HOSTEL pipeline categories ──────────────────────────────────────────
    CLEANING,           // Hostel cleaning issues
    MESS,               // Mess / food related
    PLUMBING,           // Water supply, taps, drainage
    FURNITURE,          // Bed, table, chair, cupboard
    ROOM_REPAIR,        // Wall, floor, door, window inside room
    WATER_COOLER,       // Water cooler on floor
    GEYSER,             // Geyser issues

    // ── INSTITUTE pipeline categories ───────────────────────────────────────
    ELECTRICAL,         // Room light, fan, wiring, MCB, DG set
    WIFI_INTERNET,      // WiFi not working, slow speed
    COMPUTER_HARDWARE,  // Computer, printer, hardware issues
    AC,                 // AC not working, cooling issues
    BUILDING_CIVIL,     // Seepage, plaster, structural issues
    TELEPHONE,          // Telephone line issues

    // ── Generic ─────────────────────────────────────────────────────────────
    OTHER               // Anything that doesn't fit above
}
