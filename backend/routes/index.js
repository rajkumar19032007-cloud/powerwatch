/**
 * CampusOS Backend — Central API Router (routes/index.js)
 * Mounts all functional sub-routers, auth routers, and core system endpoints.
 */

const express = require('express');
const { getApiInfo, getHealth, getDbTest } = require('../controllers/index');
const authRoutes = require('./authRoutes');
const departmentRoutes = require('./departmentRoutes');
const courseRoutes = require('./courseRoutes');
const announcementRoutes = require('./announcementRoutes');
const userRoutes = require('./userRoutes');
const studentRoutes = require('./studentRoutes');
const facultyRoutes = require('./facultyRoutes');
const adminRoutes = require('./adminRoutes');
const assignmentRoutes = require('./assignmentRoutes');

const router = express.Router();

// Core System Endpoints
router.get('/', getApiInfo);
router.get('/health', getHealth);
router.get('/db-test', getDbTest);

// Authentication Router
router.use('/auth', authRoutes);

// Public / General Resource Sub-Routers
router.use('/departments', departmentRoutes);
router.use('/courses', courseRoutes);
router.use('/announcements', announcementRoutes);
router.use('/users', userRoutes);
router.use('/assignments', assignmentRoutes);

// Role-Protected Sub-Routers
router.use('/student', studentRoutes);
router.use('/faculty', facultyRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
