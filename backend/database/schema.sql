-- =============================================================================
-- CampusOS — Smart College Management & Student Portal
-- Full Database Schema (schema.sql)
-- Phase 12: Attendance, Assignments & Marks
-- =============================================================================

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS `marks`;
DROP TABLE IF EXISTS `assignment_submissions`;
DROP TABLE IF EXISTS `assignments`;
DROP TABLE IF EXISTS `attendance`;
DROP TABLE IF EXISTS `announcements`;
DROP TABLE IF EXISTS `courses`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `departments`;

-- -----------------------------------------------------------------------------
-- 1. Departments Table
-- -----------------------------------------------------------------------------
CREATE TABLE `departments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Users Table (Students, Faculty, Administrators)
-- -----------------------------------------------------------------------------
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `first_name` VARCHAR(50) NOT NULL,
  `last_name` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NULL,
  `role` ENUM('student', 'faculty', 'admin') NOT NULL,
  `department_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_department` (`department_id`),
  CONSTRAINT `fk_users_department` 
    FOREIGN KEY (`department_id`) 
    REFERENCES `departments`(`id`) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Courses Table
-- -----------------------------------------------------------------------------
CREATE TABLE `courses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `department_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `credits` INT NOT NULL DEFAULT 3,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_courses_code` (`code`),
  INDEX `idx_courses_department` (`department_id`),
  CONSTRAINT `fk_courses_department` 
    FOREIGN KEY (`department_id`) 
    REFERENCES `departments`(`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Announcements Table
-- -----------------------------------------------------------------------------
CREATE TABLE `announcements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `content` TEXT NOT NULL,
  `audience` ENUM('all', 'students', 'faculty') NOT NULL DEFAULT 'all',
  `created_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_announcements_audience` (`audience`),
  INDEX `idx_announcements_author` (`created_by`),
  CONSTRAINT `fk_announcements_author` 
    FOREIGN KEY (`created_by`) 
    REFERENCES `users`(`id`) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Attendance Table
-- -----------------------------------------------------------------------------
CREATE TABLE `attendance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `course_id` INT NOT NULL,
  `attendance_date` DATE NOT NULL,
  `status` ENUM('present', 'absent') NOT NULL DEFAULT 'present',
  `marked_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_attendance_student` (`student_id`),
  INDEX `idx_attendance_course` (`course_id`),
  INDEX `idx_attendance_date` (`attendance_date`),
  UNIQUE KEY `unique_student_course_date` (`student_id`, `course_id`, `attendance_date`),
  CONSTRAINT `fk_attendance_student` 
    FOREIGN KEY (`student_id`) 
    REFERENCES `users`(`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  CONSTRAINT `fk_attendance_course` 
    FOREIGN KEY (`course_id`) 
    REFERENCES `courses`(`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  CONSTRAINT `fk_attendance_marked_by` 
    FOREIGN KEY (`marked_by`) 
    REFERENCES `users`(`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. Assignments Table
-- -----------------------------------------------------------------------------
CREATE TABLE `assignments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `course_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `due_date` DATE NOT NULL,
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_assignments_course` (`course_id`),
  INDEX `idx_assignments_creator` (`created_by`),
  CONSTRAINT `fk_assignments_course` 
    FOREIGN KEY (`course_id`) 
    REFERENCES `courses`(`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  CONSTRAINT `fk_assignments_creator` 
    FOREIGN KEY (`created_by`) 
    REFERENCES `users`(`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. Assignment Submissions Table
-- -----------------------------------------------------------------------------
CREATE TABLE `assignment_submissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `assignment_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `submission_text` TEXT NOT NULL,
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('submitted', 'pending') NOT NULL DEFAULT 'submitted',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_submissions_assignment` (`assignment_id`),
  INDEX `idx_submissions_student` (`student_id`),
  UNIQUE KEY `unique_assignment_student` (`assignment_id`, `student_id`),
  CONSTRAINT `fk_submissions_assignment` 
    FOREIGN KEY (`assignment_id`) 
    REFERENCES `assignments`(`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  CONSTRAINT `fk_submissions_student` 
    FOREIGN KEY (`student_id`) 
    REFERENCES `users`(`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. Marks Table
-- -----------------------------------------------------------------------------
CREATE TABLE `marks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `course_id` INT NOT NULL,
  `assessment_name` VARCHAR(100) NOT NULL,
  `marks_obtained` DECIMAL(5,2) NOT NULL,
  `maximum_marks` DECIMAL(5,2) NOT NULL,
  `entered_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_marks_student` (`student_id`),
  INDEX `idx_marks_course` (`course_id`),
  INDEX `idx_marks_entered_by` (`entered_by`),
  CONSTRAINT `fk_marks_student` 
    FOREIGN KEY (`student_id`) 
    REFERENCES `users`(`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  CONSTRAINT `fk_marks_course` 
    FOREIGN KEY (`course_id`) 
    REFERENCES `courses`(`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  CONSTRAINT `fk_marks_entered_by` 
    FOREIGN KEY (`entered_by`) 
    REFERENCES `users`(`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
