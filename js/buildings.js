/**
 * PowerWatch - Buildings Management Controller
 * Grid/Table views, Building Detail Modal, 24-hr Load Curve, and Admin CRUD.
 */

class BuildingsController {
  constructor() {
    this.currentView = 'grid';
    this.buildings = [];
    this.selectedBuilding = null;
    this.detailChart24h = null;
    this.detailChartWeekly = null;
    this.searchQuery = '';
    this.categoryFilter = 'all';
    this.sortBy = 'power-desc';

    this.init();
  }

  async init() {
    this.initEventListeners();
    this.loadBuildings();
    this.checkUrlParams();
    this.subscribeSimulator();
  }

  initEventListeners() {
    // Search input
    const searchInput = document.getElementById('bldSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderBuildings();
      });
    }

    // Category filter
    const catSelect = document.getElementById('bldCategoryFilter');
    if (catSelect) {
      catSelect.addEventListener('change', (e) => {
        this.categoryFilter = e.target.value;
        this.renderBuildings();
      });
    }

    // Sort select
    const sortSelect = document.getElementById('bldSortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.renderBuildings();
      });
    }

    // View toggle buttons
    const btnGrid = document.getElementById('btnViewGrid');
    const btnTable = document.getElementById('btnViewTable');

    if (btnGrid && btnTable) {
      btnGrid.addEventListener('click', () => {
        this.currentView = 'grid';
        btnGrid.classList.add('active');
        btnTable.classList.remove('active');
        this.renderBuildings();
      });
      btnTable.addEventListener('click', () => {
        this.currentView = 'table';
        btnTable.classList.add('active');
        btnGrid.classList.remove('active');
        this.renderBuildings();
      });
    }

    // Add building form submit
    const addForm = document.getElementById('addBuildingForm');
    if (addForm) {
      addForm.addEventListener('submit', (e) => this.handleAddBuilding(e));
    }
  }

  async loadBuildings() {
    if (window.cloudStore) {
      this.buildings = await window.cloudStore.getBuildings();
      window.cloudStore.onSnapshot('buildings', (blds) => {
        this.buildings = blds;
        this.renderBuildings();
      });
    } else {
      this.buildings = SEED_BUILDINGS;
    }
    this.renderBuildings();
  }

  checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const bldId = params.get('id');
    if (bldId) {
      setTimeout(() => this.openBuildingDetail(bldId), 300);
    }
  }

  getFilteredBuildings() {
    let list = [...this.buildings];

    if (this.searchQuery) {
      list = list.filter(b => b.name.toLowerCase().includes(this.searchQuery) || b.code.toLowerCase().includes(this.searchQuery));
    }

    if (this.categoryFilter !== 'all') {
      list = list.filter(b => b.category.toLowerCase().includes(this.categoryFilter.toLowerCase()));
    }

    // Sort
    if (this.sortBy === 'power-desc') list.sort((a, b) => b.currentPower - a.currentPower);
    else if (this.sortBy === 'power-asc') list.sort((a, b) => a.currentPower - b.currentPower);
    else if (this.sortBy === 'consumption-desc') list.sort((a, b) => b.monthlyConsumption - a.monthlyConsumption);
    else if (this.sortBy === 'efficiency-desc') list.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
    else if (this.sortBy === 'name-asc') list.sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }

  renderBuildings() {
    const gridContainer = document.getElementById('buildingsGridContainer');
    const tableContainer = document.getElementById('buildingsTableContainer');
    const filtered = this.getFilteredBuildings();

    const settings = window.cloudStore ? window.cloudStore.getSettings() : DEFAULT_SETTINGS;
    const baseTariff = settings.tariff.baseRate || 7.5;

    if (this.currentView === 'grid') {
      if (gridContainer) {
        gridContainer.style.display = 'grid';
        if (tableContainer) tableContainer.style.display = 'none';

        if (filtered.length === 0) {
          gridContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">No campus buildings match your search.</div>`;
          return;
        }

        gridContainer.innerHTML = filtered.map(b => {
          const estimatedCost = Math.round(b.monthlyConsumption * baseTariff);
          return `
            <div class="card card-glow-cyan" style="display: flex; flex-direction: column; justify-content: space-between; cursor: pointer;" onclick="buildingsController.openBuildingDetail('${b.id}')">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                  <div>
                    <h3 style="font-size: 1.15rem; margin-bottom: 0.2rem; color: var(--text-primary);">${b.name}</h3>
                    <span style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">${b.code} • ${b.category}</span>
                  </div>
                  <span class="badge ${b.activeAlerts > 0 ? 'badge-danger' : 'badge-success'}">
                    ${b.activeAlerts > 0 ? `${b.activeAlerts} Alert` : 'Optimal'}
                  </span>
                </div>

                <div style="background: var(--bg-tertiary); border-radius: var(--radius-md); padding: 0.9rem; margin-bottom: 1rem; border: 1px solid var(--border-color);">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem;">
                    <span style="font-size: 0.78rem; color: var(--text-secondary);">Active Load</span>
                    <span class="font-mono bld-card-kw-${b.id}" style="font-weight: 700; color: var(--accent-cyan); font-size: 1rem;">${b.currentPower} kW</span>
                  </div>
                  <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden;">
                    <div class="bld-card-bar-${b.id}" style="width: ${Math.min(100, Math.round((b.currentPower / b.transformerCapacity) * 100))}%; height: 100%; background: linear-gradient(90deg, var(--accent-cyan), var(--accent-blue));"></div>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-top: 0.35rem; font-size: 0.7rem; color: var(--text-dim);">
                    <span>Cap: ${b.transformerCapacity} kW</span>
                    <span class="bld-card-pct-${b.id}">${Math.round((b.currentPower / b.transformerCapacity) * 100)}% load</span>
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem; font-size: 0.8rem;">
                  <div>
                    <span style="color: var(--text-muted); display: block; font-size: 0.72rem;">Today</span>
                    <span class="font-mono" style="font-weight: 600; color: var(--text-primary);">${b.dailyConsumption} kWh</span>
                  </div>
                  <div>
                    <span style="color: var(--text-muted); display: block; font-size: 0.72rem;">Monthly Est.</span>
                    <span class="font-mono" style="font-weight: 600; color: var(--color-success);">₹${estimatedCost.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div style="padding-top: 0.75rem; border-top: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; font-size: 0.78rem;">
                <span style="color: var(--text-secondary);">Devices: <strong class="font-mono" style="color: var(--text-primary);">${b.deviceCount}</strong></span>
                <span style="color: var(--accent-cyan); font-weight: 600; display: flex; align-items: center; gap: 0.25rem;">
                  View Analytics <i data-lucide="chevron-right" style="width: 14px; height: 14px;"></i>
                </span>
              </div>
            </div>
          `;
        }).join('');
      }
    } else {
      if (tableContainer) {
        tableContainer.style.display = 'block';
        if (gridContainer) gridContainer.style.display = 'none';

        const tbody = document.getElementById('buildingsTableBody');
        if (tbody) {
          tbody.innerHTML = filtered.map(b => {
            const estimatedCost = Math.round(b.monthlyConsumption * baseTariff);
            return `
              <tr style="cursor: pointer;" onclick="buildingsController.openBuildingDetail('${b.id}')">
                <td>
                  <div style="font-weight: 600; color: var(--text-primary);">${b.name}</div>
                  <div style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">${b.code}</div>
                </td>
                <td><span class="badge badge-neutral">${b.category}</span></td>
                <td class="font-mono bld-card-kw-${b.id}" style="font-weight: 700; color: var(--accent-cyan);">${b.currentPower} kW</td>
                <td class="font-mono">${b.dailyConsumption} kWh</td>
                <td class="font-mono">${b.monthlyConsumption.toLocaleString('en-IN')} kWh</td>
                <td class="font-mono" style="color: var(--color-success); font-weight: 600;">₹${estimatedCost.toLocaleString('en-IN')}</td>
                <td class="font-mono" style="color: var(--accent-cyan);">${b.efficiencyScore}%</td>
                <td><span class="badge ${b.activeAlerts > 0 ? 'badge-danger' : 'badge-success'}">${b.activeAlerts > 0 ? `${b.activeAlerts} Alert` : 'Optimal'}</span></td>
                <td>
                  <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); buildingsController.openBuildingDetail('${b.id}')">Deep Dive</button>
                </td>
              </tr>
            `;
          }).join('');
        }
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }

  openBuildingDetail(buildingId) {
    const bld = this.buildings.find(b => b.id === buildingId);
    if (!bld) return;

    this.selectedBuilding = bld;
    const settings = window.cloudStore ? window.cloudStore.getSettings() : DEFAULT_SETTINGS;
    const baseTariff = settings.tariff.baseRate || 7.5;
    const estCost = Math.round(bld.monthlyConsumption * baseTariff);

    // Populate modal DOM
    document.getElementById('modalBldTitle').textContent = bld.name;
    document.getElementById('modalBldCode').textContent = `${bld.code} • ${bld.category} • ${bld.areaSqFt.toLocaleString()} sq.ft`;
    document.getElementById('modalBldPower').textContent = `${bld.currentPower} kW`;
    document.getElementById('modalBldDaily').textContent = `${bld.dailyConsumption} kWh`;
    document.getElementById('modalBldMonthly').textContent = `${bld.monthlyConsumption.toLocaleString()} kWh`;
    document.getElementById('modalBldCost').textContent = `₹${estCost.toLocaleString('en-IN')}`;
    document.getElementById('modalBldEfficiency').textContent = `${bld.efficiencyScore}%`;
    document.getElementById('modalBldPeak').textContent = bld.peakHour;

    // Render Charts
    this.renderDetailCharts(bld);

    PowerWatchUtils.openModal('buildingDetailModal');
    if (window.lucide) window.lucide.createIcons();
  }

  renderDetailCharts(bld) {
    const ctx24 = document.getElementById('bldDetail24hChart');
    const ctxWeekly = document.getElementById('bldDetailWeeklyChart');

    if (this.detailChart24h) this.detailChart24h.destroy();
    if (this.detailChartWeekly) this.detailChartWeekly.destroy();

    if (ctx24) {
      const hours = ['00:00','02:00','04:00','06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00'];
      const baseLoad = bld.transformerCapacity * 0.35;
      const data = hours.map((h, i) => Number((baseLoad * (0.3 + Math.sin((i / 12) * Math.PI) * 0.7) + (Math.random() - 0.5) * 3).toFixed(1)));

      this.detailChart24h = new Chart(ctx24, {
        type: 'line',
        data: {
          labels: hours,
          datasets: [{
            label: '24-Hour Load Curve (kW)',
            data: data,
            borderColor: '#00f0ff',
            backgroundColor: 'rgba(0, 240, 255, 0.15)',
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#00f0ff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false } },
            y: { ticks: { callback: v => `${v} kW` } }
          }
        }
      });
    }

    if (ctxWeekly) {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weeklyData = days.map((d, idx) => idx > 4 ? Math.round(bld.dailyConsumption * 0.45) : Math.round(bld.dailyConsumption * (0.9 + Math.random() * 0.2)));

      this.detailChartWeekly = new Chart(ctxWeekly, {
        type: 'bar',
        data: {
          labels: days,
          datasets: [{
            label: 'Daily Energy (kWh)',
            data: weeklyData,
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false } },
            y: { ticks: { callback: v => `${v} kWh` } }
          }
        }
      });
    }
  }

  async handleAddBuilding(e) {
    e.preventDefault();
    if (!window.authManager.hasPermission('Admin')) {
      PowerWatchUtils.showToast("Permission Denied", "Admin role required to add buildings", "danger");
      return;
    }

    const name = document.getElementById('addBldName').value.trim();
    const code = document.getElementById('addBldCode').value.trim();
    const category = document.getElementById('addBldCategory').value;
    const cap = parseFloat(document.getElementById('addBldCap').value) || 80;
    const area = parseInt(document.getElementById('addBldArea').value) || 25000;

    const newBld = {
      id: `bld_${code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      name,
      code,
      category,
      transformerCapacity: cap,
      areaSqFt: area,
      currentPower: Number((cap * 0.3).toFixed(1)),
      dailyConsumption: Number((cap * 1.5).toFixed(1)),
      monthlyConsumption: Math.round(cap * 45),
      efficiencyScore: 88,
      deviceCount: 10,
      activeAlerts: 0,
      peakHour: "11:00 - 14:00"
    };

    if (window.cloudStore) {
      await window.cloudStore.saveBuilding(newBld);
      PowerWatchUtils.showToast("Building Added", `${name} (${code}) added to campus grid.`, "success");
      PowerWatchUtils.closeModal('addBuildingModal');
      e.target.reset();
    }
  }

  subscribeSimulator() {
    if (!window.iotSimulator) return;

    window.iotSimulator.subscribe((telemetry) => {
      telemetry.buildings.forEach(b => {
        const kwEls = document.querySelectorAll(`.bld-card-kw-${b.id}`);
        kwEls.forEach(el => el.textContent = `${b.powerKw.toFixed(1)} kW`);

        const bldRecord = this.buildings.find(item => item.id === b.id);
        if (bldRecord) {
          const pct = Math.min(100, Math.round((b.powerKw / bldRecord.transformerCapacity) * 100));
          const barEls = document.querySelectorAll(`.bld-card-bar-${b.id}`);
          barEls.forEach(bar => bar.style.width = `${pct}%`);

          const pctEls = document.querySelectorAll(`.bld-card-pct-${b.id}`);
          pctEls.forEach(p => p.textContent = `${pct}% load`);
        }
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.buildingsController = new BuildingsController();
});
