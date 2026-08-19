/**
 * CampusOS — Main Script (main.js)
 * Phase 2 & Phase 9 Frontend UI & API Integration
 * Handles navigation, header elevation, scroll spy, and dynamic MySQL data loading.
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollSpy();
  initFooterYear();
  initDemoActions();
  loadDynamicLandingData();
});

/**
 * Initializes the responsive navigation bar, mobile toggle & keyboard accessibility
 */
function initNavbar() {
  const header = qs('#site-header');
  const toggleBtn = qs('#mobile-toggle');
  const navMenu = qs('#nav-menu');
  const navLinks = qsa('.nav-link', navMenu);

  // Handle header elevation on scroll
  const handleScroll = () => {
    if (window.scrollY > 20) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // Helper to close mobile menu
  const closeMenu = () => {
    if (navMenu && navMenu.classList.contains('open')) {
      navMenu.classList.remove('open');
      toggleBtn?.classList.remove('active');
      toggleBtn?.setAttribute('aria-expanded', 'false');
    }
  };

  // Mobile menu toggle
  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      toggleBtn.classList.toggle('active', isOpen);
      toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close menu when clicking any nav link
    navLinks.forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
      if (
        navMenu.classList.contains('open') &&
        header &&
        !header.contains(event.target)
      ) {
        closeMenu();
      }
    });

    // Keyboard accessibility: Close mobile drawer on Escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navMenu.classList.contains('open')) {
        closeMenu();
        toggleBtn.focus();
      }
    });
  }
}

/**
 * Highlights navigation links based on scroll position
 */
function initScrollSpy() {
  const sections = qsa('section[id]');
  const navLinks = qsa('.nav-menu .nav-link');

  if (!sections.length || !navLinks.length) return;

  const onScroll = () => {
    const scrollY = window.pageYOffset;

    sections.forEach((section) => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 120;
      const sectionId = section.getAttribute('id');

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        navLinks.forEach((link) => {
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          } else if (link.getAttribute('href')?.startsWith('#')) {
            link.classList.remove('active');
          }
        });
      }
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
}

/**
 * Sets dynamic copyright year in footer
 */
function initFooterYear() {
  const yearElement = qs('#current-year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

/**
 * Handles demo feedback for preview action buttons
 */
function initDemoActions() {
  const demoButtons = qsa('.btn-demo-action');

  demoButtons.forEach((button) => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const originalText = button.textContent;
      button.textContent = 'Demo Preview Only';
      button.disabled = true;

      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
    });
  });
}

/**
 * Loads dynamic Department and Announcement data from the MySQL Express API
 */
async function loadDynamicLandingData() {
  if (typeof CampusAPI === 'undefined') return;

  // 1. Fetch & Render Departments from MySQL
  const deptContainer = qs('#landing-departments-grid');
  if (deptContainer) {
    const deptResult = await CampusAPI.getDepartments();

    if (deptResult.success && Array.isArray(deptResult.data) && deptResult.data.length > 0) {
      const iconMap = {
        CSE: '💻',
        IT: '🌐',
        ECE: '📡',
        MECH: '⚙️',
        CIVIL: '🏗️',
      };

      deptContainer.innerHTML = deptResult.data
        .map((dept) => {
          const icon = iconMap[dept.code] || '🏛️';
          return `
            <div class="department-card">
              <div>
                <div class="dept-header">
                  <span class="dept-code">${dept.code}</span>
                  <span class="dept-icon" aria-hidden="true">${icon}</span>
                </div>
                <h3 class="dept-name">${dept.name}</h3>
                <p class="dept-description">${dept.description || 'Undergraduate and postgraduate curriculum with dedicated research laboratories.'}</p>
              </div>
              <div class="dept-footer">
                <span class="dept-meta-item">4 Years B.Tech</span>
                <span class="dept-meta-item">Database Verified</span>
              </div>
            </div>
          `;
        })
        .join('');
    }
  }

  // 2. Fetch & Render Announcements from MySQL
  const eventsContainer = qs('#landing-events-grid');
  if (eventsContainer) {
    const annResult = await CampusAPI.getAnnouncements();

    if (annResult.success && Array.isArray(annResult.data) && annResult.data.length > 0) {
      eventsContainer.innerHTML = annResult.data
        .map((ann) => {
          const dateObj = new Date(ann.created_at || Date.now());
          const day = dateObj.getDate().toString().padStart(2, '0');
          const month = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
          const audienceBadge = ann.audience === 'students' ? 'For Students' : ann.audience === 'faculty' ? 'Faculty Only' : 'Campus-Wide';

          return `
            <div class="event-card">
              <div class="event-header">
                <div class="event-date-box">
                  <div class="event-day">${day}</div>
                  <div class="event-month">${month}</div>
                </div>
                <span class="event-demo-tag" style="background: rgba(79, 70, 229, 0.1); color: var(--color-primary);">${audienceBadge}</span>
              </div>
              <div class="event-body">
                <span class="event-category">Official Notice • By ${ann.author_name || 'Academic Office'}</span>
                <h3 class="event-title">${ann.title}</h3>
                <p class="event-description">${ann.content}</p>
                <div class="event-actions" style="margin-top: 1rem;">
                  <button class="btn btn-secondary btn-sm btn-demo-action" type="button" style="width: 100%;">View Full Circular</button>
                </div>
              </div>
            </div>
          `;
        })
        .join('');

      initDemoActions();
    }
  }
}
