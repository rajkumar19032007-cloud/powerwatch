/**
 * CampusOS Backend — Department Controller (controllers/departmentController.js)
 * Phase 9: Frontend + Backend + MySQL Integration
 * Handles read operations for academic departments.
 */

const { query } = require('../config/db');

/**
 * Get all academic departments
 * GET /api/departments
 */
const getDepartments = async (req, res) => {
  try {
    const sql = `
      SELECT 
        id, 
        name, 
        code, 
        description, 
        created_at 
      FROM departments 
      ORDER BY name ASC
    `;
    const departments = await query(sql);

    res.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error) {
    console.error('[CampusOS Department Controller Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve departments',
    });
  }
};

module.exports = {
  getDepartments,
};
