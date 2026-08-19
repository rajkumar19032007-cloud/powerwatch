# CampusOS — Database Setup & Management Guide

This guide provides step-by-step instructions for initializing and managing the **CampusOS** MySQL database (`campusos_db`) and testing user authentication.

---

## 📋 Database Architecture Summary

The database uses **InnoDB** with **`utf8mb4`** encoding and consists of four initial relational tables:

```text
campusos_db/
├── departments       (id, name, code, description, created_at)
├── users             (id, first_name, last_name, email, password_hash, role, department_id, created_at, updated_at)
├── courses           (id, department_id, name, code, credits, created_at)
└── announcements     (id, title, content, audience, created_by, created_at, updated_at)
```

### Key Entity Relationships:
- `users.department_id` ➔ `departments.id` (`ON DELETE SET NULL`)
- `courses.department_id` ➔ `departments.id` (`ON DELETE CASCADE`)
- `announcements.created_by` ➔ `users.id` (`ON DELETE SET NULL`)

---

## 🔐 Phase 10 Demonstration User Credentials

> [!IMPORTANT]
> All demonstration passwords in MySQL are stored as **one-way bcrypt hashes** (10 salt rounds).  
> **Never store or transmit plain-text passwords.**

| Role | Email | Demo Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Student** | `student@campusos.demo` | `campus123` | Tests student portal access & timetable/attendance views |
| **Faculty** | `faculty@campusos.demo` | `campus123` | Tests faculty portal access & class rosters |
| **Admin** | `admin@campusos.demo` | `campus123` | Tests admin console & institutional system management |

*(Aliases `alex.johnson@campusos.edu`, `sarah.williams@campusos.edu`, `admin@campusos.edu` also work with password `campus123`)*

---

## 🚀 Step-by-Step Setup Instructions

### Step 1: Start Your MySQL Server
- If using **XAMPP**: Open the **XAMPP Control Panel** and click **Start** next to **MySQL**.
- Verify your MySQL port (typically `3306` or `3307`).

---

### Step 2: Create the `campusos_db` Database

Run the following in PowerShell / Command Prompt:
```powershell
# Adjust port (-P 3307 or -P 3306) as configured on your system
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS campusos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

---

### Step 3: Execute `schema.sql` (Create Tables)
```powershell
cd backend/database
mysql -u root -p campusos_db < schema.sql
```

---

### Step 4: Execute `seedRunner.js` (Load Demo Data with Bcrypt Hashes)

Use the automated Node.js seed runner:
```powershell
cd backend
node database/seedRunner.js
```

---

### Step 5: Configure `backend/.env`

Verify your `backend/.env` file contains your database connection details and JWT secret:

```ini
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000

# MySQL Configuration
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=
DB_NAME=campusos_db

# JWT Authentication
JWT_SECRET=campusos_super_secret_jwt_key_2026_dev_mode
JWT_EXPIRES_IN=2h
```

---

### Step 6: Start the Backend and Verify Connection

```powershell
cd backend
npm run dev
```

Open in your browser:
- 🩺 **Health Check**: `http://localhost:5000/api/health`
- 🔌 **Database Test**: `http://localhost:5000/api/db-test`
- 🏛️ **Departments API**: `http://localhost:5000/api/departments`
- 🔐 **Login API**: `POST http://localhost:5000/api/auth/login`

---

## 🔒 Security Best Practices

1. **Bcrypt Password Hashing**: Passwords in MySQL are exclusively stored as bcrypt hashes.
2. **Parameterized queries**: Always use parameterized queries (`query('SELECT * FROM users WHERE id = ?', [userId])`) with `mysql2` to prevent SQL injection.
3. **Role Authorization via JWT**: Endpoint protection is strictly enforced by server-verified JWT claims (`verifyToken`, `requireRole('admin')`).
4. **No Secrets in Client Code**: Database credentials, passwords, and `JWT_SECRET` are never exposed to browser JavaScript or frontend HTML/CSS.
