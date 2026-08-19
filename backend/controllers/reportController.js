/**
 * CampusOS Backend — Reports & Analytics Controller (controllers/reportController.js)
 * Phase 13: Reports & Analytics
 * Performs SQL aggregation across users, attendance, assignments, and marks.
 */

const { query } = require('../config/db');

/**
 * Get top-level institutional overview statistics and student distributions
 * GET /api/admin/reports/overview
 */
const getReportsOverview = async (req, res) => {
  try {
    // 1. Entity Counts
    const countsSql = `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'student') AS total_students,
        (SELECT COUNT(*) FROM users WHERE role = 'faculty') AS total_faculty,
        (SELECT COUNT(*) FROM departments) AS total_departments,
        (SELECT COUNT(*) FROM courses) AS total_courses
    `;
    const countsRes = await query(countsSql);
    const totalStudents = parseInt(countsRes[0]?.total_students, 10) || 0;
    const totalFaculty = parseInt(countsRes[0]?.total_faculty, 10) || 0;
    const totalDepartments = parseInt(countsRes[0]?.total_departments, 10) || 0;
    const totalCourses = parseInt(countsRes[0]?.total_courses, 10) || 0;

    // 2. Attendance Rate
    const attSql = `
      SELECT 
        COUNT(*) AS total_sessions,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS attended_sessions
      FROM attendance
    `;
    const attRes = await query(attSql);
    const totalAttSessions = parseInt(attRes[0]?.total_sessions, 10) || 0;
    const totalAttended = parseInt(attRes[0]?.attended_sessions, 10) || 0;
    const attendanceRate = totalAttSessions > 0 ? Math.round((totalAttended / totalAttSessions) * 100) : 0;

    // 3. Assignment Metrics
    const assignSql = `
      SELECT 
        (SELECT COUNT(*) FROM assignments) AS total_assignments,
        (SELECT COUNT(*) FROM assignment_submissions WHERE status = 'submitted') AS total_submissions
    `;
    const assignRes = await query(assignSql);
    const totalAssignments = parseInt(assignRes[0]?.total_assignments, 10) || 0;
    const totalSubmissions = parseInt(assignRes[0]?.total_submissions, 10) || 0;
    const expectedSubmissions = totalAssignments * Math.max(totalStudents, 1);
    const assignmentCompletion = expectedSubmissions > 0 ? Math.round((totalSubmissions / expectedSubmissions) * 100) : 0;

    // 4. Academic Performance Average
    const marksSql = `
      SELECT 
        SUM(marks_obtained) AS total_obtained,
        SUM(maximum_marks) AS total_max
      FROM marks
    `;
    const marksRes = await query(marksSql);
    const totalObtained = parseFloat(marksRes[0]?.total_obtained) || 0;
    const totalMax = parseFloat(marksRes[0]?.total_max) || 0;
    const averagePerformance = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;

    // 5. Department-wise Student Distribution
    const deptDistSql = `
      SELECT 
        d.id, 
        d.name AS department_name, 
        d.code AS department_code,
        COUNT(u.id) AS student_count
      FROM departments d
      LEFT JOIN users u ON u.department_id = d.id AND u.role = 'student'
      GROUP BY d.id, d.name, d.code
      ORDER BY student_count DESC, d.name ASC
    `;
    const deptDistribution = await query(deptDistSql);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          total_students: totalStudents,
          total_faculty: totalFaculty,
          total_departments: totalDepartments,
          total_courses: totalCourses,
          attendance_rate: attendanceRate,
          assignment_completion_rate: assignmentCompletion,
          average_performance: averagePerformance,
        },
        department_distribution: deptDistDistributionMap(deptDistribution),
      },
    });
  } catch (error) {
    console.error('[CampusOS Reports - getReportsOverview Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve reporting overview.',
    });
  }
};

