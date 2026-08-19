/**
 * CampusOS Backend — Course Routes (routes/courseRoutes.js)
 * Phase 9: Frontend + Backend + MySQL Integration
 */

const express = require('express');
const { getCourses } = require('../controllers/courseController');

const router = express.Router();

// GET /api/courses — Retrieve all courses with department metadata
router.get('/', getCourses);

module.exports = router;
