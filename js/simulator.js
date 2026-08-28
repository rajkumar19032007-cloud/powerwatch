/**
 * PowerWatch - Simulated IoT Telemetry & Physics Engine
 * Generates realistic diurnal 24-hour campus load curves, electrical physics,
 * real-time phase balance, jitter, and admin anomaly injection.
 */

class IoTSimulator {
  constructor() {
    this.isRunning = true;
    this.tickInterval = 1000; // 1 second
    this.loadMultiplier = 1.0;
    this.speed = 1;
    this.timer = null;
    this.listeners = new Set();
    this.activeAnomaly = null;

    // Time-of-day campus profile curves (normalized 0.0 - 1.0 for each hour 0..23)
    this.hourlyCurves = {
      // Academic / Labs: peak 09:00 - 17:00
      academic: [0.15, 0.12, 0.10, 0.10, 0.12, 0.18, 0.30, 0.55, 0.85, 0.98, 0.95, 0.90, 0.75, 0.88, 0.96, 0.92, 0.70, 0.45, 0.30, 0.25, 0.20, 0.18, 0.15, 0.15],
      // Hostels: peak 06:00 - 09:00 and 18:00 - 23:00
      residential: [0.35, 0.25, 0.20, 0.18, 0.22, 0.50, 0.85, 0.92, 0.75, 0.40, 0.35, 0.35, 0.45, 0.40, 0.38, 0.42, 0.55, 0.70, 0.88, 0.96, 0.98, 0.90, 0.65, 0.45],
      // Central Library: steady 08:00 - 20:00
      library: [0.10, 0.08, 0.08, 0.08, 0.08, 0.10, 0.20, 0.45, 0.75, 0.82, 0.85, 0.80, 0.70, 0.82, 0.88, 0.85, 0.90, 0.92, 0.80, 0.60, 0.30, 0.18, 0.12, 0.10],
      // Data Center / Computer Center: 24/7 continuous high load with slight daytime increase
      datacenter: [0.78, 0.75, 0.74, 0.74, 0.75, 0.76, 0.80, 0.85, 0.92, 0.96, 0.98, 0.95, 0.94, 0.97, 0.98, 0.96, 0.92, 0.88, 0.85, 0.84, 0.82, 0.80, 0.79, 0.78],
      // Administration Block: sharp office hours 09:00 - 17:00
      office: [0.08, 0.06, 0.06, 0.06, 0.06, 0.08, 0.15, 0.35, 0.70, 0.95, 0.98, 0.92, 0.65, 0.85, 0.95, 0.88, 0.60, 0.30, 0.15, 0.10, 0.08, 0.08, 0.08, 0.08]
    };

    this.start();
  }

  start() {
    if (this.timer) clearInterval(this.timer);
    this.isRunning = true;
    this.timer = setInterval(() => this.tick(), this.tickInterval);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.isRunning = false;
    this.timer = null;
  }

  setLoadMultiplier(multiplier) {
    this.loadMultiplier = Math.max(0.2, Math.min(3.0, multiplier));
  }

  increaseLoad(percent = 15) {
    this.setLoadMultiplier(this.loadMultiplier * (1 + percent / 100));
  }

  decreaseLoad(percent = 15) {
    this.setLoadMultiplier(this.loadMultiplier * (1 - percent / 100));
  }

  resetLoad() {
    this.loadMultiplier = 1.0;
    this.activeAnomaly = null;
  }

  /**
   * Inject Anomaly / Abnormal Usage Simulation
   */
  injectAnomaly(type = "spike", buildingId = "bld_cse") {
    this.activeAnomaly = {
      type: type,
      buildingId: buildingId,
      startTime: Date.now(),
      duration: 60000 // 60s active
    };

    if (window.cloudStore) {
      const bld = SEED_BUILDINGS.find(b => b.id === buildingId) || SEED_BUILDINGS[0];
      const alertPayload = {
        buildingId: buildingId,
        buildingName: bld.name,
        device: type === "spike" ? "Lab 3B - Main Air Handler" : "Capacitor Bank 02",
        type: type === "spike" ? "Power Spike" : (type === "low_pf" ? "Low Power Factor" : "Night Overload"),
        severity: type === "spike" ? "critical" : "high",
        currentValue: type === "spike" ? `${(bld.currentPower * 2.1).toFixed(1)} kW` : "0.78 PF",
        expectedRange: `${bld.currentPower.toFixed(1)} - ${(bld.currentPower * 1.2).toFixed(1)} kW`,
        timestamp: new Date().toISOString(),
        status: "active",
        title: `Simulated Anomaly: ${type.toUpperCase()} in ${bld.name}`,
        description: `Automated IoT test pattern triggered abnormal telemetry signature.`,
        recommendedAction: `Inspect circuit breaker and step-down transformer harmonics.`
      };
      window.cloudStore.addAlert(alertPayload);
      if (window.PowerWatchUtils) {
        window.PowerWatchUtils.showToast("⚡ Simulation Anomaly Injected", `Triggered ${type} on ${bld.name}`, "warning");
      }
    }
  }