function deptDistDistributionMap(rows) {
  return rows.map((r) => ({
    department_id: r.id,
    department_name: r.department_name,
    department_code: r.department_code,
    student_count: parseInt(r.student_count, 10) || 0,
  }));
}

/**
 * Get attendance report aggregated by department, course, and date range
 * GET /api/admin/reports/attendance?department_id=1&course_id=1&start_date=2026-08-01&end_date=2026-08-31
 */
const getReportsAttendance = async (req, res) => {
  try {
    const { department_id, course_id, start_date, end_date } = req.query;

    // Department Breakdown Query
    let deptSql = `
      SELECT 
        d.id AS department_id, 
        d.name AS department_name, 
        d.code AS department_code,
        COUNT(a.id) AS total_sessions,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS attended_sessions
      FROM departments d
      JOIN courses c ON c.department_id = d.id
      JOIN attendance a ON a.course_id = c.id
      WHERE 1=1
    `;
    const deptParams = [];

    if (department_id && department_id !== 'all') {
      deptSql += ` AND d.id = ?`;
      deptParams.push(parseInt(department_id, 10));
    }
    if (course_id && course_id !== 'all') {
      deptSql += ` AND c.id = ?`;
      deptParams.push(parseInt(course_id, 10));
    }
    if (start_date) {
      deptSql += ` AND a.attendance_date >= ?`;
      deptParams.push(start_date);
    }
    if (end_date) {
      deptSql += ` AND a.attendance_date <= ?`;
      deptParams.push(end_date);
    }

    deptSql += ` GROUP BY d.id, d.name, d.code ORDER BY d.name ASC`;
    const deptRows = await query(deptSql, deptParams);

    // Course Breakdown Query
    let courseSql = `
      SELECT 
        c.id AS course_id, 
        c.name AS course_name, 
        c.code AS course_code, 
        d.code AS department_code,
        COUNT(a.id) AS total_sessions,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS attended_sessions
      FROM courses c
      JOIN departments d ON c.department_id = d.id
      JOIN attendance a ON a.course_id = c.id
      WHERE 1=1
    `;
    const courseParams = [];

    if (department_id && department_id !== 'all') {
      courseSql += ` AND d.id = ?`;
      courseParams.push(parseInt(department_id, 10));
    }
    if (course_id && course_id !== 'all') {
      courseSql += ` AND c.id = ?`;
      courseParams.push(parseInt(course_id, 10));
    }
    if (start_date) {
      courseSql += ` AND a.attendance_date >= ?`;
      courseParams.push(start_date);
    }
    if (end_date) {
      courseSql += ` AND a.attendance_date <= ?`;
      courseParams.push(end_date);
    }

    courseSql += ` GROUP BY c.id, c.name, c.code, d.code ORDER BY c.code ASC`;
    const courseRows = await query(courseSql, courseParams);

    // Aggregate overall
    let totalAll = 0;
    let attendedAll = 0;

    const departmentBreakdown = deptRows.map((r) => {
      const tot = parseInt(r.total_sessions, 10) || 0;
      const att = parseInt(r.attended_sessions, 10) || 0;
      totalAll += tot;
      attendedAll += att;
      return {
        department_id: r.department_id,
        department_name: r.department_name,
        department_code: r.department_code,
        total_sessions: tot,
        attended_sessions: att,
        percentage: tot > 0 ? Math.round((att / tot) * 100) : 0,
      };
    });

    const courseBreakdown = courseRows.map((r) => {
      const tot = parseInt(r.total_sessions, 10) || 0;
      const att = parseInt(r.attended_sessions, 10) || 0;
      return {
        course_id: r.course_id,
        course_name: r.course_name,
        course_code: r.course_code,
        department_code: r.department_code,
        total_sessions: tot,
        attended_sessions: att,
        percentage: tot > 0 ? Math.round((att / tot) * 100) : 0,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        overall_attendance_rate: totalAll > 0 ? Math.round((attendedAll / totalAll) * 100) : 0,
        total_records: totalAll,
        attended_records: attendedAll,
        departments: departmentBreakdown,
        courses: courseBreakdown,
      },
    });
  } catch (error) {
    console.error('[CampusOS Reports - getReportsAttendance Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve attendance analytics.',
    });
  }
};

