/**
 * CampusOS Backend — Admin Protected Routes (routes/adminRoutes.js)
 * Phase 10, 11, 12 & Phase 13: Reports & Analytics
 * All routes require valid JWT authentication and 'admin' role authorization.
 */

const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
} = require('../controllers/studentController');
const { getAcademicOverview } = require('../controllers/academicController');
const {
  getReportsOverview,
  getReportsAttendance,
  getReportsPerformance,
  getReportsAssignments,
  getReportsStudents,
} = require('../controllers/reportController');

const router = express.Router();

// Apply global authentication and admin role requirement to all /api/admin routes
router.use(verifyToken);
router.use(requireRole('admin'));

// GET /api/admin/test — Admin authorization verification
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Access granted: Administrator role authorized.',
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

// 1. Institutional Academic Overview (Phase 12)
router.get('/academic-overview', getAcademicOverview);

// 2. Full Reporting & Analytics Endpoints (Phase 13)
router.get('/reports/overview', getReportsOverview);
router.get('/reports/attendance', getReportsAttendance);
router.get('/reports/performance', getReportsPerformance);
router.get('/reports/assignments', getReportsAssignments);
router.get('/reports/students', getReportsStudents);

// 3. Student Management Endpoints (Phase 11)
router.get('/students', getStudents);
router.post('/students', createStudent);
router.get('/students/:id', getStudentById);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

module.exports = router;
