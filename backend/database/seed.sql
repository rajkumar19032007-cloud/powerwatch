-- =============================================================================
-- CampusOS — Smart College Management & Student Portal
-- Initial Demonstration Seed Data (seed.sql)
-- Phase 12: Attendance, Assignments & Marks
-- All demo user accounts use bcrypt password hash for 'campus123'
-- =============================================================================

-- Clean existing records in child-to-parent order
DELETE FROM `marks`;
DELETE FROM `assignment_submissions`;
DELETE FROM `assignments`;
DELETE FROM `attendance`;
DELETE FROM `announcements`;
DELETE FROM `courses`;
DELETE FROM `users`;
DELETE FROM `departments`;

-- -----------------------------------------------------------------------------
-- 1. Seed Departments
-- -----------------------------------------------------------------------------
INSERT INTO `departments` (`id`, `name`, `code`, `description`) VALUES
(1, 'Computer Science & Engineering', 'CSE', 'Department of Computer Science and Engineering — software systems, algorithms, and computing infrastructure.'),
(2, 'Information Technology', 'IT', 'Department of Information Technology — enterprise software, cloud computing, and cybersecurity.'),
(3, 'Electronics & Communication Engineering', 'ECE', 'Department of Electronics and Communication — microelectronics, signal processing, and telecommunications.'),
(4, 'Mechanical Engineering', 'MECH', 'Department of Mechanical Engineering — thermodynamics, robotics, and manufacturing systems.'),
(5, 'Civil Engineering', 'CIVIL', 'Department of Civil Engineering — structural engineering, environmental science, and urban infrastructure.');

-- -----------------------------------------------------------------------------
-- 2. Seed Users (Bcrypt Hash for password 'campus123')
-- -----------------------------------------------------------------------------
INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `password_hash`, `role`, `department_id`) VALUES
(1, 'Alex', 'Johnson', 'student@campusos.demo', '$2b$10$HNoizoDiEsyzfLLepDgouuMNjCsrCb2jx5bkVOVZS.1lMMGJPEzwG', 'student', 1),
(2, 'Sarah', 'Williams', 'faculty@campusos.demo', '$2b$10$HNoizoDiEsyzfLLepDgouuMNjCsrCb2jx5bkVOVZS.1lMMGJPEzwG', 'faculty', 1),
(3, 'Campus', 'Administrator', 'admin@campusos.demo', '$2b$10$HNoizoDiEsyzfLLepDgouuMNjCsrCb2jx5bkVOVZS.1lMMGJPEzwG', 'admin', NULL),
(4, 'Alex', 'Johnson', 'alex.johnson@campusos.edu', '$2b$10$HNoizoDiEsyzfLLepDgouuMNjCsrCb2jx5bkVOVZS.1lMMGJPEzwG', 'student', 1),
(5, 'Sarah', 'Williams', 'sarah.williams@campusos.edu', '$2b$10$HNoizoDiEsyzfLLepDgouuMNjCsrCb2jx5bkVOVZS.1lMMGJPEzwG', 'faculty', 1),
(6, 'Campus', 'Administrator', 'admin@campusos.edu', '$2b$10$HNoizoDiEsyzfLLepDgouuMNjCsrCb2jx5bkVOVZS.1lMMGJPEzwG', 'admin', NULL),
(7, 'David', 'Miller', 'david.miller@campusos.demo', '$2b$10$HNoizoDiEsyzfLLepDgouuMNjCsrCb2jx5bkVOVZS.1lMMGJPEzwG', 'student', 1),
(8, 'Emma', 'Watson', 'emma.watson@campusos.demo', '$2b$10$HNoizoDiEsyzfLLepDgouuMNjCsrCb2jx5bkVOVZS.1lMMGJPEzwG', 'student', 2);

