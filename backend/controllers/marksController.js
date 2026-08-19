/**
 * CampusOS Backend — Marks Controller (controllers/marksController.js)
 * Phase 12: Attendance, Assignments & Marks
 * Handles faculty marks entry, grade updates, and student academic performance metrics.
 */

const { query } = require('../config/db');

/**
 * Record student assessment marks
 * POST /api/faculty/marks
 */
const enterMarks = async (req, res) => {
  try {
    const { student_id, course_id, assessment_name, marks_obtained, maximum_marks } = req.body;
    const entered_by = req.user.id;

    // 1. Validation
    if (!student_id || !course_id || !assessment_name || marks_obtained === undefined || maximum_marks === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Student ID, course ID, assessment name, marks obtained, and maximum marks are required.',
      });
    }

    const obtained = parseFloat(marks_obtained);
    const max = parseFloat(maximum_marks);

    if (isNaN(obtained) || isNaN(max) || obtained < 0 || max <= 0 || obtained > max) {
      return res.status(400).json({
        success: false,
        message: 'Marks obtained must be between 0 and maximum marks (maximum marks must be greater than 0).',
      });
    }

    const sql = `
      INSERT INTO marks (student_id, course_id, assessment_name, marks_obtained, maximum_marks, entered_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      parseInt(student_id, 10),
      parseInt(course_id, 10),
      assessment_name.trim(),
      obtained,
      max,
      entered_by,
    ]);

    res.status(201).json({
      success: true,
      message: 'Marks entered successfully',
      data: {
        id: result.insertId,
        student_id,
        course_id,
        assessment_name,
        marks_obtained: obtained,
        maximum_marks: max,
      },
    });
  } catch (error) {
    console.error('[CampusOS Marks - enterMarks Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to enter student marks.',
    });
  }
};

/**
 * Get marks roster for faculty view
 * GET /api/faculty/marks?course_id=1&student_id=1
 */
const getFacultyMarks = async (req, res) => {
  try {
    const { course_id, student_id } = req.query;

    let sql = `
      SELECT 
        m.id, 
        m.student_id, 
        m.course_id, 
        m.assessment_name, 
        m.marks_obtained, 
        m.maximum_marks, 
        m.created_at,
        u.first_name, 
        u.last_name, 
        u.email,
        c.name AS course_name, 
        c.code AS course_code,
        ROUND((m.marks_obtained / m.maximum_marks) * 100, 1) AS percentage
      FROM marks m
      JOIN users u ON m.student_id = u.id
      JOIN courses c ON m.course_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (course_id && course_id !== 'all') {
      sql += ` AND m.course_id = ?`;
      params.push(parseInt(course_id, 10));
    }

    if (student_id && student_id !== 'all') {
      sql += ` AND m.student_id = ?`;
      params.push(parseInt(student_id, 10));
    }

    sql += ` ORDER BY m.created_at DESC, u.last_name ASC`;

    const marks = await query(sql, params);

    res.status(200).json({
      success: true,
      data: marks,
    });
  } catch (error) {
    console.error('[CampusOS Marks - getFacultyMarks Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve faculty marks roster.',
    });
  }
};

/**
 * Update assessment marks
 * PUT /api/faculty/marks/:id
 */
const updateMarks = async (req, res) => {
  try {
    const marksId = parseInt(req.params.id, 10);
    const { assessment_name, marks_obtained, maximum_marks } = req.body;

    if (isNaN(marksId) || !assessment_name || marks_obtained === undefined || maximum_marks === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Assessment name, marks obtained, and maximum marks are required.',
      });
    }

    const obtained = parseFloat(marks_obtained);
    const max = parseFloat(maximum_marks);

    if (isNaN(obtained) || isNaN(max) || obtained < 0 || max <= 0 || obtained > max) {
      return res.status(400).json({
        success: false,
        message: 'Marks obtained must be between 0 and maximum marks (maximum marks must be greater than 0).',
      });
    }

    const result = await query(
      `UPDATE marks 
       SET assessment_name = ?, marks_obtained = ?, maximum_marks = ?, entered_by = ?
       WHERE id = ?`,
      [assessment_name.trim(), obtained, max, req.user.id, marksId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Marks record not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Marks updated successfully',
    });
  } catch (error) {
    console.error('[CampusOS Marks - updateMarks Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to update marks record.',
    });
  }
};

/**
 * Get authenticated student's academic marks & performance analytics
 * GET /api/student/marks
 */
const getStudentMarks = async (req, res) => {
  try {
    const studentId = req.user.id;

    const sql = `
      SELECT 
        m.id, 
        m.course_id, 
        m.assessment_name, 
        m.marks_obtained, 
        m.maximum_marks, 
        m.created_at,
        c.name AS course_name, 
        c.code AS course_code, 
        c.credits,
        ROUND((m.marks_obtained / m.maximum_marks) * 100, 1) AS percentage
      FROM marks m
      JOIN courses c ON m.course_id = c.id
      WHERE m.student_id = ?
      ORDER BY m.created_at DESC
    `;
    const marks = await query(sql, [studentId]);

    // Calculate aggregate score
    let totalObtained = 0;
    let totalMax = 0;

    marks.forEach((m) => {
      totalObtained += parseFloat(m.marks_obtained) || 0;
      totalMax += parseFloat(m.maximum_marks) || 0;
    });

    const averagePercentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        average_percentage: averagePercentage,
        total_obtained: totalObtained,
        total_max: totalMax,
        marks,
      },
    });
  } catch (error) {
    console.error('[CampusOS Marks - getStudentMarks Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve student marks.',
    });
  }
};

module.exports = {
  enterMarks,
  getFacultyMarks,
  updateMarks,
  getStudentMarks,
};
