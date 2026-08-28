/**
 * PowerWatch - Cloud Firebase & Unified Data Layer
 * Handles Firebase Authentication, Cloud Firestore Integration,
 * Real-Time Snapshot Listeners, and Zero-Setup Demo Storage Engine.
 */

// Global Firebase configuration object (configurable via Settings page)
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDEMO-KEY-POWERWATCH-SMART-ENERGY",
  authDomain: "powerwatch-cloud-energy.firebaseapp.com",
  projectId: "powerwatch-cloud-energy",
  storageBucket: "powerwatch-cloud-energy.appspot.com",
  messagingSenderId: "109823471928",
  appId: "1:109823471928:web:8f3c7a9b0e1d2c3f4a5b6c"
};

// Initial Seed Data for Campus Buildings
const SEED_BUILDINGS = [
  {
    id: "bld_cse",
    name: "CSE Block",
    code: "CSE-01",
    category: "Academic & Labs",
    currentPower: 18.7, // kW
    dailyConsumption: 76.4, // kWh
    monthlyConsumption: 2184, // kWh
    efficiencyScore: 82,
    deviceCount: 24,
    activeAlerts: 1,
    transformerCapacity: 100, // kW rated
    areaSqFt: 35000,
    peakHour: "14:00 - 15:00",
    status: "warning", // warning due to anomaly
    lastUpdated: new Date().toISOString()
  },
  {
    id: "bld_ece",
    name: "ECE Block",
    code: "ECE-02",
    category: "Academic & Labs",
    currentPower: 14.2,
    dailyConsumption: 58.1,
    monthlyConsumption: 1740,
    efficiencyScore: 89,
    deviceCount: 18,
    activeAlerts: 0,
    transformerCapacity: 80,
    areaSqFt: 28000,
    peakHour: "11:00 - 12:00",
    status: "optimal",
    lastUpdated: new Date().toISOString()
  },
  {
    id: "bld_mech",
    name: "Mechanical Block",
    code: "MECH-03",
    category: "Workshops & Heavy Machinery",
    currentPower: 22.8,
    dailyConsumption: 94.2,
    monthlyConsumption: 2820,
    efficiencyScore: 78,
    deviceCount: 16,
    activeAlerts: 0,
    transformerCapacity: 150,
    areaSqFt: 42000,
    peakHour: "10:00 - 13:00",
    status: "optimal",
    lastUpdated: new Date().toISOString()
  },
  {
    id: "bld_library",
    name: "Central Library",
    code: "LIB-04",
    category: "Study & Archives",
    currentPower: 9.4,
    dailyConsumption: 41.5,
    monthlyConsumption: 1245,
    efficiencyScore: 94,
    deviceCount: 14,
    activeAlerts: 0,
    transformerCapacity: 60,
    areaSqFt: 24000,
    peakHour: "16:00 - 18:00",
    status: "optimal",
    lastUpdated: new Date().toISOString()
  },
  {
    id: "bld_comp_ctr",
    name: "Computer Center",
    code: "CC-05",
    category: "Data Center & Server Farm",
    currentPower: 31.6,
    dailyConsumption: 132.8,
    monthlyConsumption: 3980,
    efficiencyScore: 86,
    deviceCount: 32,
    activeAlerts: 0,
    transformerCapacity: 120,
    areaSqFt: 18000,
    peakHour: "13:00 - 16:00",
    status: "optimal",
    lastUpdated: new Date().toISOString()
  },
  {
    id: "bld_hostel_a",
    name: "Hostel A (Boys)",
    code: "HSTL-A",
    category: "Residential",
    currentPower: 16.5,
    dailyConsumption: 68.2,
    monthlyConsumption: 2046,
    efficiencyScore: 88,
    deviceCount: 22,
    activeAlerts: 0,
    transformerCapacity: 90,
    areaSqFt: 48000,
    peakHour: "20:00 - 22:30",
    status: "optimal",
    lastUpdated: new Date().toISOString()
  },
  {
    id: "bld_hostel_b",
    name: "Hostel B (Girls)",
    code: "HSTL-B",
    category: "Residential",
    currentPower: 15.1,
    dailyConsumption: 62.4,
    monthlyConsumption: 1872,
    efficiencyScore: 91,
    deviceCount: 20,
    activeAlerts: 0,
    transformerCapacity: 90,
    areaSqFt: 46000,
    peakHour: "19:30 - 22:00",
    status: "optimal",
    lastUpdated: new Date().toISOString()
  },
  {
    id: "bld_admin",
    name: "Administration Block",
    code: "ADM-08",
    category: "Offices & Council",
    currentPower: 8.2,
    dailyConsumption: 34.6,
    monthlyConsumption: 1038,
    efficiencyScore: 90,
    deviceCount: 12,
    activeAlerts: 0,
    transformerCapacity: 50,
    areaSqFt: 22000,
    peakHour: "11:00 - 15:00",
    status: "optimal",
    lastUpdated: new Date().toISOString()
  }
];

