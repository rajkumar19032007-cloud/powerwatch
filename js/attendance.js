/**
 * CampusOS — Dedicated Attendance Controller (js/attendance.js)
 * Phase 12: Attendance, Assignments & Marks
 */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof CampusAuth === 'undefined' || !CampusAuth.isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  const user = CampusAuth.getUser();
  initAttendanceHeader(user);
  loadAttendanceData(user);
});

function initAttendanceHeader(user) {
  const nameEl = qs('#sidebar-user-name');
  const roleEl = qs('#sidebar-user-role');
  const avatarEl = qs('#user-avatar-initials');
  const dateEl = qs('#current-date-pill');
  const dashboardLink = qs('#nav-dashboard-link');

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
  }

  // Sidebar toggle
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

async function loadAttendanceData(user) {
  const container = qs('#attendance-content-container');
  if (!container) return;

  if (user.role === 'student') {
    try {
      const res = await CampusAPI.studentGetAttendance();
      if (res.success && res.data) {
        const { overall_percentage, total_classes, total_attended, courses, history } = res.data;

        qs('#metric-overall-att').textContent = `${overall_percentage}%`;
        qs('#metric-total-sessions').textContent = total_classes;
        qs('#metric-attended-sessions').textContent = total_attended;

        if (Array.isArray(courses) && courses.length > 0) {
          container.innerHTML = `
            <table class="attendance-table" aria-label="Course Attendance Breakdown">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th>Credits</th>
                  <th>Attended Sessions</th>
                  <th>Total Sessions</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                ${courses.map((c) => `
                  <tr>
                    <td><span class="badge badge-primary">${c.course_code}</span></td>
                    <td style="font-weight: 600; color: var(--color-slate-900);">${c.course_name}</td>
                    <td>${c.credits}</td>
                    <td style="color: var(--color-success); font-weight: 600;">${c.attended_classes}</td>
                    <td>${c.total_classes}</td>
                    <td>
                      <span class="status-pill ${c.percentage >= 75 ? 'present' : 'absent'}">
                        ${c.percentage}%
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
        } else {
          container.innerHTML = `<div style="text-align: center; padding: 2.5rem; color: var(--color-slate-500);">No attendance records found for your enrolled courses.</div>`;
        }
      }
    } catch (err) {
      container.innerHTML = `<div style="text-align: center; padding: 2.5rem; color: #dc2626;">Unable to load attendance records.</div>`;
    }
  } else {
    // Faculty / Admin View
    try {
      const res = await CampusAPI.facultyGetAttendance();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const records = res.data;
        const presentCount = records.filter((r) => r.status === 'present').length;
        const rate = Math.round((presentCount / records.length) * 100);

        qs('#metric-overall-att').textContent = `${rate}%`;
        qs('#metric-total-sessions').textContent = records.length;
        qs('#metric-attended-sessions').textContent = presentCount;

        container.innerHTML = `
          <table class="attendance-table" aria-label="Institutional Attendance Log">
            <thead>
              <tr>
                <th>Date</th>
                <th>Student</th>
                <th>Course</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${records.map((r) => {
                const dateStr = new Date(r.attendance_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                return `
                  <tr>
                    <td style="color: var(--color-slate-600);">${dateStr}</td>
                    <td style="font-weight: 600; color: var(--color-slate-900);">${r.first_name} ${r.last_name} (${r.email})</td>
                    <td>${r.course_name} (${r.course_code})</td>
                    <td>
                      <span class="status-pill ${r.status}">
                        ${r.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `;
      } else {
        container.innerHTML = `<div style="text-align: center; padding: 2.5rem; color: var(--color-slate-500);">No attendance records recorded yet.</div>`;
      }
    } catch (err) {
      container.innerHTML = `<div style="text-align: center; padding: 2.5rem; color: #dc2626;">Unable to load attendance log.</div>`;
    }
  }
}
