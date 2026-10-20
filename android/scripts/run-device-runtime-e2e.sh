#!/usr/bin/env bash
# ==============================================================================
# Real Android 14 (API 34 x86_64) KVM Device Runtime Verification Suite
# Installs both standalone signed APKs (`app-release.apk` & `app-debug.apk`)
# via Android Package Manager (`adb install`) with ZERO Metro dev server,
# cold-launches `com.meteogis/.MainActivity`, verifies live HTTPS calls to
# `https://meteo-gis.vercel.app`, routing safety status, SOS dry-run handling,
# Settings UI production lock, screenshots, and zero fatal crashes.
# ==============================================================================
set -euo pipefail

PROOF_DIR="/tmp/device-proof"
mkdir -p "${PROOF_DIR}"

echo "=== 1. Verifying Hardware KVM Acceleration ==="
ls -la /dev/kvm
sudo chmod 666 /dev/kvm || true

SDK_ROOT="${ANDROID_HOME:-/usr/local/lib/android/sdk}"
export ANDROID_HOME="${SDK_ROOT}"
export ANDROID_SDK_ROOT="${SDK_ROOT}"
export ANDROID_AVD_HOME="${HOME}/.android/avd"
export ANDROID_EMULATOR_WAIT_TIME_BEFORE_KILL=5
export PATH="${SDK_ROOT}/cmdline-tools/latest/bin:${SDK_ROOT}/emulator:${SDK_ROOT}/platform-tools:${PATH}"
mkdir -p "${ANDROID_AVD_HOME}"

echo "=== 2. Provisioning Android 14 (API 34 google_apis x86_64) System Image ==="
yes | sdkmanager --sdk_root="${SDK_ROOT}" --licenses >/dev/null || true
sdkmanager --sdk_root="${SDK_ROOT}" --install \
  "platform-tools" \
  "emulator" \
  "platforms;android-34" \
  "system-images;android-34;google_apis;x86_64" >/dev/null

echo "no" | avdmanager create avd \
  -n meteogis_api34 \
  -k "system-images;android-34;google_apis;x86_64" \
  -p "${ANDROID_AVD_HOME}/meteogis_api34.avd" \
  --device "pixel_6" \
  --force

if [ -d "${HOME}/.config/.android/avd" ] && [ ! -f "${ANDROID_AVD_HOME}/meteogis_api34.ini" ]; then
  cp -rf "${HOME}/.config/.android/avd/"* "${ANDROID_AVD_HOME}/" || true
fi

echo "Registered AVDs:"
"${SDK_ROOT}/emulator/emulator" -list-avds

adb start-server

echo "=== 3. Booting Hardware-Accelerated Android 14 Device ==="
nohup "${SDK_ROOT}/emulator/emulator" \
  -avd meteogis_api34 \
  -no-window \
  -no-audio \
  -no-boot-anim \
  -no-snapshot \
  -no-metrics \
  -gpu swiftshader_indirect \
  -memory 4096 \
  -cores 4 \
  -dns-server 8.8.8.8,1.1.1.1 >"${PROOF_DIR}/emulator.log" 2>&1 &
EMU_PID=$!

cleanup() {
  kill "${EMU_PID}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

BOOTED=0
for i in $(seq 1 90); do
  if ! kill -0 "${EMU_PID}" 2>/dev/null; then
    echo "ERROR: Android emulator exited prematurely at $((i * 2))s!"
    cat "${PROOF_DIR}/emulator.log" || true
    exit 1
  fi
  BOOT_PROP=$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || true)
  if [ "${BOOT_PROP}" = "1" ]; then
    echo "Android 14 (API 34) booted in $((i * 2))s (SDK=$(adb shell getprop ro.build.version.sdk | tr -d '\r'))"
    BOOTED=1
    break
  fi
  sleep 2
done

if [ "${BOOTED}" -ne 1 ]; then
  echo "ERROR: Android 14 emulator did not complete boot within 180s!"
  tail -n 60 "${PROOF_DIR}/emulator.log" || true
  exit 1
fi

adb shell settings put global window_animation_scale 0 || true
adb shell settings put global transition_animation_scale 0 || true
adb shell settings put global animator_duration_scale 0 || true
adb shell input keyevent 82 || true
sleep 3
adb logcat -c

