/**
 * PowerWatch - Device & Smart Meter Management Controller
 * Filters, Search, Status Control, and Device Inventory CRUD.
 */

class DevicesController {
  constructor() {
    this.devices = [];
    this.searchQuery = '';
    this.buildingFilter = 'all';
    this.statusFilter = 'all';
    this.typeFilter = 'all';

    this.init();
  }

  async init() {
    this.initEventListeners();
    this.loadDevices();
    this.populateBuildingFilter();
  }

  initEventListeners() {
    const searchInput = document.getElementById('devSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderDevices();
      });
    }

    const bldSelect = document.getElementById('devBuildingFilter');
    if (bldSelect) {
      bldSelect.addEventListener('change', (e) => {
        this.buildingFilter = e.target.value;
        this.renderDevices();
      });
    }

    const statusSelect = document.getElementById('devStatusFilter');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.statusFilter = e.target.value;
        this.renderDevices();
      });
    }

    const typeSelect = document.getElementById('devTypeFilter');
    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => {
        this.typeFilter = e.target.value;
        this.renderDevices();
      });
    }

    const addForm = document.getElementById('addDeviceForm');
    if (addForm) {
      addForm.addEventListener('submit', (e) => this.handleAddDevice(e));
    }
  }

  async loadDevices() {
    if (window.cloudStore) {
      this.devices = await window.cloudStore.getDevices();
      window.cloudStore.onSnapshot('devices', (devs) => {
        this.devices = devs;
        this.renderDevices();
      });
    } else {
      this.devices = SEED_DEVICES;
    }
    this.renderDevices();
  }

  populateBuildingFilter() {
    const selects = document.querySelectorAll('#devBuildingFilter, #addDevBuilding');
    selects.forEach(select => {
      if (!select) return;
      const currentValue = select.value;
      const blds = window.cloudStore ? window.cloudStore.collections.buildings : SEED_BUILDINGS;
      let opts = select.id === 'devBuildingFilter' ? '<option value="all">All Buildings</option>' : '';
      blds.forEach(b => {
        opts += `<option value="${b.id}">${b.name}</option>`;
      });
      select.innerHTML = opts;
      if (currentValue) select.value = currentValue;
    });
  }

  getFilteredDevices() {
    let list = [...this.devices];

    if (this.searchQuery) {
      list = list.filter(d => 
        d.name.toLowerCase().includes(this.searchQuery) ||
        d.room.toLowerCase().includes(this.searchQuery) ||
        d.type.toLowerCase().includes(this.searchQuery) ||
        d.buildingName.toLowerCase().includes(this.searchQuery)
      );
    }

    if (this.buildingFilter !== 'all') {
      list = list.filter(d => d.buildingId === this.buildingFilter);
    }

    if (this.statusFilter !== 'all') {
      list = list.filter(d => d.status === this.statusFilter);
    }

    if (this.typeFilter !== 'all') {
      list = list.filter(d => d.type.toLowerCase() === this.typeFilter.toLowerCase());
    }

    return list;
  }

  renderDevices() {
    const tbody = document.getElementById('devicesTableBody');
    const countEl = document.getElementById('deviceTotalCount');
    const filtered = this.getFilteredDevices();

    if (countEl) countEl.textContent = `${filtered.length} Devices`;
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 3rem; color: var(--text-muted);">
            No connected smart devices found matching current filters.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(d => {
      let badgeClass = 'badge-success';
      if (d.status === 'warning') badgeClass = 'badge-warning';
      else if (d.status === 'offline') badgeClass = 'badge-danger';
      else if (d.status === 'maintenance') badgeClass = 'badge-cyan';

      return `
        <tr>
          <td>
            <div style="font-weight: 600; color: var(--text-primary);">${d.name}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">${d.id}</div>
          </td>
          <td>
            <div style="color: var(--text-primary); font-size: 0.85rem;">${d.buildingName}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${d.room}</div>
          </td>
          <td><span class="badge badge-neutral">${d.type}</span></td>
          <td><span class="badge ${badgeClass}">${d.status}</span></td>
          <td class="font-mono" style="font-weight: 700; color: var(--accent-cyan);">${d.powerKw.toFixed(1)} kW</td>
          <td class="font-mono">${d.totalEnergyKwh.toFixed(1)} kWh</td>
          <td class="font-mono" style="font-size: 0.78rem; color: var(--text-muted);">${PowerWatchUtils.timeAgo(d.lastUpdate)}</td>
          <td>
            <div style="display: flex; gap: 0.4rem;">
              <button class="btn btn-secondary btn-sm" onclick="devicesController.toggleDeviceStatus('${d.id}')" title="Toggle On/Off">
                <i data-lucide="power" style="width: 14px; height: 14px;"></i>
              </button>
              <button class="btn btn-outline-danger btn-sm" data-role="admin" onclick="devicesController.handleDeleteDevice('${d.id}')" title="Remove">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
    if (window.authManager) window.authManager.applyDOMRoleGating();
  }

  async toggleDeviceStatus(deviceId) {
    const dev = this.devices.find(d => d.id === deviceId);
    if (!dev) return;

    const nextStatus = dev.status === 'online' ? 'offline' : 'online';
    const nextPower = nextStatus === 'online' ? (dev.type === 'HVAC' ? 5.5 : 8.0) : 0.0;

    dev.status = nextStatus;
    dev.powerKw = nextPower;
    dev.lastUpdate = new Date().toISOString();

    if (window.cloudStore) {
      await window.cloudStore.saveDevice(dev);
      PowerWatchUtils.showToast("Device State Updated", `${dev.name} is now ${nextStatus.toUpperCase()}`, nextStatus === 'online' ? 'success' : 'warning');
    }
  }

  async handleDeleteDevice(deviceId) {
    if (!window.authManager.hasPermission('Admin')) {
      PowerWatchUtils.showToast("Permission Denied", "Admin role required to remove devices", "danger");
      return;
    }

    if (confirm("Are you sure you want to remove this smart meter from the campus network?")) {
      if (window.cloudStore) {
        await window.cloudStore.deleteDevice(deviceId);
        PowerWatchUtils.showToast("Device Removed", "Smart device unlinked successfully.", "info");
      }
    }
  }

  async handleAddDevice(e) {
    e.preventDefault();
    if (!window.authManager.hasPermission('Admin')) {
      PowerWatchUtils.showToast("Permission Denied", "Admin role required to add devices", "danger");
      return;
    }

    const name = document.getElementById('addDevName').value.trim();
    const buildingId = document.getElementById('addDevBuilding').value;
    const room = document.getElementById('addDevRoom').value.trim();
    const type = document.getElementById('addDevType').value;
    const powerKw = parseFloat(document.getElementById('addDevPower').value) || 3.5;

    const blds = window.cloudStore ? window.cloudStore.collections.buildings : SEED_BUILDINGS;
    const targetBld = blds.find(b => b.id === buildingId) || blds[0];

    const newDev = {
      id: `dev_${Date.now()}`,
      name,
      buildingId,
      buildingName: targetBld.name,
      room,
      type,
      powerKw,
      voltage: 230.0,
      currentA: Number((powerKw * 1000 / (230 * 0.95)).toFixed(1)),
      powerFactor: 0.95,
      totalEnergyKwh: 0,
      status: "online",
      lastUpdate: new Date().toISOString()
    };

    if (window.cloudStore) {
      await window.cloudStore.saveDevice(newDev);
      PowerWatchUtils.showToast("Device Registered", `${name} connected to ${targetBld.name}.`, "success");
      PowerWatchUtils.closeModal('addDeviceModal');
      e.target.reset();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.devicesController = new DevicesController();
});
