/**
 * CampusOS Backend — Announcement Controller (controllers/announcementController.js)
 * Phase 9: Frontend + Backend + MySQL Integration
 * Handles read operations for campus notices and announcements.
 */

const { query } = require('../config/db');

/**
 * Get all announcements sorted newest first
 * GET /api/announcements
 */
const getAnnouncements = async (req, res) => {
  try {
    const sql = `
      SELECT 
        a.id, 
        a.title, 
        a.content, 
        a.audience, 
        a.created_at,
        a.updated_at,
        CONCAT(u.first_name, ' ', u.last_name) AS author_name,
        u.role AS author_role
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      ORDER BY a.created_at DESC
      LIMIT 20
    `;
    const announcements = await query(sql);

    res.status(200).json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    console.error('[CampusOS Announcement Controller Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve announcements',
    });
  }
};

module.exports = {
  getAnnouncements,
};