echo "=== 4. Installing & Cold-Launching Signed Standalone RELEASE APK (Zero Metro) ==="
adb install -r /tmp/release-artifact/app-release.apk
adb shell am start -W -n com.meteogis/.MainActivity

REL_VERIFIED=""
for i in $(seq 1 35); do
  LINE=$(adb logcat -d ReactNativeJS:I *:S | grep "\[METEOGIS_RUNTIME_VERIFIED\]" | tail -n 1 || true)
  if [ -n "${LINE}" ]; then
    REL_VERIFIED="${LINE}"
    break
  fi
  sleep 2
done

adb logcat -d > "${PROOF_DIR}/logcat-release.txt"

if [ -z "${REL_VERIFIED}" ]; then
  echo "ERROR: Signed Release APK did not emit [METEOGIS_RUNTIME_VERIFIED] within 70s!"
  echo "--- ReactNativeJS & Crash/Fatal Logs ---"
  grep -E "ReactNativeJS|AndroidRuntime|DEBUG|libc|Fatal|MLRN|MapLibre" "${PROOF_DIR}/logcat-release.txt" | tail -n 55 || true
  exit 1
fi

python3 android/scripts/assert-runtime-telemetry.py "RELEASE" "${REL_VERIFIED}"

sleep 2
adb exec-out screencap -p > "${PROOF_DIR}/01-release-map.png"
adb shell uiautomator dump /sdcard/ui_release_map.xml >/dev/null
adb pull /sdcard/ui_release_map.xml "${PROOF_DIR}/01-release-map.xml" >/dev/null

# Navigate to Settings tab (bottom-right tab on 1080x2400 Pixel 6 viewport)
adb shell input tap 945 2290
sleep 2
adb exec-out screencap -p > "${PROOF_DIR}/02-release-settings-https-locked.png"
adb shell uiautomator dump /sdcard/ui_release_settings.xml >/dev/null
adb pull /sdcard/ui_release_settings.xml "${PROOF_DIR}/02-release-settings.xml" >/dev/null

grep -q "https://meteo-gis.vercel.app" "${PROOF_DIR}/02-release-settings.xml"
if grep -qE "10\.0\.2\.2|127\.0\.0\.1|Emulator|ADB Reverse" "${PROOF_DIR}/02-release-settings.xml"; then
  echo "ERROR: Dev gateway switcher leaked into release Settings UI!"
  exit 1
fi

if grep -A 5 "FATAL EXCEPTION" "${PROOF_DIR}/logcat-release.txt" | grep -q "com.meteogis"; then
  echo "ERROR: Detected FATAL EXCEPTION in com.meteogis (Release APK)!"
  exit 1
fi

echo "=== 5. Installing & Cold-Launching Signed Standalone DEBUG APK (Zero Metro) ==="
adb uninstall com.meteogis
adb logcat -c
adb install -r /tmp/debug-artifact/app-debug.apk
adb shell am start -W -n com.meteogis/.MainActivity

DBG_VERIFIED=""
for i in $(seq 1 35); do
  LINE=$(adb logcat -d ReactNativeJS:I *:S | grep "\[METEOGIS_RUNTIME_VERIFIED\]" | tail -n 1 || true)
  if [ -n "${LINE}" ]; then
    DBG_VERIFIED="${LINE}"
    break
  fi
  sleep 2
done

adb logcat -d > "${PROOF_DIR}/logcat-debug.txt"

if [ -z "${DBG_VERIFIED}" ]; then
  echo "ERROR: Standalone Debug APK failed to boot without Metro!"
  grep -E "ReactNativeJS|AndroidRuntime|DEBUG|libc|Fatal|MLRN|MapLibre" "${PROOF_DIR}/logcat-debug.txt" | tail -n 55 || true
  exit 1
fi

python3 android/scripts/assert-runtime-telemetry.py "DEBUG_STANDALONE" "${DBG_VERIFIED}"
adb exec-out screencap -p > "${PROOF_DIR}/03-standalone-debug-map.png"

if grep -A 5 "FATAL EXCEPTION" "${PROOF_DIR}/logcat-debug.txt" | grep -q "com.meteogis"; then
  echo "ERROR: Detected FATAL EXCEPTION in com.meteogis (Standalone Debug APK)!"
  exit 1
fi

echo "=== 6. Verified Proof Artifacts ==="
ls -lh "${PROOF_DIR}"