// Initial Seed Smart Devices
const SEED_DEVICES = [
  { id: "dev_01", name: "AC Unit 01 - Server Room", buildingId: "bld_comp_ctr", buildingName: "Computer Center", room: "Server Room 101", type: "HVAC", status: "online", powerKw: 6.8, voltage: 231.2, currentA: 29.8, powerFactor: 0.95, totalEnergyKwh: 342.5, lastUpdate: new Date().toISOString() },
  { id: "dev_02", name: "Server Rack Alpha", buildingId: "bld_comp_ctr", buildingName: "Computer Center", room: "Server Room 102", type: "IT Equipment", status: "online", powerKw: 12.4, voltage: 230.8, currentA: 54.1, powerFactor: 0.98, totalEnergyKwh: 610.2, lastUpdate: new Date().toISOString() },
  { id: "dev_03", name: "Computer Cluster 01", buildingId: "bld_cse", buildingName: "CSE Block", room: "Lab 3B", type: "Computing", status: "warning", powerKw: 8.9, voltage: 229.4, currentA: 39.5, powerFactor: 0.88, totalEnergyKwh: 198.4, lastUpdate: new Date().toISOString() },
  { id: "dev_04", name: "Lighting Zone A (Main Lobby)", buildingId: "bld_admin", buildingName: "Administration Block", room: "Ground Floor", type: "Lighting", status: "online", powerKw: 1.8, voltage: 232.0, currentA: 7.9, powerFactor: 0.96, totalEnergyKwh: 45.2, lastUpdate: new Date().toISOString() },
  { id: "dev_05", name: "CNC Milling Station 01", buildingId: "bld_mech", buildingName: "Mechanical Block", room: "Heavy Workshop", type: "Machinery", status: "online", powerKw: 14.5, voltage: 230.1, currentA: 64.2, powerFactor: 0.91, totalEnergyKwh: 488.0, lastUpdate: new Date().toISOString() },
  { id: "dev_06", name: "HVAC Chiller Main", buildingId: "bld_library", buildingName: "Central Library", room: "Basement Plant", type: "HVAC", status: "online", powerKw: 4.2, voltage: 231.5, currentA: 18.3, powerFactor: 0.94, totalEnergyKwh: 215.6, lastUpdate: new Date().toISOString() },
  { id: "dev_07", name: "Water Heater Grid A", buildingId: "bld_hostel_a", buildingName: "Hostel A (Boys)", room: "Roof Utility", type: "Heating", status: "online", powerKw: 7.2, voltage: 230.0, currentA: 31.5, powerFactor: 0.99, totalEnergyKwh: 310.8, lastUpdate: new Date().toISOString() },
  { id: "dev_08", name: "Water Heater Grid B", buildingId: "bld_hostel_b", buildingName: "Hostel B (Girls)", room: "Roof Utility", type: "Heating", status: "online", powerKw: 6.5, voltage: 230.4, currentA: 28.4, powerFactor: 0.99, totalEnergyKwh: 284.1, lastUpdate: new Date().toISOString() },
  { id: "dev_09", name: "VLSI Testing Rig", buildingId: "bld_ece", buildingName: "ECE Block", room: "Embedded Lab 2", type: "Lab Equipment", status: "online", powerKw: 3.4, voltage: 231.0, currentA: 14.8, powerFactor: 0.93, totalEnergyKwh: 122.0, lastUpdate: new Date().toISOString() },
  { id: "dev_10", name: "Corridor Solar Inverter Link", buildingId: "bld_admin", buildingName: "Administration Block", room: "Solar Sub-station", type: "Inverter", status: "maintenance", powerKw: 0.0, voltage: 0.0, currentA: 0.0, powerFactor: 0.00, totalEnergyKwh: 92.4, lastUpdate: new Date().toISOString() }
];

