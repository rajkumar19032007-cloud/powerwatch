/**
 * CampusOS Backend — Assignment Controller (controllers/assignmentController.js)
 * Phase 12: Attendance, Assignments & Marks
 * Handles assignment creation, student submissions, and status tracking.
 */

const { query } = require('../config/db');

/**
 * Create a new assignment
 * POST /api/faculty/assignments
 */
const createAssignment = async (req, res) => {
  try {
    const { course_id, title, description, due_date } = req.body;
    const created_by = req.user.id;

    if (!course_id || !title || !due_date) {
      return res.status(400).json({
        success: false,
        message: 'Course ID, title, and due date are required.',
      });
    }

    const sql = `
      INSERT INTO assignments (course_id, title, description, due_date, created_by)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      parseInt(course_id, 10),
      title.trim(),
      description ? description.trim() : '',
      due_date,
      created_by,
    ]);

    const newAssignment = await query(
      `
      SELECT a.*, c.name AS course_name, c.code AS course_code
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      WHERE a.id = ?
    `,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Assignment published successfully',
      data: newAssignment[0],
    });
  } catch (error) {
    console.error('[CampusOS Assignment - createAssignment Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to create assignment.',
    });
  }
};

/**
 * Get all assignments with course details (Authenticated users)
 * GET /api/assignments
 */
const getAssignments = async (req, res) => {
  try {
    const sql = `
      SELECT 
        a.id, 
        a.course_id, 
        a.title, 
        a.description, 
        a.due_date, 
        a.created_at,
        c.name AS course_name, 
        c.code AS course_code,
        CONCAT(u.first_name, ' ', u.last_name) AS creator_name,
        (SELECT COUNT(*) FROM assignment_submissions s WHERE s.assignment_id = a.id) AS submissions_count
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      LEFT JOIN users u ON a.created_by = u.id
      ORDER BY a.due_date ASC, a.created_at DESC
    `;
    const assignments = await query(sql);

    res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    console.error('[CampusOS Assignment - getAssignments Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve assignments list.',
    });
  }
};

/**
 * Update an assignment
 * PUT /api/faculty/assignments/:id
 */
const updateAssignment = async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.id, 10);
    const { title, description, due_date } = req.body;

    if (isNaN(assignmentId) || !title || !due_date) {
      return res.status(400).json({
        success: false,
        message: 'Valid assignment ID, title, and due date are required.',
      });
    }

    const sql = `
      UPDATE assignments
      SET title = ?, description = ?, due_date = ?
      WHERE id = ?
    `;
    const result = await query(sql, [
      title.trim(),
      description ? description.trim() : '',
      due_date,
      assignmentId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
    });
  } catch (error) {
    console.error('[CampusOS Assignment - updateAssignment Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to update assignment.',
    });
  }
};

/**
 * Delete an assignment
 * DELETE /api/faculty/assignments/:id
 */
const deleteAssignment = async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.id, 10);

    if (isNaN(assignmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID format.',
      });
    }

    const result = await query('DELETE FROM assignments WHERE id = ?', [assignmentId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully',
    });
  } catch (error) {
    console.error('[CampusOS Assignment - deleteAssignment Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to delete assignment.',
    });
  }
};

/**
 * Submit coursework text for an assignment
 * POST /api/student/assignments/:id/submit
 */
const submitAssignment = async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.id, 10);
    const studentId = req.user.id;
    const { submission_text } = req.body;

    if (isNaN(assignmentId) || !submission_text || submission_text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Submission text is required.',
      });
    }

    // Check if assignment exists
    const assignmentCheck = await query('SELECT id, title FROM assignments WHERE id = ? LIMIT 1', [
      assignmentId,
    ]);

    if (!assignmentCheck || assignmentCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assignment does not exist.',
      });
    }

    // Check for existing submission
    const existing = await query(
      'SELECT id FROM assignment_submissions WHERE assignment_id = ? AND student_id = ? LIMIT 1',
      [assignmentId, studentId]
    );

    if (existing && existing.length > 0) {
      // Update existing submission
      await query(
        `UPDATE assignment_submissions 
         SET submission_text = ?, submitted_at = CURRENT_TIMESTAMP, status = 'submitted'
         WHERE assignment_id = ? AND student_id = ?`,
        [submission_text.trim(), assignmentId, studentId]
      );

      return res.status(200).json({
        success: true,
        message: 'Assignment submission updated successfully',
      });
    }

    // Insert new submission
    const insertSql = `
      INSERT INTO assignment_submissions (assignment_id, student_id, submission_text, status)
      VALUES (?, ?, ?, 'submitted')
    `;
    await query(insertSql, [assignmentId, studentId, submission_text.trim()]);

    res.status(201).json({
      success: true,
      message: 'Assignment submitted successfully',
    });
  } catch (error) {
    console.error('[CampusOS Assignment - submitAssignment Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to submit assignment.',
    });
  }
};

/**
 * Get assignments list with student submission status
 * GET /api/student/assignments
 */
const getStudentAssignments = async (req, res) => {
  try {
    const studentId = req.user.id;

    const sql = `
      SELECT 
        a.id, 
        a.course_id, 
        a.title, 
        a.description, 
        a.due_date, 
        c.name AS course_name, 
        c.code AS course_code,
        CONCAT(u.first_name, ' ', u.last_name) AS creator_name,
        COALESCE(s.status, 'pending') AS submission_status,
        s.submission_text,
        s.submitted_at
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.student_id = ?
      ORDER BY a.due_date ASC
    `;
    const assignments = await query(sql, [studentId]);

    res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    console.error('[CampusOS Assignment - getStudentAssignments Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve student assignments.',
    });
  }
};

module.exports = {
  createAssignment,
  getAssignments,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getStudentAssignments,
};
