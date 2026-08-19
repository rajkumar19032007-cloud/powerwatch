/**
 * CampusOS — Admin Reporting & Analytics Controller (js/reports.js)
 * Phase 13: Reports & Analytics
 * Manages Chart.js visualizations, SQL aggregated metrics, multi-dimensional filters, CSV export, and print formatting.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Enforce Admin Authentication & Route Guard
  if (typeof CampusAuth !== 'undefined') {
    const user = CampusAuth.requireRole('admin');
    if (!user) return;
  }

  initReportsHeader();
  initFilterControls();
  initExportAndPrint();
  initLogoutModal();

  // Load Department & Course Filters then run initial analytics load
  loadFilterDropdowns().then(() => {
    loadAllReports();
  });
});

// Chart.js instance references
let studentDistChart = null;
let attendanceChart = null;
let performanceChart = null;
let assignmentsChart = null;

// Cache for CSV export
let cachedStudentReports = [];

/**
 * Initializes header greeting, date, and mobile drawer
 */
function initReportsHeader() {
  const adminName = qs('#sidebar-admin-name');
  const user = typeof CampusAuth !== 'undefined' ? CampusAuth.getUser() : null;
  if (adminName && user?.name) {
    adminName.textContent = user.name;
  }

  const sidebar = qs('#app-sidebar');
  const toggleBtn = qs('#mobile-sidebar-toggle');
  const closeBtn = qs('#sidebar-close-btn');
  const backdrop = qs('#sidebar-backdrop');

  toggleBtn?.addEventListener('click', () => {
    sidebar?.classList.add('open');
    backdrop?.classList.add('active');
  });

  const closeSidebar = () => {
    sidebar?.classList.remove('open');
    backdrop?.classList.remove('active');
  };

  closeBtn?.addEventListener('click', closeSidebar);
  backdrop?.addEventListener('click', closeSidebar);
}

/**
 * Loads department and course dropdown options for the filter toolbar
 */
async function loadFilterDropdowns() {
  try {
    const deptRes = await CampusAPI.getDepartments();
    if (deptRes.success && Array.isArray(deptRes.data)) {
      const deptSelect = qs('#filter-dept-select');
      if (deptSelect) {
        deptSelect.innerHTML = `<option value="all">All Departments</option>` +
          deptRes.data.map((d) => `<option value="${d.id}">${d.name} (${d.code})</option>`).join('');
      }
    }

    const courseRes = await CampusAPI.getCourses();
    if (courseRes.success && Array.isArray(courseRes.data)) {
      const courseSelect = qs('#filter-course-select');
      if (courseSelect) {
        courseSelect.innerHTML = `<option value="all">All Courses</option>` +
          courseRes.data.map((c) => `<option value="${c.id}">${c.name} (${c.code})</option>`).join('');
      }
    }
  } catch (err) {
    console.error('Failed to load report filter dropdowns:', err);
  }
}

/**
 * Connects filter apply and reset controls
 */
function initFilterControls() {
  qs('#btn-apply-filters')?.addEventListener('click', () => {
    const filters = getActiveFilters();
    loadAllReports(filters);
    showToast('Applied analytics filters.');
  });

  qs('#btn-reset-filters')?.addEventListener('click', () => {
    qs('#filter-dept-select').value = 'all';
    qs('#filter-course-select').value = 'all';
    qs('#filter-start-date').value = '';
    qs('#filter-end-date').value = '';

    loadAllReports();
    showToast('Report filters reset to institutional default.');
  });
}

function getActiveFilters() {
  return {
    department_id: qs('#filter-dept-select')?.value || 'all',
    course_id: qs('#filter-course-select')?.value || 'all',
    start_date: qs('#filter-start-date')?.value || '',
    end_date: qs('#filter-end-date')?.value || '',
  };
}

/**
 * Loads all reporting APIs and renders overview metrics, Chart.js charts, and student leaderboard
 */