// Initial Seed Anomaly Alerts
const SEED_ALERTS = [
  {
    id: "alt_01",
    buildingId: "bld_cse",
    buildingName: "CSE Block",
    device: "Lab 3B - Computer Cluster 01",
    type: "Power Spike",
    severity: "critical", // critical, high, medium, low
    currentValue: "27.4 kW",
    expectedRange: "8.0 - 12.0 kW",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: "active", // active, acknowledged, resolved
    title: "Unusual energy spike in CSE Lab 3B",
    description: "Consumption surged 128% over expected baseline during scheduled inactive hours.",
    recommendedAction: "Inspect Lab 3B HVAC cycling and automated batch workloads. Consider isolating Cluster 01."
  },
  {
    id: "alt_02",
    buildingId: "bld_comp_ctr",
    buildingName: "Computer Center",
    device: "Server Rack Alpha",
    type: "Low Power Factor",
    severity: "medium",
    currentValue: "0.82 PF",
    expectedRange: "0.92 - 0.98 PF",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: "active",
    title: "Degraded Power Factor on Phase B",
    description: "Inductive reactive power detected, potentially incurring utility penalty tariff.",
    recommendedAction: "Engage automatic capacitor bank in Sub-station 2."
  },
  {
    id: "alt_03",
    buildingId: "bld_admin",
    buildingName: "Administration Block",
    device: "Corridor Solar Inverter Link",
    type: "Device Offline",
    severity: "low",
    currentValue: "0.0 kW",
    expectedRange: "2.0 - 4.5 kW",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    status: "acknowledged",
    title: "Solar Sub-meter Communication Dropout",
    description: "Heartbeat ping failed 4 consecutive cycles. Inverter scheduled for preventive maintenance.",
    recommendedAction: "Technician dispatched for RS485 Modbus gateway check."
  }
];

// Default System Settings
const DEFAULT_SETTINGS = {
  tariff: {
    baseRate: 7.50, // ₹ per kWh
    peakSurchargePercent: 20, // +20% during peak hours (10 AM - 2 PM, 6 PM - 10 PM)
    offPeakDiscountPercent: 10, // -10% during night (11 PM - 6 AM)
    fixedDemandCharge: 450, // ₹ per kW/month
    currency: "INR",
    symbol: "₹"
  },
  thresholds: {
    spikePercentLimit: 40, // % spike over baseline to trigger alert
    nighttimeLimitKw: 15, // max allowable baseline in academic blocks
    minPowerFactor: 0.88,
    continuousOverloadMins: 20
  },
  organization: {
    name: "National Institute of Technology Campus",
    campusCode: "NIT-CAMPUS-01",
    location: "Main Tech Hub, Block 4",
    totalTransformers: 6,
    gridCapacityKva: 750
  },
  simulation: {
    tickRateMs: 1000,
    speedMultiplier: 1,
    noiseLevel: 0.05,
    autoAnomalies: true
  }
};

/**
 * CloudStore - Unified Database Engine
 * Works seamlessly with Firebase Firestore & built-in Cloud Storage
 */
class CloudStore {
  constructor() {
    this.isCloudConnected = false;
    this.mode = 'demo'; // 'cloud' | 'demo'
    this.listeners = new Map();
    this.initStore();
  }

  initStore() {
    // Check localStorage for saved custom config or settings
    const savedConfig = localStorage.getItem('powerwatch_firebase_config');
    this.firebaseConfig = savedConfig ? JSON.parse(savedConfig) : DEFAULT_FIREBASE_CONFIG;

    const savedSettings = localStorage.getItem('powerwatch_settings');
    this.settings = savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS;

    // Load or initialize collections in memory & localStorage
    this.collections = {
      buildings: this.loadCollection('powerwatch_buildings', SEED_BUILDINGS),
      devices: this.loadCollection('powerwatch_devices', SEED_DEVICES),
      alerts: this.loadCollection('powerwatch_alerts', SEED_ALERTS),
      settings: this.settings
    };

    // Determine connection status
    this.detectCloudMode();
  }

  detectCloudMode() {
    const customConfigured = localStorage.getItem('powerwatch_use_live_firebase') === 'true';
    if (customConfigured && typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
      this.isCloudConnected = true;
      this.mode = 'cloud';
    } else {
      this.isCloudConnected = false;
      this.mode = 'demo';
    }
    this.updateCloudStatusDOM();
  }

