/**
 * PowerWatch - Global Notifications, Topbar Controls & Quick Search Modal
 */

class NotificationManager {
  constructor() {
    this.initSearchModal();
    this.initNotifications();
    this.initSimToolbar();
  }

  initNotifications() {
    const bellBtn = document.getElementById('notifBellBtn');
    const notifDropdown = document.getElementById('notifDropdown');

    if (bellBtn && notifDropdown) {
      bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notifDropdown.classList.toggle('show');
      });

      document.addEventListener('click', (e) => {
        if (!notifDropdown.contains(e.target) && e.target !== bellBtn) {
          notifDropdown.classList.remove('show');
        }
      });
    }

    // Subscribe to cloudStore alert changes
    if (window.cloudStore) {
      window.cloudStore.onSnapshot('alerts', (alerts) => {
        this.renderNotifications(alerts);
      });
    }
  }

  renderNotifications(alerts) {
    const unreadCountEl = document.getElementById('notifUnreadCount');
    const listEl = document.getElementById('notifList');
    if (!listEl) return;

    const unreadAlerts = alerts.filter(a => a.status === 'active');
    if (unreadCountEl) {
      unreadCountEl.textContent = unreadAlerts.length;
      unreadCountEl.style.display = unreadAlerts.length > 0 ? 'inline-flex' : 'none';
    }

    if (alerts.length === 0) {
      listEl.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
          <i data-lucide="bell-off" style="width: 28px; height: 28px; margin: 0 auto 0.5rem; opacity: 0.5;"></i>
          <div>No active notifications</div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    listEl.innerHTML = alerts.slice(0, 5).map(alert => `
      <div class="notification-item ${alert.status === 'active' ? 'unread' : ''}" onclick="window.location.href='${this.getRelativePath('alerts.html')}'">
        <div class="stat-icon-wrapper ${alert.severity === 'critical' ? 'danger' : (alert.severity === 'high' ? 'warning' : 'blue')}" style="width: 32px; height: 32px; flex-shrink: 0;">
          <i data-lucide="${alert.severity === 'critical' ? 'alert-octagon' : 'alert-triangle'}" style="width: 16px; height: 16px;"></i>
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${alert.title}</span>
            <span style="font-size: 0.7rem; color: var(--text-dim); font-family: var(--font-mono);">${PowerWatchUtils.timeAgo(alert.timestamp)}</span>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem; line-height: 1.3;">${alert.description}</div>
          <div style="margin-top: 0.35rem; display: flex; gap: 0.35rem;">
            <span class="badge badge-${alert.severity === 'critical' ? 'danger' : 'warning'}" style="font-size: 0.65rem;">${alert.severity}</span>
            <span style="font-size: 0.7rem; color: var(--accent-cyan); font-family: var(--font-mono);">${alert.currentValue}</span>
          </div>
        </div>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  markAllRead() {
    if (window.cloudStore) {
      const alerts = window.cloudStore.collections.alerts;
      alerts.forEach(a => a.status = 'acknowledged');
      window.cloudStore.saveCollection('powerwatch_alerts', alerts);
      window.cloudStore.notify('alerts', alerts);
      PowerWatchUtils.showToast("Notifications Cleared", "All alerts marked as acknowledged", "info");
    }
  }

  getRelativePath(pageName) {
    const isPagesDir = window.location.pathname.includes('/pages/');
    return isPagesDir ? pageName : `pages/${pageName}`;
  }

  initSearchModal() {
    const triggerInputs = document.querySelectorAll('.global-search input, #globalSearchTrigger');
    let backdrop = document.querySelector('.search-modal-backdrop');

    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'search-modal-backdrop';
      backdrop.innerHTML = `
        <div class="search-modal-box">
          <div class="search-input-header">
            <i data-lucide="search" style="color: var(--accent-cyan); width: 20px; height: 20px;"></i>
            <input type="text" id="modalSearchInput" placeholder="Search buildings, devices, alerts, reports (e.g. 'CSE', 'AC Unit', 'Spike')..." autofocus />
            <span style="font-size: 0.75rem; color: var(--text-dim); background: var(--bg-tertiary); padding: 0.2rem 0.5rem; border-radius: 4px; font-family: var(--font-mono);">ESC</span>
          </div>
          <div class="search-results-list" id="modalSearchResults">
            <div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
              Type a keyword to instantly query campus assets...
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(backdrop);
    }

    const searchInput = document.getElementById('modalSearchInput');
    const resultsContainer = document.getElementById('modalSearchResults');

    const openSearch = () => {
      backdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
      setTimeout(() => searchInput.focus(), 50);
    };

    const closeSearch = () => {
      backdrop.classList.remove('active');
      document.body.style.overflow = '';
      if (searchInput) searchInput.value = '';
    };

    triggerInputs.forEach(input => {
      input.addEventListener('focus', openSearch);
    });

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeSearch();
    });

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
      if (e.key === 'Escape' && backdrop.classList.contains('active')) {
        closeSearch();
      }
    });

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        this.performSearch(query, resultsContainer);
      });
    }
  }

  performSearch(query, container) {
    if (!query) {
      container.innerHTML = `
        <div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
          Type a keyword to query campus assets...
        </div>
      `;
      return;
    }

    const buildings = window.cloudStore ? window.cloudStore.collections.buildings : SEED_BUILDINGS;
    const devices = window.cloudStore ? window.cloudStore.collections.devices : SEED_DEVICES;
    const alerts = window.cloudStore ? window.cloudStore.collections.alerts : SEED_ALERTS;

    const matchedBld = buildings.filter(b => b.name.toLowerCase().includes(query) || b.code.toLowerCase().includes(query));
    const matchedDev = devices.filter(d => d.name.toLowerCase().includes(query) || d.room.toLowerCase().includes(query) || d.type.toLowerCase().includes(query));
    const matchedAlt = alerts.filter(a => a.title.toLowerCase().includes(query) || a.description.toLowerCase().includes(query));

    let html = '';

    if (matchedBld.length > 0) {
      html += `<div class="search-category-title">Campus Buildings (${matchedBld.length})</div>`;
      matchedBld.forEach(b => {
        html += `
          <div class="search-result-item" onclick="window.location.href='${this.getRelativePath('buildings.html')}?id=${b.id}'">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <i data-lucide="building-2" style="width: 16px; height: 16px; color: var(--accent-cyan);"></i>
              <span style="font-weight: 600; color: var(--text-primary);">${b.name}</span>
              <span style="font-size: 0.75rem; color: var(--text-muted);">(${b.code})</span>
            </div>
            <span class="badge badge-cyan">${b.currentPower} kW</span>
          </div>
        `;
      });
    }

    if (matchedDev.length > 0) {
      html += `<div class="search-category-title">Smart Meters & Devices (${matchedDev.length})</div>`;
      matchedDev.forEach(d => {
        html += `
          <div class="search-result-item" onclick="window.location.href='${this.getRelativePath('devices.html')}?id=${d.id}'">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <i data-lucide="cpu" style="width: 16px; height: 16px; color: var(--accent-blue);"></i>
              <span style="font-weight: 600; color: var(--text-primary);">${d.name}</span>
              <span style="font-size: 0.75rem; color: var(--text-muted);">${d.room}</span>
            </div>
            <span class="badge badge-success">${d.powerKw} kW</span>
          </div>
        `;
      });
    }

    if (matchedAlt.length > 0) {
      html += `<div class="search-category-title">Active Anomaly Alerts (${matchedAlt.length})</div>`;
      matchedAlt.forEach(a => {
        html += `
          <div class="search-result-item" onclick="window.location.href='${this.getRelativePath('alerts.html')}'">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <i data-lucide="alert-triangle" style="width: 16px; height: 16px; color: var(--color-danger);"></i>
              <span style="font-weight: 600; color: var(--text-primary);">${a.title}</span>
            </div>
            <span class="badge badge-${a.severity === 'critical' ? 'danger' : 'warning'}">${a.severity}</span>
          </div>
        `;
      });
    }

    if (!matchedBld.length && !matchedDev.length && !matchedAlt.length) {
      html = `
        <div style="padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
          No matching campus assets or alerts found for "<strong>${query}</strong>"
        </div>
      `;
    }

    container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
  }

  initSimToolbar() {
    // Connect quick simulation buttons if rendered in DOM
    const btnInc = document.getElementById('simBtnInc');
    const btnDec = document.getElementById('simBtnDec');
    const btnSpike = document.getElementById('simBtnSpike');
    const btnReset = document.getElementById('simBtnReset');

    if (btnInc) btnInc.onclick = () => { window.iotSimulator.increaseLoad(15); PowerWatchUtils.showToast("Load Increased", "+15% simulated power draw", "info"); };
    if (btnDec) btnDec.onclick = () => { window.iotSimulator.decreaseLoad(15); PowerWatchUtils.showToast("Load Reduced", "-15% simulated power draw", "info"); };
    if (btnSpike) btnSpike.onclick = () => { window.iotSimulator.injectAnomaly("spike", "bld_cse"); };
    if (btnReset) btnReset.onclick = () => { window.iotSimulator.resetLoad(); PowerWatchUtils.showToast("Simulation Reset", "Load multiplier restored to 1.0x", "info"); };
  }
}

// Global Notification & Search Manager
document.addEventListener('DOMContentLoaded', () => {
  window.notificationManager = new NotificationManager();
});
