/**
 * CampusOS Backend — Student Management Controller (controllers/studentController.js)
 * Phase 11: Real Student Management for Administrators
 * Handles CRUD operations for student records in MySQL with parameterized SQL & bcrypt hashing.
 */

const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

/**
 * Get all students with optional search and department filtering
 * GET /api/admin/students?search=alex&department_id=1
 */
const getStudents = async (req, res) => {
  try {
    const { search, department_id } = req.query;

    let sql = `
      SELECT 
        u.id, 
        u.first_name, 
        u.last_name, 
        u.email, 
        u.role, 
        u.department_id, 
        u.created_at, 
        u.updated_at,
        d.name AS department_name, 
        d.code AS department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.role = 'student'
    `;
    const params = [];

    // Filter by search query (First Name, Last Name, Full Name, Email, or ID)
    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      sql += ` AND (
        u.first_name LIKE ? OR 
        u.last_name LIKE ? OR 
        CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR 
        u.email LIKE ? OR 
        u.id = ?
      )`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, parseInt(search.trim(), 10) || 0);
    }

    // Filter by department
    if (department_id && department_id !== 'all' && department_id.trim() !== '') {
      sql += ` AND u.department_id = ?`;
      params.push(parseInt(department_id, 10));
    }

    sql += ` ORDER BY u.created_at DESC, u.id DESC`;

    const students = await query(sql, params);

    res.status(200).json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error('[CampusOS Student Controller - getStudents Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve student records.',
    });
  }
};

/**
 * Get a single student by ID
 * GET /api/admin/students/:id
 */
const getStudentById = async (req, res) => {
  try {
    const studentId = parseInt(req.params.id, 10);

    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format.',
      });
    }

    const sql = `
      SELECT 
        u.id, 
        u.first_name, 
        u.last_name, 
        u.email, 
        u.role, 
        u.department_id, 
        u.created_at, 
        u.updated_at,
        d.name AS department_name, 
        d.code AS department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ? AND u.role = 'student'
      LIMIT 1
    `;
    const students = await query(sql, [studentId]);

    if (!students || students.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Student with ID ${studentId} not found.`,
      });
    }

    res.status(200).json({
      success: true,
      data: students[0],
    });
  } catch (error) {
    console.error('[CampusOS Student Controller - getStudentById Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve student details.',
    });
  }
};

/**
 * Create a new student account
 * POST /api/admin/students
 */
const createStudent = async (req, res) => {
  try {
    const { first_name, last_name, email, department_id, password } = req.body;

    // 1. Validation
    if (!first_name || !last_name || !email || !department_id || !password) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email, department, and password are required.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // 2. Check duplicate email in users table
    const existingUser = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [
      email.trim().toLowerCase(),
    ]);

    if (existingUser && existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A user account with this email address already exists.',
      });
    }

    // 3. Hash password using bcrypt (10 rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Insert student record into users table
    const insertSql = `
      INSERT INTO users (first_name, last_name, email, password_hash, role, department_id)
      VALUES (?, ?, ?, ?, 'student', ?)
    `;
    const result = await query(insertSql, [
      first_name.trim(),
      last_name.trim(),
      email.trim().toLowerCase(),
      passwordHash,
      parseInt(department_id, 10),
    ]);

    const newStudentId = result.insertId;

    // 5. Query newly created student with department metadata
    const newStudent = await query(
      `
      SELECT 
        u.id, 
        u.first_name, 
        u.last_name, 
        u.email, 
        u.role, 
        u.department_id, 
        u.created_at, 
        u.updated_at,
        d.name AS department_name, 
        d.code AS department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
      LIMIT 1
    `,
      [newStudentId]
    );

    res.status(201).json({
      success: true,
      message: 'Student account created successfully',
      data: newStudent[0],
    });
  } catch (error) {
    console.error('[CampusOS Student Controller - createStudent Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to create student account.',
    });
  }
};

/**
 * Update an existing student account
 * PUT /api/admin/students/:id
 */
const updateStudent = async (req, res) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    const { first_name, last_name, email, department_id, password } = req.body;

    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format.',
      });
    }

    // 1. Verify student exists
    const existing = await query('SELECT id, password_hash FROM users WHERE id = ? AND role = "student" LIMIT 1', [
      studentId,
    ]);

    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Student with ID ${studentId} not found.`,
      });
    }

    // 2. Validate input
    if (!first_name || !last_name || !email || !department_id) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email, and department are required.',
      });
    }

    // 3. Check for email collision with other users
    const duplicateEmail = await query('SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1', [
      email.trim().toLowerCase(),
      studentId,
    ]);

    if (duplicateEmail && duplicateEmail.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Another user account already uses this email address.',
      });
    }

    // 4. Update student record (role remains strictly 'student')
    if (password && password.trim() !== '') {
      const passwordHash = await bcrypt.hash(password, 10);
      const updateSql = `
        UPDATE users 
        SET first_name = ?, last_name = ?, email = ?, department_id = ?, password_hash = ?
        WHERE id = ? AND role = 'student'
      `;
      await query(updateSql, [
        first_name.trim(),
        last_name.trim(),
        email.trim().toLowerCase(),
        parseInt(department_id, 10),
        passwordHash,
        studentId,
      ]);
    } else {
      const updateSql = `
        UPDATE users 
        SET first_name = ?, last_name = ?, email = ?, department_id = ?
        WHERE id = ? AND role = 'student'
      `;
      await query(updateSql, [
        first_name.trim(),
        last_name.trim(),
        email.trim().toLowerCase(),
        parseInt(department_id, 10),
        studentId,
      ]);
    }

    // 5. Return updated student record
    const updated = await query(
      `
      SELECT 
        u.id, 
        u.first_name, 
        u.last_name, 
        u.email, 
        u.role, 
        u.department_id, 
        u.created_at, 
        u.updated_at,
        d.name AS department_name, 
        d.code AS department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
      LIMIT 1
    `,
      [studentId]
    );

    res.status(200).json({
      success: true,
      message: 'Student account updated successfully',
      data: updated[0],
    });
  } catch (error) {
    console.error('[CampusOS Student Controller - updateStudent Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to update student record.',
    });
  }
};

/**
 * Delete a student account
 * DELETE /api/admin/students/:id
 */
const deleteStudent = async (req, res) => {
  try {
    const studentId = parseInt(req.params.id, 10);

    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format.',
      });
    }

    // 1. Check if student exists
    const existing = await query('SELECT id FROM users WHERE id = ? AND role = "student" LIMIT 1', [
      studentId,
    ]);

    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Student with ID ${studentId} not found.`,
      });
    }

    // 2. Perform deletion
    await query('DELETE FROM users WHERE id = ? AND role = "student"', [studentId]);

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    console.error('[CampusOS Student Controller - deleteStudent Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to delete student account. The record may be referenced by academic entities.',
    });
  }
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
};