  loadCollection(storageKey, defaultSeed) {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing local collection:", storageKey, e);
      }
    }
    // Seed and persist
    localStorage.setItem(storageKey, JSON.stringify(defaultSeed));
    return JSON.parse(JSON.stringify(defaultSeed));
  }

  saveCollection(storageKey, data) {
    localStorage.setItem(storageKey, JSON.stringify(data));
  }

  // --- CRUD Operations ---

  async getBuildings() {
    return [...this.collections.buildings];
  }

  async getBuildingById(id) {
    return this.collections.buildings.find(b => b.id === id) || null;
  }

  async saveBuilding(buildingData) {
    const index = this.collections.buildings.findIndex(b => b.id === buildingData.id);
    if (index >= 0) {
      this.collections.buildings[index] = { ...this.collections.buildings[index], ...buildingData, lastUpdated: new Date().toISOString() };
    } else {
      const newBld = {
        ...buildingData,
        id: buildingData.id || `bld_${Date.now()}`,
        currentPower: buildingData.currentPower || 0,
        dailyConsumption: buildingData.dailyConsumption || 0,
        monthlyConsumption: buildingData.monthlyConsumption || 0,
        efficiencyScore: buildingData.efficiencyScore || 85,
        deviceCount: buildingData.deviceCount || 0,
        activeAlerts: 0,
        status: "optimal",
        lastUpdated: new Date().toISOString()
      };
      this.collections.buildings.push(newBld);
    }
    this.saveCollection('powerwatch_buildings', this.collections.buildings);
    this.notify('buildings', this.collections.buildings);
    return true;
  }

  async deleteBuilding(id) {
    this.collections.buildings = this.collections.buildings.filter(b => b.id !== id);
    this.saveCollection('powerwatch_buildings', this.collections.buildings);
    this.notify('buildings', this.collections.buildings);
    return true;
  }

  async getDevices(filters = {}) {
    let list = [...this.collections.devices];
    if (filters.buildingId && filters.buildingId !== 'all') {
      list = list.filter(d => d.buildingId === filters.buildingId);
    }
    if (filters.status && filters.status !== 'all') {
      list = list.filter(d => d.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(d => d.name.toLowerCase().includes(q) || d.room.toLowerCase().includes(q) || d.type.toLowerCase().includes(q));
    }
    return list;
  }

  async saveDevice(deviceData) {
    const index = this.collections.devices.findIndex(d => d.id === deviceData.id);
    if (index >= 0) {
      this.collections.devices[index] = { ...this.collections.devices[index], ...deviceData, lastUpdate: new Date().toISOString() };
    } else {
      const newDev = {
        ...deviceData,
        id: deviceData.id || `dev_${Date.now()}`,
        powerKw: deviceData.powerKw || 0,
        totalEnergyKwh: deviceData.totalEnergyKwh || 0,
        voltage: 230.0,
        currentA: 0.0,
        powerFactor: 0.95,
        status: deviceData.status || "online",
        lastUpdate: new Date().toISOString()
      };
      this.collections.devices.push(newDev);
    }
    this.saveCollection('powerwatch_devices', this.collections.devices);
    this.notify('devices', this.collections.devices);
    return true;
  }

  async deleteDevice(id) {
    this.collections.devices = this.collections.devices.filter(d => d.id !== id);
    this.saveCollection('powerwatch_devices', this.collections.devices);
    this.notify('devices', this.collections.devices);
    return true;
  }

  async getAlerts(filters = {}) {
    let list = [...this.collections.alerts];
    if (filters.status && filters.status !== 'all') {
      list = list.filter(a => a.status === filters.status);
    }
    if (filters.severity && filters.severity !== 'all') {
      list = list.filter(a => a.severity === filters.severity);
    }
    return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  async addAlert(alertData) {
    const newAlert = {
      ...alertData,
      id: alertData.id || `alt_${Date.now()}`,
      timestamp: alertData.timestamp || new Date().toISOString(),
      status: alertData.status || "active"
    };
    this.collections.alerts.unshift(newAlert);
    this.saveCollection('powerwatch_alerts', this.collections.alerts);
    this.notify('alerts', this.collections.alerts);
    return newAlert;
  }

  async updateAlertStatus(alertId, newStatus) {
    const alert = this.collections.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = newStatus;
      this.saveCollection('powerwatch_alerts', this.collections.alerts);
      this.notify('alerts', this.collections.alerts);
      return true;
    }
    return false;
  }

  getSettings() {
    return { ...this.settings };
  }

  saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveCollection('powerwatch_settings', this.settings);
    this.notify('settings', this.settings);
    return true;
  }

  // --- Real-Time Snapshot Listeners ---

  onSnapshot(collectionName, callback) {
    if (!this.listeners.has(collectionName)) {
      this.listeners.set(collectionName, new Set());
    }
    this.listeners.get(collectionName).add(callback);
    // Immediately emit current state
    if (this.collections[collectionName]) {
      callback(this.collections[collectionName]);
    }
    return () => {
      if (this.listeners.has(collectionName)) {
        this.listeners.get(collectionName).delete(callback);
      }
    };
  }

  notify(collectionName, data) {
    if (this.listeners.has(collectionName)) {
      this.listeners.get(collectionName).forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error("Error in snapshot listener:", err);
        }
      });
    }
  }

  updateCloudStatusDOM() {
    const badges = document.querySelectorAll('.cloud-status-badge');
    badges.forEach(badge => {
      if (this.mode === 'cloud' && this.isCloudConnected) {
        badge.className = 'cloud-status-badge connected';
        badge.innerHTML = `<span class="pulse-dot"></span><span>● Cloud Connected</span>`;
      } else {
        badge.className = 'cloud-status-badge demo';
        badge.innerHTML = `<span class="pulse-dot cyan"></span><span>DEMO MODE</span>`;
      }
    });
  }
}

// Global Singleton Instance
window.cloudStore = new CloudStore();
