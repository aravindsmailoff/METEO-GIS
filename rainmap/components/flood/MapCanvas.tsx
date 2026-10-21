import React, { useEffect, useMemo, useState } from "react";
import { Animated, Easing, Image, PanResponder, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Polygon, Polyline, Stop } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { CHENNAI_CENTER, DEMO_EVACUATION_ROUTE } from "@/lib/flood/demo-data";
import type { GeoPoint, MapLayer, MapMarker } from "@/lib/flood/types";
import { C, riskColor, SF_PRO } from "./ui";

const TILE_SIZE = 256;
const MIN_ZOOM = 4;
const MAX_ZOOM = 18;

interface MeteoTile {
  key: string;
  x: number;
  y: number;
  satUrl: string;
  cloudsUrl?: string | null;
}

type Props = {
  markers: MapMarker[];
  layers: Record<MapLayer, boolean>;
  language?: string;
  windDirectionDeg?: number;
  windSpeedKmh?: number;
  activeDistrictName?: string;
  countdownFormatted?: string;
  focusCoords?: [number, number] | null;
  userLocation?: { latitude: number; longitude: number; accuracy?: number } | null;
  onMarker: (marker: MapMarker) => void;
  onMapPress: (point: GeoPoint) => void;
  pinMode: boolean;
};

function mercator(point: GeoPoint, zoom: number) {
  const size = TILE_SIZE * 2 ** zoom;
  const sin = Math.sin((point.latitude * Math.PI) / 180);
  return {
    x: ((point.longitude + 180) / 360) * size,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size,
  };
}

function unmercator(x: number, y: number, zoom: number): GeoPoint {
  const size = TILE_SIZE * 2 ** zoom;
  const longitude = (x / size) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / size;
  const latitude = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return { latitude, longitude };
}

function degToCardinal(deg: number): string {
  const cardinals = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const val = Math.floor((deg / 22.5) + 0.5);
  return cardinals[val % 16];
}

function getMarkerColor(marker: MapMarker) {
  if (marker.type === "ndrf") return "#30D158";
  if (marker.type === "imd") return C.amber;
  if (marker.type === "landslide") return "#F43F5E";
  if (marker.type === "report") return C.coral;
  if (marker.type === "reservoir") return C.blue;
  if (marker.type === "relief") return C.green;
  if (marker.type === "infrastructure") return riskColor(marker.level);
  return riskColor(marker.level);
}

function markerVisible(marker: MapMarker, layers: Record<MapLayer, boolean>) {
  if (marker.type === "ndrf") return layers.rescue ?? true;
  if (marker.type === "risk") return layers.risk;
  if (marker.type === "landslide") return layers.risk;
  if (marker.type === "imd") return layers.imd;
  if (marker.type === "report") return layers.reports;
  if (marker.type === "reservoir") return layers.water;
  if (marker.type === "relief") return layers.relief;
  if (marker.type === "infrastructure") return layers.infrastructure;
  return false;
}

