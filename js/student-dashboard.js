/**
 * CampusOS — Student Dashboard Script (student-dashboard.js)
 * Phase 4, 9, 10 & Phase 12: Live Attendance, Assignments & Marks
 * Handles Student role guard, live academic synchronization, and coursework submissions.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Role-Based Access Guard
  if (typeof CampusAuth !== 'undefined') {
    const user = CampusAuth.requireRole('student');
    if (!user) return;
  }

  initDashboardGreeting();
  initSidebar();
  initQuickActions();
  initLogoutModal();
  initSubmissionModal();

  // Load live data from MySQL
  loadStudentApiData();
  loadLiveAttendance();
  loadLiveAssignments();
  loadLiveMarks();
});

/**
 * Sets dynamic greeting and current formatted date
 */
function initDashboardGreeting() {
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
    const userName = user?.name ? user.name.split(' ')[0] : 'Alex';

    greetingEl.textContent = `${timeGreeting}, ${userName} 👋`;
  }
}

/**
 * Loads live attendance records from MySQL via GET /api/student/attendance
 */
async function loadLiveAttendance() {
  if (typeof CampusAPI === 'undefined') return;

  const totalEl = qs('#student-overall-attendance');
  const listEl = qs('#student-attendance-list');
  const pillEl = qs('#student-attendance-sessions-pill');

  try {
    const res = await CampusAPI.studentGetAttendance();
    if (res.success && res.data) {
      const { overall_percentage, total_classes, total_attended, courses } = res.data;

      if (totalEl) totalEl.textContent = `${overall_percentage}%`;
      if (pillEl) {
        pillEl.textContent = `${total_attended} of ${total_classes} Sessions`;
        pillEl.className = overall_percentage >= 75 ? 'badge badge-success' : 'badge badge-warning';
      }

      if (listEl && Array.isArray(courses) && courses.length > 0) {
        listEl.innerHTML = courses
          .map((c) => {
            const isGood = c.percentage >= 75;
            const fillClass = isGood ? 'fill-emerald' : 'fill-amber';
            const colorStyle = isGood ? 'color: var(--color-success);' : 'color: var(--color-warning);';

            return `
              <div class="subject-attendance-item">
                <div class="subject-info-row">
                  <span>${c.course_name} (${c.course_code})</span>
                  <span style="${colorStyle} font-weight: 700;">${c.percentage}% (${c.attended_classes}/${c.total_classes})</span>
                </div>
                <div class="subject-progress-bg" aria-hidden="true">
                  <div class="subject-progress-fill ${fillClass}" style="width: ${Math.min(c.percentage, 100)}%;"></div>
                </div>
              </div>
            `;
          })
          .join('');
      } else if (listEl) {
        listEl.innerHTML = `<div style="text-align: center; color: var(--color-slate-500); padding: 1rem;">No attendance records available.</div>`;
      }
    }
  } catch (err) {
    console.error('Failed to load student attendance:', err);
  }
}

/**
 * Loads live assignments and submission status via GET /api/student/assignments
 */
async function loadLiveAssignments() {
  if (typeof CampusAPI === 'undefined') return;

  const container = qs('#student-assignments-list');
  if (!container) return;

  try {
    const res = await CampusAPI.studentGetAssignments();
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      container.innerHTML = res.data
        .map((a) => {
          const isSubmitted = a.submission_status === 'submitted';
          const badgeClass = isSubmitted ? 'badge-success' : 'badge-warning';
          const badgeText = isSubmitted ? 'Submitted' : 'Pending';
          const dateObj = new Date(a.due_date);
          const dueStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          return `
            <div class="assignment-card" style="display: flex; justify-content: space-between; align-items: center; gap: 0.75rem;">
              <div class="assignment-info" style="flex: 1;">
                <span class="assignment-title">${a.title}</span>
                <span class="assignment-meta">${a.course_name} (${a.course_code}) • Due: ${dueStr}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="badge ${badgeClass}">${badgeText}</span>
                <button class="btn btn-secondary btn-sm btn-open-submit" data-id="${a.id}" data-title="${a.title}" style="padding: 0.3rem 0.65rem; font-size: 0.75rem;">
                  ${isSubmitted ? 'Edit Submission' : 'Submit Work'}
                </button>
              </div>
            </div>
          `;
        })
        .join('');

      // Attach submit modal triggers
      qsa('.btn-open-submit').forEach((btn) => {
        btn.addEventListener('click', () => {
          qs('#submit-assignment-id').value = btn.dataset.id;
          qs('#modal-submit-desc').innerHTML = `Submitting coursework for: <strong>${btn.dataset.title}</strong>`;
          const errEl = qs('#submit-assignment-error');
          if (errEl) errEl.textContent = '';
          qs('#modal-submit-assignment')?.classList.add('active');
        });
      });
    } else if (container) {
      container.innerHTML = `<div style="text-align: center; color: var(--color-slate-500); padding: 1.5rem;">No assignments currently published.</div>`;
    }
  } catch (err) {
    console.error('Failed to load student assignments:', err);
  }
}

