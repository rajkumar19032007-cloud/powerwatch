# PowerWatch — Cloud-Based Smart Energy Monitoring & Analytics Platform

[![Cloud Architecture](https://img.shields.io/badge/Architecture-Cloud--Native%20Serverless-00f0ff?style=flat-square)](#cloud-architecture)
[![Database](https://img.shields.io/badge/Database-Cloud%20Firestore-3b82f6?style=flat-square)](#cloud-firestore-nosql-collections)
[![Authentication](https://img.shields.io/badge/Auth-Firebase%20IDaaS-10b981?style=flat-square)](#authentication--role-based-access-control-rbac)
[![Visuals](https://img.shields.io/badge/Theme-Dark%20Futuristic%20Glassmorphism-a855f7?style=flat-square)](#design-identity)
[![License](https://img.shields.io/badge/License-MIT-gray?style=flat-square)](LICENSE)

> **PowerWatch** is an enterprise-grade, cloud-powered energy intelligence and analytics platform designed for university campuses, industrial facilities, laboratories, and multi-building complexes. It collects real-time sub-meter telemetry, stores it in Cloud Firestore, detects electrical anomalies, estimates multi-tier tariffs, forecasts demand with statistical confidence intervals, and generates executive audit reports.

---

## 🌟 Key Features

### 1. ⚡ Real-Time Live Telemetry & Oscilloscope
- **Sub-Second Streaming (1 Hz)**: Instantaneous monitoring of **Active Power (kW)**, **Grid Voltage (V)**, **3-Phase Current (A)**, **Grid Frequency (Hz)**, **Power Factor (PF)**, and **Reactive Power (kVAR)**.
- **Dynamic Waveform Visualizer**: Multi-axis Chart.js oscilloscope rendering continuous rolling telemetry with zero page reloads.
- **3-Phase Electrical Load Balance**: Dedicated Phase R (L1), Phase Y (L2), and Phase B (L3) voltage/current diagnostics and THD harmonic indicators.

### 2. 🏢 Hierarchical Multi-Building Management
- **8 Campus Facilities Pre-Configured**: CSE Block, ECE Block, Mechanical Block, Central Library, Computer Center, Hostel A (Boys), Hostel B (Girls), Administration Block.
- **Interactive Deep-Dive Modals**: 24-hour diurnal load curves, 7-day consumption histories, floor-by-floor sub-meter breakdowns, and rated transformer utilization.
- **Admin Building Operations**: Add, configure transformer capacity (kW), edit codes, and remove facilities.

### 3. 🚨 Abnormal Energy Detection & Smart Alert Engine
- **Automated Rule Triggers**:
  - **Power Spike Detection**: Immediate alert when instantaneous demand surges > 40% above baseline.
  - **Nighttime Vampire Load**: Violations flagged if academic blocks exceed 15 kW between 11:00 PM and 05:00 AM.
  - **Power Factor Degradation**: Alerts when PF drops below 0.88 (preventing utility penalty surcharges).
  - **Smart Meter Offline**: Disconnection heartbeat alerts.
- **Actionable Remediation**: Contextual diagnostics, expected vs detected values, and one-click Acknowledge & Resolve workflows.

### 4. 📈 Advanced Multi-Dimensional Analytics
- **Flexible Time Horizons**: Seamlessly toggle between **Hourly**, **Daily**, **Weekly**, and **Monthly** time-series.
- **Building Radar Matrix**: Multi-axis benchmark comparing efficiency scores against transformer loading percentages.
- **End-Use Category Doughnut**: HVAC & Cooling (34%), IT & Servers (26%), Lighting (12%), Heavy Machinery (14%), Water Heating (8%), Lab Electronics (6%).
- **Tariff Breakdown**: Visualizing base energy cost vs peak-hour surcharge penalties.

### 5. 🔮 Predictive Forecasting & Smart Recommendations
- **Transparent Statistical Modeling**: Holt-Winters Seasonal Exponential Smoothing with day-of-week diurnal curves and 95% confidence intervals (±8%).
- **Peak Demand Forecast**: Predicts coincident campus maximum demand hours in advance for pre-emptive peak shaving.
- **Data-Driven Optimization Rules**: Practical energy-saving insights (e.g. shifting water heating to solar windows, automating lab PC sleep states).

### 6. 📄 Automated Cloud Audit Reports
- **Executive Templates**: Daily Energy Audit, Weekly Campus Summary, Monthly Financial & Consumption Audit.
- **Print & PDF Ready**: Formatted with PowerWatch official letterhead branding, tabular consumption matrices, tariff breakdowns, and carbon emissions.
- **Instant CSV Export**: Download structured data sets for third-party auditing.

### 7. 🔌 High-Fidelity IoT Simulation Engine
- **Physics-Based Diurnal Modeling**: Generates realistic time-of-day campus patterns (academic daytime peaks, hostel morning/evening peaks, server 24/7 continuous base).
- **Admin Fault Injection Panel**: Inject real-time power surges, phase imbalances, and low power factor faults with immediate dashboard response.

---

## ☁️ 12 Cloud Computing Concepts Demonstrated

This platform is engineered to demonstrate core cloud computing principles for final-year evaluation and viva defense:

| # | Cloud Concept | PowerWatch Implementation |
|---|---------------|---------------------------|
| **1** | **Identity-as-a-Service (IDaaS)** | Token-based authentication via Firebase Auth with JWT ID tokens, role claims, and session expiration. |
| **2** | **NoSQL Cloud Database** | Scalable document/collection architecture in Cloud Firestore with composite querying and auto-partitioning. |
| **3** | **Real-Time Synchronization** | Low-latency bi-directional WebSocket streams via `onSnapshot` listeners pushing updates live to browsers. |
| **4** | **Serverless Edge Computing** | Stateless event-driven Cloud Functions handling telemetry ingestion, rate-limiting, and payload normalization. |
| **5** | **Cloud Telemetry Analytics** | On-the-fly metric aggregations, diurnal time binning, and multi-tenant performance indexing. |
| **6** | **IoT Edge-to-Cloud Pipeline** | Simulated RS485/Modbus gateways forwarding electrical telemetry packets to cloud endpoints. |
| **7** | **Multi-Tenant Hierarchy** | Structured data model: Campus → Facility → Zone/Room → Smart Sub-Meter → Circuit Breaker. |
| **8** | **Declarative Cloud Security Rules** | Production `firestore.rules` validating authorization tokens server-side to prevent unauthorized database writes. |
| **9** | **Automated Cloud Reporting** | Server-side/client-side dynamic report rendering with printable layout stylesheets and CSV data streaming. |
| **10** | **Event-Driven Alert Dispatch** | Automated threshold trigger rules evaluating sensor telemetry streams for power spikes and low PF. |
| **11** | **Statistical Predictive Modeling** | Seasonal exponential smoothing forecasting 24-hour and 7-day electrical demand with confidence bounds. |
| **12** | **Cost & Carbon Optimization** | Time-of-Use (ToU) tariff calculations and carbon footprint modeling (0.82 kg CO₂e / kWh grid factor). |

---

## 🗄️ Cloud Firestore NoSQL Collections

```
powerwatch-cloud/
├── users/
│   └── {userId}                  # uid, name, email, role (Admin|Energy Manager|Viewer), org
├── buildings/
│   └── {buildingId}              # name, code, category, currentPower, dailyConsumption, capacity
├── devices/
│   └── {deviceId}               # name, buildingId, room, type, powerKw, voltage, currentA, status
├── energyReadings/
│   └── {readingId}              # buildingId, timestamp, powerKw, voltage, currentA, powerFactor
├── alerts/
│   └── {alertId}                # buildingId, title, severity, currentValue, expectedRange, status
├── settings/
│   └── system                   # tariff (baseRate, peakSurcharge), thresholds (spikeLimit, minPf)
└── reports/
    └── {reportId}               # reportType, generatedAt, author, totalKwh, totalCost, data
```

---

## 👥 Authentication & Role-Based Access Control (RBAC)

PowerWatch implements strict 3-tier role governance:

- **👑 Admin (`admin@powerwatch.io` / `admin123`)**:
  - Full campus grid access.
  - Add, edit, and delete buildings and smart meters.
  - Configure electricity tariff rates and anomaly threshold rules.
  - Inject simulated anomalies and reset grid baseline data.
- **⚡ Energy Manager (`manager@powerwatch.io` / `manager123`)**:
  - Acknowledge and resolve anomaly alerts.
  - Generate and download official audit reports.
  - Tune alert threshold parameters.
- **👁 Viewer (`viewer@powerwatch.io` / `viewer123`)**:
  - Read-only access to overview dashboards, live telemetry, analytics, and predictions.

---

## 🎨 Design Identity

- **Palette**: Dark futuristic cyber-energy aesthetic (`#080b11`, `#0d121f`, `#131b2e`).
- **Accents**: Electric Cyan (`#00f0ff`), Energy Blue (`#3b82f6`), Efficiency Green (`#10b981`), Warning Amber (`#f59e0b`), Critical Red (`#ef4444`).
- **Glassmorphism**: Translucent panels (`backdrop-filter: blur(16px)`), glowing micro-borders, and animated status pulses.
- **Typography**: Inter for clean UI, JetBrains Mono for electrical metrics and numbers.

---

## 🚀 Quick Start & Local Setup

PowerWatch is built with modern vanilla web technologies (HTML5, CSS3, ES6+ JavaScript, Chart.js, Lucide Icons) and runs seamlessly out of the box with zero external build steps.

### Option 1: VS Code Live Server (Recommended)
1. Open the project folder in **Visual Studio Code**.
2. Right-click `index.html` and select **"Open with Live Server"**.
3. The landing page opens at `http://127.0.0.1:5500/index.html`.

### Option 2: Python HTTP Server
```bash
# Python 3
python -m http.server 8080
```
Open `http://localhost:8080` in your web browser.

### Option 3: Firebase Hosting Deployment
```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login to Firebase
firebase login

# 3. Deploy to Firebase Hosting & Firestore
firebase deploy
```

---

## 📂 Project Structure

```
CampusOS/ (PowerWatch)
├── index.html                        # Public Landing Page & Interactive Architecture Visualizer
├── login.html                        # Authentication with 1-Click Role Logins
├── register.html                     # Organization & User Registration
├── dashboard.html                    # Main Overview Dashboard with animated KPI counters
│
├── pages/
│   ├── monitoring.html               # Real-Time Oscilloscope & 3-Phase Electrical Telemetry
│   ├── buildings.html                # Campus Buildings Grid, Table & Detail Deep-Dive
│   ├── devices.html                  # Smart Sub-Meters & Device Inventory
│   ├── analytics.html                # Multi-Horizon Energy Analytics & Radar Benchmarks
│   ├── alerts.html                   # Abnormal Energy Detection & Anomaly Rules
│   ├── predictions.html              # Statistical Load Forecasting & Smart Recommendations
│   ├── reports.html                  # Cloud Audit Report Generator (Print & PDF Ready)
│   ├── settings.html                 # Tariff Engine, Thresholds & Cloud Config
│   └── architecture.html             # 12 Cloud Computing Concepts Viva Defense Guide
│
├── css/
│   ├── global.css                    # Design system tokens, variables, typography, animations
│   ├── components.css                # Glass cards, buttons, KPI stat cards, modals, tables, toasts
│   ├── landing.css                   # Hero styles, preview window, architecture nodes, stats
│   ├── dashboard.css                 # Sidebar, sticky topbar, live telemetry strip, chart boxes
│   ├── auth.css                      # Glassmorphic login and registration cards
│   └── responsive.css                # Mobile navigation drawer and @media print audit stylesheets
│
├── js/
│   ├── utils.js                      # Currency (₹), energy formatting, animated counters, toasts
│   ├── firebase-config.js            # Unified data layer, Cloud Firestore & zero-setup demo store
│   ├── auth.js                       # RBAC permissions, session persistence, role gating
│   ├── simulator.js                  # Realistic diurnal IoT engine, physics calculations, fault injector
│   ├── notifications.js              # Global search modal (⌘K), notification bell dropdown
│   ├── dashboard.js                  # Overview stream charts, KPI counter animations
│   ├── monitoring.js                 # 1 Hz live oscilloscope, 3-phase balance renderer
│   ├── buildings.js                  # Building CRUD, 24-hr load curve charts
│   ├── devices.js                    # Smart meter inventory, search, category filters
│   ├── analytics.js                  # Time-series graphs, radar comparisons, CSV data export
│   ├── alerts.js                     # Anomaly rule engine, severity filters, resolution actions
│   ├── predictions.js                # Holt-Winters diurnal forecasting, recommendation engine
│   ├── reports.js                    # Audit template renderer, printable letterhead, CSV exporter
│   └── settings.js                   # Tariff updates, threshold persistence, Firebase keys
│
├── firestore.rules                   # Production Cloud Firestore Security Rules
├── firestore.indexes.json            # Composite query index specifications
├── firebase.json                     # Hosting and Firestore deployment configuration
└── README.md                         # Project documentation and examiner guide
```

---

## 📜 License
This project is open-source and available under the [MIT License](LICENSE).
