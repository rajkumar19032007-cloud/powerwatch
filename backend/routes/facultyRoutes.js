/**
 * CampusOS Backend — Faculty Protected Routes (routes/facultyRoutes.js)
 * Phase 10 & Phase 12: Attendance, Assignments & Marks Management
 * All endpoints require valid JWT authentication and 'faculty' role.
 */

const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const {
  markAttendance,
  getFacultyAttendance,
  updateAttendance,
} = require('../controllers/attendanceController');

const {
  createAssignment,
  updateAssignment,
  deleteAssignment,
} = require('../controllers/assignmentController');

const {
  enterMarks,
  getFacultyMarks,
  updateMarks,
} = require('../controllers/marksController');

const router = express.Router();

// Apply global authentication and faculty role authorization
router.use(verifyToken);
router.use(requireRole('faculty'));

// GET /api/faculty/test — Role verification
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Access granted: Faculty role authorized.',
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

// 1. Attendance Endpoints
router.post('/attendance', markAttendance);
router.get('/attendance', getFacultyAttendance);
router.put('/attendance/:id', updateAttendance);

// 2. Assignment Endpoints
router.post('/assignments', createAssignment);
router.put('/assignments/:id', updateAssignment);
router.delete('/assignments/:id', deleteAssignment);

// 3. Marks Endpoints
router.post('/marks', enterMarks);
router.get('/marks', getFacultyMarks);
router.put('/marks/:id', updateMarks);

module.exports = router;