async function loadAllReports(filters = {}) {
  try {
    // 1. Load Overview Summary
    const overviewRes = await CampusAPI.getReportsOverview();
    if (overviewRes.success && overviewRes.data) {
      const s = overviewRes.data.summary;
      qs('#stat-total-students').textContent = s.total_students;
      qs('#stat-total-faculty').textContent = s.total_faculty;
      qs('#stat-attendance-rate').textContent = `${s.attendance_rate}%`;
      qs('#stat-assignment-rate').textContent = `${s.assignment_completion_rate}%`;
      qs('#stat-performance-rate').textContent = `${s.average_performance}%`;

      renderStudentDistributionChart(overviewRes.data.department_distribution);
    }

    // 2. Load Attendance Analytics
    const attRes = await CampusAPI.getReportsAttendance(filters);
    if (attRes.success && attRes.data) {
      renderAttendanceChart(attRes.data.departments);
    }

    // 3. Load Academic Performance Analytics
    const perfRes = await CampusAPI.getReportsPerformance(filters);
    if (perfRes.success && perfRes.data) {
      renderPerformanceChart(perfRes.data.courses);
    }

    // 4. Load Assignment Submission Pipeline
    const assignRes = await CampusAPI.getReportsAssignments(filters);
    if (assignRes.success && assignRes.data) {
      renderAssignmentsChart(assignRes.data);
    }

    // 5. Load Student Leaderboard Roster
    const studentsRes = await CampusAPI.getReportsStudents(filters);
    if (studentsRes.success && Array.isArray(studentsRes.data)) {
      cachedStudentReports = studentsRes.data;
      renderStudentsLeaderboard(studentsRes.data);
    }
  } catch (err) {
    console.error('Failed to load complete reports suite:', err);
    showToast('Error synchronizing reports from MySQL.');
  }
}

/**
 * Chart 1: Student Distribution by Department (Doughnut Chart)
 */
function renderStudentDistributionChart(distData = []) {
  const canvas = qs('#chart-student-dist');
  if (!canvas || typeof Chart === 'undefined') return;

  if (studentDistChart) studentDistChart.destroy();

  const labels = distData.map((d) => d.department_code || d.department_name);
  const counts = distData.map((d) => d.student_count);

  studentDistChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels.length > 0 ? labels : ['No Data'],
      datasets: [
        {
          data: counts.length > 0 ? counts : [1],
          backgroundColor: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
      },
      cutout: '65%',
    },
  });
}

/**
 * Chart 2: Department Attendance Rate (Bar Chart)
 */
function renderAttendanceChart(deptAtt = []) {
  const canvas = qs('#chart-attendance');
  if (!canvas || typeof Chart === 'undefined') return;

  if (attendanceChart) attendanceChart.destroy();

  const labels = deptAtt.map((d) => d.department_code || d.department_name);
  const rates = deptAtt.map((d) => d.percentage);

  attendanceChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels.length > 0 ? labels : ['No Data'],
      datasets: [
        {
          label: 'Attendance Rate (%)',
          data: rates.length > 0 ? rates : [0],
          backgroundColor: '#10b981',
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, max: 100, ticks: { callback: (v) => `${v}%` } },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });
}

/**
 * Chart 3: Course Academic Performance Average (Bar Chart)
 */
function renderPerformanceChart(coursesPerf = []) {
  const canvas = qs('#chart-performance');
  if (!canvas || typeof Chart === 'undefined') return;

  if (performanceChart) performanceChart.destroy();

  const labels = coursesPerf.map((c) => c.course_code || c.course_name);
  const averages = coursesPerf.map((c) => c.average_percentage);

  performanceChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels.length > 0 ? labels : ['No Courses'],
      datasets: [
        {
          label: 'Avg Score (%)',
          data: averages.length > 0 ? averages : [0],
          backgroundColor: '#f59e0b',
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, max: 100, ticks: { callback: (v) => `${v}%` } },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });
}

/**
 * Chart 4: Assignment Pipeline Status (Doughnut Chart)
 */
function renderAssignmentsChart(assignData) {
  const canvas = qs('#chart-assignments');
  if (!canvas || typeof Chart === 'undefined') return;

  if (assignmentsChart) assignmentsChart.destroy();

  const submitted = assignData?.total_submitted || 0;
  const pending = assignData?.total_pending || 0;

  assignmentsChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Submitted Coursework', 'Pending Submissions'],
      datasets: [
        {
          data: [submitted, pending],
          backgroundColor: ['#10b981', '#cbd5e1'],
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
      },
      cutout: '65%',
    },
  });
}

