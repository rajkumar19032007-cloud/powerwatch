/**
 * CampusOS — Faculty Dashboard Script (faculty-dashboard.js)
 * Phase 5, 9, 10 & Phase 12: Live Academic Operations
 * Handles Attendance Marking, Assignment Publishing, Marks Recording, and Role Guard.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Role-Based Access Guard
  if (typeof CampusAuth !== 'undefined') {
    const user = CampusAuth.requireRole('faculty');
    if (!user) return;
  }

  initFacultyGreeting();
  initSidebar();
  initAcademicModals();
  initFacultyActions();
  initLogoutModal();

  // Load Data
  loadFacultyDropdowns();
  loadFacultyAssignments();
  loadFacultyApiData();
});

let facultyCoursesCache = [];
let facultyStudentsCache = [];

/**
 * Sets dynamic greeting and current formatted date for Faculty
 */
function initFacultyGreeting() {
  const greetingEl = qs('#dynamic-greeting');
  const dateEl = qs('#current-date-pill');

  const now = new Date();
  const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
  const formattedDate = now.toLocaleDateString('en-US', options);

  if (dateEl) dateEl.textContent = `📅 ${formattedDate}`;

  if (greetingEl) {
    const hours = now.getHours();
    let timeGreeting = 'Good morning';
    if (hours >= 12 && hours < 17) timeGreeting = 'Good afternoon';
    else if (hours >= 17) timeGreeting = 'Good evening';

    const user = typeof CampusAuth !== 'undefined' ? CampusAuth.getUser() : null;
    const userName = user?.name || 'Dr. Sarah Williams';

    greetingEl.textContent = `${timeGreeting}, ${userName} 👋`;
  }
}

/**
 * Loads courses and student options for modal dropdown pickers
 */
async function loadFacultyDropdowns() {
  try {
    // 1. Load Courses
    const coursesRes = await CampusAPI.getCourses();
    if (coursesRes.success && Array.isArray(coursesRes.data)) {
      facultyCoursesCache = coursesRes.data;
      const courseOptions = `<option value="" disabled selected>Select Course</option>` +
        facultyCoursesCache.map((c) => `<option value="${c.id}">${c.name} (${c.code})</option>`).join('');

      qs('#att-course-select').innerHTML = courseOptions;
      qs('#assign-course-select').innerHTML = courseOptions;
      qs('#marks-course-select').innerHTML = courseOptions;
    }

    // 2. Load Students
    const studentsRes = await CampusAPI.getStudents();
    if (studentsRes.success && Array.isArray(studentsRes.data)) {
      facultyStudentsCache = studentsRes.data;
      const studentOptions = `<option value="" disabled selected>Select Student</option>` +
        facultyStudentsCache.map((s) => `<option value="${s.id}">${s.first_name} ${s.last_name} (${s.email})</option>`).join('');

      qs('#att-student-select').innerHTML = studentOptions;
      qs('#marks-student-select').innerHTML = studentOptions;
    }

    // Pre-fill today's date for attendance
    const todayStr = new Date().toISOString().split('T')[0];
    const dateInput = qs('#att-date-input');
    if (dateInput) dateInput.value = todayStr;
  } catch (err) {
    console.error('Failed to load faculty dropdowns:', err);
  }
}

/**
 * Loads published assignments into faculty queue
 */
async function loadFacultyAssignments() {
  const container = qs('#faculty-assignments-list');
  if (!container) return;

  try {
    const res = await CampusAPI.getAssignments();
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      container.innerHTML = res.data
        .map((a) => {
          const dateObj = new Date(a.due_date);
          const dueStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const subCount = parseInt(a.submissions_count, 10) || 0;

          return `
            <div class="faculty-assignment-card">
              <div class="assignment-info">
                <span class="assignment-title">${a.title}</span>
                <span class="assignment-meta">${a.course_name} (${a.course_code}) • Due: ${dueStr}</span>
              </div>
              <div class="assignment-submission-meter">
                <span class="submission-count-text">${subCount} submitted</span>
                <span class="badge ${subCount > 0 ? 'badge-success' : 'badge-warning'}">
                  ${subCount > 0 ? 'Active Submissions' : 'Pending Review'}
                </span>
              </div>
            </div>
          `;
        })
        .join('');
    } else if (container) {
      container.innerHTML = `<div style="text-align: center; color: var(--color-slate-500); padding: 1.5rem;">No assignments published yet.</div>`;
    }
  } catch (err) {
    console.error('Failed to load faculty assignments:', err);
  }
}

