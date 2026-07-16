# HostelDesk

HostelDesk is a role-based hostel complaint management system for Hostel 10 (Blocks A & B). Students file complaints with photos and preferred visit slots, staff assign and track them through a full lifecycle with SLA-based overdue escalation, and workers resolve them with proof-of-work photos — all with real-time notifications, analytics, and student housing-profile management built in.

---

## Features

- **Role-Based Access Control:** Five roles — Student, Worker, Caretaker, Warden, Admin — each with a distinct dashboard and permission set, enforced server-side.
- **Complaint Lifecycle:** `CREATED → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED` (with `REJECTED`/`DISPUTED` branches), each transition role-gated and logged to a full audit trail.
- **SLA Tracking:** An hourly scheduled job automatically flags overdue complaints and escalates them.
- **Real-Time Notifications:** Server-Sent Events push live updates (assignment, status changes, new complaints) to connected users.
- **Student Housing Profiles:** Students submit fee UTRs, payment screenshots, and contact details; staff get a searchable directory, room-vacancy view, and CSV/PDF export.
- **Analytics Dashboard:** Status/category/block breakdowns, a 6-month trend chart, and top-worker rankings.
- **Worker Ratings:** Students rate resolved complaints; staff see per-worker average ratings.
- **Notice Board, OTP-verified registration, JWT authentication, and rate-limited APIs.**

---

## Tech Stack

- **Frontend:** React, React Router, Tailwind CSS, Axios
- **Backend:** Node.js, Express.js, Prisma ORM
- **Database:** MySQL
- **Authentication:** JSON Web Tokens (JWT) + bcrypt
- **Email:** Nodemailer (Gmail SMTP) for OTP verification and password reset
- **File Uploads:** Multer, with magic-byte validation (local disk storage)
- **PDF Export:** PDFKit
- **Scheduled Jobs:** node-cron (hourly SLA scheduler)
- **Testing:** Jest + Supertest

---

## Implementation Details

- **Role Enforcement:** Every state transition (assign, start work, resolve, close, reject, dispute) is validated server-side against the caller's role and relationship to the complaint — not just hidden in the UI.
- **Audit Trail:** Every status change is written to a `ComplaintAuditLog` row (who, when, from/to status, note), independent of the complaint's current state.
- **File Validation:** Uploaded images/PDFs are checked by magic bytes, not just MIME type or extension, before being written to disk.
- **Migration History:** Originally built on Spring Boot + JPA/MySQL, then migrated 1:1 to this Node/Express/Prisma stack with verified endpoint-for-endpoint behavioral parity, then rescoped from a multi-hostel data model down to Hostel 10 only. Full details in [`backend/docs/MIGRATION_NOTES.md`](backend/docs/MIGRATION_NOTES.md).

---

## Getting Started

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, MAIL_USERNAME, MAIL_PASSWORD
npx prisma generate
npm run dev
```

The server seeds an admin account and departments on first boot:
`admin_10@hostel.com` / `Admin_10@123`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend expects the backend at the URL in `VITE_API_URL` (defaults to `http://localhost:8080/api`).

---

## Future Enhancements

- Multi-hostel support (currently scoped to Hostel 10 only by design).
- Live OpenAPI/Swagger docs (currently a static reference at [`backend/docs/API_REFERENCE.md`](backend/docs/API_REFERENCE.md)).
- Broader automated test coverage beyond the current auth/complaint read-path suite.

---

## Author

Built by **Ayush Kumar**.
