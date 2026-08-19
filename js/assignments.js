/**
 * CampusOS — Dedicated Assignments Controller (js/assignments.js)
 * Phase 12: Attendance, Assignments & Marks
 */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof CampusAuth === 'undefined' || !CampusAuth.isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  const user = CampusAuth.getUser();
  initAssignmentsHeader(user);
  initSubmissionModal();
  loadAssignmentsData(user);
});

function initAssignmentsHeader(user) {
  const nameEl = qs('#sidebar-user-name');
  const roleEl = qs('#sidebar-user-role');
  const avatarEl = qs('#user-avatar-initials');
  const dateEl = qs('#current-date-pill');
  const dashboardLink = qs('#nav-dashboard-link');
  const createBtn = qs('#btn-open-create-assignment');

  if (dateEl) {
    dateEl.textContent = `📅 ${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  if (user) {
    if (nameEl) nameEl.textContent = user.name || 'Campus User';
    if (roleEl) roleEl.textContent = `${user.role.toUpperCase()} Portal`;
    if (avatarEl) {
      const parts = (user.name || 'CU').split(' ');
      avatarEl.textContent = `${parts[0][0] || ''}${parts[1] ? parts[1][0] : ''}`.toUpperCase();
    }

    if (dashboardLink) {
      const links = {
        student: 'student-dashboard.html',
        faculty: 'faculty-dashboard.html',
        admin: 'admin-dashboard.html',
      };
      dashboardLink.href = links[user.role] || 'login.html';
    }

    if (user.role === 'faculty' && createBtn) {
      createBtn.style.display = 'inline-block';
      createBtn.addEventListener('click', () => {
        window.location.href = 'faculty-dashboard.html';
      });
    }
  }

  // Sidebar mobile toggle
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

  qsa('.logout-btn').forEach((b) =>
    b.addEventListener('click', (e) => {
      e.preventDefault();
      CampusAuth.logout();
    })
  );
}

async function loadAssignmentsData(user) {
  const container = qs('#assignments-content-container');
  if (!container) return;

  if (user.role === 'student') {
    try {
      const res = await CampusAPI.studentGetAssignments();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        container.innerHTML = res.data
          .map((a) => {
            const isSubmitted = a.submission_status === 'submitted';
            const badgeClass = isSubmitted ? 'badge-success' : 'badge-warning';
            const badgeText = isSubmitted ? 'Submitted' : 'Pending Submission';
            const dateObj = new Date(a.due_date);
            const dueStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

            return `
              <div class="assignment-detail-card">
                <div>
                  <div class="assignment-header-meta">
                    <span class="badge badge-primary">${a.course_code}</span>
                    <span class="badge ${badgeClass}">${badgeText}</span>
                  </div>
                  <h3 class="assignment-main-title">${a.title}</h3>
                  <div style="font-size: 0.82rem; color: var(--color-slate-500); margin-top: 0.25rem;">
                    Course: ${a.course_name} • Instructor: ${a.creator_name || 'Faculty'}
                  </div>
                  <p style="font-size: 0.875rem; color: var(--color-slate-600); margin-top: 0.75rem; line-height: 1.5;">
                    ${a.description || 'No detailed instructions provided.'}
                  </p>
                </div>

                <div style="border-top: 1px solid var(--color-slate-100); padding-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
                  <span class="assignment-due-pill">📅 Due ${dueStr}</span>
                  <button class="btn btn-primary btn-sm btn-open-submit" data-id="${a.id}" data-title="${a.title}">
                    ${isSubmitted ? 'Edit Work' : 'Submit Solution'}
                  </button>
                </div>
              </div>
            `;
          })
          .join('');

        qsa('.btn-open-submit').forEach((btn) => {
          btn.addEventListener('click', () => {
            qs('#submit-assignment-id').value = btn.dataset.id;
            qs('#modal-submit-desc').innerHTML = `Submitting solution for: <strong>${btn.dataset.title}</strong>`;
            const errEl = qs('#submit-assignment-error');
            if (errEl) errEl.textContent = '';
            qs('#modal-submit-assignment')?.classList.add('active');
          });
        });
      } else {
        container.innerHTML = `<div style="text-align: center; padding: 3rem; color: var(--color-slate-500); grid-column: 1 / -1;">No active course assignments found.</div>`;
      }
    } catch (err) {
      container.innerHTML = `<div style="text-align: center; padding: 3rem; color: #dc2626; grid-column: 1 / -1;">Unable to load assignments.</div>`;
    }
  } else {
    // Faculty / Admin
    try {
      const res = await CampusAPI.getAssignments();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        container.innerHTML = res.data
          .map((a) => {
            const dateObj = new Date(a.due_date);
            const dueStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
            const subCount = parseInt(a.submissions_count, 10) || 0;

            return `
              <div class="assignment-detail-card">
                <div>
                  <div class="assignment-header-meta">
                    <span class="badge badge-primary">${a.course_code}</span>
                    <span class="badge ${subCount > 0 ? 'badge-success' : 'badge-neutral'}">${subCount} Submissions</span>
                  </div>
                  <h3 class="assignment-main-title">${a.title}</h3>
                  <div style="font-size: 0.82rem; color: var(--color-slate-500); margin-top: 0.25rem;">
                    Course: ${a.course_name} • Published by: ${a.creator_name || 'Faculty'}
                  </div>
                  <p style="font-size: 0.875rem; color: var(--color-slate-600); margin-top: 0.75rem; line-height: 1.5;">
                    ${a.description || 'No detailed instructions provided.'}
                  </p>
                </div>

                <div style="border-top: 1px solid var(--color-slate-100); padding-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
                  <span class="assignment-due-pill">📅 Due ${dueStr}</span>
                  <a href="faculty-dashboard.html" class="btn btn-secondary btn-sm">Manage</a>
                </div>
              </div>
            `;
          })
          .join('');
      } else {
        container.innerHTML = `<div style="text-align: center; padding: 3rem; color: var(--color-slate-500); grid-column: 1 / -1;">No assignments published yet.</div>`;
      }
    } catch (err) {
      container.innerHTML = `<div style="text-align: center; padding: 3rem; color: #dc2626; grid-column: 1 / -1;">Unable to load assignments.</div>`;
    }
  }
}

function initSubmissionModal() {
  const form = qs('#form-submit-assignment');
  const modal = qs('#modal-submit-assignment');

  qsa('.modal-close-btn').forEach((btn) => {
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
        alert('Coursework submitted successfully!');
        const user = CampusAuth.getUser();
        loadAssignmentsData(user);
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