/**
 * Initializes Attendance, Assignment, and Marks Modals
 */
function initAcademicModals() {
  // Modal Close Buttons
  qsa('.modal-close-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      qsa('.modal-overlay').forEach((m) => m.classList.remove('active'));
    });
  });

  // 1. Take Attendance Form
  const attForm = qs('#form-take-attendance');
  attForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const course_id = qs('#att-course-select').value;
    const student_id = qs('#att-student-select').value;
    const attendance_date = qs('#att-date-input').value;
    const status = qs('#att-status-select').value;
    const errEl = qs('#att-error');
    const submitBtn = qs('#btn-submit-attendance');

    if (!course_id || !student_id || !attendance_date || !status) {
      if (errEl) errEl.textContent = 'All fields are required.';
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Recording...';
    }

    try {
      const res = await CampusAPI.facultyMarkAttendance({
        course_id,
        student_id,
        attendance_date,
        status,
      });

      if (res.success) {
        qs('#modal-take-attendance')?.classList.remove('active');
        showToast('Attendance recorded successfully in MySQL.');
      } else {
        if (errEl) errEl.textContent = res.message || 'Failed to record attendance.';
      }
    } catch (err) {
      if (errEl) errEl.textContent = 'Network error while recording attendance.';
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Record Attendance';
      }
    }
  });

  // 2. Publish Assignment Form
  const assignForm = qs('#form-faculty-assignment');
  assignForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const course_id = qs('#assign-course-select').value;
    const title = qs('#assign-title-input').value.trim();
    const due_date = qs('#assign-due-date').value;
    const description = qs('#assign-desc-input').value.trim();
    const errEl = qs('#assign-error');
    const submitBtn = qs('#btn-submit-assignment');

    if (!course_id || !title || !due_date) {
      if (errEl) errEl.textContent = 'Course, title, and due date are required.';
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Publishing...';
    }

    try {
      const res = await CampusAPI.facultyCreateAssignment({
        course_id,
        title,
        due_date,
        description,
      });

      if (res.success) {
        qs('#modal-faculty-assignment')?.classList.remove('active');
        assignForm.reset();
        showToast(`Assignment "${title}" published successfully!`);
        loadFacultyAssignments();
      } else {
        if (errEl) errEl.textContent = res.message || 'Failed to publish assignment.';
      }
    } catch (err) {
      if (errEl) errEl.textContent = 'Network error while publishing assignment.';
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Publish Assignment';
      }
    }
  });

  // 3. Enter Marks Form
  const marksForm = qs('#form-enter-marks');
  marksForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const course_id = qs('#marks-course-select').value;
    const student_id = qs('#marks-student-select').value;
    const assessment_name = qs('#marks-assessment-name').value.trim();
    const marks_obtained = qs('#marks-obtained-input').value;
    const maximum_marks = qs('#marks-max-input').value;
    const errEl = qs('#marks-error');
    const submitBtn = qs('#btn-submit-marks');

    if (!course_id || !student_id || !assessment_name || !marks_obtained || !maximum_marks) {
      if (errEl) errEl.textContent = 'All fields are required.';
      return;
    }

    if (parseFloat(marks_obtained) > parseFloat(maximum_marks)) {
      if (errEl) errEl.textContent = 'Marks obtained cannot exceed maximum marks.';
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Recording...';
    }

    try {
      const res = await CampusAPI.facultyEnterMarks({
        course_id,
        student_id,
        assessment_name,
        marks_obtained: parseFloat(marks_obtained),
        maximum_marks: parseFloat(maximum_marks),
      });

      if (res.success) {
        qs('#modal-enter-marks')?.classList.remove('active');
        marksForm.reset();
        showToast('Student assessment marks recorded successfully!');
      } else {
        if (errEl) errEl.textContent = res.message || 'Failed to record marks.';
      }
    } catch (err) {
      if (errEl) errEl.textContent = 'Network error while recording marks.';
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Record Marks';
      }
    }
  });
}

