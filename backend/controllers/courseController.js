/**
 * CampusOS Backend — Course Controller (controllers/courseController.js)
 * Phase 9: Frontend + Backend + MySQL Integration
 * Handles read operations for academic courses with department associations.
 */

const { query } = require('../config/db');

/**
 * Get all courses with department metadata
 * GET /api/courses
 */
const getCourses = async (req, res) => {
  try {
    const sql = `
      SELECT 
        c.id, 
        c.name, 
        c.code, 
        c.credits, 
        c.department_id, 
        c.created_at,
        d.name AS department_name, 
        d.code AS department_code
      FROM courses c
      LEFT JOIN departments d ON c.department_id = d.id
      ORDER BY c.code ASC
    `;
    const courses = await query(sql);

    res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error('[CampusOS Course Controller Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve courses',
    });
  }
};

module.exports = {
  getCourses,
};
