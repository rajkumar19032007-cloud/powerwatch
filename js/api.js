/**
 * CampusOS — Frontend API Client & Auth Guard (js/api.js)
 * Phase 9, 10, 11, 12 & Phase 13: Full Stack REST Client & Institutional Reporting
 * Centralized fetch helper for communicating with the Express REST API.
 */

const CampusAPI = (() => {
  // Base REST API URL
  const API_BASE_URL = 'http://localhost:5000/api';

  /**
   * Helper to retrieve stored JWT token
   * @returns {string|null}
   */
  function getToken() {
    try {
      return localStorage.getItem('campusos_token');
    } catch (e) {
      return null;
    }
  }

  /**
   * Generic safe fetch wrapper with automatic Authorization header
   * @param {string} endpoint
   * @param {object} options
   * @returns {Promise<{success: boolean, data: any, message?: string}>}
   */
  async function safeFetch(endpoint, options = {}) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const token = getToken();

      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        headers,
        ...options,
      });

      const json = await response.json();

      if (!response.ok) {
        return {
          success: false,
          data: null,
          message: json.message || `Server responded with status ${response.status}`,
          status: response.status,
        };
      }

      return json;
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Backend server is currently offline or unreachable.',
        networkError: true,
      };
    }
  }

  return {
    /**
     * User Login API
     * POST /api/auth/login
     */
    login: async (email, password) => {
      const result = await safeFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (result.success && result.data && result.data.token) {
        try {
          localStorage.setItem('campusos_token', result.data.token);
          localStorage.setItem('campusos_user', JSON.stringify(result.data.user));
        } catch (e) {
          console.warn('[CampusOS Auth Warning]: Could not persist token to localStorage.');
        }
      }

      return result;
    },

    /**
     * Verify and get authenticated user profile
     * GET /api/auth/me
     */
    getMe: () => safeFetch('/auth/me'),

    /**
     * Retrieve all academic departments
     * GET /api/departments
     */
    getDepartments: () => safeFetch('/departments'),

    /**
     * Retrieve all courses with department metadata
     * GET /api/courses
     */
    getCourses: () => safeFetch('/courses'),

    /**
     * Retrieve recent campus announcements
     * GET /api/announcements
     */
    getAnnouncements: () => safeFetch('/announcements'),

    /**
     * Retrieve safe aggregate user counts
     * GET /api/users/summary
     */
    getUserSummary: () => safeFetch('/users/summary'),

    /**
     * Check backend health status
     * GET /api/health
     */
    getHealth: () => safeFetch('/health'),

    /**
     * Check database connectivity
     * GET /api/db-test
     */
    getDbTest: () => safeFetch('/db-test'),

    /**
     * =========================================================================
     * Phase 11: Admin Student Management APIs
     * =========================================================================
     */
    getStudents: (params = {}) => {
      const query = new URLSearchParams();
      if (params.search && params.search.trim() !== '') {
        query.append('search', params.search.trim());
      }
      if (params.department_id && params.department_id !== 'all' && params.department_id !== '') {
        query.append('department_id', params.department_id);
      }
      const queryString = query.toString();
      return safeFetch(`/admin/students${queryString ? `?${queryString}` : ''}`);
    },

    getStudent: (id) => safeFetch(`/admin/students/${id}`),

    createStudent: (studentData) =>
      safeFetch('/admin/students', {
        method: 'POST',
        body: JSON.stringify(studentData),
      }),

    updateStudent: (id, studentData) =>
      safeFetch(`/admin/students/${id}`, {
        method: 'PUT',
        body: JSON.stringify(studentData),
      }),

    deleteStudent: (id) =>
      safeFetch(`/admin/students/${id}`, {
        method: 'DELETE',
      }),

    /**
     * =========================================================================
     * Phase 12: Core Academic APIs (Attendance, Assignments & Marks)
     * =========================================================================
     */

    // 1. Attendance APIs
    facultyMarkAttendance: (data) =>
      safeFetch('/faculty/attendance', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    facultyGetAttendance: (params = {}) => {
      const query = new URLSearchParams();
      if (params.course_id && params.course_id !== 'all') query.append('course_id', params.course_id);
      if (params.attendance_date) query.append('attendance_date', params.attendance_date);
      const qs = query.toString();
      return safeFetch(`/faculty/attendance${qs ? `?${qs}` : ''}`);
    },

    facultyUpdateAttendance: (id, data) =>
      safeFetch(`/faculty/attendance/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    studentGetAttendance: () => safeFetch('/student/attendance'),

    // 2. Assignment APIs
    getAssignments: () => safeFetch('/assignments'),

    facultyCreateAssignment: (data) =>
      safeFetch('/faculty/assignments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    facultyUpdateAssignment: (id, data) =>
      safeFetch(`/faculty/assignments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    facultyDeleteAssignment: (id) =>
      safeFetch(`/faculty/assignments/${id}`, {
        method: 'DELETE',
      }),

    studentGetAssignments: () => safeFetch('/student/assignments'),

    studentSubmitAssignment: (assignmentId, data) =>
      safeFetch(`/student/assignments/${assignmentId}/submit`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // 3. Marks APIs
    facultyEnterMarks: (data) =>
      safeFetch('/faculty/marks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    facultyGetMarks: (params = {}) => {
      const query = new URLSearchParams();
      if (params.course_id && params.course_id !== 'all') query.append('course_id', params.course_id);
      if (params.student_id && params.student_id !== 'all') query.append('student_id', params.student_id);
      const qs = query.toString();
      return safeFetch(`/faculty/marks${qs ? `?${qs}` : ''}`);
    },

    facultyUpdateMarks: (id, data) =>
      safeFetch(`/faculty/marks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    studentGetMarks: () => safeFetch('/student/marks'),

    // 4. Academic Overview
    getAcademicOverview: () => safeFetch('/admin/academic-overview'),

    /**
     * =========================================================================
     * Phase 13: Reports & Analytics APIs (Admin)
     * =========================================================================
     */
    getReportsOverview: () => safeFetch('/admin/reports/overview'),

    getReportsAttendance: (filters = {}) => {
      const q = new URLSearchParams();
      if (filters.department_id && filters.department_id !== 'all') q.append('department_id', filters.department_id);
      if (filters.course_id && filters.course_id !== 'all') q.append('course_id', filters.course_id);
      if (filters.start_date) q.append('start_date', filters.start_date);
      if (filters.end_date) q.append('end_date', filters.end_date);
      const qs = q.toString();
      return safeFetch(`/admin/reports/attendance${qs ? `?${qs}` : ''}`);
    },

    getReportsPerformance: (filters = {}) => {
      const q = new URLSearchParams();
      if (filters.department_id && filters.department_id !== 'all') q.append('department_id', filters.department_id);
      if (filters.course_id && filters.course_id !== 'all') q.append('course_id', filters.course_id);
      const qs = q.toString();
      return safeFetch(`/admin/reports/performance${qs ? `?${qs}` : ''}`);
    },

    getReportsAssignments: (filters = {}) => {
      const q = new URLSearchParams();
      if (filters.department_id && filters.department_id !== 'all') q.append('department_id', filters.department_id);
      if (filters.course_id && filters.course_id !== 'all') q.append('course_id', filters.course_id);
      const qs = q.toString();
      return safeFetch(`/admin/reports/assignments${qs ? `?${qs}` : ''}`);
    },

    getReportsStudents: (filters = {}) => {
      const q = new URLSearchParams();
      if (filters.department_id && filters.department_id !== 'all') q.append('department_id', filters.department_id);
      const qs = q.toString();
      return safeFetch(`/admin/reports/students${qs ? `?${qs}` : ''}`);
    },
  };
})();

/**
 * CampusOS Client-side Authentication & Role Guard Helper
 */
const CampusAuth = (() => {
  function getToken() {
    try {
      return localStorage.getItem('campusos_token');
    } catch (e) {
      return null;
    }
  }

  function getUser() {
    try {
      const userStr = localStorage.getItem('campusos_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  }

  function isAuthenticated() {
    return !!getToken();
  }

  function logout() {
    try {
      localStorage.removeItem('campusos_token');
      localStorage.removeItem('campusos_user');
    } catch (e) {}

    const isPagesSubdir = window.location.pathname.includes('/pages/');
    const loginUrl = isPagesSubdir ? 'login.html' : 'pages/login.html';
    window.location.href = loginUrl;
  }

  function requireRole(expectedRole) {
    const user = getUser();
    const isPagesSubdir = window.location.pathname.includes('/pages/');
    const loginPath = isPagesSubdir ? 'login.html' : 'pages/login.html';

    if (!isAuthenticated() || !user) {
      window.location.href = loginPath;
      return null;
    }

    if (expectedRole && user.role !== expectedRole) {
      const dashboardMap = {
        student: isPagesSubdir ? 'student-dashboard.html' : 'pages/student-dashboard.html',
        faculty: isPagesSubdir ? 'faculty-dashboard.html' : 'pages/faculty-dashboard.html',
        admin: isPagesSubdir ? 'admin-dashboard.html' : 'pages/admin-dashboard.html',
      };

      const redirectPath = dashboardMap[user.role] || loginPath;
      window.location.href = redirectPath;
      return null;
    }

    return user;
  }

  return {
    getToken,
    getUser,
    isAuthenticated,
    logout,
    requireRole,
  };
})();