/**
 * Renders Student Performance & Academic Standing Leaderboard Table
 */
function renderStudentsLeaderboard(students = []) {
  const tbody = qs('#reports-students-tbody');
  const countPill = qs('#leaderboard-count-pill');

  if (countPill) countPill.textContent = `${students.length} Scholars Listed`;
  if (!tbody) return;

  if (students.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: var(--color-slate-500);">
          No student records found for the specified filter criteria.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = students
    .map((s) => {
      let standingClass = 'standing-good';
      let standingIcon = '⭐';

      if (s.standing === "Dean's Honor List") {
        standingClass = 'standing-honor';
        standingIcon = '🏆';
      } else if (s.standing === 'Academic Advisory') {
        standingClass = 'standing-warning';
        standingIcon = '⚠️';
      }

      return `
        <tr>
          <td>
            <div style="display: flex; flex-direction: column;">
              <span style="font-weight: 600; color: var(--color-slate-900);">${s.full_name}</span>
              <span style="font-size: 0.75rem; color: var(--color-slate-500);">${s.email}</span>
            </div>
          </td>
          <td>
            <span class="badge badge-primary" title="${s.department_name}">${s.department_code}</span>
          </td>
          <td>
            <span style="font-weight: 700; color: ${s.attendance_rate >= 75 ? 'var(--color-success)' : 'var(--color-warning)'};">
              ${s.attendance_rate}%
            </span>
          </td>
          <td>
            <span style="font-weight: 700; color: var(--color-slate-900);">
              ${s.average_marks}%
            </span>
          </td>
          <td style="color: var(--color-slate-600);">
            ${s.assignments_submitted} of ${s.total_assignments} (${s.assignment_completion}%)
          </td>
          <td>
            <span class="standing-badge ${standingClass}">
              ${standingIcon} ${s.standing}
            </span>
          </td>
        </tr>
      `;
    })
    .join('');
}

/**
 * Initializes CSV Export and Print functionality
 */
function initExportAndPrint() {
  // CSV Export
  qs('#btn-export-csv')?.addEventListener('click', () => {
    if (cachedStudentReports.length === 0) {
      showToast('No student data available to export.');
      return;
    }

    const headers = [
      'Student ID',
      'First Name',
      'Last Name',
      'Email',
      'Department Code',
      'Department Name',
      'Attendance Rate (%)',
      'Average Marks (%)',
      'Assignments Submitted',
      'Total Assignments',
      'Assignment Completion (%)',
      'Academic Standing',
    ];

    const rows = cachedStudentReports.map((s) => [
      `"${s.id}"`,
      `"${s.first_name}"`,
      `"${s.last_name}"`,
      `"${s.email}"`,
      `"${s.department_code}"`,
      `"${s.department_name}"`,
      `"${s.attendance_rate}"`,
      `"${s.average_marks}"`,
      `"${s.assignments_submitted}"`,
      `"${s.total_assignments}"`,
      `"${s.assignment_completion}"`,
      `"${s.standing}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `campusos_academic_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Institutional CSV report downloaded.');
  });

  // Print Report
  qs('#btn-print-report')?.addEventListener('click', () => {
    window.print();
  });
}

function initLogoutModal() {
  const logoutBtns = qsa('.logout-btn');
  const modal = qs('#logout-modal');
  const cancelBtn = modal?.querySelector('.modal-close-btn');
  const confirmBtn = qs('#btn-confirm-logout');

  logoutBtns.forEach((btn) =>
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal?.classList.add('active');
    })
  );

  cancelBtn?.addEventListener('click', () => modal?.classList.remove('active'));

  confirmBtn?.addEventListener('click', () => {
    showToast('Signing out of admin session...');
    setTimeout(() => {
      if (typeof CampusAuth !== 'undefined') CampusAuth.logout();
      else window.location.href = 'login.html';
    }, 500);
  });
}

function showToast(message) {
  let toast = qs('#dashboard-toast');

  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'dashboard-toast';
    toast.className = 'dashboard-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('show');

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
