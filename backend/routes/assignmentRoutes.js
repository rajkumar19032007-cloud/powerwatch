/**
 * CampusOS Backend — Assignments General Routes (routes/assignmentRoutes.js)
 * Phase 12: Attendance, Assignments & Marks
 */

const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { getAssignments } = require('../controllers/assignmentController');

const router = express.Router();

// GET /api/assignments — Get all assignments (authenticated users)
router.get('/', verifyToken, getAssignments);

module.exports = router;