-- -----------------------------------------------------------------------------
-- 3. Seed Courses
-- -----------------------------------------------------------------------------
INSERT INTO `courses` (`id`, `department_id`, `name`, `code`, `credits`) VALUES
(1, 1, 'Web Technologies', 'CS-601', 4),
(2, 1, 'Database Management Systems', 'CS-602', 4),
(3, 1, 'Computer Networks', 'CS-603', 3),
(4, 1, 'Software Engineering', 'CS-604', 3),
(5, 2, 'Data Structures & Algorithms', 'IT-601', 4),
(6, 3, 'Digital Signal Processing', 'EC-601', 4);

-- -----------------------------------------------------------------------------
-- 4. Seed Announcements
-- -----------------------------------------------------------------------------
INSERT INTO `announcements` (`id`, `title`, `content`, `audience`, `created_by`) VALUES
(1, 'Internal Assessment Schedule Released', 'The timetable for Semester 6 internal examinations has been officially published. Check the academic calendar for subject slots.', 'students', 2),
(2, 'Campus Innovation Hackathon 2026', 'Team registrations are now open for the annual collegiate hackathon on August 25. Cash prizes and industry mentorship awards available.', 'all', 3),
(3, 'Annual Faculty Curriculum Review Meeting', 'All department faculty members are requested to attend the curriculum and syllabus review meeting on Thursday at 3:00 PM in the conference hall.', 'faculty', 3);

-- -----------------------------------------------------------------------------
-- 5. Seed Attendance Records
-- -----------------------------------------------------------------------------
INSERT INTO `attendance` (`id`, `student_id`, `course_id`, `attendance_date`, `status`, `marked_by`) VALUES
(1, 1, 1, '2026-08-10', 'present', 2),
(2, 1, 1, '2026-08-11', 'present', 2),
(3, 1, 1, '2026-08-12', 'present', 2),
(4, 1, 1, '2026-08-13', 'absent', 2),
(5, 1, 1, '2026-08-14', 'present', 2),
(6, 1, 2, '2026-08-10', 'present', 2),
(7, 1, 2, '2026-08-12', 'present', 2),
(8, 1, 2, '2026-08-14', 'present', 2),
(9, 1, 3, '2026-08-11', 'present', 2),
(10, 1, 3, '2026-08-13', 'present', 2),
(11, 7, 1, '2026-08-10', 'present', 2),
(12, 7, 1, '2026-08-11', 'absent', 2);

-- -----------------------------------------------------------------------------
-- 6. Seed Assignments
-- -----------------------------------------------------------------------------
INSERT INTO `assignments` (`id`, `course_id`, `title`, `description`, `due_date`, `created_by`) VALUES
(1, 1, 'CampusOS Responsive UI Design', 'Develop a responsive frontend portal adhering to HTML5 semantics, CSS variables, and modern SaaS layout principles.', '2026-08-25', 2),
(2, 2, 'Relational Schema & Normalization', 'Design a 3NF normalized database schema for a university management system with foreign keys and indexes.', '2026-08-28', 2),
(3, 3, 'TCP/IP Socket Programming Lab', 'Implement a client-server architecture in Node.js or Python to handle concurrent connections.', '2026-08-30', 2);

-- -----------------------------------------------------------------------------
-- 7. Seed Assignment Submissions
-- -----------------------------------------------------------------------------
INSERT INTO `assignment_submissions` (`id`, `assignment_id`, `student_id`, `submission_text`, `status`) VALUES
(1, 1, 1, 'Completed all CSS Grid and Flexbox responsive layouts for CampusOS portal. Tested on desktop and mobile viewports.', 'submitted');

-- -----------------------------------------------------------------------------
-- 8. Seed Marks Records
-- -----------------------------------------------------------------------------
INSERT INTO `marks` (`id`, `student_id`, `course_id`, `assessment_name`, `marks_obtained`, `maximum_marks`, `entered_by`) VALUES
(1, 1, 1, 'Internal Assessment 1', 46.00, 50.00, 2),
(2, 1, 2, 'Mid-Term Exam', 44.50, 50.00, 2),
(3, 1, 3, 'Lab Practical 1', 19.00, 20.00, 2),
(4, 7, 1, 'Internal Assessment 1', 38.00, 50.00, 2);
