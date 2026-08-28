/**
 * PowerWatch - Live Energy Monitoring Controller
 * Real-time telemetry streaming, multi-phase electrical analytics,
 * oscilloscope chart, and simulation controls.
 */

class MonitoringController {
  constructor() {
    this.streamChart = null;
    this.maxPoints = 40;
    this.timeLabels = [];
    this.powerHistory = [];
    this.voltageHistory = [];
    this.currentHistory = [];
    this.selectedBuildingId = 'all';

    this.init();
  }

  init() {
    this.initChart();
    this.initControls();
    this.subscribeSimulator();
  }

  initChart() {
    const ctx = document.getElementById('liveOscilloscopeChart');
    if (!ctx) return;

    // Pre-populate with initial points
    const now = Date.now();
    for (let i = this.maxPoints - 1; i >= 0; i--) {
      const t = new Date(now - i * 1000);
      this.timeLabels.push(t.toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      this.powerHistory.push(110 + Math.sin(i * 0.3) * 6);
      this.voltageHistory.push(230.5 + (Math.random() - 0.5) * 1.5);
      this.currentHistory.push(165 + Math.sin(i * 0.3) * 10);
    }

    this.streamChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.timeLabels,
        datasets: [
          {
            label: 'Active Power (kW)',
            data: this.powerHistory,
            borderColor: '#00f0ff',
            backgroundColor: 'rgba(0, 240, 255, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            yAxisID: 'yPower',
            pointRadius: 0
          },
          {
            label: 'Grid Voltage (V)',
            data: this.voltageHistory,
            borderColor: '#f59e0b',
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderDash: [4, 4],
            tension: 0.2,
            yAxisID: 'yVoltage',
            pointRadius: 0
          },
          {
            label: 'Total Current (A)',
            data: this.currentHistory,
            borderColor: '#10b981',
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            tension: 0.3,
            yAxisID: 'yCurrent',
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: {
            labels: { color: '#f8fafc', font: { size: 12 } }
          },
          tooltip: {
            backgroundColor: '#0d121f',
            borderColor: 'rgba(0, 240, 255, 0.3)',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.03)' },
            ticks: { maxTicksLimit: 8, font: { family: 'JetBrains Mono', size: 10 } }
          },
          yPower: {
            type: 'linear',
            position: 'left',
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { callback: v => `${v} kW`, color: '#00f0ff', font: { family: 'JetBrains Mono', size: 10 } }
          },
          yVoltage: {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false },
            suggestedMin: 220,
            suggestedMax: 240,
            ticks: { callback: v => `${v} V`, color: '#f59e0b', font: { family: 'JetBrains Mono', size: 10 } }
          },
          yCurrent: {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { callback: v => `${v} A`, color: '#10b981', font: { family: 'JetBrains Mono', size: 10 } }
          }
        }
      }
    });
  }

  initControls() {
    const bldSelect = document.getElementById('monitorBuildingFilter');
    if (bldSelect) {
      bldSelect.addEventListener('change', (e) => {
        this.selectedBuildingId = e.target.value;
      });
    }
  }

  subscribeSimulator() {
    if (!window.iotSimulator) return;

    window.iotSimulator.subscribe((telemetry) => {
      this.updateTelemetryDOM(telemetry);
      this.updateChart(telemetry);
      this.updateBuildingTelemetryTable(telemetry.buildings);
    });
  }

  updateTelemetryDOM(telemetry) {
    let power = telemetry.totalPowerKw;
    let voltage = telemetry.voltage;
    let current = telemetry.totalCurrentA;
    let pf = telemetry.powerFactor;
    let freq = telemetry.frequency;

    // If a single building is selected
    if (this.selectedBuildingId !== 'all') {
      const b = telemetry.buildings.find(b => b.id === this.selectedBuildingId);
      if (b) {
        power = b.powerKw;
        voltage = b.voltage;
        current = b.currentA;
        pf = b.powerFactor;
      }
    }

    // Reactive Power Q (kVAR) = P * tan(acos(PF))
    const kVAR = Number((power * Math.tan(Math.acos(Math.min(1, pf)))).toFixed(1));

    const elPower = document.getElementById('meterLivePower');
    const elVolt = document.getElementById('meterLiveVoltage');
    const elCurr = document.getElementById('meterLiveCurrent');
    const elFreq = document.getElementById('meterLiveFreq');
    const elPF = document.getElementById('meterLivePF');
    const elKvar = document.getElementById('meterLiveKVAR');

    if (elPower) elPower.textContent = `${power.toFixed(1)} kW`;
    if (elVolt) elVolt.textContent = `${voltage.toFixed(1)} V`;
    if (elCurr) elCurr.textContent = `${current.toFixed(1)} A`;
    if (elFreq) elFreq.textContent = `${freq.toFixed(2)} Hz`;
    if (elPF) elPF.textContent = `${pf.toFixed(2)}`;
    if (elKvar) elKvar.textContent = `${kVAR} kVAR`;

    // Phase Balance Breakdown
    const p1V = document.getElementById('phaseL1V');
    const p2V = document.getElementById('phaseL2V');
    const p3V = document.getElementById('phaseL3V');
    const p1A = document.getElementById('phaseL1A');
    const p2A = document.getElementById('phaseL2A');
    const p3A = document.getElementById('phaseL3A');

    if (p1V) p1V.textContent = `${telemetry.phases.l1.voltage} V`;
    if (p2V) p2V.textContent = `${telemetry.phases.l2.voltage} V`;
    if (p3V) p3V.textContent = `${telemetry.phases.l3.voltage} V`;
    if (p1A) p1A.textContent = `${telemetry.phases.l1.current} A`;
    if (p2A) p2A.textContent = `${telemetry.phases.l2.current} A`;
    if (p3A) p3A.textContent = `${telemetry.phases.l3.current} A`;
  }

  updateChart(telemetry) {
    if (!this.streamChart) return;

    let p = telemetry.totalPowerKw;
    let v = telemetry.voltage;
    let c = telemetry.totalCurrentA;

    if (this.selectedBuildingId !== 'all') {
      const b = telemetry.buildings.find(b => b.id === this.selectedBuildingId);
      if (b) {
        p = b.powerKw;
        v = b.voltage;
        c = b.currentA;
      }
    }

    const timeStr = new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.timeLabels.push(timeStr);
    this.powerHistory.push(p);
    this.voltageHistory.push(v);
    this.currentHistory.push(c);

    if (this.timeLabels.length > this.maxPoints) {
      this.timeLabels.shift();
      this.powerHistory.shift();
      this.voltageHistory.shift();
      this.currentHistory.shift();
    }

    this.streamChart.update('none');
  }

  updateBuildingTelemetryTable(buildings) {
    const tbody = document.getElementById('liveBuildingTableBody');
    if (!tbody) return;

    tbody.innerHTML = buildings.map(b => `
      <tr>
        <td>
          <div style="font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
            <span class="pulse-dot ${b.status === 'warning' ? 'danger' : ''}"></span>
            ${b.name}
          </div>
        </td>
        <td class="font-mono" style="font-weight: 700; color: var(--accent-cyan);">${b.powerKw.toFixed(1)} kW</td>
        <td class="font-mono">${b.voltage.toFixed(1)} V</td>
        <td class="font-mono">${b.currentA.toFixed(1)} A</td>
        <td class="font-mono">${b.powerFactor.toFixed(2)}</td>
        <td class="font-mono">${b.frequency.toFixed(2)} Hz</td>
        <td>
          <span class="badge ${b.status === 'warning' ? 'badge-danger' : 'badge-success'}">
            ${b.status === 'warning' ? 'Warning' : 'Normal'}
          </span>
        </td>
      </tr>
    `).join('');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.monitoringController = new MonitoringController();
});
