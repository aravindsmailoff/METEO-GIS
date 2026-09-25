#!/usr/bin/env bash
# ==============================================================================
# NER Landslide RiskWatch — Valhalla Hierarchical Tile Building Pipeline
# Target Region: North Eastern Region (NER) of India
# States: Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura
# Source: Geofabrik OpenStreetMap North-Eastern Zone Extract
# Official Valhalla Toolchain: https://valhalla.github.io/valhalla/
# ==============================================================================

set -euo pipefail

DATA_DIR="${DATA_DIR:-/data}"
PBF_URL="${PBF_URL:-https://download.geofabrik.de/asia/india/north-eastern-zone-latest.osm.pbf}"
SOURCE_DIR="${DATA_DIR}/source"
BUILD_DIR="${DATA_DIR}/build"
TILES_DIR="${DATA_DIR}/tiles"
STAGING_DIR="${DATA_DIR}/staging_tiles"
BACKUP_DIR="${DATA_DIR}/backup_tiles"
CONFIG_FILE="${DATA_DIR}/valhalla.json"
PBF_FILE="${SOURCE_DIR}/north-eastern-zone-latest.osm.pbf"
ADMIN_DB="${DATA_DIR}/admins.sqlite"
TZ_DB="${DATA_DIR}/timezones.sqlite"
BUILD_CONCURRENCY="${BUILD_CONCURRENCY:-2}"

echo "========================================================================"
echo " [Valhalla Pipeline] Starting Tile Build for North Eastern Region (NER)"
echo " Base Data Directory: ${DATA_DIR}"
echo " Geofabrik Source:   ${PBF_URL}"
echo " Concurrency:        ${BUILD_CONCURRENCY} workers"
echo "========================================================================"

# Step 1: Create required directory tree
echo "[1/8] Setting up directory structure..."
mkdir -p "${SOURCE_DIR}" "${BUILD_DIR}" "${TILES_DIR}" "${STAGING_DIR}"

# Step 2: Download Geofabrik North-Eastern Zone OSM Extract
echo "[2/8] Fetching latest North-Eastern Zone OpenStreetMap PBF..."
if [ -f "${PBF_FILE}" ]; then
    echo "Existing PBF found at ${PBF_FILE}. Checking for updates via curl..."
    curl -L --retry 3 --retry-delay 5 -z "${PBF_FILE}" -o "${PBF_FILE}" "${PBF_URL}"
else
    echo "Downloading fresh extract from Geofabrik..."
    curl -L --retry 3 --retry-delay 5 -o "${PBF_FILE}" "${PBF_URL}"
fi

# Step 3: Validate downloaded PBF file
echo "[3/8] Validating downloaded PBF integrity..."
if [ ! -s "${PBF_FILE}" ]; then
    echo "ERROR: Downloaded PBF file is empty or missing!" >&2
    exit 1
fi
PBF_SIZE=$(du -h "${PBF_FILE}" | cut -f1)
echo "Verified PBF file exists. Size: ${PBF_SIZE}"

# Step 4: Generate official Valhalla configuration JSON
echo "[4/8] Generating Valhalla JSON configuration..."
valhalla_build_config \
    --mjolnir-tile-dir "${TILES_DIR}" \
    --mjolnir-tile-extract "${DATA_DIR}/tiles.tar" \
    --mjolnir-timezone "${TZ_DB}" \
    --mjolnir-admin "${ADMIN_DB}" \
    --mjolnir-concurrency "${BUILD_CONCURRENCY}" \
    --mjolnir-traffic-extract "" \
    > "${CONFIG_FILE}"

echo "Generated config at ${CONFIG_FILE}"

# Step 5: Build administrative boundaries
echo "[5/8] Compiling administrative database (admins.sqlite)..."
if command -v valhalla_build_admins >/dev/null 2>&1; then
    valhalla_build_admins -c "${CONFIG_FILE}" "${PBF_FILE}"
    echo "Administrative database compiled successfully."
else
    echo "valhalla_build_admins command not present; skipping standalone admin build."
fi

# Step 6: Build timezone database
echo "[6/8] Compiling timezone database (timezones.sqlite)..."
if command -v valhalla_build_timezones >/dev/null 2>&1; then
    valhalla_build_timezones -c "${CONFIG_FILE}"
    echo "Timezone database compiled successfully."
else
    echo "valhalla_build_timezones command not present; skipping standalone timezone build."
fi

# Step 7: Build routing tiles (in staging directory for atomic swap)
echo "[7/8] Compiling Valhalla routing graph tiles..."
# Temporarily update config to target staging directory
sed -i "s|\"tile_dir\": \"${TILES_DIR}\"|\"tile_dir\": \"${STAGING_DIR}\"|g" "${CONFIG_FILE}"

rm -rf "${STAGING_DIR:?}"/*
valhalla_build_tiles -c "${CONFIG_FILE}" "${PBF_FILE}"

# Revert config tile directory back to primary
sed -i "s|\"tile_dir\": \"${STAGING_DIR}\"|\"tile_dir\": \"${TILES_DIR}\"|g" "${CONFIG_FILE}"

# Step 8: Atomic switch & verification
echo "[8/8] Performing atomic tile swap and validation..."
if [ -d "${STAGING_DIR}/0" ] || [ -d "${STAGING_DIR}/1" ] || [ -d "${STAGING_DIR}/2" ]; then
    echo "Staging tiles validated successfully."
    
    # Safe atomic rotation: Backup existing -> Move staging -> Purge old backup
    if [ -d "${TILES_DIR}" ] && [ "$(ls -A "${TILES_DIR}")" ]; then
        rm -rf "${BACKUP_DIR}"
        mv "${TILES_DIR}" "${BACKUP_DIR}"
    fi
    mv "${STAGING_DIR}" "${TILES_DIR}"
    mkdir -p "${STAGING_DIR}"

    # Build compressed tar tile extract if supported
    if command -v valhalla_build_extract >/dev/null 2>&1; then
        echo "Creating tiles tar archive..."
        valhalla_build_extract -c "${CONFIG_FILE}" -v || true
    fi

    # Set file permissions
    chmod -R 755 "${DATA_DIR}"

    echo "========================================================================"
    echo " [Valhalla Pipeline] SUCCESS: Valhalla tiles ready for production."
    echo " Tiles Location: ${TILES_DIR}"
    echo " Config Path:    ${CONFIG_FILE}"
    echo "========================================================================"
else
    echo "ERROR: Tile generation failed! Staging directory is missing expected tile levels." >&2
    # Restore backup if available
    if [ -d "${BACKUP_DIR}" ]; then
        echo "Rolling back to previous working tiles..."
        rm -rf "${TILES_DIR}"
        mv "${BACKUP_DIR}" "${TILES_DIR}"
    fi
    exit 1
fi