export function MapCanvas({
  markers,
  layers,
  windDirectionDeg = 338,
  windSpeedKmh = 14,
  activeDistrictName = "DAKSHIN KANNADA",
  countdownFormatted = "10h 36m 29s remaining",
  focusCoords = null,
  userLocation = null,
  onMarker,
  onMapPress,
  pinMode,
}: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [center, setCenter] = useState(CHENNAI_CENTER);
  const [zoom, setZoom] = useState(6);
  const [drag] = useState(() => new Animated.ValueXY({ x: 0, y: 0 }));

  // ── Radar Sweep & Pulsing Beacon Animations ──
  const [radarAngle] = useState(() => new Animated.Value(0));
  const [pulseAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const radar = Animated.loop(
      Animated.timing(radarAngle, {
        toValue: 360,
        duration: 4500,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    );
    radar.start();
    pulse.start();
    return () => {
      radar.stop();
      pulse.stop();
    };
  }, [radarAngle, pulseAnim]);

  const yesterdayUtc = useMemo(() => {
    return new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  }, []);

  useEffect(() => {
    if (focusCoords && typeof focusCoords[0] === "number" && typeof focusCoords[1] === "number" && !isNaN(focusCoords[0]) && !isNaN(focusCoords[1])) {
      setCenter({ latitude: focusCoords[0], longitude: focusCoords[1] });
      setZoom((z) => Math.max(z, 11));
    }
  }, [focusCoords?.[0], focusCoords?.[1]]);

  useEffect(() => {
    if (userLocation && typeof userLocation.latitude === "number" && typeof userLocation.longitude === "number") {
      setCenter({ latitude: userLocation.latitude, longitude: userLocation.longitude });
      setZoom((z) => Math.max(z, 11));
    }
  }, [userLocation?.latitude, userLocation?.longitude]);

  const centerPx = useMemo(() => mercator(center, zoom), [center, zoom]);

  const userPx = useMemo(() => {
    if (!userLocation) return null;
    return mercator(userLocation, zoom);
  }, [userLocation, zoom]);

  const userScreenPos = useMemo(() => {
    if (!userPx) return null;
    return {
      x: userPx.x - centerPx.x + size.width / 2,
      y: userPx.y - centerPx.y + size.height / 2,
    };
  }, [userPx, centerPx, size]);

  const toPoint = (px: number, py: number) =>
    unmercator(centerPx.x + px - size.width / 2, centerPx.y + py - size.height / 2, zoom);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) + Math.abs(g.dy) > 4,
        onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) + Math.abs(g.dy) > 4,
        onPanResponderMove: (_, g) => drag.setValue({ x: g.dx, y: g.dy }),
        onPanResponderRelease: (_, g) => {
          const next = unmercator(centerPx.x - g.dx, centerPx.y - g.dy, zoom);
          setCenter(next);
          drag.setValue({ x: 0, y: 0 });
        },
        onPanResponderTerminate: () => drag.setValue({ x: 0, y: 0 }),
      }),
    [centerPx, zoom, drag],
  );

  // Meteo-GIS Seamless Satellite Mosaic & Reference Labels Generator
  const visibleTiles = useMemo(() => {
    if (size.width <= 0 || size.height <= 0) return [];
    const maxTileIndex = 2 ** zoom;
    const tiles: MeteoTile[] = [];
    const minTX = Math.floor((centerPx.x - size.width / 2) / TILE_SIZE) - 1;
    const maxTX = Math.floor((centerPx.x + size.width / 2) / TILE_SIZE) + 1;
    const minTY = Math.floor((centerPx.y - size.height / 2) / TILE_SIZE) - 1;
    const maxTY = Math.floor((centerPx.y + size.height / 2) / TILE_SIZE) + 1;

    for (let ty = minTY; ty <= maxTY; ty++) {
      if (ty < 0 || ty >= maxTileIndex) continue;
      for (let tx = minTX; tx <= maxTX; tx++) {
        const wrappedX = ((tx % maxTileIndex) + maxTileIndex) % maxTileIndex;
        const screenX = tx * TILE_SIZE - centerPx.x + size.width / 2;
        const screenY = ty * TILE_SIZE - centerPx.y + size.height / 2;

        // 1. High-Resolution Satellite Tile (Esri World Imagery / ISRO Bhuvan Mosaic)
        const satUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${ty}/${wrappedX}`;

        // 2. NASA VIIRS SNPP Live Clouds (Level 9 WMTS)
        const cloudsUrl =
          zoom <= 9
            ? `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/${yesterdayUtc}/GoogleMapsCompatible_Level9/${zoom}/${ty}/${wrappedX}.jpg`
            : null;

        tiles.push({
          key: `meteo-${zoom}-${tx}-${ty}`,
          x: screenX,
          y: screenY,
          satUrl,
          cloudsUrl,
        });
      }
    }
    return tiles;
  }, [centerPx, zoom, size, yesterdayUtc]);

  const markerPositions = useMemo(() => {
    return markers
      .filter((marker) => markerVisible(marker, layers))
      .map((marker) => {
        const point = mercator(marker, zoom);
        return {
          marker,
          x: point.x - centerPx.x + size.width / 2,
          y: point.y - centerPx.y + size.height / 2,
        };
      })
      .filter(({ x, y }) => x > -40 && x < size.width + 40 && y > -40 && y < size.height + 40);
  }, [markers, layers, centerPx, zoom, size]);

  const routePoints = useMemo(() => {
    return DEMO_EVACUATION_ROUTE.map((point) => {
      const px = mercator(point, zoom);
      return `${px.x - centerPx.x + size.width / 2},${px.y - centerPx.y + size.height / 2}`;
    }).join(" ");
  }, [centerPx, zoom, size]);

  // Wind vectors grid across viewport
  const windStreamlines = useMemo(() => {
    if (!layers.wind || size.width <= 0 || size.height <= 0) return [];
    const rad = ((windDirectionDeg + 180) * Math.PI) / 180;
    const len = Math.max(18, Math.min(38, windSpeedKmh * 1.6));
    const dx = Math.sin(rad) * len;
    const dy = -Math.cos(rad) * len;

    const list: { x: number; y: number; x2: number; y2: number }[] = [];
    const step = 80;
    for (let x = 40; x < size.width; x += step) {
      for (let y = 60; y < size.height - 40; y += step) {
        list.push({ x, y, x2: x + dx, y2: y + dy });
      }
    }
    return list;
  }, [layers.wind, windDirectionDeg, windSpeedKmh, size]);

  const zoomBy = (amount: number) => setZoom((current) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current + amount)));

  return (
    <View
      style={mapStyles.root}
      onLayout={(event) => setSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
    >
      <View style={mapStyles.tileViewport} {...panResponder.panHandlers}>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: drag.x }, { translateY: drag.y }] }]}>
          {/* Meteo-GIS Satellite + Live Clouds + Crisp Reference Labels */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {visibleTiles.map((tile) => (
              <View
                key={tile.key}
                style={{
                  position: "absolute",
                  left: tile.x,
                  top: tile.y,
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                }}
              >
                {/* 1. Base Satellite Mosaic (Esri World Imagery / ISRO Bhuvan Sat) */}
                <Image
                  source={{ uri: tile.satUrl }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />

                {/* 2. NASA VIIRS SNPP Live Clouds (if zoom <= 9) */}
                {tile.cloudsUrl ? (
                  <Image
                    source={{ uri: tile.cloudsUrl }}
                    style={[StyleSheet.absoluteFill, { opacity: 0.65 }]}
                    resizeMode="cover"
                  />
                ) : null}

              </View>
            ))}
          </View>

          {/* Interactive Tap Plane */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={(event) => {
              const { locationX, locationY } = event.nativeEvent;
              onMapPress(toPoint(locationX, locationY));
            }}
          />

          {/* SVG Meteorological & Overlay Vector Layers */}
          {size.width > 0 && size.height > 0 ? (
            <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill} pointerEvents="none">
              <Defs>
                <LinearGradient id="windGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#0284C7" stopOpacity="0.85" />
                  <Stop offset="100%" stopColor="#2563EB" stopOpacity="0.25" />
                </LinearGradient>
              </Defs>

              {/* Wind & Rain Vector Overlays Removed for Clean Satellite Clarity */}

              {/* Flood & Landslide Risk Buffers */}
              {layers.risk ? (
                <>
                  {markerPositions
                    .filter(({ marker }) => marker.type === "risk" || marker.type === "landslide")
                    .map(({ marker, x, y }) => (
                      <G key={`risk-halo-${marker.id}`}>
                        <Circle cx={x} cy={y} r={32} fill={getMarkerColor(marker)} opacity={0.22} />
                      </G>
                    ))}
                </>
              ) : null}

              {/* IMD Warning Zones */}
              {layers.imd ? (
                <>
                  {markerPositions
                    .filter(({ marker }) => marker.type === "imd")
                    .map(({ marker, x, y }) => (
                      <G key={`imd-halo-${marker.id}`}>
                        <Circle cx={x} cy={y} r={38} fill="rgba(245, 158, 11, 0.16)" />
                      </G>
                    ))}
                </>
              ) : null}

              {/* NDRF & SDRF Rescue Coverage Halos */}
              {layers.rescue ? (
                <>
                  {markerPositions
                    .filter(({ marker }) => marker.type === "ndrf")
                    .map(({ marker, x, y }) => (
                      <G key={`ndrf-halo-${marker.id}`}>
                        <Circle cx={x} cy={y} r={38} fill="rgba(48, 209, 88, 0.16)" />
                      </G>
                    ))}
                </>
              ) : null}

              {/* User Location Subtle GPS Accuracy Halo */}
              {userScreenPos ? (
                <G key="user-accuracy-halo">
                  <Circle
                    cx={userScreenPos.x}
                    cy={userScreenPos.y}
                    r={Math.min(40, Math.max(16, (userLocation?.accuracy ?? 25) * 0.7))}
                    fill="rgba(56, 189, 248, 0.14)"
                  />
                </G>
              ) : null}
            </Svg>
          ) : null}

          {/* Interactive Map Markers */}
          {markerPositions.map(({ marker, x, y }) => {
            const color = getMarkerColor(marker);
            const icon =
              marker.type === "ndrf"
                ? "shield-checkmark"
                : marker.type === "imd"
                ? "warning"
                : marker.type === "landslide"
                ? "trending-down"
                : marker.type === "reservoir"
                ? "water"
                : marker.type === "relief"
                ? "home"
                : marker.type === "report"
                ? "alert"
                : marker.type === "infrastructure"
                ? "construct"
                : "warning";

            return (
              <Pressable
                key={marker.id}
                accessibilityRole="button"
                accessibilityLabel={`${marker.title}. ${marker.subtitle}`}
                onPress={() => onMarker(marker)}
                style={({ pressed }) => [
                  mapStyles.marker,
                  { left: x - 17, top: y - 30, borderColor: "#FFFFFF", backgroundColor: color },
                  marker.type === "ndrf" && mapStyles.ndrfMarker,
                  pressed && mapStyles.markerPressed,
                ]}
              >
                <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={15} color="#FFFFFF" />
                <View style={[mapStyles.markerStem, { backgroundColor: color }]} />
              </Pressable>
            );
          })}



          {/* Apple-Style Glowing Blue GPS Location Puck with Animated Ripple */}
          {userScreenPos ? (
            <View
              pointerEvents="none"
              style={[
                mapStyles.userPuckContainer,
                { left: userScreenPos.x - 16, top: userScreenPos.y - 16 },
              ]}
            >
              {/* Expanding Ripple Ring */}
              <Animated.View
                style={[
                  mapStyles.userPuckRipple,
                  {
                    transform: [
                      {
                        scale: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 2.5],
                        }),
                      },
                    ],
                    opacity: pulseAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.8, 0.35, 0],
                    }),
                  },
                ]}
              />
              <View style={mapStyles.userPuckHalo} />
              <View style={mapStyles.userPuckDot} />
            </View>
          ) : null}

          {pinMode ? (
            <View pointerEvents="none" style={[mapStyles.pinPrompt, { left: Math.max(16, size.width / 2 - 120), top: 16 }]}>
              <Ionicons name="location" size={16} color="#0A84FF" />
              <Text style={mapStyles.pinPromptText}>Tap the map to place your pin</Text>
            </View>
          ) : null}
        </Animated.View>
      </View>

      {/* Floating Apple-Style Zoom Controls */}
      <View style={mapStyles.zoom}>
        <Pressable accessibilityRole="button" accessibilityLabel="Zoom in" style={mapStyles.zoomButton} onPress={() => zoomBy(1)}>
          <Ionicons name="add" size={19} color="#1E293B" />
        </Pressable>
        <View style={mapStyles.zoomDivider} />
        <Pressable accessibilityRole="button" accessibilityLabel="Zoom out" style={mapStyles.zoomButton} onPress={() => zoomBy(-1)}>
          <Ionicons name="remove" size={19} color="#1E293B" />
        </Pressable>
      </View>



      {/* Top Right Satellite & Radar Quick Toggles */}
      <View style={mapStyles.topRightPills}>
        <View style={mapStyles.hudPill}>
          <Ionicons name="planet" size={12} color="#38BDF8" />
          <Text style={mapStyles.hudPillText}>INSAT-3DR</Text>
        </View>

        <View style={mapStyles.hudPill}>
          <Ionicons name="radio" size={12} color="#A78BFA" />
          <Text style={mapStyles.hudPillText}>DWR Radar</Text>
        </View>
      </View>

      {/* NASA VIIRS Clouds Indicator */}
      <View style={mapStyles.nasaCloudsPill}>
        <Ionicons name="cloudy" size={13} color="#FFFFFF" />
        <View style={{ alignItems: "center" }}>
          <Text style={mapStyles.nasaCloudsTitle}>NASA Clouds</Text>
          <Text style={mapStyles.nasaCloudsSub}>VIIRS SNPP Live TrueColor</Text>
        </View>
      </View>

      {/* Bottom Left Real-Time Wind & Compass HUD */}
      <View style={mapStyles.bottomLeftControls}>
        <View style={mapStyles.compassRose}>
          <Ionicons
            name="navigate"
            size={12}
            color="#38BDF8"
            style={{ transform: [{ rotate: `${windDirectionDeg}deg` }] }}
          />
        </View>
        <View style={mapStyles.rainfallPill}>
          <Text style={mapStyles.rainfallPillText}>
            Wind {degToCardinal(windDirectionDeg)} ({Math.round(windDirectionDeg)}°) · {Math.round(windSpeedKmh)} km/h
          </Text>
        </View>
      </View>

      {/* Subtle Apple-style GIS Attribution & Status */}
      <View style={mapStyles.attribution} pointerEvents="none">
        <Text style={mapStyles.attributionText}>NASA GIBS · Esri World Imagery · IMD Meteo-GIS</Text>
      </View>

      <View style={mapStyles.centerDot} pointerEvents="none">
        <View style={mapStyles.centerDotInner} />
      </View>

      <View style={mapStyles.locationChip} pointerEvents="none">
        <Text style={mapStyles.locationText}>
          {center.latitude.toFixed(4)}° N   {center.longitude.toFixed(4)}° E
        </Text>
      </View>
    </View>
  );
}

const mapStyles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 260,
    overflow: "hidden",
    backgroundColor: "#070B12",
  },
  tileViewport: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
  },
  marker: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    zIndex: 10,
  },
  ndrfMarker: {
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    shadowColor: "#16A34A",
    shadowOpacity: 0.5,
  },
  markerPressed: {
    transform: [{ scale: 1.1 }],
  },
  markerStem: {
    position: "absolute",
    bottom: -5,
    width: 8,
    height: 8,
    transform: [{ rotate: "45deg" }],
    zIndex: -1,
  },
  pinPrompt: {
    position: "absolute",
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1,
    borderColor: "#0A84FF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  pinPromptText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: Platform.select({ ios: "System", default: "sans-serif" }),
  },
  radarSweepContainer: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 12,
  },
  radarSweepBeam: {
    position: "absolute",
    top: 0,
    left: 159,
    width: 2,
    height: 160,
    backgroundColor: "rgba(56, 189, 248, 0.75)",
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  userPuckContainer: {
    position: "absolute",
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 25,
  },
  userPuckRipple: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#38BDF8",
    backgroundColor: "rgba(56, 189, 248, 0.16)",
  },
  userPuckHalo: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(56, 189, 248, 0.32)",
  },
  userPuckDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#007AFF",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 4,
    elevation: 6,
  },
  zoom: {
    position: "absolute",
    right: 14,
    top: 175,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderColor: "rgba(0, 0, 0, 0.12)",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  zoomButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomDivider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    marginHorizontal: 6,
  },
  styleToggleWrap: {
    position: "absolute",
    left: 14,
    bottom: 28,
    zIndex: 20,
  },
  styleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  styleText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0F172A",
    fontFamily: Platform.select({ ios: "System", default: "sans-serif" }),
  },
  styleDropdown: {
    position: "absolute",
    bottom: 38,
    left: 0,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    minWidth: 135,
    gap: 2,
    elevation: 8,
  },
  styleOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  styleOptionActive: {
    backgroundColor: "rgba(10, 132, 255, 0.1)",
  },
  styleOptionText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#334155",
  },
  styleOptionTextActive: {
    color: "#0A84FF",
    fontWeight: "700",
  },
  attribution: {
    position: "absolute",
    bottom: 8,
    left: 10,
    borderRadius: 6,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  attributionText: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.2,
    fontFamily: SF_PRO,
  },
  centerDot: {
    position: "absolute",
    left: "50%",
    top: "50%",
    marginLeft: -10,
    marginTop: -10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  centerDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0A84FF",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  locationChip: {
    position: "absolute",
    right: 10,
    bottom: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  locationText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 9,
    fontFamily: SF_PRO,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  topRightPills: {
    position: "absolute",
    right: 14,
    top: 72,
    flexDirection: "row",
    gap: 6,
  },
  hudPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: "rgba(10, 14, 23, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  hudPillText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "600",
    fontFamily: SF_PRO,
    letterSpacing: 0.2,
  },
  nasaCloudsPill: {
    position: "absolute",
    bottom: 36,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: "rgba(10, 14, 23, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  nasaCloudsTitle: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "700",
    fontFamily: SF_PRO,
  },
  nasaCloudsSub: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 8,
    fontFamily: SF_PRO,
  },
  bottomLeftControls: {
    position: "absolute",
    left: 14,
    bottom: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  compassRose: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(10, 14, 23, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  compassN: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    fontFamily: SF_PRO,
  },
  rainfallPill: {
    backgroundColor: "rgba(10, 14, 23, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rainfallPillText: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 8.5,
    fontWeight: "600",
    fontFamily: SF_PRO,
  },
});
