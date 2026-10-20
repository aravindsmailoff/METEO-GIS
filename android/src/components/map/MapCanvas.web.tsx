import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TILE_URL } from '../../config/api';
import {
  createGeoCirclePolygon,
  METEO_MAPS,
  MONITORED_DWR_NETWORK,
} from '../../data/indiaGeoCatalog';
import { useAppStore } from '../../store/appStore';
import type { MapCanvasProps } from './MapCanvas';

export const MapCanvas: React.FC<MapCanvasProps> = ({
  hazards,
  warnings,
  pluvialZones,
  stations,
  rainfallPoints,
  onSelectWarning,
  onSelectHazard,
  onSelectPluvialZone,
  onSelectStation,
  onLocateUserGps,
}) => {
  const { height: windowHeight } = useWindowDimensions();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const overlaysGroupRef = useRef<L.LayerGroup | null>(null);

  const cameraCommand = useAppStore((s) => s.cameraCommand);
  const layerConfig = useAppStore((s) => s.layerConfig);
  const bottomSheetSnap = useAppStore((s) => s.bottomSheetSnap);
  const isHazardFocusOnly = useAppStore((s) => s.isHazardFocusOnly);
  const activeRouteOverlay = useAppStore((s) => s.activeRouteOverlay);
  const handleEmptyMapTap = useAppStore((s) => s.handleEmptyMapTap);
  const openSatelliteModal = useAppStore((s) => s.openSatelliteModal);
  const openRadarModal = useAppStore((s) => s.openRadarModal);
  const resetNationalView = useAppStore((s) => s.resetNationalView);
  const setBaseMap = useAppStore((s) => s.setBaseMap);

  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const [tileError, setTileError] = useState(false);

  // Initialize interactive Leaflet viewport
  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;

    const map = L.map(hostRef.current, {
      center: [cameraCommand.lat, cameraCommand.lng],
      zoom: Math.round(cameraCommand.zoom),
      zoomControl: false,
      attributionControl: true,
    });

    const group = L.layerGroup().addTo(map);
    overlaysGroupRef.current = group;

    map.on('click', () => {
      handleEmptyMapTap();
    });

    mapRef.current = map;

    const resizeObs = new ResizeObserver(() => {
      map.invalidateSize({ pan: false });
    });
    resizeObs.observe(hostRef.current);

    return () => {
      resizeObs.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Swap Base Map Tiles seamlessly
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    setTileError(false);

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    const template = TILE_URL(layerConfig.baseMap);
    let tileErrors = 0;
    const tl = L.tileLayer(template, {
      maxZoom: 18,
      attribution: 'IMD · ISRO Bhuvan · NASA GIBS',
    });

    tl.on('tileerror', () => {
      tileErrors += 1;
      if (tileErrors >= 6) {
        setTileError(true);
      }
    });

    tl.addTo(map);
    tileLayerRef.current = tl;
  }, [layerConfig.baseMap]);

  // Apply Camera Padding when snapping BottomSheet to HALF (Spec Section 6)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const targetZoom = Math.max(4, Math.round(cameraCommand.zoom));
    if (cameraCommand.padForHalfSheet) {
      const halfSheetOffsetPx = Math.round(windowHeight * 0.22);
      const targetPoint = map.project([cameraCommand.lat, cameraCommand.lng], targetZoom);
      const shiftedCenter = map.unproject(
        L.point(targetPoint.x, targetPoint.y + halfSheetOffsetPx),
        targetZoom
      );
      map.flyTo(shiftedCenter, targetZoom, { duration: 0.4 });
    } else {
      map.flyTo([cameraCommand.lat, cameraCommand.lng], targetZoom, { duration: 0.4 });
    }
  }, [cameraCommand, windowHeight]);

  // Render DWR Rings, Pluvial Polygons, AWS/Rainfall Dots, Active Safe Route, and Hazard/Warning Markers
  useEffect(() => {
    const group = overlaysGroupRef.current;
    if (!group) return;
    group.clearLayers();

    // 1. DWR Coverage Rings
    if (layerConfig.showDwrRings) {
      for (const stn of MONITORED_DWR_NETWORK) {
        const ring = createGeoCirclePolygon(stn.lng, stn.lat, stn.rangeKm, 36).map(
          ([lng, lat]) => [lat, lng] as [number, number]
        );
        L.polygon(ring, {
          color: '#22d3ee',
          weight: 1.1,
          dashArray: '4 4',
          fillColor: '#06b6d4',
          fillOpacity: 0.04,
          interactive: false,
        }).addTo(group);

        const dot = L.circleMarker([stn.lat, stn.lng], {
          radius: 4.5,
          color: '#ecfeff',
          weight: 1.5,
          fillColor: '#06b6d4',
          fillOpacity: 0.95,
        });
        dot.on('click', (ev) => {
          L.DomEvent.stopPropagation(ev);
          openRadarModal(stn.code);
        });
        dot.addTo(group);
      }
    }

    // 2. Pluvial Flood Zones
    if (layerConfig.showPluvialFloodLayer) {
      for (const z of pluvialZones) {
        const color =
          z.pluvialFloodRisk === 'CRITICAL'
            ? '#ef4444'
            : z.pluvialFloodRisk === 'HIGH'
              ? '#f97316'
              : '#eab308';
        const coords = (
          z.polygon || createGeoCirclePolygon(z.longitude, z.latitude, 4.2, 24)
        ).map(([lng, lat]) => [lat, lng] as [number, number]);
        const poly = L.polygon(coords, {
          color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.3,
        });
        poly.on('click', (ev) => {
          L.DomEvent.stopPropagation(ev);
          onSelectPluvialZone(z);
        });
        poly.addTo(group);
      }
    }

    // 3. Rainfall Observation Gauges
    if (layerConfig.showLiveRainfall) {
      for (const r of rainfallPoints) {
        const color =
          r.category === 'EXTREMELY_HEAVY'
            ? '#ef4444'
            : r.category === 'VERY_HEAVY'
              ? '#f97316'
              : r.category === 'HEAVY'
                ? '#eab308'
                : r.category === 'MODERATE'
                  ? '#38bdf8'
                  : '#10b981';
        const marker = L.circleMarker([r.latitude, r.longitude], {
          radius: 5.5,
          color: '#020617',
          weight: 1.5,
          fillColor: color,
          fillOpacity: 0.9,
        });
        marker.on('click', (ev) => {
          L.DomEvent.stopPropagation(ev);
          const st = stations.find((s) => s.stationName === r.stationName) || stations[0];
          if (st) onSelectStation(st);
        });
        marker.addTo(group);
      }
    }

    // 4. AWS Telemetry Stations
    if (layerConfig.showAwsStations) {
      for (const s of stations) {
        const marker = L.circleMarker([s.latitude, s.longitude], {
          radius: 6,
          color: '#0f172a',
          weight: 1.5,
          fillColor: '#22d3ee',
          fillOpacity: 0.95,
        });
        marker.on('click', (ev) => {
          L.DomEvent.stopPropagation(ev);
          onSelectStation(s);
        });
        marker.addTo(group);
      }
    }

    // 5. Active Safe / Emergency Route Polyline
    if (activeRouteOverlay && activeRouteOverlay.coordinates.length >= 2) {
      const latLngs = activeRouteOverlay.coordinates.map(
        ([lng, lat]) => [lat, lng] as [number, number]
      );
      L.polyline(latLngs, {
        color: activeRouteOverlay.mode === 'emergency' ? '#38bdf8' : '#10b981',
        weight: 5,
        opacity: 0.95,
      }).addTo(group);
    }

    // 6. IMD District Warning Pins -> route to WARNINGS tab
    if (layerConfig.showDistrictWarnings) {
      for (const w of warnings) {
        if (w.latitude == null || w.longitude == null) continue;
        if (isHazardFocusOnly && w.currentAlertLevel !== 'RED' && w.currentAlertLevel !== 'ORANGE') {
          continue;
        }
        const color =
          w.currentAlertLevel === 'RED'
            ? '#dc2626'
            : w.currentAlertLevel === 'ORANGE'
              ? '#ea580c'
              : w.currentAlertLevel === 'YELLOW'
                ? '#eab308'
                : '#10b981';
        const marker = L.circleMarker([w.latitude, w.longitude], {
          radius: 9,
          color: '#ffffff',
          weight: 2,
          fillColor: color,
          fillOpacity: 0.92,
        });
        marker.on('click', (ev) => {
          L.DomEvent.stopPropagation(ev);
          onSelectWarning(w);
        });
        marker.addTo(group);
      }
    }

    // 7. Live Convective / Cloudburst Hazard Pins -> route to OVERVIEW tab
    for (const h of hazards) {
      if (isHazardFocusOnly && !h.isSevere) continue;
      const color =
        h.severity === 'RED'
          ? '#ef4444'
          : h.severity === 'ORANGE'
            ? '#f97316'
            : h.severity === 'YELLOW'
              ? '#eab308'
              : '#10b981';

      const icon = L.divIcon({
        className: 'meteogis-mobile-hazard-pin',
        html: `<div style="
          width:26px;height:26px;border-radius:13px;
          background:${color};border:2px solid #ffffff;
          box-shadow:0 2px 10px rgba(0,0,0,0.75);
          display:flex;align-items:center;justify-content:center;
          font-size:12px;color:#fff;font-weight:900;cursor:pointer;
        ">⚡</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([h.latitude, h.longitude], { icon });
      marker.on('click', (ev) => {
        L.DomEvent.stopPropagation(ev);
        onSelectHazard(h);
      });
      marker.addTo(group);
    }
  }, [
    hazards,
    warnings,
    pluvialZones,
    stations,
    rainfallPoints,
    layerConfig,
    isHazardFocusOnly,
    activeRouteOverlay,
    onSelectHazard,
    onSelectPluvialZone,
    onSelectStation,
    onSelectWarning,
    openRadarModal,
  ]);

  const activeMapMeta =
    METEO_MAPS.find((m) => m.id === layerConfig.baseMap) || METEO_MAPS[0];

  const handleLocateTap = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => onLocateUserGps(pos.coords.latitude, pos.coords.longitude),
        () => onLocateUserGps(13.0827, 80.2707),
        { timeout: 4000 }
      );
    } else {
      onLocateUserGps(13.0827, 80.2707);
    }
  };

  return (
    <View style={styles.root}>
      {/* Vector dark ocean / India coastline backdrop so map remains clear even without external internet */}
      <svg
        viewBox="66 6 32 32"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          opacity: 0.22,
          zIndex: 0,
        }}
      >
        <defs>
          <pattern id="gisgrid" width="2" height="2" patternUnits="userSpaceOnUse">
            <path d="M 2 0 L 0 0 0 2" fill="none" stroke="#38bdf8" strokeWidth="0.06" />
          </pattern>
        </defs>
        <rect x="66" y="6" width="32" height="32" fill="url(#gisgrid)" />
      </svg>

      <div
        ref={hostRef}
        style={{
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 50% 45%, #0f1b2d 0%, #060c18 100%)',
          zIndex: 1,
        }}
      />

      {tileError && (
        <Pressable
          onPress={() => setBaseMap('bhuvan_2d')}
          style={styles.tileErrorBanner}
        >
          <Text style={styles.tileErrorText} numberOfLines={2}>
            ⚠️ Upstream raster tile feed offline · Vector hazards, radar rings & proxy layers active
          </Text>
        </Pressable>
      )}

      {/* Right Non-Overlapping Control Rail (Every target >= 48x48dp, hidden when sheet is FULL) */}
      {bottomSheetSnap !== 'full' && (
        <View style={styles.rightRail} pointerEvents="box-none">
          <Pressable
            onPress={openSatelliteModal}
            style={styles.railBtn}
            accessibilityRole="button"
            accessibilityLabel="Open INSAT-3DR Satellite Imagery"
          >
            <Text style={styles.railIcon}>🛰️</Text>
            <Text style={styles.railLabel} maxFontSizeMultiplier={1.1}>INSAT</Text>
          </Pressable>

          <Pressable
            onPress={() => openRadarModal()}
            style={styles.railBtn}
            accessibilityRole="button"
            accessibilityLabel="Open DWR Doppler Radar Viewer"
          >
            <Text style={styles.railIcon}>📡</Text>
            <Text style={styles.railLabel} maxFontSizeMultiplier={1.1}>RADAR</Text>
          </Pressable>

          <Pressable
            onPress={handleLocateTap}
            style={styles.railBtn}
            accessibilityRole="button"
            accessibilityLabel="Locate Me via GPS"
          >
            <Text style={styles.railIcon}>🎯</Text>
            <Text style={styles.railLabel} maxFontSizeMultiplier={1.1}>GPS</Text>
          </Pressable>

          <Pressable
            onPress={resetNationalView}
            style={styles.railBtn}
            accessibilityRole="button"
            accessibilityLabel="Reset All India View"
          >
            <Text style={styles.railIcon}>↺</Text>
            <Text style={styles.railLabel} maxFontSizeMultiplier={1.1}>INDIA</Text>
          </Pressable>

          <View style={styles.zoomGroup}>
            <Pressable
              onPress={() => mapRef.current?.zoomIn()}
              style={styles.zoomBtn}
              accessibilityRole="button"
              accessibilityLabel="Zoom in"
            >
              <Text style={styles.zoomText}>+</Text>
            </Pressable>
            <View style={styles.zoomDivider} />
            <Pressable
              onPress={() => mapRef.current?.zoomOut()}
              style={styles.zoomBtn}
              accessibilityRole="button"
              accessibilityLabel="Zoom out"
            >
              <Text style={styles.zoomText}>−</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Bottom-Left Collapsible Legend Pill (Strictly above collapsed 56dp sheet, hidden when expanded) */}
      {bottomSheetSnap === 'collapsed' && (
        <View style={styles.bottomLeftSlot} pointerEvents="box-none">
          <Pressable
            onPress={() => setIsLegendExpanded((v) => !v)}
            style={styles.legendPill}
            accessibilityRole="button"
            accessibilityLabel="Toggle 24-hour IMD Rainfall Scale Legend"
          >
            <Text style={styles.legendTitle} numberOfLines={1} maxFontSizeMultiplier={1.15}>
              🌧 24h Rain · {activeMapMeta.icon} {activeMapMeta.label}{' '}
              {isLegendExpanded ? '▾' : '▴'}
            </Text>
            {isLegendExpanded && (
              <View style={styles.legendScaleRow}>
                <View style={styles.scaleItem}>
                  <View style={[styles.swatch, { backgroundColor: '#10b981' }]} />
                  <Text style={styles.scaleText}>Light</Text>
                </View>
                <View style={styles.scaleItem}>
                  <View style={[styles.swatch, { backgroundColor: '#38bdf8' }]} />
                  <Text style={styles.scaleText}>Mod</Text>
                </View>
                <View style={styles.scaleItem}>
                  <View style={[styles.swatch, { backgroundColor: '#eab308' }]} />
                  <Text style={styles.scaleText}>Heavy</Text>
                </View>
                <View style={styles.scaleItem}>
                  <View style={[styles.swatch, { backgroundColor: '#f97316' }]} />
                  <Text style={styles.scaleText}>V.Heavy</Text>
                </View>
                <View style={styles.scaleItem}>
                  <View style={[styles.swatch, { backgroundColor: '#ef4444' }]} />
                  <Text style={styles.scaleText}>Extreme</Text>
                </View>
              </View>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#060c18',
    position: 'relative',
    overflow: 'hidden',
  },
  tileErrorBanner: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 70,
    minHeight: 48,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: 'center',
    zIndex: 10,
  },
  tileErrorText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
  rightRail: {
    position: 'absolute',
    top: 10,
    right: 10,
    alignItems: 'center',
    gap: 8,
    zIndex: 12,
  },
  railBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(9, 15, 29, 0.92)',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  railIcon: {
    fontSize: 16,
  },
  railLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#cbd5e1',
    marginTop: 1,
    letterSpacing: 0.3,
  },
  zoomGroup: {
    marginTop: 2,
    width: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(9, 15, 29, 0.92)',
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  zoomBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: '#1e293b',
  },
  zoomText: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
  },
  bottomLeftSlot: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    maxWidth: '74%',
    zIndex: 12,
  },
  legendPill: {
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(9, 15, 29, 0.92)',
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    gap: 6,
  },
  legendTitle: {
    color: '#e2e8f0',
    fontSize: 11.5,
    fontWeight: '700',
  },
  legendScaleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 2,
  },
  scaleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  swatch: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scaleText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '600',
  },
});
