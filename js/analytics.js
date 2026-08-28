/**
 * PowerWatch - Advanced Energy Analytics Controller
 * Time-series consumption, Building Radar, Category Donut, Peak Heatmaps, and Cost breakdowns.
 */

class AnalyticsController {
  constructor() {
    this.timeframe = 'weekly';
    this.mainChart = null;
    this.radarChart = null;
    this.categoryChart = null;
    this.costChart = null;

    this.init();
  }

  init() {
    this.initTimeframeButtons();
    this.renderMainChart();
    this.renderRadarChart();
    this.renderCategoryChart();
    this.renderCostChart();
    this.renderSummaryMetrics();
  }

  initTimeframeButtons() {
    const buttons = document.querySelectorAll('.analytics-time-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.timeframe = btn.dataset.timeframe;
        this.updateMainChart();
      });
    });

    const exportBtn = document.getElementById('exportAnalyticsBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportCSV());
    }
  }

  renderSummaryMetrics() {
    const settings = window.cloudStore ? window.cloudStore.getSettings() : DEFAULT_SETTINGS;
    const baseTariff = settings.tariff.baseRate || 7.5;

    const totalMonthlyKwh = SEED_BUILDINGS.reduce((sum, b) => sum + b.monthlyConsumption, 0);
    const totalCost = totalMonthlyKwh * baseTariff;
    const carbonFootprintKg = Math.round(totalMonthlyKwh * 0.82); // 0.82 kg CO2 per kWh grid factor
    const peakDemandKw = 168.4;

    const elTotal = document.getElementById('analyticsMonthlyTotal');
    const elCost = document.getElementById('analyticsMonthlyCost');
    const elCarbon = document.getElementById('analyticsCarbonFootprint');
    const elPeak = document.getElementById('analyticsPeakDemand');

    if (elTotal) elTotal.textContent = `${totalMonthlyKwh.toLocaleString('en-IN')} kWh`;
    if (elCost) elCost.textContent = `₹${Math.round(totalCost).toLocaleString('en-IN')}`;
    if (elCarbon) elCarbon.textContent = `${(carbonFootprintKg / 1000).toFixed(1)} MT CO₂`;
    if (elPeak) elPeak.textContent = `${peakDemandKw} kW`;
  }

  getMainChartData() {
    if (this.timeframe === 'hourly') {
      const labels = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
      const academic = [12, 10, 9, 14, 48, 88, 92, 90, 72, 35, 20, 15];
      const hostels = [28, 18, 14, 22, 54, 32, 28, 30, 42, 78, 88, 52];
      const datacenter = [31, 31, 30, 31, 32, 35, 36, 36, 35, 34, 33, 32];
      return { labels, datasets: [
        { label: 'Academic & Labs', data: academic, borderColor: '#00f0ff', backgroundColor: 'rgba(0,240,255,0.1)', fill: true, tension: 0.3 },
        { label: 'Hostels & Res.', data: hostels, borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.1)', fill: true, tension: 0.3 },
        { label: 'Data Center / CC', data: datacenter, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.3 }
      ]};
    } else if (this.timeframe === 'daily') {
      const labels = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7', 'Day 8', 'Day 9', 'Day 10', 'Day 11', 'Day 12', 'Day 13', 'Day 14'];
      const dailyVals = [520, 540, 580, 560, 595, 380, 340, 530, 550, 570, 590, 610, 390, 350];
      return { labels, datasets: [
        { label: 'Campus Total Energy (kWh)', data: dailyVals, borderColor: '#00f0ff', backgroundColor: 'rgba(0,240,255,0.15)', fill: true, tension: 0.35 }
      ]};
    } else if (this.timeframe === 'weekly') {
      const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'];
      const campusWeekly = [3650, 3820, 3740, 3980, 3620, 3890, 4100, 3920];
      return { labels, datasets: [
        { label: 'Weekly Total Energy (kWh)', data: campusWeekly, borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.2)', fill: true, tension: 0.3 }
      ]};
    } else {
      // Monthly
      const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyVals = [14200, 13800, 15600, 17200, 18500, 16900, 15400, 16100, 16800, 17400, 15200, 14600];
      return { labels, datasets: [
        { label: 'Monthly Energy (kWh)', data: monthlyVals, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.2)', fill: true, tension: 0.3 }
      ]};
    }
  }

  renderMainChart() {
    const ctx = document.getElementById('analyticsMainTrendChart');
    if (!ctx) return;

    const data = this.getMainChartData();
    this.mainChart = new Chart(ctx, {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { position: 'top', labels: { color: '#f8fafc', font: { size: 12 } } },
          tooltip: {
            backgroundColor: '#0d121f',
            borderColor: 'rgba(0,240,255,0.3)',
            borderWidth: 1
          }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.03)' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { callback: v => `${v} kWh` } }
        }
      }
    });
  }

  updateMainChart() {
    if (!this.mainChart) return;
    const data = this.getMainChartData();
    this.mainChart.data = data;
    this.mainChart.update();
  }

  renderRadarChart() {
    const ctx = document.getElementById('analyticsRadarChart');
    if (!ctx) return;

    const labels = SEED_BUILDINGS.map(b => b.name);
    const efficiency = SEED_BUILDINGS.map(b => b.efficiencyScore);
    const loadPercent = SEED_BUILDINGS.map(b => Math.round((b.currentPower / b.transformerCapacity) * 100));

    this.radarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Efficiency Score (%)',
            data: efficiency,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            pointBackgroundColor: '#10b981'
          },
          {
            label: 'Transformer Load (%)',
            data: loadPercent,
            borderColor: '#00f0ff',
            backgroundColor: 'rgba(0, 240, 255, 0.2)',
            pointBackgroundColor: '#00f0ff'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { color: '#f8fafc' } } },
        scales: {
          r: {
            angleLines: { color: 'rgba(255,255,255,0.08)' },
            grid: { color: 'rgba(255,255,255,0.08)' },
            pointLabels: { color: '#94a3b8', font: { size: 10 } },
            ticks: { display: false, max: 100, min: 0 }
          }
        }
      }
    });
  }

  renderCategoryChart() {
    const ctx = document.getElementById('analyticsCategoryChart');
    if (!ctx) return;

    this.categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['HVAC & Cooling', 'IT & Servers', 'Lighting', 'Heavy Machinery', 'Water Heating', 'Lab Electronics'],
        datasets: [{
          data: [34, 26, 12, 14, 8, 6],
          backgroundColor: [
            'rgba(0, 240, 255, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(16, 185, 129, 0.8)'
          ],
          borderColor: '#0d121f',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#94a3b8', boxWidth: 12, font: { size: 11 } } }
        }
      }
    });
  }

  renderCostChart() {
    const ctx = document.getElementById('analyticsCostBreakdownChart');
    if (!ctx) return;

    this.costChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['CSE Block', 'ECE Block', 'Mech Block', 'Library', 'Comp Center', 'Hostel A', 'Hostel B', 'Admin Block'],
        datasets: [
          {
            label: 'Base Tariff (₹)',
            data: [13104, 10440, 16920, 7470, 23880, 12276, 11232, 6228],
            backgroundColor: 'rgba(59, 130, 246, 0.7)'
          },
          {
            label: 'Peak Surcharge (₹)',
            data: [2316, 1560, 3200, 940, 4800, 2180, 1920, 890],
            backgroundColor: 'rgba(245, 158, 11, 0.7)'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, ticks: { callback: v => `₹${v.toLocaleString('en-IN')}` } }
        }
      }
    });
  }

  exportCSV() {
    let csv = "Building,Code,Category,Current Power (kW),Daily (kWh),Monthly (kWh),Efficiency Score (%)\n";
    SEED_BUILDINGS.forEach(b => {
      csv += `"${b.name}","${b.code}","${b.category}",${b.currentPower},${b.dailyConsumption},${b.monthlyConsumption},${b.efficiencyScore}\n`;
    });
    PowerWatchUtils.downloadCSV(`PowerWatch_Campus_Analytics_${new Date().toISOString().slice(0,10)}.csv`, csv);
    PowerWatchUtils.showToast("Export Ready", "Analytics CSV downloaded successfully.", "success");
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.analyticsController = new AnalyticsController();
});
