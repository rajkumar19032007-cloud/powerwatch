# CampusOS — Comprehensive Features Specification (`docs/features.md`)

> **CampusOS** is a collegiate operating system connecting students, faculty members, and institutional administrators into one unified platform.

---

## 🏛️ 1. Student Portal (`pages/student-dashboard.html`)

* **Authentication & Role Guard**: Protected by `CampusAuth.requireRole('student')` and JSON Web Token verification.
* **Dynamic Time-Aware Greeting**: Greets students based on local time of day with their verified profile name.
* **Aggregate Attendance Meter**: Real-time attendance rate calculated via SQL across all enrolled lecture and lab courses.
* **Course-wise Attendance Breakdown**: Visual progress bars color-coded by compliance threshold (≥75% in green, <75% in amber).
* **Coursework & Assignments Tracker**: Live assignments queue displaying subject metadata, instructors, deadlines, and submission status (`Submitted` vs `Pending`).
* **Interactive Assignment Submission**: In-browser modal for submitting coursework solutions and text notes directly to MySQL.
* **Marks & Performance Visualization**: Pure CSS performance bar chart and semester assessment grade breakdown.
* **Campus Notices**: Filtered broadcast announcements for student and campus-wide audiences.

---

## 👨‍🏫 2. Faculty Portal (`pages/faculty-dashboard.html`)

* **Role Authorization**: Protected by `requireRole('faculty')`.
* **Take Class Attendance Modal**:
  - Select active course and student roster.
  - Record attendance date and status (`present` / `absent`).
  - Automatic upsert logic ensuring no duplicate records per session.
* **Publish Course Assignments Modal**:
  - Create new coursework with course selection, title, due date, and guidelines.
  - Real-time submission counter tracking how many students have submitted.
* **Enter Assessment Marks Modal**:
  - Record exam, quiz, lab, or sprint scores.
  - Strict input validation ensuring `0 <= marks_obtained <= maximum_marks`.
* **Course Announcements**: Faculty communication channel.

---

## 🛡️ 3. Administrator Console (`pages/admin-dashboard.html` & `pages/reports.html`)

* **Full Student Lifecycle Management (`pages/students.html`)**:
  - Paginated / structured roster table with avatar initials, student IDs, and department badges.
  - Parameterized multi-field live search (First name, Last name, Full name, Email, ID).
  - Academic department dropdown filtering.
  - "+ Add Student" modal with bcrypt password encryption.
  - "✏️ Edit Student" modal for modifying names, emails, departments, or passwords.
  - "👁️ View Details" modal displaying verified database profile.
  - "🗑️ Delete Student" modal with confirmation guard.
* **Institutional Reports & Analytics (`pages/reports.html`)**:
  - Overview metric cards: Total Students, Faculty, Departments, Courses, Overall Attendance %, Assignment Completion %, Marks Avg %.
  - 4 Dynamic Chart.js visualizations:
    1. *Student Distribution by Department* (Doughnut).
    2. *Department Attendance Compliance* (Bar).
    3. *Course Academic Performance* (Bar).
    4. *Assignment Submission Pipeline* (Doughnut).
  - Multi-dimensional filter toolbar (Department, Course, Start Date, End Date, Reset).
  - Student Academic Standing Leaderboard (*Dean's Honor List*, *Good Standing*, *Academic Advisory*).
  - RFC 4180 CSV Export (`campusos_academic_report.csv`).
  - Print-friendly layout (`@media print` rules).

---

## 📑 4. Dedicated Academic Sub-Views

* **[`pages/attendance.html`](file:///c:/Users/asus/Downloads/CampusOS/pages/attendance.html)**: Focused attendance roster and course compliance matrix.
* **[`pages/assignments.html`](file:///c:/Users/asus/Downloads/CampusOS/pages/assignments.html)**: Detailed coursework pipelines and submission management.
* **[`pages/marks.html`](file:///c:/Users/asus/Downloads/CampusOS/pages/marks.html)**: Academic transcript and institutional grade book.
