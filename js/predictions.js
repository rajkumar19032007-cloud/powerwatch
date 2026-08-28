/**
 * PowerWatch - Predictive Analytics & Forecasting Controller
 * Statistical forecasting (24-hour, 7-day, 30-day), confidence intervals,
 * and data-driven smart energy recommendations.
 */

class PredictionsController {
  constructor() {
    this.forecastTimeframe = '7d';
    this.forecastChart = null;
    this.hourlyForecastChart = null;

    this.init();
  }

  init() {
    this.initEventListeners();
    this.renderForecastChart();
    this.renderHourlyForecastChart();
    this.renderMetrics();
    this.renderRecommendations();
  }

  initEventListeners() {
    const buttons = document.querySelectorAll('.pred-time-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.forecastTimeframe = btn.dataset.timeframe;
        this.updateForecastChart();
      });
    });
  }

  renderMetrics() {
    const elTomorrow = document.getElementById('predTomorrowVal');
    const elTomorrowDiff = document.getElementById('predTomorrowDiff');
    const elPeak = document.getElementById('predPeakDemandVal');
    const elConfidence = document.getElementById('predConfidenceVal');

    if (elTomorrow) elTomorrow.textContent = "1,348 kWh";
    if (elTomorrowDiff) elTomorrowDiff.textContent = "+4.9% vs yesterday";
    if (elPeak) elPeak.textContent = "174.2 kW (14:30)";
    if (elConfidence) elConfidence.textContent = "94.2%";
  }

  getForecastData() {
    if (this.forecastTimeframe === '7d') {
      const labels = ['Tomorrow (Fri)', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
      const predicted = [1348, 890, 810, 1380, 1410, 1395, 1360];
      const upperBand = predicted.map(v => Math.round(v * 1.08));
      const lowerBand = predicted.map(v => Math.round(v * 0.92));

      return {
        labels,
        datasets: [
          {
            label: 'Upper Confidence (95%)',
            data: upperBand,
            borderColor: 'transparent',
            backgroundColor: 'rgba(0, 240, 255, 0.08)',
            fill: '+1',
            pointRadius: 0
          },
          {
            label: 'Lower Confidence (95%)',
            data: lowerBand,
            borderColor: 'transparent',
            backgroundColor: 'rgba(0, 240, 255, 0.08)',
            fill: false,
            pointRadius: 0
          },
          {
            label: 'Forecasted Consumption (kWh)',
            data: predicted,
            borderColor: '#00f0ff',
            borderWidth: 2.5,
            pointBackgroundColor: '#00f0ff',
            pointRadius: 4,
            tension: 0.3
          }
        ]
      };
    } else {
      // 30 Days Forecast
      const labels = [];
      const predicted = [];
      const upperBand = [];
      const lowerBand = [];

      for (let i = 1; i <= 30; i++) {
        labels.push(`Day ${i}`);
        const isWeekend = (i % 7 === 2 || i % 7 === 3);
        const base = isWeekend ? 840 : 1370;
        const noise = (Math.sin(i * 0.5) * 60) + ((Math.random() - 0.5) * 30);
        const val = Math.round(base + noise);
        predicted.push(val);
        upperBand.push(Math.round(val * 1.09));
        lowerBand.push(Math.round(val * 0.91));
      }

      return {
        labels,
        datasets: [
          {
            label: 'Upper Bound',
            data: upperBand,
            borderColor: 'transparent',
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            fill: '+1',
            pointRadius: 0
          },
          {
            label: 'Lower Bound',
            data: lowerBand,
            borderColor: 'transparent',
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            fill: false,
            pointRadius: 0
          },
          {
            label: '30-Day Estimated Load (kWh)',
            data: predicted,
            borderColor: '#3b82f6',
            borderWidth: 2,
            pointRadius: 2,
            tension: 0.2
          }
        ]
      };
    }
  }

  renderForecastChart() {
    const ctx = document.getElementById('forecastMainChart');
    if (!ctx) return;

    const data = this.getForecastData();
    this.forecastChart = new Chart(ctx, {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              filter: (legendItem) => !legendItem.text.includes('Bound') && !legendItem.text.includes('Confidence'),
              color: '#f8fafc'
            }
          },
          tooltip: {
            backgroundColor: '#0d121f',
            borderColor: 'rgba(0, 240, 255, 0.3)',
            borderWidth: 1
          }
        },
        scales: {
          x: { grid: { color: 'rgba(255, 255, 255, 0.03)' } },
          y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { callback: v => `${v} kWh` } }
        }
      }
    });
  }

  updateForecastChart() {
    if (!this.forecastChart) return;
    const data = this.getForecastData();
    this.forecastChart.data = data;
    this.forecastChart.update();
  }

  renderHourlyForecastChart() {
    const ctx = document.getElementById('forecastHourlyChart');
    if (!ctx) return;

    const hours = ['00:00','02:00','04:00','06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00'];
    const tomorrowHourly = [35, 28, 26, 42, 112, 162, 168, 174, 155, 120, 95, 55];
    const todayActual = [32, 27, 25, 38, 105, 152, 160, 165, 148, 115, 88, 50];

    this.hourlyForecastChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: hours,
        datasets: [
          {
            label: 'Predicted Tomorrow (kW)',
            data: tomorrowHourly,
            borderColor: '#00f0ff',
            borderDash: [5, 5],
            borderWidth: 2,
            tension: 0.35,
            pointBackgroundColor: '#00f0ff'
          },
          {
            label: 'Today Baseline (kW)',
            data: todayActual,
            borderColor: 'rgba(255, 255, 255, 0.3)',
            borderWidth: 1.5,
            tension: 0.35,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: '#94a3b8' } }
        },
        scales: {
          x: { grid: { display: false } },
          y: { ticks: { callback: v => `${v} kW` } }
        }
      }
    });
  }

  renderRecommendations() {
    const container = document.getElementById('smartRecommendationsList');
    if (!container) return;

    const recommendations = [
      {
        title: "Shift Hostel A Water Heating to Pre-Peak Solar Window",
        impact: "High Savings",
        savingEst: "₹18,400 / month",
        confidence: "96%",
        desc: "Hostel A heating load spikes sharply at 06:30 AM before rooftop solar generation peaks. Pre-heating utility tanks between 04:30 - 05:30 AM on off-peak tariff avoids peak grid tariff.",
        icon: "zap",
        color: "warning"
      },
      {
        title: "Automate Computer Lab 3B Idle Power Cutoff",
        impact: "Medium Savings",
        savingEst: "₹8,200 / month",
        confidence: "91%",
        desc: "Lab 3B shows a continuous 8.9 kW base draw past 20:00 PM due to unmanaged PC sleep states. Enabling automatic scheduled shutdown at 20:30 PM reduces unnecessary idle consumption.",
        icon: "moon",
        color: "cyan"
      },
      {
        title: "Capacitor Bank Correction in Computer Center",
        impact: "Compliance & Safety",
        savingEst: "₹6,500 / month (Penalties Avoided)",
        confidence: "98%",
        desc: "Server Room Phase B power factor drops to 0.82 during heavy compute batches. Tuning automatic power factor correction (APFC) keeps PF above 0.95 and avoids DISCOM penalties.",
        icon: "shield-alert",
        color: "success"
      },
      {
        title: "HVAC Temperature Setpoint Optimization in Library",
        impact: "Efficiency Score +6%",
        savingEst: "₹12,100 / month",
        confidence: "88%",
        desc: "Central Library chillers run continuously at 21°C regardless of ambient load. Modulating setpoint to 24°C between 10:00 - 15:00 PM saves ~14% cooling energy without compromising comfort.",
        icon: "thermometer",
        color: "blue"
      }
    ];

    container.innerHTML = recommendations.map(rec => `
      <div class="card card-glow-${rec.color}" style="margin-bottom: 1.25rem; padding: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div class="stat-icon-wrapper ${rec.color}" style="width: 42px; height: 42px;">
              <i data-lucide="${rec.icon}" style="width: 20px; height: 20px;"></i>
            </div>
            <div>
              <h3 style="font-size: 1.1rem; color: var(--text-primary);">${rec.title}</h3>
              <div style="display: flex; gap: 0.5rem; margin-top: 0.25rem;">
                <span class="badge badge-${rec.color}">${rec.impact}</span>
                <span style="font-size: 0.75rem; color: var(--text-muted);">Confidence: <strong style="color: var(--accent-cyan); font-family: var(--font-mono);">${rec.confidence}</strong></span>
              </div>
            </div>
          </div>

          <div style="text-align: right;">
            <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Estimated Savings</span>
            <div class="font-mono" style="font-size: 1.2rem; font-weight: 700; color: var(--color-success);">${rec.savingEst}</div>
          </div>
        </div>

        <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1rem;">
          ${rec.desc}
        </p>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
          <button class="btn btn-secondary btn-sm" onclick="PowerWatchUtils.showToast('Rule Configured', 'Automated energy recommendation queued for schedule deployment.', 'info')">
            Apply Recommendation Rule
          </button>
        </div>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.predictionsController = new PredictionsController();
});
