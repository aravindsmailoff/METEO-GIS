# METEO-GIS Android Application (`React Native 0.76.6 + MapLibre`)

Isolated standalone native Android companion app for the deployed **METEO-GIS** platform (**`https://meteo-gis.vercel.app`**), built inside `/android` without altering the existing web dashboard or backend code.

---

## 1. Standalone Signed Packaging & Keystore Security

Both CI artifacts produced by `.github/workflows/android-build.yml` are **signed, standalone APKs with embedded Hermes JS bundles (`assets/index.android.bundle`)** ready for immediate installation on Android devices without a Metro development server:

- **Release APK (`app-release.apk`):**
  - Signed with **APK Signature Scheme v1 + v2 + v3** and verified in CI via `apksigner verify --verbose --print-certs`.
  - Reads `ANDROID_RELEASE_KEYSTORE_BASE64`, `ANDROID_RELEASE_STORE_PASSWORD`, `ANDROID_RELEASE_KEY_ALIAS`, and `ANDROID_RELEASE_KEY_PASSWORD` from encrypted GitHub Actions Secrets into ephemeral `$RUNNER_TEMP` storage (shredded after every build in `if: always()`).
  - Run `./android/scripts/setup-android-signing-secrets.sh` on an administrator workstation to generate a persistent offline PKCS#12 release keystore outside Git and upload all four encrypted secrets directly to GitHub Actions via `gh secret set`.
  - Contains **zero local development URLs** (`0` occurrences of `http://10.0.2.2:3000`, `http://127.0.0.1:3000`, `http://localhost:3000`, `10.0.2.2`, `127.0.0.1`, or `METEOGIS_PROD_API_URL`, enforced in both Vitest and CI binary inspection).
- **Debug APK (`app-debug.apk`):**
  - Signed with Android's auto-generated machine-local `~/.android/debug.keystore` (never committed to Git) and embeds `assets/index.android.bundle` so it also launches standalone on physical phones without Metro.
  - Pass `-PUSE_METRO_DEV=true` (`./gradlew assembleDebug -PUSE_METRO_DEV=true`) during local iterative development to connect live to Metro on port `8081`.

---

## 2. Production API Enforcement & Runtime Verification

- **Production Lock (`__DEV__ === false`):**
  - Locked unconditionally to `BuildConfig.PROD_API_URL` (`https://meteo-gis.vercel.app`) bridged natively via `MeteoAppConfigPackage.kt` -> `NativeModules.MeteoAppConfig.PROD_API_URL`.
  - Runtime custom API URL overrides, dev loopback constants, and dev Settings switcher buttons are completely dead-code-eliminated from production bundles.
  - `app/src/main/res/xml/network_security_config.xml` sets `<base-config cleartextTrafficPermitted="false" />` across all hosts with zero cleartext exceptions in release builds.
- **Automated Android 14 (API 34) Device Runtime Verification (`android-device-runtime-e2e` job):**
  - Boots a hardware-accelerated Android 14 (`x86_64`) virtual device in GitHub Actions, installs `app-release.apk` via `adb install`, cold-launches `com.meteogis/.MainActivity` with no Metro server, verifies live HTTPS 200 responses from `https://meteo-gis.vercel.app` across hazards, warnings, stations, ML risk prediction, `Road-Closure Safety Unverified` routing, and non-destructive SOS queueing, checks `adb logcat` for zero fatal exceptions, and uploads real device PNG screenshots (`meteo-gis-device-runtime-proof`).
