/**
 * CampusOS — Admin Dashboard Script (admin-dashboard.js)
 * Phase 6, 9 & Phase 10: Role Guard, Dynamic Data & JWT Logout
 * Enforces Admin role authentication and handles real logout.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Role-Based Access Guard
  if (typeof CampusAuth !== 'undefined') {
    const user = CampusAuth.requireRole('admin');
    if (!user) return; // Unauthenticated or wrong role redirected
  }

  initAdminGreeting();
  initSidebar();
  initAdminActions();
  initLogoutModal();
  loadAdminApiData();
});

/**
 * Sets dynamic greeting and current formatted date for Administrator
 */
function initAdminGreeting() {
  const greetingEl = qs('#dynamic-greeting');
  const dateEl = qs('#current-date-pill');

  // Format Date
  const now = new Date();
  const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
  const formattedDate = now.toLocaleDateString('en-US', options);

  if (dateEl) {
    dateEl.textContent = `📅 ${formattedDate}`;
  }

  // Dynamic Greeting
  if (greetingEl) {
    const hours = now.getHours();
    let timeGreeting = 'Welcome back';

    if (hours >= 12 && hours < 17) {
      timeGreeting = 'Good afternoon';
    } else if (hours >= 17) {
      timeGreeting = 'Good evening';
    }

    const user = typeof CampusAuth !== 'undefined' ? CampusAuth.getUser() : null;
    const userName = user?.name || 'Administrator';

    greetingEl.textContent = `${timeGreeting}, ${userName} 👋`;
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

  // Close sidebar on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar?.classList.contains('open')) {
      closeSidebar();
      toggleBtn?.focus();
    }
  });

  // Handle active navigation switching
  navItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navItems.forEach((n) => n.classList.remove('active'));
      item.classList.add('active');

      const label = item.querySelector('span')?.textContent || 'Section';
      showToast(`Switched to ${label} (Demo console active)`);

      // Close sidebar if on mobile
      if (window.innerWidth <= 1024) {
        closeSidebar();
      }
    });
  });
}

/**
 * Handles demo button actions for administrator operations
 */
function initAdminActions() {
  // Management Action Buttons
  const managementBtns = qsa('.btn-admin-manage');
  managementBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const scope = btn.dataset.manage || 'Resource';
      showToast(`${scope} management console is connected to MySQL in Phase 9.`);
    });
  });

  // Quick Action Buttons
  const quickButtons = qsa('.btn-quick-action');
  quickButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const actionName = btn.dataset.action || btn.textContent.trim();
      showToast(`Admin Action: "${actionName}" (Demo active)`);
    });
  });
}

/**
 * Loads dynamic system infrastructure status and user summary from MySQL API
 */
async function loadAdminApiData() {
  if (typeof CampusAPI === 'undefined') return;

  const dbBadge = qs('#status-badge-db');
  const apiBadge = qs('#status-badge-api');

  // 1. Check REST API Health
  const healthRes = await CampusAPI.getHealth();
  if (apiBadge) {
    if (healthRes.success) {
      apiBadge.textContent = 'Operational (Port 5000)';
      apiBadge.className = 'badge badge-success';
    } else {
      apiBadge.textContent = 'Offline';
      apiBadge.className = 'badge badge-warning';
    }
  }

  // 2. Check MySQL Database Connectivity
  const dbRes = await CampusAPI.getDbTest();
  if (dbBadge) {
    if (dbRes.success) {
      dbBadge.textContent = 'Connected (MySQL)';
      dbBadge.className = 'badge badge-success';
    } else {
      dbBadge.textContent = 'Not Connected';
      dbBadge.className = 'badge badge-neutral';
    }
  }

  // 3. Load User Summary from MySQL
  const userRes = await CampusAPI.getUserSummary();
  if (userRes.success && userRes.data) {
    const studentEl = qs('#admin-metric-students');
    const facultyEl = qs('#admin-metric-faculty');
    const adminEl = qs('#admin-metric-admins');
    const totalEl = qs('#admin-metric-total');

    if (studentEl) studentEl.textContent = userRes.data.students.toLocaleString();
    if (facultyEl) facultyEl.textContent = userRes.data.faculty.toLocaleString();
    if (adminEl) adminEl.textContent = userRes.data.admins.toLocaleString();
    if (totalEl) totalEl.textContent = userRes.data.total.toLocaleString();
  }
}

/**
 * Handles real logout modal and session termination
 */
function initLogoutModal() {
  const logoutBtns = qsa('.logout-btn');
  const modal = qs('#logout-modal');
  const cancelBtn = qs('#btn-cancel-logout');
  const confirmBtn = qs('#btn-confirm-logout');

  if (!modal) return;

  const openModal = (e) => {
    e.preventDefault();
    modal.classList.add('active');
  };

  const closeModal = () => {
    modal.classList.remove('active');
  };

  logoutBtns.forEach((btn) => btn.addEventListener('click', openModal));
  cancelBtn?.addEventListener('click', closeModal);

  // Close modal when clicking outside modal box
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  confirmBtn?.addEventListener('click', () => {
    closeModal();
    showToast('Signing out of administrator session...');
    setTimeout(() => {
      if (typeof CampusAuth !== 'undefined') {
        CampusAuth.logout();
      } else {
        window.location.href = 'login.html';
      }
    }, 500);
  });
}

/**
 * Lightweight accessible toast notification
 * @param {string} message
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
