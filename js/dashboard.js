/**
 * PowerWatch - Main Dashboard Controller
 * Handles real-time KPI counters, Chart.js graphs, anomaly alert feeds,
 * and building status overviews.
 */

class DashboardController {
  constructor() {
    this.liveTrendChart = null;
    this.buildingDistChart = null;
    this.peakHoursChart = null;
    this.maxDataPoints = 30;
    this.liveTimeLabels = [];
    this.livePowerValues = [];

    this.init();
  }

  async init() {
    this.initKPICounters();
    this.initCharts();
    this.initBuildingCards();
    this.initAlertsFeed();
    this.subscribeToLiveTelemetry();
  }

  initKPICounters() {
    const settings = window.cloudStore ? window.cloudStore.getSettings() : DEFAULT_SETTINGS;
    const baseTariff = settings.tariff.baseRate || 7.5;

    // Calculate aggregated stats
    const totalDailyKwh = SEED_BUILDINGS.reduce((sum, b) => sum + b.dailyConsumption, 0);
    const totalMonthlyKwh = SEED_BUILDINGS.reduce((sum, b) => sum + b.monthlyConsumption, 0);
    const totalCurrentKw = SEED_BUILDINGS.reduce((sum, b) => sum + b.currentPower, 0);
    const totalEstimatedCost = totalDailyKwh * baseTariff;
    const avgEfficiency = Math.round(SEED_BUILDINGS.reduce((sum, b) => sum + b.efficiencyScore, 0) / SEED_BUILDINGS.length);
    const totalDevices = SEED_BUILDINGS.reduce((sum, b) => sum + b.deviceCount, 0);

    PowerWatchUtils.animateValue('kpiTotalConsumption', 0, Math.round(totalMonthlyKwh), 1000, 0, '', ' kWh');
    PowerWatchUtils.animateValue('kpiTodayConsumption', 0, totalDailyKwh, 1000, 1, '', ' kWh');
    PowerWatchUtils.animateValue('kpiCurrentPower', 0, totalCurrentKw, 1000, 1, '', ' kW');
    PowerWatchUtils.animateValue('kpiEstimatedCost', 0, Math.round(totalEstimatedCost), 1000, 0, '₹', '');
    PowerWatchUtils.animateValue('kpiEfficiencyScore', 0, avgEfficiency, 1000, 0, '', '%');
    PowerWatchUtils.animateValue('kpiActiveDevices', 0, totalDevices, 1000, 0, '', '');
  }

  initCharts() {
    if (typeof Chart === 'undefined') {
      console.warn("Chart.js not loaded yet. Waiting...");
      return;
    }

    // Set Chart.js dark theme defaults
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.scale.grid.color = 'rgba(255, 255, 255, 0.05)';

    this.renderLiveTrendChart();
    this.renderBuildingDistChart();
    this.renderPeakHoursChart();
  }

