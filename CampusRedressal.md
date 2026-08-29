# College Complaint Management System — Campus Redressal Plan

We will build a full-stack **College Complaint Management System (CCMS)**. The system features student, admin, and staff dashboards, jwt-based authentication, a database layer supporting local in-memory storage (for zero-config testing) and MongoDB Atlas, local file uploads via Multer, auto-priority flagging, duplicate detection, upvoting, feedback, and complaint reopening.

---

## User Roles
- **Student** — register/login, submit complaints, track own complaints, upvote community board complaints, add follow-up comments, get notified/track status change, leave rating feedback, reopen complaints.
- **Staff** — login only (seeded), view department-scoped complaints assigned to their queue (Hostel Warden, Academic Office, Maintenance Desk, Anti-Ragging Committee, Canteen Management, IT & Library Administration, General Administration), update status, and add resolution remarks. Security limits access exclusively to their department.
- **Admin** — login only (seed at least one admin account via seed script; no public admin signup), view all complaints across all departments, filter/sort/search, update status, add resolution remarks, view basic analytics, and view full administrative activity audit logs.

---

## Core Features

### Authentication & Accounts
- Student signup/login (email + password, JWT)
- Seeded admin and department staff accounts (not publicly registrable)
- Password hashing, protected routes, role-based access control (RBAC) enforced server-side

### Complaint Submission (Student)
- Fields: title, category (Hostel, Academic, Infrastructure, Ragging/Harassment, Canteen, IT/Library, Other), description, optional attachment, optional "submit anonymously" toggle
- Stored with status `Pending`, timestamp, and student reference (omitted/shielded if anonymous)
- Student can view their own complaints with current status and remarks
- Student can add follow-up comments to their complaints

### Complaint Tracking
- Status lifecycle: `Pending` → `In Progress` → `Resolved` / `Rejected`
- Status-change history stored (who changed it, when, remark)
- Dynamic timeline layout for students to inspect the resolution actions

### Dashboards & Management
- **Student Dashboard**: Track personal filings and support others on the community board via +1 upvotes.
- **Staff Dashboard**: Scoped strictly to the staff member's department, displaying pending and active queues. Enforces 403 Forbidden constraints on other departments.
- **Admin Dashboard**: Global statistics and overview of all complaints. Displays system audit activity logs.

### Advanced Features:
- **Auto-priority**: High-sensitivity categories (e.g., Harassment/Ragging) automatically get flagged as `Urgent` and placed at the top of management dashboards.
- **Duplicate Detection & Upvoting**: Warning overlay when students type duplicate-sounding titles, suggesting they upvote an existing thread.
- **Feedback & Rating**: Rating and reviewing resolved complaints.
- **Reopen Flow**: Unsatisfied students can reopen resolved/rejected complaints to place them back in the pending queue.
- **Full Audit Log**: Capturing and displaying administrative status changes and comment additions in chronological order.

---

## Proposed Project Structure

### Backend Component
- `backend/package.json`
- `backend/models/User.js`
- `backend/models/Complaint.js`
- `backend/models/AuditLog.js`
- `backend/controllers/authController.js`
- `backend/controllers/complaintController.js`
- `backend/middleware/auth.js`
- `backend/scripts/seed.js`
- `backend/server.js`

### Frontend Component
- `frontend/package.json`
- `frontend/src/index.css`
- `frontend/src/App.jsx`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/Register.jsx`
- `frontend/src/pages/StudentDashboard.jsx`
- `frontend/src/pages/AdminDashboard.jsx`
- `frontend/src/pages/StaffDashboard.jsx`
- `frontend/src/pages/ComplaintDetail.jsx`
