/**
 * CampusOS Backend — Attendance Controller (controllers/attendanceController.js)
 * Phase 12: Attendance, Assignments & Marks
 * Handles faculty attendance marking & student attendance progress calculation.
 */

const { query } = require('../config/db');

/**
 * Record or update student attendance for a course session
 * POST /api/faculty/attendance
 */
const markAttendance = async (req, res) => {
  try {
    const { student_id, course_id, attendance_date, status } = req.body;
    const marked_by = req.user.id;

    // 1. Validation
    if (!student_id || !course_id || !attendance_date || !status) {
      return res.status(400).json({
        success: false,
        message: 'Student ID, course ID, date, and status (present/absent) are required.',
      });
    }

    const normalizedStatus = status.toLowerCase().trim();
    if (normalizedStatus !== 'present' && normalizedStatus !== 'absent') {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'present' or 'absent'.",
      });
    }

    // 2. Upsert attendance record
    const sql = `
      INSERT INTO attendance (student_id, course_id, attendance_date, status, marked_by)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        status = VALUES(status), 
        marked_by = VALUES(marked_by)
    `;
    await query(sql, [
      parseInt(student_id, 10),
      parseInt(course_id, 10),
      attendance_date,
      normalizedStatus,
      marked_by,
    ]);

    res.status(200).json({
      success: true,
      message: 'Attendance recorded successfully',
    });
  } catch (error) {
    console.error('[CampusOS Attendance - markAttendance Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to record attendance.',
    });
  }
};

/**
 * Get attendance records for faculty view with filters
 * GET /api/faculty/attendance?course_id=1&attendance_date=2026-08-19
 */
const getFacultyAttendance = async (req, res) => {
  try {
    const { course_id, attendance_date } = req.query;

    let sql = `
      SELECT 
        a.id, 
        a.student_id, 
        a.course_id, 
        a.attendance_date, 
        a.status, 
        a.created_at,
        u.first_name, 
        u.last_name, 
        u.email,
        c.name AS course_name, 
        c.code AS course_code
      FROM attendance a
      JOIN users u ON a.student_id = u.id
      JOIN courses c ON a.course_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (course_id && course_id !== 'all') {
      sql += ` AND a.course_id = ?`;
      params.push(parseInt(course_id, 10));
    }

    if (attendance_date && attendance_date.trim() !== '') {
      sql += ` AND a.attendance_date = ?`;
      params.push(attendance_date.trim());
    }

    sql += ` ORDER BY a.attendance_date DESC, u.last_name ASC`;

    const records = await query(sql, params);

    res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error('[CampusOS Attendance - getFacultyAttendance Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve faculty attendance list.',
    });
  }
};

/**
 * Update an existing attendance record status
 * PUT /api/faculty/attendance/:id
 */
const updateAttendance = async (req, res) => {
  try {
    const attendanceId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (isNaN(attendanceId) || !status) {
      return res.status(400).json({
        success: false,
        message: 'Valid attendance ID and status are required.',
      });
    }

    const normalizedStatus = status.toLowerCase().trim();
    if (normalizedStatus !== 'present' && normalizedStatus !== 'absent') {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'present' or 'absent'.",
      });
    }

    const result = await query(
      'UPDATE attendance SET status = ?, marked_by = ? WHERE id = ?',
      [normalizedStatus, req.user.id, attendanceId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully',
    });
  } catch (error) {
    console.error('[CampusOS Attendance - updateAttendance Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to update attendance record.',
    });
  }
};

/**
 * Get authenticated student's attendance summary & course-wise percentages
 * GET /api/student/attendance
 */
const getStudentAttendance = async (req, res) => {
  try {
    const studentId = req.user.id;

    // 1. Calculate course-wise statistics
    const courseStatsSql = `
      SELECT 
        c.id AS course_id, 
        c.name AS course_name, 
        c.code AS course_code, 
        c.credits,
        COUNT(a.id) AS total_classes,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS attended_classes
      FROM courses c
      JOIN attendance a ON a.course_id = c.id
      WHERE a.student_id = ?
      GROUP BY c.id, c.name, c.code, c.credits
      ORDER BY c.code ASC
    `;
    const courseStats = await query(courseStatsSql, [studentId]);

    // 2. Fetch raw recent attendance log (last 20 entries)
    const logSql = `
      SELECT 
        a.id, 
        a.course_id, 
        a.attendance_date, 
        a.status,
        c.name AS course_name, 
        c.code AS course_code
      FROM attendance a
      JOIN courses c ON a.course_id = c.id
      WHERE a.student_id = ?
      ORDER BY a.attendance_date DESC
      LIMIT 20
    `;
    const logs = await query(logSql, [studentId]);

    // 3. Compute overall percentage
    let totalClasses = 0;
    let totalAttended = 0;

    const breakdown = courseStats.map((item) => {
      const total = parseInt(item.total_classes, 10) || 0;
      const attended = parseInt(item.attended_classes, 10) || 0;
      const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;

      totalClasses += total;
      totalAttended += attended;

      return {
        course_id: item.course_id,
        course_name: item.course_name,
        course_code: item.course_code,
        credits: item.credits,
        total_classes: total,
        attended_classes: attended,
        percentage,
      };
    });

    const overallPercentage = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        overall_percentage: overallPercentage,
        total_classes: totalClasses,
        total_attended: totalAttended,
        courses: breakdown,
        history: logs,
      },
    });
  } catch (error) {
    console.error('[CampusOS Attendance - getStudentAttendance Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve student attendance details.',
    });
  }
};

module.exports = {
  markAttendance,
  getFacultyAttendance,
  updateAttendance,
  getStudentAttendance,
};