/**
 * Loads live assessment marks via GET /api/student/marks
 */
async function loadLiveMarks() {
  if (typeof CampusAPI === 'undefined') return;

  const chartGrid = qs('#student-marks-chart-grid');
  if (!chartGrid) return;

  try {
    const res = await CampusAPI.studentGetMarks();
    if (res.success && res.data && Array.isArray(res.data.marks) && res.data.marks.length > 0) {
      chartGrid.innerHTML = res.data.marks
        .map((m) => {
          const scorePercent = Math.min(Math.round(parseFloat(m.percentage) || 0), 100);
          const shortCode = m.course_code || 'SUB';

          return `
            <div class="perf-bar-col">
              <div class="perf-bar-fill" style="height: ${scorePercent}%;">
                <span class="perf-bar-score">${scorePercent}%</span>
              </div>
              <span class="perf-bar-label" title="${m.course_name}: ${m.assessment_name} (${m.marks_obtained}/${m.maximum_marks})">${shortCode}</span>
            </div>
          `;
        })
        .join('');
    } else {
      chartGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--color-slate-500); padding: 1rem;">No assessment marks published yet.</div>`;
    }
  } catch (err) {
    console.error('Failed to load student marks:', err);
  }
}

/**
 * Initializes assignment coursework submission form
 */
function initSubmissionModal() {
  const form = qs('#form-submit-assignment');
  const modal = qs('#modal-submit-assignment');
  const closeBtns = qsa('.modal-close-btn');

  closeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      modal?.classList.remove('active');
    });
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const assignmentId = qs('#submit-assignment-id').value;
    const textInput = qs('#submission-text-input');
    const errEl = qs('#submit-assignment-error');
    const submitBtn = qs('#btn-confirm-assignment-submit');

    if (!textInput.value.trim()) {
      if (errEl) errEl.textContent = 'Please enter your coursework text.';
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
    }

    try {
      const res = await CampusAPI.studentSubmitAssignment(assignmentId, {
        submission_text: textInput.value.trim(),
      });

      if (res.success) {
        modal?.classList.remove('active');
        textInput.value = '';
        showToast('Assignment submitted successfully!');
        loadLiveAssignments();
      } else {
        if (errEl) errEl.textContent = res.message || 'Submission failed.';
      }
    } catch (err) {
      if (errEl) errEl.textContent = 'Network error while submitting.';
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Assignment';
      }
    }
  });
}

/**
 * Loads dynamic announcements from MySQL REST API
 */
async function loadStudentApiData() {
  if (typeof CampusAPI === 'undefined') return;

  const annContainer = qs('#student-announcements-list');
  if (annContainer) {
    const annResult = await CampusAPI.getAnnouncements();

    if (annResult.success && Array.isArray(annResult.data) && annResult.data.length > 0) {
      const studentNotices = annResult.data.filter((a) => a.audience === 'students' || a.audience === 'all');

      if (studentNotices.length > 0) {
        annContainer.innerHTML = studentNotices
          .map((ann) => {
            const dateObj = new Date(ann.created_at || Date.now());
            const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const badgeLabel = ann.audience === 'students' ? 'For Students' : 'Campus-Wide';

            return `
              <div class="announcement-item">
                <div class="announcement-header">
                  <span class="badge badge-primary" style="font-size: 0.65rem;">${badgeLabel}</span>
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
      qs('#modal-submit-assignment')?.classList.remove('active');
      qs('#logout-modal')?.classList.remove('active');
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

function initQuickActions() {
  qs('button[data-action="Submit Assignment File"]')?.addEventListener('click', () => {
    qs('#student-assignments-list')?.scrollIntoView({ behavior: 'smooth' });
    showToast('Select an assignment from your list to submit.');
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
    showToast('Logging out of CampusOS session...');
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
