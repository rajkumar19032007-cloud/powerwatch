/**
 * PowerWatch - Core Utility Functions
 * Formatting, Currency (INR), Numbers, Dates, Toasts, Modals, Animations
 */

const PowerWatchUtils = {
  /**
   * Format Indian Rupee currency (₹)
   * @param {number} amount 
   * @param {number} decimals 
   * @returns {string} e.g. "₹15,420"
   */
  formatINR(amount, decimals = 0) {
    if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals
    }).format(amount);
  },

  /**
   * Format energy in kWh or MWh
   * @param {number} kWh 
   * @param {number} decimals 
   * @returns {string} e.g. "1,284 kWh" or "1.28 MWh"
   */
  formatEnergy(kWh, decimals = 1) {
    if (isNaN(kWh) || kWh === null) return '0.0 kWh';
    if (kWh >= 10000) {
      return `${(kWh / 1000).toFixed(decimals)} MWh`;
    }
    return `${Number(kWh).toLocaleString('en-IN', { maximumFractionDigits: decimals })} kWh`;
  },

  /**
   * Format active power in kW or MW
   * @param {number} kW 
   * @param {number} decimals 
   * @returns {string} e.g. "42.6 kW"
   */
  formatPower(kW, decimals = 1) {
    if (isNaN(kW) || kW === null) return '0.0 kW';
    if (kW >= 1000) {
      return `${(kW / 1000).toFixed(decimals)} MW`;
    }
    return `${Number(kW).toFixed(decimals)} kW`;
  },

  /**
   * Format date/time to local readable string
   * @param {Date|string|number} date 
   * @param {boolean} includeTime 
   * @returns {string}
   */
  formatDateTime(date, includeTime = true) {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    
    const options = {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.second = '2-digit';
      options.hour12 = true;
    }
    return d.toLocaleDateString('en-IN', options);
  },

  /**
   * Relative time formatter (e.g. "2 mins ago")
   * @param {Date|string|number} date 
   * @returns {string}
   */
  timeAgo(date) {
    if (!date) return '';
    const now = new Date();
    const past = new Date(date);
    const diffSec = Math.floor((now - past) / 1000);

    if (diffSec < 5) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay}d ago`;
  },

  /**
   * Animate numeric value counter in DOM
   * @param {HTMLElement|string} elementOrId 
   * @param {number} start 
   * @param {number} end 
   * @param {number} durationMs 
   * @param {number} decimals 
   * @param {string} prefix 
   * @param {string} suffix 
   */
  animateValue(elementOrId, start, end, durationMs = 800, decimals = 0, prefix = '', suffix = '') {
    const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
    if (!el) return;

    const startTime = performance.now();
    const diff = end - start;

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * easeProgress;

      let formatted = current.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });

      el.textContent = `${prefix}${formatted}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  },

  /**
   * Display toast notification
   * @param {string} title 
   * @param {string} message 
   * @param {'info'|'success'|'warning'|'danger'} type 
   * @param {number} durationMs 
   */
  showToast(title, message, type = 'info', durationMs = 4000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-item ${type}`;
    
    let iconClass = 'zap';
    if (type === 'success') iconClass = 'check-circle';
    if (type === 'warning') iconClass = 'alert-triangle';
    if (type === 'danger') iconClass = 'alert-octagon';

    toast.innerHTML = `
      <i data-lucide="${iconClass}" style="color: var(--color-${type === 'info' ? 'info' : type}); width: 20px; height: 20px; flex-shrink: 0; margin-top: 2px;"></i>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-desc">${message}</div>
      </div>
      <div class="toast-close" onclick="this.parentElement.remove()">&times;</div>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    // Trigger entrance animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto remove
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, durationMs);
  },

  /**
   * Open modal by ID
   * @param {string} modalId 
   */
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  /**
   * Close modal by ID
   * @param {string} modalId 
   */
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  /**
   * Debounce function
   */
  debounce(func, wait = 250) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },

  /**
   * Generate UUID v4
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  /**
   * Download CSV string as a file
   * @param {string} filename 
   * @param {string} csvContent 
   */
  downloadCSV(filename, csvContent) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

window.PowerWatchUtils = PowerWatchUtils;
