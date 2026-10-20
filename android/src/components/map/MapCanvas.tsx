import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { TILE_URL } from '../../config/api';
import { METEO_MAPS } from '../../data/indiaGeoCatalog';
import { useAppStore } from '../../store/appStore';
import {
  DerivedHazardEvent,
  PluvialFloodZone,
  RainfallObservationPoint,
  ValidatedDistrictWarning,
  ValidatedStationObservation,
} from '../../types/meteo';
import { buildDwrCentersGeoJson, buildDwrRingsGeoJson } from './DwrRingLayer';
import { buildHazardMarkersGeoJson } from './HazardMarker';
import { buildPluvialZonesGeoJson } from './PluvialZoneLayer';
import { buildStationsGeoJson } from './RainfallPointLayer';

MapLibreGL.setAccessToken(null);

export interface MapCanvasProps {
  hazards: DerivedHazardEvent[];
  warnings: ValidatedDistrictWarning[];
  pluvialZones: PluvialFloodZone[];
  stations: ValidatedStationObservation[];
  rainfallPoints: RainfallObservationPoint[];
  onSelectWarning: (w: ValidatedDistrictWarning) => void;
  onSelectHazard: (h: DerivedHazardEvent) => void;
  onSelectPluvialZone: (z: PluvialFloodZone) => void;
  onSelectStation: (s: ValidatedStationObservation) => void;
  onLocateUserGps: (lat: number, lng: number) => void;
}

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
  const cameraRef = useRef<any>(null);

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

  const [zoomLevel, setZoomLevel] = useState<number>(cameraCommand.zoom || 4.3);
  const [isLegendExpanded, setIsLegendExpanded] = useState<boolean>(false);
  const [tileError, setTileError] = useState<boolean>(false);

  const HALF_SHEET_HEIGHT = windowHeight * 0.5;

  useEffect(() => {
    setTileError(false);
  }, [layerConfig.baseMap]);

  useEffect(() => {
    setZoomLevel(cameraCommand.zoom);
    cameraRef.current?.setCamera({
      centerCoordinate: [cameraCommand.lng, cameraCommand.lat],
      zoomLevel: cameraCommand.zoom,
      padding: {
        paddingTop: 16,
        paddingBottom: cameraCommand.padForHalfSheet ? HALF_SHEET_HEIGHT + 16 : 16,
        paddingLeft: 16,
        paddingRight: 16,
      },
      animationDuration: 420,
    });
  }, [cameraCommand, HALF_SHEET_HEIGHT]);

  const dwrRingsGeo = useMemo(() => buildDwrRingsGeoJson(), []);
  const dwrCentersGeo = useMemo(() => buildDwrCentersGeoJson(), []);
  const pluvialGeo = useMemo(() => buildPluvialZonesGeoJson(pluvialZones), [pluvialZones]);
  const stationsGeo = useMemo(
    () =>
      buildStationsGeoJson(
        stations,
        rainfallPoints,
        layerConfig.showAwsStations,
        layerConfig.showLiveRainfall
      ),
    [stations, rainfallPoints, layerConfig.showAwsStations, layerConfig.showLiveRainfall]
  );
  const markersGeo = useMemo(
    () =>
      buildHazardMarkersGeoJson(
        hazards,
        warnings,
        layerConfig.showDistrictWarnings,
        isHazardFocusOnly
      ),
    [hazards, warnings, layerConfig.showDistrictWarnings, isHazardFocusOnly]
  );

  const routeGeo = useMemo(() => {
    if (!activeRouteOverlay || activeRouteOverlay.coordinates.length < 2) return null;
    return {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          properties: { mode: activeRouteOverlay.mode },
          geometry: {
            type: 'LineString' as const,
            coordinates: activeRouteOverlay.coordinates,
          },
        },
      ],
    };
  }, [activeRouteOverlay]);

  const activeMapMeta =
    METEO_MAPS.find((m) => m.id === layerConfig.baseMap) || METEO_MAPS[0];

  const handleRequestGps = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Locate Me on MeteoGIS',
            message:
              'MeteoGIS uses your location once to center the hazard map on your district and show nearby AWS weather telemetry.',
            buttonPositive: 'Allow Once',
            buttonNegative: 'Cancel',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return;
        }
      }
      const geo = (globalThis as any).navigator?.geolocation;
      if (geo?.getCurrentPosition) {
        geo.getCurrentPosition(
          (pos: any) => onLocateUserGps(pos.coords.latitude, pos.coords.longitude),
          () => onLocateUserGps(13.0827, 80.2707),
          { enableHighAccuracy: true, timeout: 6000 }
        );
      } else {
        onLocateUserGps(13.0827, 80.2707);
      }
    } catch {
      onLocateUserGps(13.0827, 80.2707);
    }
  };

  return (
    <View style={styles.root}>
      <MapLibreGL.MapView
        style={styles.map}
        logoEnabled={false}
        compassEnabled={false}
        attributionPosition={{ bottom: 8, right: 8 }}
        onPress={handleEmptyMapTap}
        onDidFailLoadingMap={() => setTileError(true)}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [cameraCommand.lng, cameraCommand.lat],
            zoomLevel: cameraCommand.zoom,
          }}
        />

        {/* Base Raster Tile Layer (NASA GIBS or Next.js Bhuvan XYZ Proxy) */}
        <MapLibreGL.RasterSource
          id={`raster-${layerConfig.baseMap}`}
          tileUrlTemplates={[TILE_URL(layerConfig.baseMap)]}
          tileSize={256}
        >
          <MapLibreGL.RasterLayer id={`raster-layer-${layerConfig.baseMap}`} />
        </MapLibreGL.RasterSource>

        {/* DWR Radar Coverage Rings */}
        {layerConfig.showDwrRings && (
          <MapLibreGL.ShapeSource id="dwr-rings-src" shape={dwrRingsGeo}>
            <MapLibreGL.LineLayer
              id="dwr-rings-line"
              style={{
                lineColor: '#22d3ee',
                lineWidth: 1.1,
                lineOpacity: 0.45,
                lineDasharray: [3, 3],
              }}
            />
          </MapLibreGL.ShapeSource>
        )}
        {layerConfig.showDwrRings && (
          <MapLibreGL.ShapeSource
            id="dwr-centers-src"
            shape={dwrCentersGeo}
            onPress={(e: any) => {
              const code = e?.features?.[0]?.properties?.code;
              openRadarModal(code);
            }}
          >
            <MapLibreGL.CircleLayer
              id="dwr-centers-circle"
              style={{
                circleRadius: 5,
                circleColor: '#06b6d4',
                circleStrokeWidth: 1.5,
                circleStrokeColor: '#ecfeff',
              }}
            />
          </MapLibreGL.ShapeSource>
        )}

        {/* Pluvial Flood Polygons */}
        {layerConfig.showPluvialFloodLayer && (
          <MapLibreGL.ShapeSource
            id="pluvial-src"
            shape={pluvialGeo}
            onPress={(e: any) => {
              const refId = e?.features?.[0]?.properties?.refId;
              const match = pluvialZones.find((z) => z.id === refId);
              if (match) onSelectPluvialZone(match);
            }}
          >
            <MapLibreGL.FillLayer
              id="pluvial-fill"
              style={{
                fillColor: ['get', 'fillColor'],
                fillOpacity: 0.28,
              }}
            />
            <MapLibreGL.LineLayer
              id="pluvial-outline"
              style={{
                lineColor: ['get', 'fillColor'],
                lineWidth: 2,
              }}
            />
          </MapLibreGL.ShapeSource>
        )}

        {/* AWS Stations & Rainfall Gauges */}
        <MapLibreGL.ShapeSource
          id="stations-src"
          shape={stationsGeo}
          onPress={(e: any) => {
            const props = e?.features?.[0]?.properties;
            const match =
              stations.find((s) => s.id === props?.refId) ||
              stations.find((s) => s.stationName === props?.stationName);
            if (match) onSelectStation(match);
          }}
        >
          <MapLibreGL.CircleLayer
            id="stations-circle"
            style={{
              circleRadius: 5.5,
              circleColor: ['get', 'color'],
              circleStrokeWidth: 1.5,
              circleStrokeColor: '#020617',
            }}
          />
        </MapLibreGL.ShapeSource>

        {/* Active Safe / Emergency Route Polyline (Amber dashed when Road-Closure Safety Unverified) */}
        {routeGeo && (
          <MapLibreGL.ShapeSource id="active-route-src" shape={routeGeo}>
            <MapLibreGL.LineLayer
              id="active-route-line"
              style={{
                lineColor:
                  activeRouteOverlay?.closureVerification === 'closure_unverified'
                    ? '#f59e0b'
                    : activeRouteOverlay?.mode === 'emergency'
                      ? '#38bdf8'
                      : '#10b981',
                lineWidth: 4.5,
                lineOpacity: 0.92,
                ...(activeRouteOverlay?.closureVerification === 'closure_unverified'
                  ? { lineDasharray: [2.2, 1.4] }
                  : {}),
              }}
            />
          </MapLibreGL.ShapeSource>
        )}

        {/* Hazard & IMD Warning Markers */}
        <MapLibreGL.ShapeSource
          id="hazards-src"
          shape={markersGeo}
          onPress={(e: any) => {
            const props = e?.features?.[0]?.properties;
            if (!props) return;
            if (props.kind === 'warning') {
              const w = warnings.find((item) => item.objId === props.refId);
              if (w) onSelectWarning(w);
            } else {
              const h = hazards.find((item) => item.id === props.refId);
              if (h) onSelectHazard(h);
            }
          }}
        >
          <MapLibreGL.CircleLayer
            id="hazards-circle"
            style={{
              circleRadius: ['get', 'radius'],
              circleColor: ['get', 'color'],
              circleStrokeWidth: 2,
              circleStrokeColor: '#ffffff',
            }}
          />
        </MapLibreGL.ShapeSource>
      </MapLibreGL.MapView>

      {/* Tile Provider Degradation Notice (Never crashes when tile provider is down) */}
      {tileError && (
        <Pressable
          onPress={() => setBaseMap('bhuvan_2d')}
          style={styles.tileErrorBanner}
        >
          <Text style={styles.tileErrorText}>
            ⚠️ Tile layer unavailable · Tap to switch base map
          </Text>
        </Pressable>
      )}

      {/* Right Non-Overlapping Control Rail (Hidden when sheet is FULL) */}
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
            onPress={handleRequestGps}
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
              onPress={() => {
                const next = Math.min(17, zoomLevel + 1);
                setZoomLevel(next);
                cameraRef.current?.zoomTo(next, 220);
              }}
              style={styles.zoomBtn}
              accessibilityRole="button"
              accessibilityLabel="Zoom in"
            >
              <Text style={styles.zoomText}>+</Text>
            </Pressable>
            <View style={styles.zoomDivider} />
            <Pressable
              onPress={() => {
                const next = Math.max(3.5, zoomLevel - 1);
                setZoomLevel(next);
                cameraRef.current?.zoomTo(next, 220);
              }}
              style={styles.zoomBtn}
              accessibilityRole="button"
              accessibilityLabel="Zoom out"
            >
              <Text style={styles.zoomText}>−</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Bottom-Left Collapsible Rainfall & BaseMap Pill (Strictly above collapsed 56dp sheet) */}
      {bottomSheetSnap === 'collapsed' && (
        <View style={styles.bottomLeftSlot} pointerEvents="box-none">
          <Pressable
            onPress={() => setIsLegendExpanded((v) => !v)}
            style={styles.legendPill}
            accessibilityRole="button"
            accessibilityLabel="Toggle 24-hour IMD Rainfall Scale Legend"
          >
            <Text style={styles.legendTitle} numberOfLines={1} maxFontSizeMultiplier={1.15}>
              🌧 24h IMD Rain · {activeMapMeta.icon} {activeMapMeta.label}{' '}
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
  },
  map: {
    flex: 1,
  },
  tileErrorBanner: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 72,
    minHeight: 48,
    backgroundColor: 'rgba(120, 53, 15, 0.94)',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  tileErrorText: {
    color: '#fef3c7',
    fontSize: 12,
    fontWeight: '700',
  },
  rightRail: {
    position: 'absolute',
    top: 12,
    right: 12,
    alignItems: 'center',
    gap: 8,
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
    marginTop: 4,
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
    left: 12,
    bottom: 12,
    maxWidth: '76%',
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
