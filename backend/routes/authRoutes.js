/**
 * CampusOS Backend — Authentication Routes (routes/authRoutes.js)
 * Phase 10: Authentication & Role-Based Access
 */

const express = require('express');
const { login, getMe } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/auth/login — User login
router.post('/login', login);

// GET /api/auth/me — Verified user profile
router.get('/me', verifyToken, getMe);

module.exports = router;