  /**
   * Simulation Tick: computes instantaneous telemetry across campus
   */
  tick() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();
    
    // Fractional hour for smooth curve interpolation
    const hourFraction = currentHour + currentMinute / 60 + currentSecond / 3600;
    const baseHourIdx = Math.floor(hourFraction) % 24;
    const nextHourIdx = (baseHourIdx + 1) % 24;
    const lerpWeight = hourFraction - Math.floor(hourFraction);

    // Calculate electrical base physics
    const gridJitter = (Math.random() - 0.5) * 2; // ±1V
    const campusVoltage = 230.8 + gridJitter;
    const campusFrequency = 50.00 + (Math.random() - 0.5) * 0.08; // 49.96 - 50.04 Hz
    let campusPowerFactor = 0.94 + (Math.random() - 0.5) * 0.02;

    let totalCampusKw = 0;
    const buildingReadings = [];

    SEED_BUILDINGS.forEach(bld => {
      // Determine curve type
      let curveKey = 'academic';
      if (bld.id.includes('hostel')) curveKey = 'residential';
      else if (bld.id.includes('library')) curveKey = 'library';
      else if (bld.id.includes('comp_ctr')) curveKey = 'datacenter';
      else if (bld.id.includes('admin')) curveKey = 'office';

      const curve = this.hourlyCurves[curveKey];
      const normalizedLoad = curve[baseHourIdx] * (1 - lerpWeight) + curve[nextHourIdx] * lerpWeight;

      // Noise factor
      const noise = 1 + (Math.random() - 0.5) * 0.06;
      let power = (bld.transformerCapacity * 0.35) * normalizedLoad * noise * this.loadMultiplier;

      // Apply active anomaly if targeting this building
      if (this.activeAnomaly && this.activeAnomaly.buildingId === bld.id) {
        if (this.activeAnomaly.type === "spike") {
          power *= 2.2;
        } else if (this.activeAnomaly.type === "low_pf") {
          campusPowerFactor = 0.79;
        }
      }

      // Update building state
      bld.currentPower = Number(power.toFixed(1));
      totalCampusKw += power;

      // 3-Phase Line Current: I = (kW * 1000) / (sqrt(3) * 400 * PF) approx = kW * 1.55
      const currentA = Number((power * 1000 / (1.732 * 400 * campusPowerFactor)).toFixed(1));

      buildingReadings.push({
        id: bld.id,
        name: bld.name,
        powerKw: bld.currentPower,
        voltage: Number((campusVoltage + (Math.random() - 0.5) * 1.2).toFixed(1)),
        currentA: currentA,
        frequency: Number(campusFrequency.toFixed(2)),
        powerFactor: Number(campusPowerFactor.toFixed(2)),
        status: (this.activeAnomaly && this.activeAnomaly.buildingId === bld.id) ? "warning" : "optimal"
      });
    });

    // Campus Total Current (A)
    const totalCurrentA = Number((totalCampusKw * 1000 / (1.732 * 400 * campusPowerFactor)).toFixed(1));

    // Compile Telemetry Snapshot
    const telemetry = {
      timestamp: now.toISOString(),
      totalPowerKw: Number(totalCampusKw.toFixed(1)),
      totalCurrentA: totalCurrentA,
      voltage: Number(campusVoltage.toFixed(1)),
      frequency: Number(campusFrequency.toFixed(2)),
      powerFactor: Number(campusPowerFactor.toFixed(2)),
      loadMultiplier: this.loadMultiplier,
      activeAnomaly: this.activeAnomaly,
      buildings: buildingReadings,
      phases: {
        l1: { voltage: Number((campusVoltage + 0.4).toFixed(1)), current: Number((totalCurrentA * 0.34).toFixed(1)) },
        l2: { voltage: Number((campusVoltage - 0.2).toFixed(1)), current: Number((totalCurrentA * 0.33).toFixed(1)) },
        l3: { voltage: Number((campusVoltage - 0.2).toFixed(1)), current: Number((totalCurrentA * 0.33).toFixed(1)) }
      }
    };

    // Check anomaly expiration
    if (this.activeAnomaly && (Date.now() - this.activeAnomaly.startTime > this.activeAnomaly.duration)) {
      this.activeAnomaly = null;
    }

    // Broadcast to subscribers
    this.broadcast(telemetry);
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  broadcast(telemetry) {
    this.listeners.forEach(cb => {
      try {
        cb(telemetry);
      } catch (err) {
        console.error("Error in simulator subscriber:", err);
      }
    });
  }
}

// Global Singleton Simulator
window.iotSimulator = new IoTSimulator();
