# MeteoGIS Android App (`android/`)

Production-structured **React Native + MapLibre** Android application for **MeteoGIS — Operational Meteorological & Flood Intelligence (India)**, connected directly to the existing single-port Next.js backend gateway (`http://10.0.2.2:3000/api/*`).

> **Scope isolation:** The existing web application in `app/`, `components/`, and `backend/` remains untouched except for the dedicated fullscreen `app/mobile-analytics/page.tsx` embed page used by the mobile `WebView` Analytics view.

---

## Quick Start (Android Studio Emulator or Physical Android Device)

### 1. Start the Backend Gateway (Root Folder)
```bash
pnpm install
pnpm dev
# Runs Next.js API gateway on http://localhost:3000
```

### 2. Install Mobile Dependencies & Start Metro (`android/`)
```bash
cd android
npm install
npm start
```

### 3. Run in Android Studio / Build APK
- Open **`android/android`** inside **Android Studio** -> wait for Gradle Sync -> press **Run ▶** on any API 24+ emulator (`10.0.2.2:3000` resolves automatically to host `:3000`), **or** run:
```bash
cd android
npm run android
```
- **Physical Android Phone over USB:**
```bash
adb reverse tcp:3000 tcp:3000
```
  *(Or enter your PC's LAN URL such as `http://192.168.1.10:3000` inside **Settings -> API Gateway Config** without modifying code.)*

### 4. Browser Simulator Preview (Optional Instant QA)
```bash
cd android
npm run preview
# Serves the interactive Pixel 8 Pro / 360dp Small Android / 150% Font Scale harness on port 5173
```

---

## Verified API Contract (All via Single Port `:3000`)

| Feature | Endpoint | Component / Hook |
|---|---|---|
| Live hazard events & pluvial zones | `GET /api/live/hazards` | `useHazards.ts` (30s poll, 5m TTL cache) |
| 5-day district warnings | `GET /api/live/warnings` | `useWarnings.ts` (60s poll, 15m TTL cache) |
| Surface AWS stations & 24h rain | `GET /api/live/stations`, `GET /api/live/rainfall` | `useStations.ts` (120s poll, 2m TTL cache) |
| ML multi-hazard risk prediction | `POST /api/risk/predict` | `ObsTab.tsx` |
| Village isolation corridors | `GET /api/isolation` | `ImpactTab.tsx` |
| Flood-free & NDRF routing | `POST /api/routing/safe-route`, `POST /api/routing/emergency-route` | `ImpactTab.tsx` + `MapCanvas` polyline |
| Emergency SOS & field reports | `POST /api/sos`, `POST /api/sos/cancel`, `POST /api/citizen/report` | `ImpactTab.tsx` |
| Provider telemetry & data audit | `GET /api/telemetry`, `GET /api/live/audit`, `GET /api/system/data-status` | `DataTab.tsx`, `SettingsScreen.tsx` |
| ISRO Bhuvan slippy tiles | `GET /api/bhuvan/wms?z={z}&x={x}&y={y}&layers=...` | `MapCanvas.tsx` |
| DWR Radar & INSAT-3DR streams | `GET /api/imd/imagery?type=radar...` / `?type=satellite...` | `ImdRadarModal.tsx`, `InsatSatelliteModal.tsx` |
| Embedded Telemetry Analytics | `GET /mobile-analytics` | `AnalyticsTab.tsx` (`WebView` + 3s SVG fallback) |

---

## Non-Overlapping Spatial Rules Enforced

1. **In-Flow Top Chrome (`TopHazardStrip`):** Search bar, `LIVE / HIST` mode toggle, `☰ / ✕` drawer button, and expandable hazard countdown strip occupy dedicated vertical space above the map and **auto-collapse when `BottomSheet === 'full'`**.
2. **Reserved Collapsed Sheet Clearance (`marginBottom: 56dp`):** The map viewport ends above the `56dp` collapsed sheet handle bar—preventing any overlap with map attribution, zoom buttons, or the bottom-left `Rainfall (24h IMD)` legend.
3. **Half-Sheet Camera Padding (`paddingBottom: HALF_SHEET_HEIGHT + 16`):** Tapping any marker flies the camera with bottom padding equal to the open half-sheet height so selected districts always sit centered in the visible upper map window.
4. **Minimum `48dp` Touch Targets & Hardware Back Stack:** Every interactive control meets Android `48dp` accessibility sizing, and hardware Back follows `Modal -> LayerDrawer -> Expanded Top Strip -> Sheet (Full -> Half -> Collapsed) -> Navigation`.
