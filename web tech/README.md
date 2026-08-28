# 🛰️ CampusLens — Smart Web-Based AR Campus Navigation System

[![Vite](https://img.shields.io/badge/Vite-5.3-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Three.js-r166-000000?style=flat&logo=three.js&logoColor=white)](https://threejs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-00F0FF.svg)](https://opensource.org/licenses/MIT)

**CampusLens** is a full-stack, enterprise-grade spatial navigation platform that combines **interactive 2D maps, immersive 3D campus exploration (Three.js), real-time camera-based Augmented Reality (AR) wayfinding, Dijkstra graph pathfinding, role-based JWT authentication, and a comprehensive admin control suite**.

---

## 🌟 Key Highlights & Capabilities

### 1. 🧭 Multi-Modal Wayfinding
- **Interactive 2D Campus Map (`/map`)**: Real-time GPS beacon tracking ("You are here"), dynamic pan/zoom, layer styles (Dark Vector / Satellite), and live turn-by-turn routing with animated path dash offsets.
- **3D Spatial Campus Explorer (`/campus-3d`)**: Full WebGL interactive 3D model featuring multi-story building blocks, illuminated roof beacons, day/night lighting modes, hover glow raycasters, and click-to-focus camera orbits.
- **Smart AR Navigation (`/ar-navigation`)**: Live camera stream with device orientation/compass tracking (`deviceorientation` API), 3D glowing directional arrows, floating POI labels that track screen azimuth, remaining distance/ETA HUD, and optional Web Speech voice synthesizer guidance.

### 2. 🦽 Accessible Dijkstra Pathfinding Engine
- Multi-criteria route calculation on a high-density campus walkway mesh.
- Options for **Wheelchair-Friendly (Ramps & Elevators Only)**, **Stairs-Free Routes**, and **Shortest Paths**.
- Generates step-by-step turn maneuvers (`DEPART`, `TURN_LEFT`, `TURN_RIGHT`, `ENTER_BUILDING`, `FLOOR_UP`, `ARRIVE`) with bearing angles and distance countdowns.

### 3. 🛡️ Multi-Level AR Fallback Architecture
- **Level 1**: WebXR Spatial AR where supported on modern hardware.
- **Level 2**: Device Camera + Magnetometer Compass + Gyroscope orientation + 3D Canvas overlay.
- **Level 3**: Interactive 2D/3D Cyber Radar mode for desktop browsers and devices without camera permissions.
- *Guaranteed zero crash or disruption regardless of user device.*

### 4. 🏢 Comprehensive Administrative Suite (`/admin`)
- Role-gated dashboard with **Recharts** analytics (hourly foot traffic, popular destinations, mode breakdown).
- Complete CRUD interfaces with modal dialogs and confirmation guards for **Buildings**, **Rooms & Labs**, **Campus Facilities**, **Campus Events**, and **User Roles**.
- Visual graph route node and edge connector for updating campus walkways dynamically.

### 5. 🚨 Campus Safety & Emergency SOS Hub
- Instant 1-tap emergency dispatch for Campus Police, Medical Bay, Fire, and Night SafeWalk escort.
- Direct AR routing to nearest defibrillators (AED), first-aid stations, and emergency exits.

### 6. 📱 Progressive Web App (PWA)
- Full service worker caching with stale-while-revalidate data strategy.
- Offline navigation fallback using cached campus graph in IndexedDB / CacheStorage.

---

## 🏗️ Architecture & Technology Stack

```
campuslens/
├── client/                     # Vite + React 18 + Tailwind CSS + Framer Motion
│   ├── public/                 # PWA icons, manifest.json, sw.js
│   └── src/
│       ├── components/         # GlassCard, Button, SearchBar, BuildingCard, FacilityCard, etc.
│       ├── context/            # AuthContext, NavigationContext, ToastContext
│       ├── hooks/              # useGeolocation, useDeviceOrientation, useSpeechSynthesis, useDebounce
│       ├── layouts/            # MainLayout, DashboardLayout, AdminLayout
│       ├── pages/              # Landing, Map, Campus3D, ARNav, Facilities, Events, Auth, Admin
│       ├── services/           # Axios REST API client
│       ├── utils/              # Haversine distance, bearing calculations, formatters
│       ├── App.jsx & main.jsx
├── server/                     # Node.js + Express.js + Prisma ORM
│   ├── controllers/            # Auth, Buildings, Rooms, Facilities, Navigation, Events, Admin
│   ├── middleware/             # JWT protect, adminOnly, rateLimiter, errorHandler
│   ├── prisma/
│   │   ├── schema.prisma       # User, Building, Room, Facility, RouteNode, Edge, Event, History
│   │   └── seed.js             # 11 Buildings, 25 Rooms, 11 Facilities, 20 Nodes, 23 Edges
│   ├── routes/                 # Express API routes
│   ├── services/               # Dijkstra pathfindingService, analyticsService
│   └── server.js               # Express application entry point
├── package.json
└── README.md
```

---

## ⚡ Quickstart & Installation

### Prerequisites
- Node.js (v18.0 or newer)
- npm or yarn

### 1. Install Dependencies
```bash
# Install root, server, and client packages
npm install
npm install --prefix server
npm install --prefix client
```

### 2. Configure Environment Variables
Copy `.env.example` to `server/.env` and `client/.env`:

**`server/.env`**:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET="campuslens_super_secure_jwt_secret_key_2026_!@#"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173"
```

**`client/.env`**:
```env
VITE_API_URL="http://localhost:5000/api"
```

### 3. Initialize Database & Seed Demo Data
```bash
cd server
npx prisma generate
npx prisma db push
node prisma/seed.js
cd ..
```

### 4. Run Full-Stack Development Servers
```bash
# Run both Backend API (:5000) and Frontend Client (:5173) concurrently
npm run dev
```

- **Frontend Client**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **API Health Check**: `http://localhost:5000/api/health`

---

## 🔑 Demo User Accounts

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@campuslens.edu` | `AdminPassword123!` | Full Admin Panel, Building/Room/Facility CRUD, User Role Mgmt, Route Graph Editor |
| **Student** | `student@campuslens.edu` | `StudentPassword123!` | 2D/3D/AR Navigation, Saved Favorites, Trip History, Profile Settings |
| **Faculty / Staff** | `faculty@campuslens.edu` | `StaffPassword123!` | Campus Directory, Facility Navigation, Campus Event Schedules |

*Note: For testing convenience, 1-click demo login buttons are provided directly on the Login page.*

---

## 📡 REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Create a student/staff account (Admin self-registration is strictly blocked)
- `POST /api/auth/login` — Authenticate and retrieve JWT token
- `GET /api/auth/me` — Retrieve current user profile
- `PUT /api/auth/profile` — Update name, department, avatar
- `POST /api/auth/logout` — Invalidate user session

### Buildings (`/api/buildings`)
- `GET /api/buildings` — List buildings with search & category filters
- `GET /api/buildings/:id` — Building details with rooms, facilities, and upcoming events
- `POST /api/buildings` — Create building (*Admin only*)
- `PUT /api/buildings/:id` — Update building details & 3D attributes (*Admin only*)
- `DELETE /api/buildings/:id` — Delete building (*Admin only*)

### Rooms & Laboratories (`/api/rooms`)
- `GET /api/rooms` — Search rooms by number, department, or building
- `POST /api/rooms` — Add room (*Admin only*)
- `PUT /api/rooms/:id` — Update room (*Admin only*)
- `DELETE /api/rooms/:id` — Delete room (*Admin only*)

### Facilities & Emergency (`/api/facilities`)
- `GET /api/facilities` — Directory of amenities (Dining, Medical, Sports, Library)
- `GET /api/facilities/emergency` — Dedicated urgent clinic and emergency police contacts
- `POST /api/facilities` — Create facility (*Admin only*)
- `PUT /api/facilities/:id` — Update facility (*Admin only*)
- `DELETE /api/facilities/:id` — Delete facility (*Admin only*)

### Navigation & Graph (`/api/navigation`)
- `POST /api/navigation/route` — Compute Dijkstra shortest / wheelchair-accessible route
- `GET /api/navigation/graph` — Retrieve full node and edge network for client offline routing
- `POST /api/navigation/history` — Log navigation session
- `GET /api/navigation/history` — Fetch user trip history

### Admin Command (`/api/admin`)
- `GET /api/admin/stats` — Aggregate metrics and chart series data
- `GET /api/admin/users` — List and filter platform users
- `PUT /api/admin/users/:id/role` — Modify user role (`STUDENT`, `STAFF`, `ADMIN`)
- `DELETE /api/admin/users/:id` — Delete user account
- `POST /api/admin/nodes` — Create graph route node
- `POST /api/admin/edges` — Connect walkway edge between nodes

---

## 🎨 Visual Design Guidelines
- **Palette**: Dark futuristic backdrop (`#070B12`, `#0B111C`, `#101827`)
- **Accents**: Neon Cyan (`#00F0FF`), Neon Purple (`#8B5CF6`), Neon Green (`#10B981`), Neon Amber (`#F59E0B`), Emergency Rose (`#F43F5E`)
- **Typography**: `Space Grotesk` (Headings & Codes), `Outfit` (Body), `JetBrains Mono` (Coordinates & Telemetry)
- **Glassmorphism**: 16px backdrop blur, semi-transparent panels, animated glow borders.

---

## 🔒 Security Best Practices
- **Password Protection**: Passwords salted and hashed with `bcryptjs`.
- **JWT Authentication**: Signed bearer tokens with configurable expiration.
- **Role-Based Authorization**: Middleware guards verifying role permissions on protected endpoints.
- **SQL Injection Prevention**: Safe parameterized queries via Prisma ORM.
- **Rate Limiting**: `express-rate-limit` prevents brute-force and DDoS attacks.
- **HTTP Security**: `helmet` headers configured for secure web communication.

---

## 📜 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
