# CampusOS — REST API Specification (`docs/api.md`)

> All backend endpoints are served from `http://localhost:5000/api`.  
> Protected endpoints require an `Authorization: Bearer <JWT_TOKEN>` header.

---

## 🔓 1. Core & Public Endpoints

### `GET /api`
Returns server metadata and status.
```json
{
  "success": true,
  "data": { "name": "CampusOS REST API", "version": "1.0.0", "status": "operational" }
}
```

### `GET /api/health`
Health probe returning system uptime and timestamp.

### `GET /api/db-test`
MySQL pool connectivity validation test.

### `GET /api/departments`
Retrieves all academic departments (`id`, `name`, `code`, `description`).

### `GET /api/courses`
Retrieves all courses with joined department names and credit counts.

### `GET /api/announcements`
Retrieves campus announcements (`id`, `title`, `content`, `audience`, `created_at`).

### `GET /api/users/summary`
Returns aggregate user metrics (`students`, `faculty`, `admins`, `total`).

---

## 🔐 2. Authentication Endpoints

### `POST /api/auth/login`
Validates user credentials against 10-round bcrypt hash and issues HMAC-SHA256 JWT.
- **Request Body**:
  ```json
  { "email": "admin@campusos.demo", "password": "campus123" }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": { "id": 3, "name": "Campus Administrator", "email": "admin@campusos.demo", "role": "admin" }
    }
  }
  ```

### `GET /api/auth/me`
Retrieves profile of the authenticated user based on verified token.

---

## 🎓 3. Student Endpoints (`requireRole('student')`)

* **`GET /api/student/attendance`**: Returns aggregate percentage, total sessions, attended sessions, course breakdown, and recent history.
* **`GET /api/student/assignments`**: Returns all assignments with the student's submission status (`submitted` / `pending`) and submitted solution text.
* **`POST /api/student/assignments/:id/submit`**: Submits coursework text for an assignment (`{ "submission_text": "..." }`).
* **`GET /api/student/marks`**: Returns all assessment marks, max marks, and calculated percentage.

---

## 👨‍🏫 4. Faculty Endpoints (`requireRole('faculty')`)

* **`POST /api/faculty/attendance`**: Records / upserts session attendance (`{ "student_id": 1, "course_id": 1, "attendance_date": "2026-08-19", "status": "present" }`).
* **`GET /api/faculty/attendance`**: Filters attendance records by `?course_id=...` and `?attendance_date=...`.
* **`PUT /api/faculty/attendance/:id`**: Updates attendance record status.
* **`POST /api/faculty/assignments`**: Publishes coursework (`{ "course_id": 1, "title": "...", "due_date": "...", "description": "..." }`).
* **`PUT /api/faculty/assignments/:id`**: Updates assignment title, due date, description.
* **`DELETE /api/faculty/assignments/:id`**: Deletes assignment.
* **`POST /api/faculty/marks`**: Records student assessment marks (`{ "student_id": 1, "course_id": 1, "assessment_name": "...", "marks_obtained": 45, "maximum_marks": 50 }`).
* **`GET /api/faculty/marks`**: Lists marks roster with `?course_id=...` and `?student_id=...` filters.
* **`PUT /api/faculty/marks/:id`**: Updates marks record.

---

## 🛡️ 5. Administrator Endpoints (`requireRole('admin')`)

### Student Management
* **`GET /api/admin/students`**: Lists students with search (`?search=...`) and department (`?department_id=...`) filters.
* **`POST /api/admin/students`**: Creates a new student record (hashes password with bcrypt).
* **`GET /api/admin/students/:id`**: Retrieves single student details.
* **`PUT /api/admin/students/:id`**: Updates student profile and optional password.
* **`DELETE /api/admin/students/:id`**: Deletes student record.

### Reporting & Analytics
* **`GET /api/admin/reports/overview`**: Summary counts, attendance rate %, assignment completion %, marks avg %, and department distribution.
* **`GET /api/admin/reports/attendance`**: Aggregated attendance breakdown by department and course.
* **`GET /api/admin/reports/performance`**: Course marks averages and GPA scores.
* **`GET /api/admin/reports/assignments`**: Assignment pipeline metrics and completion rates.
* **`GET /api/admin/reports/students`**: Full student performance leaderboard with academic standings.
