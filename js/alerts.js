/**
 * PowerWatch - Anomaly Detection & Smart Alert Center Controller
 * Rule engine, severity filtering, diagnostics, acknowledge & resolve workflow.
 */

class AlertsController {
  constructor() {
    this.alerts = [];
    this.statusFilter = 'all';
    this.severityFilter = 'all';

    this.init();
  }

  async init() {
    this.initEventListeners();
    this.loadAlerts();
  }

  initEventListeners() {
    const statusSelect = document.getElementById('alertStatusFilter');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.statusFilter = e.target.value;
        this.renderAlerts();
      });
    }

    const sevSelect = document.getElementById('alertSeverityFilter');
    if (sevSelect) {
      sevSelect.addEventListener('change', (e) => {
        this.severityFilter = e.target.value;
        this.renderAlerts();
      });
    }

    const simSpikeBtn = document.getElementById('simTriggerSpikeBtn');
    if (simSpikeBtn) {
      simSpikeBtn.addEventListener('click', () => {
        if (window.iotSimulator) {
          window.iotSimulator.injectAnomaly('spike', 'bld_cse');
        }
      });
    }

    const simLowPfBtn = document.getElementById('simTriggerLowPfBtn');
    if (simLowPfBtn) {
      simLowPfBtn.addEventListener('click', () => {
        if (window.iotSimulator) {
          window.iotSimulator.injectAnomaly('low_pf', 'bld_comp_ctr');
        }
      });
    }
  }

  async loadAlerts() {
    if (window.cloudStore) {
      this.alerts = await window.cloudStore.getAlerts();
      window.cloudStore.onSnapshot('alerts', (alerts) => {
        this.alerts = alerts;
        this.renderAlerts();
        this.renderStats();
      });
    } else {
      this.alerts = SEED_ALERTS;
    }
    this.renderAlerts();
    this.renderStats();
  }

  renderStats() {
    const totalCount = this.alerts.length;
    const activeCount = this.alerts.filter(a => a.status === 'active').length;
    const criticalCount = this.alerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length;
    const resolvedCount = this.alerts.filter(a => a.status === 'resolved').length;

    const elTotal = document.getElementById('alertStatTotal');
    const elActive = document.getElementById('alertStatActive');
    const elCritical = document.getElementById('alertStatCritical');
    const elResolved = document.getElementById('alertStatResolved');

    if (elTotal) elTotal.textContent = totalCount;
    if (elActive) elActive.textContent = activeCount;
    if (elCritical) elCritical.textContent = criticalCount;
    if (elResolved) elResolved.textContent = resolvedCount;
  }

  getFilteredAlerts() {
    let list = [...this.alerts];

    if (this.statusFilter !== 'all') {
      list = list.filter(a => a.status === this.statusFilter);
    }

    if (this.severityFilter !== 'all') {
      list = list.filter(a => a.severity === this.severityFilter);
    }

    return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  renderAlerts() {
    const container = document.getElementById('alertsListContainer');
    if (!container) return;

    const filtered = this.getFilteredAlerts();

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 4rem 2rem; background: var(--bg-card); border-radius: var(--radius-xl); border: 1px solid var(--border-color);">
          <i data-lucide="shield-check" style="width: 48px; height: 48px; color: var(--color-success); margin: 0 auto 1rem;"></i>
          <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem;">No Anomaly Alerts</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem;">All monitored campus circuits are operating within baseline safety margins.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = filtered.map(alert => {
      let sevBadge = 'badge-danger';
      if (alert.severity === 'high') sevBadge = 'badge-warning';
      else if (alert.severity === 'medium') sevBadge = 'badge-blue';
      else if (alert.severity === 'low') sevBadge = 'badge-neutral';

      return `
        <div class="card card-glow-cyan" style="margin-bottom: 1.25rem; border-left: 4px solid var(--color-${alert.severity === 'critical' ? 'danger' : (alert.severity === 'high' ? 'warning' : 'info')});">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
                <span class="badge ${sevBadge}">${alert.severity}</span>
                <span class="badge badge-${alert.status === 'active' ? 'danger' : (alert.status === 'acknowledged' ? 'warning' : 'success')}">
                  ${alert.status}
                </span>
                <span style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">
                  ${PowerWatchUtils.timeAgo(alert.timestamp)} (${PowerWatchUtils.formatDateTime(alert.timestamp)})
                </span>
              </div>
              <h3 style="font-size: 1.2rem; color: var(--text-primary);">${alert.title}</h3>
              <div style="font-size: 0.85rem; color: var(--accent-cyan); margin-top: 0.2rem;">
                ${alert.buildingName} • <span style="color: var(--text-secondary);">${alert.device}</span>
              </div>
            </div>

            <div style="display: flex; gap: 0.5rem;">
              ${alert.status === 'active' ? `
                <button class="btn btn-secondary btn-sm" onclick="alertsController.acknowledgeAlert('${alert.id}')">
                  <i data-lucide="check" style="width: 14px; height: 14px;"></i> Acknowledge
                </button>
              ` : ''}
              ${alert.status !== 'resolved' ? `
                <button class="btn btn-outline-cyan btn-sm" onclick="alertsController.resolveAlert('${alert.id}')">
                  <i data-lucide="check-circle-2" style="width: 14px; height: 14px;"></i> Mark Resolved
                </button>
              ` : `
                <span style="color: var(--color-success); font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 0.35rem;">
                  <i data-lucide="check-check" style="width: 16px; height: 16px;"></i> Resolved
                </span>
              `}
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 1rem;">
            <div>
              <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Detected Value</span>
              <div class="font-mono" style="font-size: 1.15rem; font-weight: 700; color: var(--color-${alert.severity === 'critical' ? 'danger' : 'warning'});">${alert.currentValue}</div>
            </div>
            <div>
              <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Expected Range</span>
              <div class="font-mono" style="font-size: 1.15rem; font-weight: 600; color: var(--color-success);">${alert.expectedRange}</div>
            </div>
            <div>
              <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Anomaly Type</span>
              <div style="font-size: 0.95rem; font-weight: 600; color: var(--text-primary);">${alert.type}</div>
            </div>
          </div>

          <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 0.75rem; line-height: 1.5;">
            ${alert.description}
          </p>

          <div style="background: rgba(0, 240, 255, 0.05); border: 1px dashed rgba(0, 240, 255, 0.25); border-radius: var(--radius-md); padding: 0.85rem 1rem; display: flex; align-items: flex-start; gap: 0.75rem;">
            <i data-lucide="lightbulb" style="color: var(--accent-cyan); width: 20px; height: 20px; flex-shrink: 0; margin-top: 2px;"></i>
            <div>
              <div style="font-size: 0.78rem; font-weight: 700; color: var(--accent-cyan); text-transform: uppercase; letter-spacing: 0.05em;">Recommended Action</div>
              <div style="font-size: 0.85rem; color: var(--text-primary); margin-top: 0.2rem;">${alert.recommendedAction}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  async acknowledgeAlert(alertId) {
    if (window.cloudStore) {
      await window.cloudStore.updateAlertStatus(alertId, 'acknowledged');
      PowerWatchUtils.showToast("Alert Acknowledged", "Marked as under investigation.", "info");
    }
  }

  async resolveAlert(alertId) {
    if (window.cloudStore) {
      await window.cloudStore.updateAlertStatus(alertId, 'resolved');
      PowerWatchUtils.showToast("Alert Resolved", "Anomaly cleared from active queue.", "success");
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.alertsController = new AlertsController();
});