/**
 * Connects action buttons across the faculty dashboard
 */
function initFacultyActions() {
  // Take Attendance Modal Trigger
  qsa('.btn-manage-attendance, button[data-action="Take Class Attendance"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      qs('#modal-take-attendance')?.classList.add('active');
    });
  });

  // Create Assignment Modal Trigger
  qsa('.btn-create-assignment, button[data-action="Add New Assignment"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      qs('#modal-faculty-assignment')?.classList.add('active');
    });
  });

  // Enter Marks Modal Trigger
  qsa('button[data-action="Enter Assessment Marks"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      qs('#modal-enter-marks')?.classList.add('active');
    });
  });

  // Other Action Toasts
  qsa('.btn-quick-action').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (!['Take Class Attendance', 'Add New Assignment', 'Enter Assessment Marks'].includes(action)) {
        showToast(`Faculty Action: "${action}" (Active)`);
      }
    });
  });
}

/**
 * Loads dynamic announcements from MySQL REST API
 */
async function loadFacultyApiData() {
  if (typeof CampusAPI === 'undefined') return;

  const annContainer = qs('#faculty-announcements-list');
  if (annContainer) {
    const annResult = await CampusAPI.getAnnouncements();

    if (annResult.success && Array.isArray(annResult.data) && annResult.data.length > 0) {
      annContainer.innerHTML = annResult.data
        .map((ann) => {
          const dateObj = new Date(ann.created_at || Date.now());
          const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const badgeClass = ann.audience === 'faculty' ? 'badge-warning' : 'badge-primary';
          const audienceLabel = ann.audience === 'faculty' ? 'Faculty Only' : 'Campus-Wide';

          return `
            <div class="announcement-item">
              <div class="announcement-header">
                <span class="badge ${badgeClass}" style="font-size: 0.65rem;">${audienceLabel}</span>
                <span class="announcement-time">${formattedDate}</span>
              </div>
              <p class="announcement-text"><strong>${ann.title}:</strong> ${ann.content}</p>
            </div>
          `;
        })
        .join('');
    }
  }
}

/**
 * Handles mobile sidebar toggle, overlay, and keyboard dismissal
 */
function initSidebar() {
  const sidebar = qs('#app-sidebar');
  const toggleBtn = qs('#mobile-sidebar-toggle');
  const closeBtn = qs('#sidebar-close-btn');
  const backdrop = qs('#sidebar-backdrop');
  const navItems = qsa('.sidebar-nav-item:not(.logout-btn)');

  const openSidebar = () => {
    sidebar?.classList.add('open');
    backdrop?.classList.add('active');
    toggleBtn?.setAttribute('aria-expanded', 'true');
  };

  const closeSidebar = () => {
    sidebar?.classList.remove('open');
    backdrop?.classList.remove('active');
    toggleBtn?.setAttribute('aria-expanded', 'false');
  };

  toggleBtn?.addEventListener('click', openSidebar);
  closeBtn?.addEventListener('click', closeSidebar);
  backdrop?.addEventListener('click', closeSidebar);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSidebar();
      qsa('.modal-overlay').forEach((m) => m.classList.remove('active'));
    }
  });

  navItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navItems.forEach((n) => n.classList.remove('active'));
      item.classList.add('active');

      const label = item.querySelector('span')?.textContent || 'Section';
      showToast(`Switched to ${label}`);

      if (window.innerWidth <= 1024) closeSidebar();
    });
  });
}

function initLogoutModal() {
  const logoutBtns = qsa('.logout-btn');
  const modal = qs('#logout-modal');
  const cancelBtn = qs('#btn-cancel-logout');
  const confirmBtn = qs('#btn-confirm-logout');

  if (!modal) return;

  logoutBtns.forEach((btn) =>
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('active');
    })
  );

  cancelBtn?.addEventListener('click', () => modal.classList.remove('active'));

  confirmBtn?.addEventListener('click', () => {
    modal.classList.remove('active');
    showToast('Signing out of faculty session...');
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
