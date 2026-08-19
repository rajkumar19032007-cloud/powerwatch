/**
 * CampusOS Backend — Student Protected Routes (routes/studentRoutes.js)
 * Phase 10 & Phase 12: Attendance, Assignments & Marks
 * All endpoints require valid JWT authentication and 'student' role.
 */

const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const { getStudentAttendance } = require('../controllers/attendanceController');
const {
  submitAssignment,
  getStudentAssignments,
} = require('../controllers/assignmentController');
const { getStudentMarks } = require('../controllers/marksController');

const router = express.Router();

// Apply global authentication and student role authorization
router.use(verifyToken);
router.use(requireRole('student'));

// GET /api/student/test — Role verification
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Access granted: Student role authorized.',
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

// 1. Student Attendance
router.get('/attendance', getStudentAttendance);

// 2. Student Assignments & Submissions
router.get('/assignments', getStudentAssignments);
router.post('/assignments/:id/submit', submitAssignment);

// 3. Student Marks & Performance
router.get('/marks', getStudentMarks);

module.exports = router;
