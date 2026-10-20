# METEO-GIS Android Application (`React Native 0.76 + MapLibre`)

Isolated native Android companion app for the deployed **METEO-GIS** platform (**`https://meteo-gis.vercel.app`**), built inside `/android` without altering the existing web dashboard or backend code.

---

## 1. Shared Backend Configuration (`src/config/api.ts`)

All mobile network requests and embedded analytics WebViews route through `src/config/api.ts`:

- **Production Default (Debug & Release APKs):** `https://meteo-gis.vercel.app` (`PRODUCTION_API_URL`)
- **Intentional Local Emulator Dev (Opt-In Only):** `http://10.0.2.2:3000` (`LOCAL_DEV_API_URL`, active only when `USE_LOCAL_DEV_API=true` in development or explicitly selected in **Settings → Emulator :3000**)
- **Physical Device Local Dev via USB:** `adb reverse tcp:3000 tcp:3000` + **Settings → ADB :3000** (`http://127.0.0.1:3000`)
- **Cleartext Security Policy (`AndroidManifest.xml` + `res/xml/network_security_config.xml`):**
  - `android:usesCleartextTraffic="false"` and `<base-config cleartextTrafficPermitted="false" />` enforce HTTPS globally across all external domains.
  - Cleartext HTTP is restricted strictly to loopback development hosts (`10.0.2.2`, `127.0.0.1`, `localhost`).
  - Release builds run Gradle task `verifyReleaseApiConfig` to reject missing, non-HTTPS, emulator, or localhost URLs.

---

## 2. Reproducible Build Prerequisites & Commands

### Prerequisites (Host Machine / CI)
- **Node.js:** `>= 20.x`
- **JDK:** OpenJDK `17` (`JAVA_HOME` configured)
- **Android SDK (`ANDROID_HOME` configured):**
  - Platform `android-35` (`compileSdkVersion 35`, `targetSdkVersion 34`, `minSdkVersion 24`)
  - Android SDK Build-Tools `35.0.0`
  - Android NDK `26.1.10909125`

### Install, Typecheck & Run Automated Safety Tests
```bash
cd android
npm ci --legacy-peer-deps
npm run typecheck
npm test
```

### Verify Native Android JS Bundles (Debug & Release)
```bash
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output /tmp/index.android.release.bundle
```

### Build Debug & Release APKs with Gradle Wrapper
```bash
cd android/android

# Debug APK (connects to https://meteo-gis.vercel.app by default; switchable in Settings)
./gradlew assembleDebug

# Release APK (enforces HTTPS PROD_API_URL via verifyReleaseApiConfig)
./gradlew assembleRelease -PPROD_API_URL=https://meteo-gis.vercel.app
```

---

## 3. Deployed Vercel vs. FastAPI Service Dependencies

| Next.js Endpoint | Vercel Serverless Standalone Status | Notes & Mobile Handling |
|---|---|---|
| `GET /api/live/hazards`, `/warnings`, `/stations`, `/rainfall`, `/nowcast`, `/audit` | Self-contained on Vercel | Checks both `status === 'OK'` and `isLive !== false`; marks unavailable feeds `IMD Feed Unavailable` or `Cached` (`stale`), never `Live`. |
| `POST /api/risk/predict` | Self-contained on Vercel | Submits `{ rainfall_1h, rainfall_24h }` and displays real `landslide_probability` and `recommended_action`. |
| `POST /api/routing/safe-route`, `/emergency-route` | Uses `BACKEND_URL` (FastAPI Valhalla) if configured on Vercel; falls back to live OSRM road graph | Mobile strictly validates `recommended_route.geometry` (`>=5` road vertices), `distance_km`, `duration_minutes`, `<=5km` origin/destination snap, and zero intersection with active severe hazards / flood zones. Never invents fallback coordinates. |
| `POST /api/sos`, `POST /api/sos/cancel` | **Requires FastAPI + PostGIS (`BACKEND_URL` on Vercel)** | Returns `503` if `BACKEND_URL` is unset/unreachable on Vercel, or `persisted: false` if PostGIS is offline. Mobile never fakes an active beacon: stores unsent SOS locally as `NOT DELIVERED`, shows explicit warning, keeps active SOS until `cancelled: true`, and exposes user-initiated `112` / `1077` dialer buttons. |
| `POST /api/citizen/report` | Stateless gateway receipt on Next.js | Mobile explicitly notes when response is not database-persisted (`persisted !== true`). |
| `GET /api/isolation`, `/api/landslides/historical` | Uses `BACKEND_URL` if reachable; otherwise returns static reference dataset | Mobile inspects `source === 'static_fallback'` and labels static data transparently. |
| `GET /mobile-analytics` | Self-contained on Vercel | Embedded `WebView` enforces origin validation + whitelisted IMD DWR station codes on `postMessage`. |
