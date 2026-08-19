# CampusOS — Smart College Management & Student Portal

> **A modern, unified digital operating system for collegiate institutions.**  
> Built as an academic collegiate project to connect students, faculty members, and administrators into one synchronized platform.

---

## 📌 Project Overview

**CampusOS** is a full-stack collegiate management system designed to streamline academic operations, attendance tracking, coursework submissions, internal assessment analytics, student lifecycle management, campus announcements, and administrative reporting for colleges and universities.

---

## ✨ Features

### 🎓 Student Portal (`pages/student-dashboard.html`)
- Real-time aggregate attendance rate and subject-wise compliance meters.
- Interactive coursework tracker with submission status (`Submitted` vs `Pending`).
- In-browser coursework solution text submission modal.
- Semester assessment performance breakdown and pure CSS grade bar chart.
- Broadcast announcements tailored for students.

### 👨‍🏫 Faculty Portal (`pages/faculty-dashboard.html`)
- **Take Attendance Modal**: Mark class sessions (`present` / `absent`) with duplicate protection.
- **Publish Coursework Modal**: Create new assignments with deadlines and track student submissions.
- **Enter Assessment Marks Modal**: Record exam, quiz, and project scores with mathematical range validation (`0 <= score <= max`).
- Faculty notices communication feed.

### 🛡️ Administrator Console (`pages/admin-dashboard.html` & `pages/reports.html`)
- **Student Lifecycle Management (`pages/students.html`)**:
  - Live multi-field search (First name, Last name, Email, Student ID).
  - Academic department filter.
  - Add Student modal with 10-round bcrypt password encryption.
  - Edit Student modal and View Profile modal.
  - Delete Student confirmation dialog.
