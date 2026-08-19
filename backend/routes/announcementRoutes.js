/**
 * CampusOS Backend — Announcement Routes (routes/announcementRoutes.js)
 * Phase 9: Frontend + Backend + MySQL Integration
 */

const express = require('express');
const { getAnnouncements } = require('../controllers/announcementController');

const router = express.Router();

// GET /api/announcements — Retrieve recent announcements
router.get('/', getAnnouncements);

module.exports = router;
