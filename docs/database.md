# CampusOS — Database Architecture & Dictionary (`docs/database.md`)

> **Database Engine**: MySQL / MariaDB (InnoDB)  
> **Character Set**: `utf8mb4` | **Collation**: `utf8mb4_unicode_ci`  
> **Database Name**: `campusos_db`

---

## 📊 1. Entity-Relationship Model Overview

```text
  departments (1) ────< (N) users (1) ────< (N) attendance (N) >──── (1) courses
       │                     │                      │                       │
       │                     │                      │                       │
       └──< (N) courses (1) ─┼──< (N) marks (N) >───┘                       │
                             │                                              │
                             └──< (N) assignments (1) ──< (N) submissions >─┘
```

---

## 🗄️ 2. Table Specifications

### 1. `departments`
| Field | Type | Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT PRIMARY KEY` | Department Identifier |
| `name` | `VARCHAR(100)` | `NOT NULL UNIQUE` | Full Department Name |
| `code` | `VARCHAR(20)` | `NOT NULL UNIQUE` | Short Academic Code (e.g. CSE, IT) |
| `description` | `TEXT` | `NULL` | Department Summary |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Creation Timestamp |

### 2. `users`
| Field | Type | Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT PRIMARY KEY` | User Identifier |
| `first_name` | `VARCHAR(50)` | `NOT NULL` | First Name |
| `last_name` | `VARCHAR(50)` | `NOT NULL` | Last Name |
| `email` | `VARCHAR(100)` | `NOT NULL UNIQUE` | Institutional Email |
| `password_hash` | `VARCHAR(255)` | `NULL` | 10-round bcrypt hash |
| `role` | `ENUM` | `('student', 'faculty', 'admin') NOT NULL` | Access Role |
| `department_id` | `INT` | `NULL, FK -> departments.id ON DELETE SET NULL` | Department Assignment |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Registration Date |
| `updated_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE` | Last Update |

### 3. `courses`
| Field | Type | Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT PRIMARY KEY` | Course Identifier |
| `department_id` | `INT` | `NOT NULL, FK -> departments.id ON DELETE CASCADE` | Department FK |
| `name` | `VARCHAR(100)` | `NOT NULL` | Course Title |
| `code` | `VARCHAR(20)` | `NOT NULL UNIQUE` | Subject Code (e.g. CS-601) |
| `credits` | `INT` | `NOT NULL DEFAULT 3` | Credit Units |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Timestamp |

### 4. `announcements`
| Field | Type | Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT PRIMARY KEY` | Notice Identifier |
| `title` | `VARCHAR(200)` | `NOT NULL` | Notice Headline |
| `content` | `TEXT` | `NOT NULL` | Notice Body |
| `audience` | `ENUM` | `('all', 'students', 'faculty') DEFAULT 'all'` | Target Audience |
| `created_by` | `INT` | `NULL, FK -> users.id ON DELETE SET NULL` | Author User FK |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Timestamp |

### 5. `attendance`
| Field | Type | Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT PRIMARY KEY` | Attendance Record ID |
| `student_id` | `INT` | `NOT NULL, FK -> users.id ON DELETE CASCADE` | Student User FK |
| `course_id` | `INT` | `NOT NULL, FK -> courses.id ON DELETE CASCADE` | Course FK |
| `attendance_date` | `DATE` | `NOT NULL` | Class Date |
| `status` | `ENUM` | `('present', 'absent') DEFAULT 'present'` | Status |
| `marked_by` | `INT` | `NOT NULL, FK -> users.id ON DELETE CASCADE` | Faculty User FK |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Timestamp |
| **Unique Constraint** | `UNIQUE KEY (student_id, course_id, attendance_date)` | Prevents duplicate records per session |

### 6. `assignments`
| Field | Type | Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT PRIMARY KEY` | Assignment ID |
| `course_id` | `INT` | `NOT NULL, FK -> courses.id ON DELETE CASCADE` | Course FK |
| `title` | `VARCHAR(255)` | `NOT NULL` | Assignment Title |
| `description` | `TEXT` | `NULL` | Task Description |
| `due_date` | `DATE` | `NOT NULL` | Submission Deadline |
| `created_by` | `INT` | `NOT NULL, FK -> users.id ON DELETE CASCADE` | Faculty User FK |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Timestamp |

### 7. `assignment_submissions`
| Field | Type | Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT PRIMARY KEY` | Submission ID |
| `assignment_id` | `INT` | `NOT NULL, FK -> assignments.id ON DELETE CASCADE` | Assignment FK |
| `student_id` | `INT` | `NOT NULL, FK -> users.id ON DELETE CASCADE` | Student User FK |
| `submission_text`| `TEXT` | `NOT NULL` | Coursework Solution Text |
| `submitted_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Timestamp |
| `status` | `ENUM` | `('submitted', 'pending') DEFAULT 'submitted'` | Status |
| **Unique Constraint** | `UNIQUE KEY (assignment_id, student_id)` | Prevents duplicate submissions per student |

### 8. `marks`
| Field | Type | Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT PRIMARY KEY` | Marks Entry ID |
| `student_id` | `INT` | `NOT NULL, FK -> users.id ON DELETE CASCADE` | Student User FK |
| `course_id` | `INT` | `NOT NULL, FK -> courses.id ON DELETE CASCADE` | Course FK |
| `assessment_name`| `VARCHAR(100)`| `NOT NULL` | Assessment Title |
| `marks_obtained` | `DECIMAL(5,2)`| `NOT NULL` | Marks Achieved (>= 0) |
| `maximum_marks`  | `DECIMAL(5,2)`| `NOT NULL` | Maximum Possible Marks (> 0) |
| `entered_by` | `INT` | `NOT NULL, FK -> users.id ON DELETE CASCADE` | Faculty User FK |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Timestamp |

---

## 🔑 3. Demonstration Accounts Reference

| Role | Email | Password | Full Name | Department |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | `student@campusos.demo` | `campus123` | Alex Johnson | Computer Science & Engineering |
| **Faculty** | `faculty@campusos.demo` | `campus123` | Dr. Sarah Williams | Computer Science & Engineering |
| **Admin** | `admin@campusos.demo` | `campus123` | Campus Administrator | Super Admin / Institutional Console |
