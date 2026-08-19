/**
 * CampusOS Backend — User Controller (controllers/userController.js)
 * Phase 9: Frontend + Backend + MySQL Integration
 * Handles safe read operations and aggregate summaries for users.
 */

const { query } = require('../config/db');

/**
 * Get safe user role counts and metrics
 * GET /api/users/summary
 */
const getUserSummary = async (req, res) => {
  try {
    const sql = `
      SELECT 
        role, 
        COUNT(*) AS count 
      FROM users 
      GROUP BY role
    `;
    const rows = await query(sql);

    // Build structured aggregate object
    const summary = {
      students: 0,
      faculty: 0,
      admins: 0,
      total: 0,
    };

    rows.forEach((row) => {
      const count = parseInt(row.count, 10) || 0;
      summary.total += count;

      if (row.role === 'student') summary.students = count;
      if (row.role === 'faculty') summary.faculty = count;
      if (row.role === 'admin') summary.admins = count;
    });

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('[CampusOS User Controller Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve user summary',
    });
  }
};

module.exports = {
  getUserSummary,
};
