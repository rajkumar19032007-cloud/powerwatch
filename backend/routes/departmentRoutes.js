/**
 * CampusOS Backend — Department Routes (routes/departmentRoutes.js)
 * Phase 9: Frontend + Backend + MySQL Integration
 */

const express = require('express');
const { getDepartments } = require('../controllers/departmentController');

const router = express.Router();

// GET /api/departments — Retrieve all academic departments
router.get('/', getDepartments);

module.exports = router;
