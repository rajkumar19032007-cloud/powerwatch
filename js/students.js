/**
 * CampusOS — Admin Student Management (js/students.js)
 * Phase 11: Real Student Management for Administrators
 * Handles listing, searching, filtering, adding, editing, viewing, and deleting students.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Enforce Admin Authentication & Route Guard
  if (typeof CampusAuth !== 'undefined') {
    const user = CampusAuth.requireRole('admin');
    if (!user) return;
  }

  initHeaderAndSidebar();
  initModals();
  initFiltersAndActions();

  // Initial Data Load
  loadDepartments().then(() => {
    loadStudents();
  });
});

// Module State
let departmentsCache = [];
let studentPendingDelete = null;
let searchDebounceTimer = null;

/**
 * Initializes header greeting, date, sidebar drawer, and logout flow
 */
function initHeaderAndSidebar() {
  const greetingEl = qs('#dynamic-greeting');
  const dateEl = qs('#current-date-pill');
  const sidebarName = qs('#sidebar-admin-name');

  // Format Date
  const now = new Date();
  const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
  const formattedDate = now.toLocaleDateString('en-US', options);
  if (dateEl) dateEl.textContent = `📅 ${formattedDate}`;

  // User Profile Greeting
  const user = typeof CampusAuth !== 'undefined' ? CampusAuth.getUser() : null;
  if (sidebarName && user?.name) {
    sidebarName.textContent = user.name;
  }
  if (greetingEl) {
    greetingEl.textContent = `Students Directory 🎓`;
  }

  // Sidebar Mobile Toggle
  const sidebar = qs('#app-sidebar');
  const toggleBtn = qs('#mobile-sidebar-toggle');
  const closeBtn = qs('#sidebar-close-btn');
  const backdrop = qs('#sidebar-backdrop');

  const openSidebar = () => {
    sidebar?.classList.add('open');
    backdrop?.classList.add('active');
  };

  const closeSidebar = () => {
    sidebar?.classList.remove('open');
    backdrop?.classList.remove('active');
  };

  toggleBtn?.addEventListener('click', openSidebar);
  closeBtn?.addEventListener('click', closeSidebar);
  backdrop?.addEventListener('click', closeSidebar);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar?.classList.contains('open')) {
      closeSidebar();
    }
  });
}

/**
 * Loads academic departments from MySQL API for dropdowns
 */
async function loadDepartments() {
  try {
    const res = await CampusAPI.getDepartments();
    if (res.success && Array.isArray(res.data)) {
      departmentsCache = res.data;

      // Populate Filter Select
      const filterSelect = qs('#student-department-filter');
      if (filterSelect) {
        filterSelect.innerHTML = `<option value="all">All Academic Departments</option>` +
          departmentsCache.map(d => `<option value="${d.id}">${d.name} (${d.code})</option>`).join('');
      }

      // Populate Add Modal Select
      const addSelect = qs('#add-department');
      if (addSelect) {
        addSelect.innerHTML = `<option value="" disabled selected>Select Department *</option>` +
          departmentsCache.map(d => `<option value="${d.id}">${d.name} (${d.code})</option>`).join('');
      }

      // Populate Edit Modal Select
      const editSelect = qs('#edit-department');
      if (editSelect) {
        editSelect.innerHTML = departmentsCache.map(d => `<option value="${d.id}">${d.name} (${d.code})</option>`).join('');
      }
    }
  } catch (err) {
    console.error('Failed to load departments:', err);
  }
}

/**
 * Loads student records from MySQL API with active search & filter criteria
 */
