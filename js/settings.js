/**
 * PowerWatch - Settings & Configuration Controller
 * Tariff management, threshold tuning, organization profile, simulation controls,
 * and live Firebase Cloud credentials management.
 */

class SettingsController {
  constructor() {
    this.settings = null;
    this.init();
  }

  init() {
    this.loadSettings();
    this.initEventListeners();
  }

  loadSettings() {
    if (window.cloudStore) {
      this.settings = window.cloudStore.getSettings();
    } else {
      this.settings = DEFAULT_SETTINGS;
    }

    this.populateForms();
  }

  populateForms() {
    if (!this.settings) return;

    // Tariff
    const elBase = document.getElementById('settingBaseTariff');
    const elPeak = document.getElementById('settingPeakSurcharge');
    const elOffPeak = document.getElementById('settingOffPeakDiscount');
    const elFixed = document.getElementById('settingFixedDemand');

    if (elBase) elBase.value = this.settings.tariff.baseRate;
    if (elPeak) elPeak.value = this.settings.tariff.peakSurchargePercent;
    if (elOffPeak) elOffPeak.value = this.settings.tariff.offPeakDiscountPercent;
    if (elFixed) elFixed.value = this.settings.tariff.fixedDemandCharge;

    // Thresholds
    const elSpike = document.getElementById('settingSpikeLimit');
    const elNight = document.getElementById('settingNightLimit');
    const elMinPf = document.getElementById('settingMinPf');
    const elOverload = document.getElementById('settingOverloadMins');

    if (elSpike) elSpike.value = this.settings.thresholds.spikePercentLimit;
    if (elNight) elNight.value = this.settings.thresholds.nighttimeLimitKw;
    if (elMinPf) elMinPf.value = this.settings.thresholds.minPowerFactor;
    if (elOverload) elOverload.value = this.settings.thresholds.continuousOverloadMins;

    // Organization
    const elOrgName = document.getElementById('settingOrgName');
    const elCampusCode = document.getElementById('settingCampusCode');
    const elLocation = document.getElementById('settingLocation');
    const elCapacity = document.getElementById('settingGridCapacity');

    if (elOrgName) elOrgName.value = this.settings.organization.name;
    if (elCampusCode) elCampusCode.value = this.settings.organization.campusCode;
    if (elLocation) elLocation.value = this.settings.organization.location;
    if (elCapacity) elCapacity.value = this.settings.organization.gridCapacityKva;

    // Firebase Config
    const fbConfig = window.cloudStore ? window.cloudStore.firebaseConfig : DEFAULT_FIREBASE_CONFIG;
    const elApiKey = document.getElementById('settingFbApiKey');
    const elProjectId = document.getElementById('settingFbProjectId');
    const elAppId = document.getElementById('settingFbAppId');
    const elUseLive = document.getElementById('settingUseLiveFirebase');

    if (elApiKey) elApiKey.value = fbConfig.apiKey || '';
    if (elProjectId) elProjectId.value = fbConfig.projectId || '';
    if (elAppId) elAppId.value = fbConfig.appId || '';
    if (elUseLive) elUseLive.checked = (localStorage.getItem('powerwatch_use_live_firebase') === 'true');
  }

  initEventListeners() {
    // Tariff form
    const tariffForm = document.getElementById('tariffSettingsForm');
    if (tariffForm) {
      tariffForm.addEventListener('submit', (e) => this.handleSaveTariff(e));
    }

    // Thresholds form
    const thresholdForm = document.getElementById('thresholdSettingsForm');
    if (thresholdForm) {
      thresholdForm.addEventListener('submit', (e) => this.handleSaveThresholds(e));
    }

    // Org form
    const orgForm = document.getElementById('orgSettingsForm');
    if (orgForm) {
      orgForm.addEventListener('submit', (e) => this.handleSaveOrg(e));
    }

    // Firebase form
    const fbForm = document.getElementById('firebaseSettingsForm');
    if (fbForm) {
      fbForm.addEventListener('submit', (e) => this.handleSaveFirebase(e));
    }

    // Reset Data button
    const btnResetData = document.getElementById('btnResetDemoData');
    if (btnResetData) {
      btnResetData.addEventListener('click', () => this.handleResetDemoData());
    }
  }

