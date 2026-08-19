/**
 * CampusOS — Dedicated Marks & Grade Book Controller (js/marks.js)
 * Phase 12: Attendance, Assignments & Marks
 */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof CampusAuth === 'undefined' || !CampusAuth.isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  const user = CampusAuth.getUser();
  initMarksHeader(user);
  loadMarksData(user);
});

function initMarksHeader(user) {
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

async function loadMarksData(user) {
  const container = qs('#marks-content-container');
  if (!container) return;

  if (user.role === 'student') {
    try {
      const res = await CampusAPI.studentGetMarks();
      if (res.success && res.data && Array.isArray(res.data.marks) && res.data.marks.length > 0) {
        const { average_percentage, marks } = res.data;

        container.innerHTML = `
          <table class="attendance-table" aria-label="Student Marks Breakdown">
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Title</th>
                <th>Assessment</th>
                <th>Marks Obtained</th>
                <th>Maximum Marks</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${marks.map((m) => {
                const score = parseFloat(m.percentage) || 0;
                const scoreClass = score >= 75 ? 'score-high' : score >= 50 ? 'score-med' : 'score-low';

                return `
                  <tr>
                    <td><span class="badge badge-primary">${m.course_code}</span></td>
                    <td style="font-weight: 600; color: var(--color-slate-900);">${m.course_name}</td>
                    <td>${m.assessment_name}</td>
                    <td style="font-weight: 700; color: var(--color-slate-900);">${m.marks_obtained}</td>
                    <td>${m.maximum_marks}</td>
                    <td>
                      <span class="marks-score-badge ${scoreClass}">
                        ${score}%
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `;
      } else {
        container.innerHTML = `<div style="text-align: center; padding: 3rem; color: var(--color-slate-500);">No assessment marks published yet.</div>`;
      }
    } catch (err) {
      container.innerHTML = `<div style="text-align: center; padding: 3rem; color: #dc2626;">Unable to load marks records.</div>`;
    }
  } else {
    // Faculty / Admin
    try {
      const res = await CampusAPI.facultyGetMarks();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const records = res.data;

        container.innerHTML = `
          <table class="attendance-table" aria-label="Institutional Marks Roster">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Assessment</th>
                <th>Marks Obtained</th>
                <th>Max Marks</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${records.map((m) => {
                const score = parseFloat(m.percentage) || 0;
                const scoreClass = score >= 75 ? 'score-high' : score >= 50 ? 'score-med' : 'score-low';

                return `
                  <tr>
                    <td style="font-weight: 600; color: var(--color-slate-900);">${m.first_name} ${m.last_name}</td>
                    <td>${m.course_name} (${m.course_code})</td>
                    <td>${m.assessment_name}</td>
                    <td style="font-weight: 700; color: var(--color-slate-900);">${m.marks_obtained}</td>
                    <td>${m.maximum_marks}</td>
                    <td>
                      <span class="marks-score-badge ${scoreClass}">
                        ${score}%
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `;
      } else {
        container.innerHTML = `<div style="text-align: center; padding: 3rem; color: var(--color-slate-500);">No assessment marks recorded yet.</div>`;
      }
    } catch (err) {
      container.innerHTML = `<div style="text-align: center; padding: 3rem; color: #dc2626;">Unable to load marks roster.</div>`;
    }
  }
}