async function loadStudents() {
  const container = qs('#students-table-container');
  if (!container) return;

  const searchVal = qs('#student-search-input')?.value.trim() || '';
  const deptVal = qs('#student-department-filter')?.value || 'all';

  // Loading State
  container.innerHTML = `
    <div class="table-state-box">
      <div class="state-icon">⏳</div>
      <div class="state-title">Loading students...</div>
      <div class="state-subtext">Fetching synchronized student roster from MySQL database.</div>
    </div>
  `;

  try {
    const res = await CampusAPI.getStudents({
      search: searchVal,
      department_id: deptVal,
    });

    if (!res.success || !Array.isArray(res.data)) {
      container.innerHTML = `
        <div class="table-state-box">
          <div class="state-icon">⚠️</div>
          <div class="state-title">Unable to load students</div>
          <div class="state-subtext">${res.message || 'Please check your connection and try again.'}</div>
          <button class="btn btn-secondary btn-sm" onclick="loadStudents()" style="margin-top: 0.5rem;">Retry</button>
        </div>
      `;
      return;
    }

    const students = res.data;

    // Empty State
    if (students.length === 0) {
      container.innerHTML = `
        <div class="table-state-box">
          <div class="state-icon">🔍</div>
          <div class="state-title">No students found</div>
          <div class="state-subtext">No student accounts matched your search or department filter criteria.</div>
          <button class="btn btn-primary btn-sm" id="btn-empty-add-student" style="margin-top: 0.5rem;">+ Add New Student</button>
        </div>
      `;
      qs('#btn-empty-add-student')?.addEventListener('click', () => openModal('#modal-add-student'));
      return;
    }

    // Render Table
    container.innerHTML = `
      <table class="students-table" aria-label="Student accounts list">
        <thead>
          <tr>
            <th>Student</th>
            <th>Email Address</th>
            <th>Department</th>
            <th>Status</th>
            <th>Joined</th>
            <th style="text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${students.map(student => {
            const initials = `${(student.first_name || '')[0] || ''}${(student.last_name || '')[0] || ''}`.toUpperCase() || 'ST';
            const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Student';
            const deptCode = student.department_code || 'GEN';
            const deptName = student.department_name || 'General Engineering';
            const dateObj = new Date(student.created_at || Date.now());
            const joinedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            return `
              <tr data-student-id="${student.id}">
                <td>
                  <div class="student-profile-cell">
                    <div class="student-avatar" aria-hidden="true">${initials}</div>
                    <div>
                      <span class="student-name-title">${fullName}</span>
                      <span class="student-id-subtext">ID: #${student.id.toString().padStart(4, '0')}</span>
                    </div>
                  </div>
                </td>
                <td style="color: var(--color-slate-600);">${student.email}</td>
                <td>
                  <span class="badge badge-primary" title="${deptName}">${deptCode}</span>
                </td>
                <td>
                  <span class="badge badge-success">Active</span>
                </td>
                <td style="color: var(--color-slate-500); font-size: 0.8rem;">${joinedDate}</td>
                <td style="text-align: right;">
                  <div class="action-btn-group" style="justify-content: flex-end;">
                    <button class="btn-action-icon btn-view-student" data-id="${student.id}" title="View Details" type="button">
                      👁️ View
                    </button>
                    <button class="btn-action-icon btn-action-edit btn-edit-student" data-id="${student.id}" title="Edit Student" type="button">
                      ✏️ Edit
                    </button>
                    <button class="btn-action-icon btn-action-delete btn-delete-student" data-id="${student.id}" data-name="${fullName}" title="Delete Student" type="button">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    // Attach Row Action Handlers
    attachTableActionHandlers();
  } catch (err) {
    container.innerHTML = `
      <div class="table-state-box">
        <div class="state-icon">⚠️</div>
        <div class="state-title">Unable to load students. Please try again.</div>
      </div>
    `;
  }
}

/**
 * Attaches event handlers for View, Edit, and Delete action buttons
 */
function attachTableActionHandlers() {
  // View Details
  qsa('.btn-view-student').forEach(btn => {
    btn.addEventListener('click', () => handleViewStudent(btn.dataset.id));
  });

  // Edit Student
  qsa('.btn-edit-student').forEach(btn => {
    btn.addEventListener('click', () => handleEditStudent(btn.dataset.id));
  });

  // Delete Student
  qsa('.btn-delete-student').forEach(btn => {
    btn.addEventListener('click', () => {
      studentPendingDelete = {
        id: btn.dataset.id,
        name: btn.dataset.name,
      };
      const descEl = qs('#modal-delete-desc');
      if (descEl) {
        descEl.innerHTML = `Are you sure you want to permanently delete student account <strong>${btn.dataset.name}</strong> (ID: #${btn.dataset.id})? This action cannot be undone.`;
      }
      openModal('#modal-delete-student');
    });
  });
}