  handleSaveTariff(e) {
    e.preventDefault();
    if (!window.authManager.hasPermission('Admin') && !window.authManager.hasPermission('Energy Manager')) {
      PowerWatchUtils.showToast("Permission Denied", "Manager or Admin role required.", "danger");
      return;
    }

    const baseRate = parseFloat(document.getElementById('settingBaseTariff').value) || 7.5;
    const peakSurchargePercent = parseFloat(document.getElementById('settingPeakSurcharge').value) || 20;
    const offPeakDiscountPercent = parseFloat(document.getElementById('settingOffPeakDiscount').value) || 10;
    const fixedDemandCharge = parseFloat(document.getElementById('settingFixedDemand').value) || 450;

    this.settings.tariff = {
      ...this.settings.tariff,
      baseRate,
      peakSurchargePercent,
      offPeakDiscountPercent,
      fixedDemandCharge
    };

    if (window.cloudStore) {
      window.cloudStore.saveSettings(this.settings);
      PowerWatchUtils.showToast("Tariff Updated", `Base rate set to ₹${baseRate.toFixed(2)} / kWh.`, "success");
    }
  }

  handleSaveThresholds(e) {
    e.preventDefault();
    if (!window.authManager.hasPermission('Energy Manager')) {
      PowerWatchUtils.showToast("Permission Denied", "Manager role required.", "danger");
      return;
    }

    const spikePercentLimit = parseFloat(document.getElementById('settingSpikeLimit').value) || 40;
    const nighttimeLimitKw = parseFloat(document.getElementById('settingNightLimit').value) || 15;
    const minPowerFactor = parseFloat(document.getElementById('settingMinPf').value) || 0.88;
    const continuousOverloadMins = parseInt(document.getElementById('settingOverloadMins').value) || 20;

    this.settings.thresholds = {
      spikePercentLimit,
      nighttimeLimitKw,
      minPowerFactor,
      continuousOverloadMins
    };

    if (window.cloudStore) {
      window.cloudStore.saveSettings(this.settings);
      PowerWatchUtils.showToast("Alert Thresholds Saved", "Real-time anomaly engine rules updated.", "success");
    }
  }

  handleSaveOrg(e) {
    e.preventDefault();
    const name = document.getElementById('settingOrgName').value.trim();
    const campusCode = document.getElementById('settingCampusCode').value.trim();
    const location = document.getElementById('settingLocation').value.trim();
    const gridCapacityKva = parseInt(document.getElementById('settingGridCapacity').value) || 750;

    this.settings.organization = {
      name,
      campusCode,
      location,
      gridCapacityKva
    };

    if (window.cloudStore) {
      window.cloudStore.saveSettings(this.settings);
      PowerWatchUtils.showToast("Organization Updated", "Campus profile details saved.", "success");
    }
  }

  handleSaveFirebase(e) {
    e.preventDefault();
    const apiKey = document.getElementById('settingFbApiKey').value.trim();
    const projectId = document.getElementById('settingFbProjectId').value.trim();
    const appId = document.getElementById('settingFbAppId').value.trim();
    const useLive = document.getElementById('settingUseLiveFirebase').checked;

    const newConfig = {
      ...DEFAULT_FIREBASE_CONFIG,
      apiKey: apiKey || DEFAULT_FIREBASE_CONFIG.apiKey,
      projectId: projectId || DEFAULT_FIREBASE_CONFIG.projectId,
      appId: appId || DEFAULT_FIREBASE_CONFIG.appId
    };

    localStorage.setItem('powerwatch_firebase_config', JSON.stringify(newConfig));
    localStorage.setItem('powerwatch_use_live_firebase', useLive ? 'true' : 'false');

    if (window.cloudStore) {
      window.cloudStore.firebaseConfig = newConfig;
      window.cloudStore.detectCloudMode();
      PowerWatchUtils.showToast("Cloud Config Saved", useLive ? "Switched to Live Firebase Cloud Mode" : "Switched to Local Demo Simulation Mode", "success");
    }
  }

  handleResetDemoData() {
    if (confirm("Reset all buildings, smart meters, and historical anomaly records to default seed values?")) {
      localStorage.removeItem('powerwatch_buildings');
      localStorage.removeItem('powerwatch_devices');
      localStorage.removeItem('powerwatch_alerts');
      localStorage.removeItem('powerwatch_settings');

      if (window.cloudStore) {
        window.cloudStore.initStore();
      }

      PowerWatchUtils.showToast("Data Reset Complete", "Campus energy grid reseeded with clean baseline data.", "info");
      setTimeout(() => window.location.reload(), 800);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.settingsController = new SettingsController();
});
