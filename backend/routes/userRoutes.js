/**
 * CampusOS Backend — User Routes (routes/userRoutes.js)
 * Phase 9: Frontend + Backend + MySQL Integration
 */

const express = require('express');
const { getUserSummary } = require('../controllers/userController');

const router = express.Router();

// GET /api/users/summary — Retrieve safe aggregate user metrics
router.get('/summary', getUserSummary);

module.exports = router;
