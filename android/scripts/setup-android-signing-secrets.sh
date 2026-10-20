#!/usr/bin/env bash
# Generates an encrypted production PKCS#12 Android release signing keystore OUTSIDE the Git repository
# and uploads the four encrypted signing secrets directly to GitHub Actions via `gh secret set`.
# Never commit the generated `.p12` file or passwords to Git.

set -euo pipefail

KEYSTORE_OUT="${1:-$HOME/.meteogis-signing/meteogis-release.p12}"
KEY_ALIAS="${ANDROID_RELEASE_KEY_ALIAS:-meteogis-release}"
REPO_SLUG="${GITHUB_REPOSITORY:-aravindsmailoff/METEO-GIS}"

mkdir -p "$(dirname "$KEYSTORE_OUT")"
chmod 700 "$(dirname "$KEYSTORE_OUT")"

if [ -f "$KEYSTORE_OUT" ]; then
  echo "Keystore already exists at $KEYSTORE_OUT — refusing to overwrite."
  exit 1
fi

STORE_PASS="$(openssl rand -hex 24)"
KEY_PASS="$(openssl rand -hex 24)"

keytool -genkeypair \
  -v \
  -storetype PKCS12 \
  -keystore "$KEYSTORE_OUT" \
  -alias "$KEY_ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass "$STORE_PASS" \
  -keypass "$KEY_PASS" \
  -dname "CN=MeteoGIS Android Release, OU=Meteorological GIS Operations, O=MeteoGIS, L=Chennai, ST=Tamil Nadu, C=IN"

chmod 600 "$KEYSTORE_OUT"

base64 -w 0 "$KEYSTORE_OUT" | gh secret set ANDROID_RELEASE_KEYSTORE_BASE64 --repo "$REPO_SLUG"
printf "%s" "$STORE_PASS" | gh secret set ANDROID_RELEASE_STORE_PASSWORD --repo "$REPO_SLUG"
printf "%s" "$KEY_ALIAS" | gh secret set ANDROID_RELEASE_KEY_ALIAS --repo "$REPO_SLUG"
printf "%s" "$KEY_PASS" | gh secret set ANDROID_RELEASE_KEY_PASSWORD --repo "$REPO_SLUG"

echo "Uploaded encrypted Android release signing secrets to GitHub Actions for ${REPO_SLUG}."
echo "Back up ${KEYSTORE_OUT} securely in an offline password vault."