- **Institutional Reports & Analytics (`pages/reports.html`)**:
  - Overview cards: Total Students, Faculty, Departments, Courses, Attendance Rate, Assignment Completion, Marks Average.
  - 4 Chart.js visualizations (Student Distribution, Department Attendance, Course Performance, Assignment Pipeline).
  - Multi-dimensional filter toolbar (Department, Course, Date range).
  - Student Academic Standing Leaderboard (*Dean's Honor List*, *Good Standing*, *Academic Advisory*).
  - RFC 4180 CSV report export (`campusos_academic_report.csv`).
  - Print-formatted report transcripts (`@media print` rules).

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | HTML5, CSS3, Vanilla JS (ES6+) | Accessible semantic UI, responsive SaaS layouts, modal workflows |
| **Data Visualization** | Chart.js (via CDN) | High-performance canvas charts without external build systems |
| **Frontend Client** | `js/api.js` (`CampusAPI` & `CampusAuth`) | JWT authentication, client route guards, REST API helpers |
| **Backend Runtime** | Node.js (v24 LTS) | Asynchronous JavaScript backend execution engine |
| **Backend Framework** | Express.js (v4) | REST API routing, JSON body parsing, CORS middleware |
| **Security & Hashing** | `bcryptjs` & `jsonwebtoken` | 10-round bcrypt password hashing and signed HMAC-SHA256 JWT tokens |
| **Database** | MySQL / MariaDB (InnoDB, utf8mb4) | Relational storage with foreign keys, indexes & SQL aggregation queries |
| **Database Driver** | `mysql2/promise` | Asynchronous connection pooling and parameterized query execution |

---

## 📂 Project Structure

```text
CampusOS/
│
├── index.html                  # Landing page (connected to GET /api/departments & /api/announcements)
│
├── pages/                      # Role-based portal views
│   ├── login.html              # Real JWT login UI with role selector tabs & demo credentials
│   ├── students.html           # Admin Student Management (table, search, department filter, modals)
│   ├── reports.html            # Admin Reports & Analytics (Chart.js, Filters, CSV Export, Print)
│   ├── attendance.html         # Dedicated Attendance tracking view
│   ├── assignments.html        # Dedicated Coursework and assignment pipeline view
│   ├── marks.html              # Dedicated Marks & Grade Book view
│   ├── student-dashboard.html  # Student Portal (attendance, assignments, submission modal, marks)
│   ├── faculty-dashboard.html  # Faculty Portal (Take Attendance, Create Assignment, Enter Marks modals)
│   └── admin-dashboard.html    # Admin Console linked to student management and reports
│
├── js/                         # Frontend client scripts
│   ├── api.js                  # Central REST client (CampusAPI) & Role guard (CampusAuth)
│   ├── reports.js              # Chart.js analytics controller, filter debouncer, CSV export, print
│   ├── students.js             # Admin Student Management controller (live search, filter, CRUD modals)
│   ├── student-dashboard.js    # Student Portal controller (live attendance, coursework submission, marks)
│   ├── faculty-dashboard.js    # Faculty Portal controller (attendance, assignments & marks modals)
│   ├── attendance.js           # Dedicated Attendance page controller
│   ├── assignments.js          # Dedicated Assignments page controller
│   ├── marks.js                # Dedicated Marks page controller
│   ├── auth.js                 # Login form submission & token storage
│   ├── main.js                 # Landing page interactions & dynamic data loading
│   └── utils.js                # Shared DOM utilities & smooth scrolling
│
├── css/                        # Modular stylesheet architecture
│   ├── style.css               # Design tokens, typography, shared components
│   ├── reports.css             # Analytics grid, Chart.js canvas cards, toolbar, @media print rules
│   ├── students.css            # Student management table, action bar, modal layouts
│   ├── attendance.css          # Attendance tables & status toggle pills
│   ├── assignments.css         # Assignment pipelines & submission cards
│   ├── marks.css               # Grade books & mark score badges
│   ├── landing.css             # Landing page layout & CSS dashboard mockup
│   ├── auth.css                # Authentication layout, role selector, form states
│   ├── dashboard.css           # Shared application shell, sidebar, widgets, charts
│   ├── faculty-dashboard.css   # Faculty roster table, class schedule cards
│   ├── admin-dashboard.css     # Distribution bars, activity feed, system status
│   └── responsive.css          # Responsive breakpoints (Desktop, Tablet, Mobile)
│
├── backend/                    # Node.js + Express REST API Server & MySQL Integration
│   ├── server.js               # Express server entrypoint
│   ├── package.json            # Dependencies: express, cors, dotenv, mysql2, bcryptjs, jsonwebtoken
│   ├── .env.example            # Environment configuration template
│   ├── .env                    # Local environment variables
│   │
│   ├── config/
│   │   ├── config.js           # Configuration loader (port, db, jwt)
│   │   └── db.js               # MySQL connection pool (mysql2/promise)
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js   # verifyToken: Bearer JWT validation
│   │   ├── roleMiddleware.js   # requireRole: Role-based access control (RBAC)
│   │   └── errorHandler.js     # 404 Route Not Found & 500 Global Error Handlers
│   │
│   ├── controllers/
│   │   ├── authController.js   # Login verification & user profile
│   │   ├── reportController.js # SQL aggregation for overview, attendance, performance, assignments, students
│   │   ├── studentController.js # CRUD handlers for student management
│   │   ├── attendanceController.js # Faculty attendance marking & student percentage calculations
│   │   ├── assignmentController.js # Assignment CRUD & student coursework submissions
│   │   ├── marksController.js      # Marks recording & student performance metrics
│   │   ├── academicController.js   # Admin academic overview metrics
│   │   ├── departmentController.js # Department queries
│   │   ├── courseController.js     # Course JOIN queries
│   │   ├── announcementController.js # Announcement queries
│   │   ├── userController.js       # User summary counts
│   │   └── index.js                # System info, health, and DB test
│   │
│   ├── routes/
│   │   ├── index.js            # Central API router mounting all sub-routers
│   │   ├── authRoutes.js       # POST /api/auth/login, GET /api/auth/me
│   │   ├── adminRoutes.js      # Protected admin routes (/api/admin/reports/* & /api/admin/students)
│   │   ├── facultyRoutes.js    # Protected faculty routes (/api/faculty/attendance, assignments, marks)
│   │   ├── studentRoutes.js    # Protected student routes (/api/student/attendance, assignments, marks)
│   │   ├── assignmentRoutes.js # Public/authenticated assignment list
│   │   ├── departmentRoutes.js # GET /api/departments
│   │   ├── courseRoutes.js     # GET /api/courses
│   │   ├── announcementRoutes.js # GET /api/announcements
│   │   └── userRoutes.js       # GET /api/users/summary
│   │
│   └── database/
│       ├── schema.sql          # 8-table relational schema with foreign keys and constraints
│       ├── seed.sql            # Demo academic records & bcrypt-hashed users
│       └── seedRunner.js       # Node.js schema migration and seeding runner
│
├── docs/                       # Project documentation suite
│   ├── features.md             # Detailed feature catalog
│   ├── api.md                  # REST API specification
│   └── database.md             # Database schema dictionary
│
└── README.md                   # Project documentation & master setup guide
```

---

## ⚙️ Requirements

1. **Node.js**: v18.x or v20.x+ (Tested on Node.js v24 LTS)
2. **MySQL / MariaDB**: v8.0+ or MariaDB 10.4+ (XAMPP default on Port 3306 or 3307)
3. **Web Browser**: Any modern evergreen browser (Chrome, Firefox, Safari, Edge)

---

## 🚀 Installation & Setup Guide

### 1. Database Initialization
1. Ensure your MySQL service is running (e.g. via XAMPP Control Panel).
2. Create the database:
   ```sql
   CREATE DATABASE IF NOT EXISTS `campusos_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Run the schema migration and seed script:
   ```bash
   cd backend
   node database/seedRunner.js
   ```

### 2. Backend Server Setup
1. Install Node.js dependencies:
   ```bash
   npm install
   ```
2. Configure your environment file:
   - Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   - Update database credentials and port in `.env` if necessary.
3. Start the Express server:
   ```bash
   npm run dev
   ```
   The backend will start at `http://localhost:5000`.

### 3. Open the Frontend Application
- Open [`index.html`](file:///c:/Users/asus/Downloads/CampusOS/index.html) or serve it with VS Code Live Server / Python HTTP server (`http://localhost:5500`).

---

## 🔐 Demonstration User Accounts

> [!IMPORTANT]
> All demonstration account passwords in the database are stored as **10-round one-way bcrypt hashes**.  
> **These accounts are provided strictly for academic evaluation and development testing.**

| Role | Email Address | Password | Accessible Dashboard |
| :--- | :--- | :--- | :--- |
| **Student** | `student@campusos.demo` | `campus123` | [`pages/student-dashboard.html`](file:///c:/Users/asus/Downloads/CampusOS/pages/student-dashboard.html) |
| **Faculty** | `faculty@campusos.demo` | `campus123` | [`pages/faculty-dashboard.html`](file:///c:/Users/asus/Downloads/CampusOS/pages/faculty-dashboard.html) |
| **Admin** | `admin@campusos.demo` | `campus123` | [`pages/admin-dashboard.html`](file:///c:/Users/asus/Downloads/CampusOS/pages/admin-dashboard.html) |

---

## 🌐 REST API Endpoints Overview

| Scope | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **System** | `GET` | `/api/health` | Backend health probe |
| **System** | `GET` | `/api/db-test` | MySQL connectivity ping |
| **Auth** | `POST` | `/api/auth/login` | Authenticates credentials and returns Bearer JWT |
| **Auth** | `GET` | `/api/auth/me` | Retrieves profile of authenticated user |
| **Public** | `GET` | `/api/departments` | Lists all academic departments |
| **Public** | `GET` | `/api/courses` | Lists all courses with department info |
| **Public** | `GET` | `/api/announcements` | Lists broadcast notices |
| **Student** | `GET` | `/api/student/attendance` | Returns student attendance % and course breakdown |
| **Student** | `GET` | `/api/student/assignments` | Lists assignments with student submission status |
| **Student** | `POST` | `/api/student/assignments/:id/submit` | Submits coursework solution text |
| **Student** | `GET` | `/api/student/marks` | Returns assessment marks and average percentage |
| **Faculty** | `POST` | `/api/faculty/attendance` | Records session attendance (`present` / `absent`) |
| **Faculty** | `POST` | `/api/faculty/assignments` | Publishes new course assignment |
| **Faculty** | `POST` | `/api/faculty/marks` | Records student marks with score validation |
| **Admin** | `GET` | `/api/admin/students` | Student directory with search and department filtering |
| **Admin** | `POST` | `/api/admin/students` | Creates student with bcrypt password encryption |
| **Admin** | `GET` | `/api/admin/reports/overview` | Macro statistics and department distribution |
| **Admin** | `GET` | `/api/admin/reports/attendance` | Aggregated attendance compliance reports |
| **Admin** | `GET` | `/api/admin/reports/performance` | Course academic GPA and marks analytics |
| **Admin** | `GET` | `/api/admin/reports/assignments` | Coursework pipeline and completion rates |
| **Admin** | `GET` | `/api/admin/reports/students` | Full student leaderboard with academic standing |

---

## 🛡️ Security Architecture

1. **Password Encryption**: Stored exclusively as 10-round bcrypt hashes using `bcryptjs`. `password_hash` is never returned in any API response.
2. **Token-Based Authentication**: Signed HMAC-SHA256 JWT tokens containing user ID, name, email, and verified role.
3. **Role-Based Access Control (RBAC)**: Backend middleware (`requireRole('admin')`, `requireRole('faculty')`, `requireRole('student')`) strictly reject cross-role requests with HTTP 403 Forbidden.
4. **Parameterized SQL Queries**: All database queries use MySQL placeholder parameters (`?`), eliminating SQL injection vulnerabilities.
5. **Masked Error Responses**: Server exceptions return friendly JSON error messages without exposing SQL queries or stack traces.

---

## 🔮 Future Enhancements

* Multipart file attachments for coursework submissions (PDF / ZIP).
* Automated email notifications for attendance warnings and grade publications.
* Multi-factor authentication (2FA).
* Real-time WebSocket messaging and timetable scheduling conflicts detector.

---

## 🎓 Academic Project Notice

> **CampusOS** is designed and implemented as an academic collegiate Web Technologies project. It demonstrates full-stack software architecture principles, relational database normalization, responsive design systems, and secure RESTful API development.