/**
 * Get academic performance reports (GPA, average marks by department and course)
 * GET /api/admin/reports/performance?department_id=1&course_id=1
 */
const getReportsPerformance = async (req, res) => {
  try {
    const { department_id, course_id } = req.query;

    let sql = `
      SELECT 
        d.name AS department_name, 
        d.code AS department_code,
        c.name AS course_name, 
        c.code AS course_code,
        COUNT(m.id) AS marks_count,
        SUM(m.marks_obtained) AS sum_obtained,
        SUM(m.maximum_marks) AS sum_max,
        ROUND((SUM(m.marks_obtained) / NULLIF(SUM(m.maximum_marks), 0)) * 100, 1) AS average_percentage
      FROM marks m
      JOIN courses c ON m.course_id = c.id
      JOIN departments d ON c.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (department_id && department_id !== 'all') {
      sql += ` AND d.id = ?`;
      params.push(parseInt(department_id, 10));
    }
    if (course_id && course_id !== 'all') {
      sql += ` AND c.id = ?`;
      params.push(parseInt(course_id, 10));
    }

    sql += ` GROUP BY d.name, d.code, c.name, c.code ORDER BY average_percentage DESC`;
    const rows = await query(sql, params);

    // Department Aggregates
    let totalObtained = 0;
    let totalMax = 0;

    const courseBreakdown = rows.map((r) => {
      const obt = parseFloat(r.sum_obtained) || 0;
      const max = parseFloat(r.sum_max) || 0;
      totalObtained += obt;
      totalMax += max;
      return {
        department_name: r.department_name,
        department_code: r.department_code,
        course_name: r.course_name,
        course_code: r.course_code,
        assessments_recorded: parseInt(r.marks_count, 10) || 0,
        average_percentage: parseFloat(r.average_percentage) || 0,
      };
    });

    const overallAverage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        overall_average: overallAverage,
        courses: courseBreakdown,
      },
    });
  } catch (error) {
    console.error('[CampusOS Reports - getReportsPerformance Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve academic performance analytics.',
    });
  }
};

/**
 * Get assignment submission metrics and completion rates
 * GET /api/admin/reports/assignments?department_id=1&course_id=1
 */
const getReportsAssignments = async (req, res) => {
  try {
    const { department_id, course_id } = req.query;

    let sql = `
      SELECT 
        a.id AS assignment_id, 
        a.title, 
        a.due_date,
        c.name AS course_name, 
        c.code AS course_code,
        d.code AS department_code,
        (SELECT COUNT(*) FROM users u WHERE u.role = 'student' AND (u.department_id = c.department_id OR c.department_id IS NULL)) AS enrolled_students,
        COUNT(s.id) AS submitted_count
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN departments d ON c.department_id = d.id
      LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.status = 'submitted'
      WHERE 1=1
    `;
    const params = [];

    if (department_id && department_id !== 'all') {
      sql += ` AND d.id = ?`;
      params.push(parseInt(department_id, 10));
    }
    if (course_id && course_id !== 'all') {
      sql += ` AND c.id = ?`;
      params.push(parseInt(course_id, 10));
    }

    sql += ` GROUP BY a.id, a.title, a.due_date, c.name, c.code, d.code, c.department_id ORDER BY a.due_date ASC`;
    const rows = await query(sql, params);

    let totalAssignments = rows.length;
    let totalSubmitted = 0;
    let totalExpected = 0;

    const assignmentList = rows.map((r) => {
      const enrolled = Math.max(parseInt(r.enrolled_students, 10) || 1, 1);
      const submitted = parseInt(r.submitted_count, 10) || 0;
      const pending = Math.max(enrolled - submitted, 0);
      const rate = Math.round((submitted / enrolled) * 100);

      totalSubmitted += submitted;
      totalExpected += enrolled;

      return {
        assignment_id: r.assignment_id,
        title: r.title,
        due_date: r.due_date,
        course_name: r.course_name,
        course_code: r.course_code,
        department_code: r.department_code,
        submitted_count: submitted,
        pending_count: pending,
        completion_rate: rate,
      };
    });

    const completionRate = totalExpected > 0 ? Math.round((totalSubmitted / totalExpected) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        total_assignments: totalAssignments,
        total_submitted: totalSubmitted,
        total_pending: Math.max(totalExpected - totalSubmitted, 0),
        completion_rate: completionRate,
        assignments: assignmentList,
      },
    });
  } catch (error) {
    console.error('[CampusOS Reports - getReportsAssignments Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve assignment analytics.',
    });
  }
};

/**
 * Get consolidated student performance leaderboard roster
 * GET /api/admin/reports/students?department_id=1
 */
const getReportsStudents = async (req, res) => {
  try {
    const { department_id } = req.query;

    let sql = `
      SELECT 
        u.id, 
        u.first_name, 
        u.last_name, 
        u.email,
        d.name AS department_name, 
        d.code AS department_code,
        (
          SELECT ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / NULLIF(COUNT(a.id), 0)) * 100)
          FROM attendance a
          WHERE a.student_id = u.id
        ) AS attendance_rate,
        (
          SELECT ROUND((SUM(m.marks_obtained) / NULLIF(SUM(m.maximum_marks), 0)) * 100, 1)
          FROM marks m
          WHERE m.student_id = u.id
        ) AS average_marks_percentage,
        (
          SELECT COUNT(s.id)
          FROM assignment_submissions s
          WHERE s.student_id = u.id AND s.status = 'submitted'
        ) AS assignments_submitted,
        (
          SELECT COUNT(*)
          FROM assignments
        ) AS total_assignments
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.role = 'student'
    `;
    const params = [];

    if (department_id && department_id !== 'all') {
      sql += ` AND u.department_id = ?`;
      params.push(parseInt(department_id, 10));
    }

    sql += ` ORDER BY average_marks_percentage DESC, attendance_rate DESC, u.last_name ASC`;
    const rows = await query(sql, params);

    const students = rows.map((s) => {
      const avgMarks = s.average_marks_percentage !== null ? parseFloat(s.average_marks_percentage) : 85.0;
      const attRate = s.attendance_rate !== null ? parseInt(s.attendance_rate, 10) : 90;
      const submitted = parseInt(s.assignments_submitted, 10) || 0;
      const totalAssign = parseInt(s.total_assignments, 10) || 1;
      const completion = Math.round((submitted / Math.max(totalAssign, 1)) * 100);

      let standing = 'Good Standing';
      if (avgMarks >= 90 && attRate >= 85) standing = "Dean's Honor List";
      else if (avgMarks >= 75 && attRate >= 75) standing = 'Good Standing';
      else if (avgMarks < 60 || attRate < 75) standing = 'Academic Advisory';

      return {
        id: s.id,
        first_name: s.first_name,
        last_name: s.last_name,
        full_name: `${s.first_name} ${s.last_name}`,
        email: s.email,
        department_name: s.department_name || 'General',
        department_code: s.department_code || 'GEN',
        attendance_rate: attRate,
        average_marks: avgMarks,
        assignments_submitted: submitted,
        total_assignments: totalAssign,
        assignment_completion: completion,
        standing,
      };
    });

    res.status(200).json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error('[CampusOS Reports - getReportsStudents Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve student performance report.',
    });
  }
};

module.exports = {
  getReportsOverview,
  getReportsAttendance,
  getReportsPerformance,
  getReportsAssignments,
  getReportsStudents,
};