  renderLiveTrendChart() {
    const ctx = document.getElementById('dashboardLiveTrendChart');
    if (!ctx) return;

    // Seed initial history
    const now = Date.now();
    for (let i = this.maxDataPoints - 1; i >= 0; i--) {
      const t = new Date(now - i * 1000);
      this.liveTimeLabels.push(t.toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      this.livePowerValues.push(115 + Math.sin(i * 0.4) * 8 + (Math.random() - 0.5) * 4);
    }

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(0, 240, 255, 0.35)');
    gradient.addColorStop(1, 'rgba(0, 240, 255, 0.0)');

    this.liveTrendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.liveTimeLabels,
        datasets: [{
          label: 'Total Campus Power (kW)',
          data: this.livePowerValues,
          borderColor: '#00f0ff',
          borderWidth: 2.5,
          backgroundColor: gradient,
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: '#00f0ff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0d121f',
            borderColor: 'rgba(0, 240, 255, 0.3)',
            borderWidth: 1,
            titleFont: { size: 12 },
            bodyFont: { family: 'JetBrains Mono', size: 13, weight: 'bold' },
            callbacks: {
              label: (ctx) => ` Power: ${ctx.parsed.y.toFixed(1)} kW`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxTicksLimit: 6, font: { size: 11, family: 'JetBrains Mono' } }
          },
          y: {
            suggestedMin: 80,
            suggestedMax: 200,
            ticks: {
              font: { size: 11, family: 'JetBrains Mono' },
              callback: (v) => `${v} kW`
            }
          }
        }
      }
    });
  }

  renderBuildingDistChart() {
    const ctx = document.getElementById('dashboardBuildingDistChart');
    if (!ctx) return;

    const labels = SEED_BUILDINGS.map(b => b.name);
    const dataValues = SEED_BUILDINGS.map(b => b.dailyConsumption);

    this.buildingDistChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: "Today's Consumption (kWh)",
          data: dataValues,
          backgroundColor: [
            'rgba(0, 240, 255, 0.7)',
            'rgba(59, 130, 246, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(168, 85, 247, 0.7)',
            'rgba(236, 72, 153, 0.7)',
            'rgba(14, 165, 233, 0.7)',
            'rgba(99, 102, 241, 0.7)'
          ],
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0d121f',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            callbacks: {
              label: (ctx) => ` Consumption: ${ctx.parsed.x.toFixed(1)} kWh`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { font: { family: 'JetBrains Mono', size: 10 } }
          },
          y: {
            grid: { display: false },
            ticks: { font: { size: 11 } }
          }
        }
      }
    });
  }

  renderPeakHoursChart() {
    const ctx = document.getElementById('dashboardPeakHoursChart');
    if (!ctx) return;

    const hours = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00', '23:00'];
    const academicLoad = [22, 18, 25, 110, 145, 138, 70, 42, 28];
    const hostelLoad = [45, 30, 58, 82, 40, 38, 92, 118, 75];

    this.peakHoursChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: hours,
        datasets: [
          {
            label: 'Academic & Labs (kW)',
            data: academicLoad,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Hostels & Residential (kW)',
            data: hostelLoad,
            borderColor: '#a855f7',
            backgroundColor: 'rgba(168, 85, 247, 0.15)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } }
        },
        scales: {
          x: { grid: { display: false } },
          y: { ticks: { callback: v => `${v} kW` } }
        }
      }
    });
  }

  initBuildingCards() {
    const container = document.getElementById('dashboardBuildingCards');
    if (!container) return;

    const isPages = window.location.pathname.includes('/pages/');
    const bldUrl = isPages ? 'buildings.html' : 'pages/buildings.html';

    container.innerHTML = SEED_BUILDINGS.map(bld => `
      <div class="card card-glow-cyan" style="padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; cursor: pointer;" onclick="window.location.href='${bldUrl}?id=${bld.id}'">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
            <div>
              <h4 style="font-size: 1rem; margin-bottom: 0.2rem;">${bld.name}</h4>
              <span style="font-size: 0.72rem; color: var(--text-muted);">${bld.category}</span>
            </div>
            <span class="badge ${bld.activeAlerts > 0 ? 'badge-danger' : 'badge-success'}">${bld.activeAlerts > 0 ? `${bld.activeAlerts} Alert` : 'Optimal'}</span>
          </div>
          
          <div style="display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 0.75rem;">
            <span class="font-mono bld-live-kw-${bld.id}" style="font-size: 1.45rem; font-weight: 700; color: var(--accent-cyan);">${bld.currentPower}</span>
            <span style="font-size: 0.8rem; color: var(--text-muted);">kW active</span>
          </div>
        </div>

        <div style="padding-top: 0.75rem; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted);">
          <span>Daily: <strong style="color: var(--text-primary); font-family: var(--font-mono);">${bld.dailyConsumption} kWh</strong></span>
          <span>Efficiency: <strong style="color: var(--color-success); font-family: var(--font-mono);">${bld.efficiencyScore}%</strong></span>
        </div>
      </div>
    `).join('');
  }

  initAlertsFeed() {
    const container = document.getElementById('dashboardAlertsFeed');
    if (!container) return;

    if (window.cloudStore) {
      window.cloudStore.onSnapshot('alerts', (alerts) => {
        const activeAlerts = alerts.filter(a => a.status !== 'resolved').slice(0, 4);
        if (activeAlerts.length === 0) {
          container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
              <i data-lucide="check-circle-2" style="color: var(--color-success); width: 32px; height: 32px; margin: 0 auto 0.5rem;"></i>
              <div>All campus energy circuits operating within optimal thresholds.</div>
            </div>
          `;
          if (window.lucide) window.lucide.createIcons();
          return;
        }

        container.innerHTML = activeAlerts.map(alert => `
          <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-left: 4px solid var(--color-${alert.severity === 'critical' ? 'danger' : 'warning'}); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                <span style="font-weight: 600; font-size: 0.9rem; color: var(--text-primary);">${alert.title}</span>
                <span class="badge badge-${alert.severity === 'critical' ? 'danger' : 'warning'}" style="font-size: 0.65rem;">${alert.severity}</span>
              </div>
              <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">${alert.description}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.35rem; display: flex; gap: 1rem;">
                <span>Building: <strong style="color: var(--accent-cyan);">${alert.buildingName}</strong></span>
                <span>Value: <strong style="color: var(--text-primary); font-family: var(--font-mono);">${alert.currentValue}</strong></span>
                <span>Time: ${PowerWatchUtils.timeAgo(alert.timestamp)}</span>
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="window.location.href='pages/alerts.html'">Investigate</button>
          </div>
        `).join('');

        if (window.lucide) window.lucide.createIcons();
      });
    }
  }

  subscribeToLiveTelemetry() {
    if (!window.iotSimulator) return;

    window.iotSimulator.subscribe((telemetry) => {
      // 1. Update live total power element in KPI card
      const liveKwEl = document.getElementById('kpiCurrentPower');
      if (liveKwEl) {
        liveKwEl.textContent = `${telemetry.totalPowerKw.toFixed(1)} kW`;
      }

      // 2. Update telemetry strip in dashboard
      const stripPower = document.getElementById('stripLivePower');
      const stripVolt = document.getElementById('stripLiveVoltage');
      const stripCurr = document.getElementById('stripLiveCurrent');
      const stripFreq = document.getElementById('stripLiveFreq');
      const stripPf = document.getElementById('stripLivePF');

      if (stripPower) stripPower.textContent = `${telemetry.totalPowerKw.toFixed(1)} kW`;
      if (stripVolt) stripVolt.textContent = `${telemetry.voltage.toFixed(1)} V`;
      if (stripCurr) stripCurr.textContent = `${telemetry.totalCurrentA.toFixed(1)} A`;
      if (stripFreq) stripFreq.textContent = `${telemetry.frequency.toFixed(2)} Hz`;
      if (stripPf) stripPf.textContent = `${telemetry.powerFactor.toFixed(2)}`;

      // 3. Update building mini counters
      telemetry.buildings.forEach(b => {
        const bEl = document.querySelector(`.bld-live-kw-${b.id}`);
        if (bEl) bEl.textContent = b.powerKw.toFixed(1);
      });

      // 4. Push new point to live stream chart
      if (this.liveTrendChart) {
        const timeStr = new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        this.liveTimeLabels.push(timeStr);
        this.livePowerValues.push(telemetry.totalPowerKw);

        if (this.liveTimeLabels.length > this.maxDataPoints) {
          this.liveTimeLabels.shift();
          this.livePowerValues.shift();
        }

        this.liveTrendChart.update('none');
      }
    });
  }
}

// Instantiate on load
document.addEventListener('DOMContentLoaded', () => {
  window.dashboardController = new DashboardController();
});