/**
 * Handles viewing student profile details in modal
 */
async function handleViewStudent(studentId) {
  const modalContent = qs('#view-student-details-content');
  if (!modalContent) return;

  modalContent.innerHTML = `<div style="text-align: center; padding: 1.5rem;">Loading student profile...</div>`;
  openModal('#modal-view-student');

  const res = await CampusAPI.getStudent(studentId);
  if (res.success && res.data) {
    const s = res.data;
    const dateObj = new Date(s.created_at || Date.now());
    const joinedStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    modalContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 1.25rem;">
        <div class="student-avatar" style="width: 56px; height: 56px; font-size: 1.2rem; margin: 0 auto 0.5rem auto;">
          ${(s.first_name[0] || '')}${(s.last_name[0] || '')}
        </div>
        <h4 style="font-size: 1.15rem; color: var(--color-slate-900); font-weight: 700; margin: 0;">${s.first_name} ${s.last_name}</h4>
        <div style="font-size: 0.8rem; color: var(--color-slate-500); margin-top: 0.25rem;">Student ID: #${s.id.toString().padStart(4, '0')}</div>
      </div>

      <div class="modal-detail-row">
        <span class="modal-detail-label">Institutional Email</span>
        <span class="modal-detail-value">${s.email}</span>
      </div>
      <div class="modal-detail-row">
        <span class="modal-detail-label">Academic Department</span>
        <span class="modal-detail-value">${s.department_name || 'General'} (${s.department_code || 'CSE'})</span>
      </div>
      <div class="modal-detail-row">
        <span class="modal-detail-label">System Role</span>
        <span class="badge badge-primary">${s.role.toUpperCase()}</span>
      </div>
      <div class="modal-detail-row">
        <span class="modal-detail-label">Enrollment Date</span>
        <span class="modal-detail-value" style="font-size: 0.8rem;">${joinedStr}</span>
      </div>
    `;
  } else {
    modalContent.innerHTML = `<div style="color: #dc2626; text-align: center; padding: 1.5rem;">Failed to load student details.</div>`;
  }
}

/**
 * Handles editing student account in modal
 */
async function handleEditStudent(studentId) {
  const errEl = qs('#edit-student-error');
  if (errEl) errEl.textContent = '';

  const res = await CampusAPI.getStudent(studentId);
  if (res.success && res.data) {
    const s = res.data;
    qs('#edit-student-id').value = s.id;
    qs('#edit-first-name').value = s.first_name;
    qs('#edit-last-name').value = s.last_name;
    qs('#edit-email').value = s.email;
    qs('#edit-department').value = s.department_id || '';
    qs('#edit-password').value = '';

    openModal('#modal-edit-student');
  } else {
    showToast('Unable to load student record for editing.');
  }
}

/**
 * Initializes search input, department filter, and buttons
 */
function initFiltersAndActions() {
  // Search Input (Debounced)
  const searchInput = qs('#student-search-input');
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      loadStudents();
    }, 300);
  });

  // Department Select Filter
  const deptSelect = qs('#student-department-filter');
  deptSelect?.addEventListener('change', () => {
    loadStudents();
  });

  // Refresh Button
  qs('#btn-refresh-students')?.addEventListener('click', () => {
    loadStudents();
    showToast('Student directory refreshed from MySQL.');
  });

  // Open Add Student Modal
  qs('#btn-open-add-student')?.addEventListener('click', () => {
    qs('#form-add-student')?.reset();
    const errEl = qs('#add-student-error');
    if (errEl) errEl.textContent = '';
    openModal('#modal-add-student');
  });

  // Add Student Form Submission
  const addForm = qs('#form-add-student');
  addForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = qs('#add-student-error');
    const submitBtn = qs('#btn-submit-add-student');

    if (errEl) errEl.textContent = '';

    const first_name = qs('#add-first-name').value.trim();
    const last_name = qs('#add-last-name').value.trim();
    const email = qs('#add-email').value.trim();
    const department_id = qs('#add-department').value;
    const password = qs('#add-password').value;

    if (!first_name || !last_name || !email || !department_id || !password) {
      if (errEl) errEl.textContent = 'All fields are required.';
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating...';
    }

    try {
      const res = await CampusAPI.createStudent({
        first_name,
        last_name,
        email,
        department_id,
        password,
      });

      if (res.success) {
        closeModal('#modal-add-student');
        addForm.reset();
        showToast(`Student "${first_name} ${last_name}" created successfully!`);
        loadStudents();
      } else {
        if (errEl) errEl.textContent = res.message || 'Failed to create student.';
      }
    } catch (err) {
      if (errEl) errEl.textContent = 'Network error while creating student.';
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Student';
      }
    }
  });

  // Edit Student Form Submission
  const editForm = qs('#form-edit-student');
  editForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = qs('#edit-student-error');
    const submitBtn = qs('#btn-submit-edit-student');
    const studentId = qs('#edit-student-id').value;

    if (errEl) errEl.textContent = '';

    const first_name = qs('#edit-first-name').value.trim();
    const last_name = qs('#edit-last-name').value.trim();
    const email = qs('#edit-email').value.trim();
    const department_id = qs('#edit-department').value;
    const password = qs('#edit-password').value;

    if (!first_name || !last_name || !email || !department_id) {
      if (errEl) errEl.textContent = 'First name, last name, email, and department are required.';
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';
    }

    try {
      const updateData = { first_name, last_name, email, department_id };
      if (password && password.trim() !== '') {
        updateData.password = password;
      }

      const res = await CampusAPI.updateStudent(studentId, updateData);

      if (res.success) {
        closeModal('#modal-edit-student');
        showToast(`Student account #${studentId} updated successfully!`);
        loadStudents();
      } else {
        if (errEl) errEl.textContent = res.message || 'Failed to update student.';
      }
    } catch (err) {
      if (errEl) errEl.textContent = 'Network error while updating student.';
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Changes';
      }
    }
  });

  // Confirm Delete Button
  qs('#btn-confirm-delete-student')?.addEventListener('click', async () => {
    if (!studentPendingDelete) return;

    const btn = qs('#btn-confirm-delete-student');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Deleting...';
    }

    try {
      const res = await CampusAPI.deleteStudent(studentPendingDelete.id);
      if (res.success) {
        closeModal('#modal-delete-student');
        showToast(`Student "${studentPendingDelete.name}" deleted successfully.`);
        loadStudents();
      } else {
        showToast(res.message || 'Failed to delete student.');
      }
    } catch (err) {
      showToast('Network error while deleting student.');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Delete Student';
      }
      studentPendingDelete = null;
    }
  });
}

/**
 * Initializes modal open/close behaviors and keyboard dismissals
 */
function initModals() {
  qsa('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      qsa('.modal-overlay').forEach(modal => modal.classList.remove('active'));
    });
  });

  qsa('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      qsa('.modal-overlay').forEach(modal => modal.classList.remove('active'));
    }
  });

  // Logout Handlers
  qsa('.logout-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('#logout-modal');
    });
  });

  qs('#btn-confirm-logout')?.addEventListener('click', () => {
    showToast('Signing out of admin session...');
    setTimeout(() => {
      if (typeof CampusAuth !== 'undefined') {
        CampusAuth.logout();
      } else {
        window.location.href = 'login.html';
      }
    }, 500);
  });
}

function openModal(selector) {
  qs(selector)?.classList.add('active');
}

function closeModal(selector) {
  qs(selector)?.classList.remove('active');
}

/**
 * Lightweight accessible toast notification
 */
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
