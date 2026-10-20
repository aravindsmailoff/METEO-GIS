# METEO-GIS Android Application (`React Native 0.76.6 + MapLibre`)

Isolated native Android companion app for the deployed **METEO-GIS** platform (**`https://meteo-gis.vercel.app`**), built inside `/android` without altering the existing web dashboard or backend code.

---

## 1. Verified Compatibility Matrix & Keystore Hygiene

| Layer | Verified Version / Configuration |
|---|---|
| **React Native / Hermes** | `0.76.6` (`hermesEnabled=true`, `newArchEnabled=false`, `OpenSourceMergedSoMapping`) |
| **Android Gradle Plugin (AGP)** | `8.6.0` (via `@react-native/gradle-plugin`) |
| **Gradle Wrapper** | `8.10.2` (`android/android/gradle/wrapper/gradle-wrapper.properties` + `gradle-wrapper.jar`) |
| **Kotlin / Java Target** | Kotlin `1.9.24`, JDK `17` (`JavaVersion.VERSION_17`) |
| **Android SDK / NDK / CMake** | `compileSdk = 35`, `targetSdk = 34`, `minSdk = 24`, `buildToolsVersion = "35.0.0"`, `ndkVersion = "26.1.10909125"`, `cmake = "3.22.1"` |
| **Signing Strategy (Zero Committed Keys)** | No `.keystore` or `.jks` files are checked into Git. `assembleDebug` uses Android Gradle Plugin's auto-generated machine-local `~/.android/debug.keystore`. `assembleRelease` signs with `RELEASE_STORE_FILE` / `RELEASE_STORE_PASSWORD` / `RELEASE_KEY_ALIAS` / `RELEASE_KEY_PASSWORD` when supplied, or outputs reproducible unsigned `app-release-unsigned.apk` when omitted. |

---

## 2. Shared Backend Configuration & Cleartext Security (`src/config/api.ts`)

All mobile network requests and embedded analytics WebViews route through `src/config/api.ts`:

- **Production Default (Debug & Release APKs):** `https://meteo-gis.vercel.app` (`PRODUCTION_API_URL`, bridged at build time via `PROD_API_URL` -> `BuildConfig.PROD_API_URL` -> `NativeModules.MeteoAppConfig.PROD_API_URL`)
- **Intentional Local Emulator Dev (Opt-In Only):** `http://10.0.2.2:3000` (`LOCAL_DEV_API_URL`, active only when `USE_LOCAL_DEV_API=true` in development or explicitly selected in **Settings -> Emulator :3000**)
- **Physical Device Local Dev via USB:** `adb reverse tcp:3000 tcp:3000` + **Settings -> ADB :3000** (`http://127.0.0.1:3000`)
- **Build-Type Network Security Configs:**
  - **Release (`app/src/main/res/xml/network_security_config.xml`):** `<base-config cleartextTrafficPermitted="false" />` across all hosts with zero cleartext exceptions.
  - **Debug Overlay (`app/src/debug/res/xml/network_security_config.xml`):** permits cleartext HTTP solely on loopback development hosts (`10.0.2.2`, `127.0.0.1`, `localhost`).
  - **Compile-Time Guard (`verifyReleaseApiConfig`):** rejects empty, non-HTTPS, `localhost`, `127.0.0.1`, `10.0.2.2`, `0.0.0.0`, `::1`, or placeholder URLs before any release APK/AAB task executes.

---

## 3. Reproducible Build & Verification Commands

```bash
# 1. Install web & Android dependencies cleanly
npm ci
cd android && npm ci

# 2. Run Android & Web TypeScript checks + Safety Test Suite
npm run typecheck
npm test
cd .. && npx tsc --noEmit

# 3. Verify React Native Android production JS bundle
cd android
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output /tmp/index.android.release.bundle

# 4. Run Gradle wrapper, Debug APK, API Guard check, and Release APK
cd android
./gradlew --version
./gradlew assembleDebug
./gradlew verifyReleaseApiConfig
./gradlew assembleRelease -PPROD_API_URL=https://meteo-gis.vercel.app
```

Automated CI runs every command above on GitHub Actions (`.github/workflows/android-build.yml`) and publishes both `meteo-gis-android-debug-apk` (`app-debug.apk`) and `meteo-gis-android-release-apk` (`app-release-unsigned.apk`) build artifacts.

---

## 4. Safety Verification & Vercel Standalone Behavior

| Feature / Endpoint | Verification & Degraded-Mode Behavior |
|---|---|
| **Safe & Emergency Routing (`/api/routing/safe-route`, `/emergency-route` + `/api/roads/incidents`)** | Rejects `<5`-vertex straight lines, malformed coordinates, missing distance/time metrics, `>5 km` origin/destination mismatches, static pre-cached OSM fallbacks (`cached_high_density_osm_graph`), active blocked segments, and corridors within `400m` of active severe IMD hazards or `BLOCKED` road incidents. Marks routes **`Verified Safe Route`** ONLY when an authoritative Valhalla/PostGIS engine and a fresh (`<=6h`) road-closure feed both pass; labels OSRM or missing/stale road-closure corridors **`Road-Closure Safety Unverified`** (amber dashed line + warning card, never `"Verified Safe"`). |
| **ML Risk Inference (`/api/risk/predict`)** | Submits `{ rainfall_1h, rainfall_24h }` and handles timeouts, `503` service unavailability, and malformed responses cleanly without fabricating fallback scores. |
| **Emergency SOS & Cancel (`/api/sos`, `/api/sos/cancel`)** | Distinguishes `confirmed_persisted` (`persisted: true`), `received_unpersisted` (`persisted: false`), and `queued_not_delivered` (`503`/timeout/unconfirmed saved in `AsyncStorage` with idempotent `clientRequestId`). Retains active beacon until server explicitly confirms `{ cancelled: true }`. Never triggers automatic emergency calls. |
| **Live IMD Feeds (`/api/live/*`)** | Verifies both `status === 'OK'` and `isLive !== false`; sample data is off by default and strictly blocked in production builds. |
