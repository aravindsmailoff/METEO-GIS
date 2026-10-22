import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image as RnImage,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";

const TileImg = Platform.OS === "web" ? RnImage : (ExpoImage as any);
import Svg, { Circle, Defs, G, Line as SvgLine, LinearGradient, Path, Polygon, Polyline, Rect, Stop } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import type { GeoPoint, MapLayer, MapMarker } from "@/lib/flood/types";
import { SF_PRO } from "./ui";
import { MONITORED_RADAR_NETWORK } from "@/lib/meteo/imdDirectService";

const TILE_SIZE = 256;
const MIN_ZOOM = 4;
const MAX_ZOOM = 18;

// ─── Yesterday UTC Date for NASA GIBS VIIRS TrueColor ─────────────────────────
const YESTERDAY_UTC = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

// ─── Basemap Definitions (Meteo-GIS Unified Suite) ───────────────────────────

export type BasemapId =
  | "nasa_clouds"
  | "nasa_precip"
  | "nasa_night"
  | "nasa_modis"
  | "dark";

export interface Basemap {
  id: BasemapId;
  label: string;
  subtitle: string;
  category: "NASA Earth Observation" | "Tactical";
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  getTileUrl: (z: number, x: number, y: number) => string;
  getOverlayUrl?: (z: number, x: number, y: number) => string | null;
  overlayOpacity?: number;
}

export const BASEMAPS: Basemap[] = [
  {
    id: "nasa_clouds",
    label: "NASA Weather & Clouds",
    subtitle: "NASA Blue Marble & High-Resolution Satellite",
    category: "NASA Earth Observation",
    icon: "cloudy",
    color: "#38BDF8",
    getTileUrl: (z, x, y) =>
      z <= 8
        ? `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/${z}/${y}/${x}.jpeg`
        : `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
    getOverlayUrl: () => null,
    overlayOpacity: 0,
  },
  {
    id: "nasa_precip",
    label: "NASA Rain Radar",
    subtitle: "NASA GPM IMERG 30-min Global Precipitation",
    category: "NASA Earth Observation",
    icon: "rainy",
    color: "#3B82F6",
    getTileUrl: (z, x, y) =>
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
    getOverlayUrl: (z, x, y) =>
      z <= 6
        ? `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/IMERG_Precipitation_Rate/default/default/GoogleMapsCompatible_Level6/${z}/${y}/${x}.png`
        : null,
    overlayOpacity: 0.92,
  },
  {
    id: "nasa_night",
    label: "NASA Black Marble",
    subtitle: "NASA VIIRS Day/Night Band Nighttime Lights",
    category: "NASA Earth Observation",
    icon: "moon",
    color: "#EAB308",
    getTileUrl: (z, x, y) =>
      z <= 8
        ? `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/GoogleMapsCompatible_Level8/${z}/${y}/${x}.png`
        : `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
  },
  {
    id: "nasa_modis",
    label: "NASA Surface Weather",
    subtitle: "NASA Terra MODIS Surface Reflectance & Land Cover",
    category: "NASA Earth Observation",
    icon: "earth",
    color: "#10B981",
    getTileUrl: (z, x, y) =>
      z <= 8
        ? `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${YESTERDAY_UTC}/GoogleMapsCompatible_Level8/${z}/${y}/${x}.jpg`
        : `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
  },
  {
    id: "dark",
    label: "CartoDB Dark Radar",
    subtitle: "High-Contrast Tactical Weather GIS",
    category: "Tactical",
    icon: "radio",
    color: "#64748B",
    getTileUrl: (z, x, y) => {
      const sub = ["a", "b", "c", "d"][(x + y) % 4];
      return `https://${sub}.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`;
    },
  },
];

// ─── Key National Inundation Plains & Major Rivers (From Meteo-GIS Engine) ───

export const FLOOD_PLAINS = [
  {
    name: "Brahmaputra Valley Flood Corridor",
    state: "Assam",
    risk: "CRITICAL",
    coords: [
      { lat: 26.15, lng: 90.50 }, { lat: 26.40, lng: 91.20 }, { lat: 26.65, lng: 92.40 },
      { lat: 27.10, lng: 93.80 }, { lat: 27.50, lng: 95.20 }, { lat: 27.60, lng: 95.60 },
      { lat: 27.35, lng: 95.70 }, { lat: 26.85, lng: 94.60 }, { lat: 26.35, lng: 93.20 },
      { lat: 26.05, lng: 91.80 }, { lat: 25.90, lng: 90.80 }, { lat: 26.00, lng: 90.20 },
    ],
  },
  {
    name: "Ganga & Kosi Alluvial Plains",
    state: "Bihar / West Bengal",
    risk: "CRITICAL",
    coords: [
      { lat: 25.40, lng: 84.80 }, { lat: 25.75, lng: 85.60 }, { lat: 26.20, lng: 86.80 },
      { lat: 26.45, lng: 87.40 }, { lat: 26.10, lng: 87.80 }, { lat: 25.40, lng: 87.90 },
      { lat: 25.15, lng: 86.80 }, { lat: 25.10, lng: 85.50 },
    ],
  },
  {
    name: "Mahanadi Deltaic Inundation Corridor",
    state: "Odisha",
    risk: "HIGH",
    coords: [
      { lat: 20.30, lng: 85.60 }, { lat: 20.65, lng: 86.10 }, { lat: 20.80, lng: 86.70 },
      { lat: 20.40, lng: 87.00 }, { lat: 19.85, lng: 86.40 }, { lat: 19.80, lng: 85.80 },
    ],
  },
  {
    name: "Kuttanad Below-Sea-Level Basin",
    state: "Kerala",
    risk: "CRITICAL",
    coords: [
      { lat: 9.25, lng: 76.35 }, { lat: 9.55, lng: 76.38 }, { lat: 9.72, lng: 76.55 },
      { lat: 9.50, lng: 76.75 }, { lat: 9.30, lng: 76.65 },
    ],
  },
  {
    name: "Yamuna-Delhi Lowland Floodplain",
    state: "NCT Delhi / Haryana",
    risk: "HIGH",
    coords: [
      { lat: 28.50, lng: 77.25 }, { lat: 28.75, lng: 77.22 }, { lat: 28.80, lng: 77.30 },
      { lat: 28.55, lng: 77.35 },
    ],
  },
];

export const MAJOR_RIVERS = [
  { name: "Ganga River", coords: [{ lat: 30.9, lng: 78.9 }, { lat: 30.1, lng: 78.3 }, { lat: 27.9, lng: 79.9 }, { lat: 26.8, lng: 81.0 }, { lat: 25.6, lng: 85.1 }, { lat: 25.3, lng: 87.0 }, { lat: 24.8, lng: 88.0 }, { lat: 23.0, lng: 88.5 }] },
  { name: "Brahmaputra River", coords: [{ lat: 28.5, lng: 95.5 }, { lat: 27.5, lng: 95.0 }, { lat: 26.9, lng: 93.5 }, { lat: 26.2, lng: 91.8 }, { lat: 26.1, lng: 90.5 }, { lat: 25.2, lng: 89.8 }] },
  { name: "Yamuna River", coords: [{ lat: 31.0, lng: 78.5 }, { lat: 30.3, lng: 77.6 }, { lat: 28.7, lng: 77.2 }, { lat: 27.2, lng: 78.0 }, { lat: 25.4, lng: 81.8 }] },
  { name: "Godavari River", coords: [{ lat: 19.9, lng: 73.5 }, { lat: 19.2, lng: 75.8 }, { lat: 18.9, lng: 77.5 }, { lat: 18.7, lng: 79.5 }, { lat: 17.0, lng: 81.8 }, { lat: 16.4, lng: 82.0 }] },
  { name: "Krishna River", coords: [{ lat: 17.9, lng: 73.7 }, { lat: 16.5, lng: 75.8 }, { lat: 16.2, lng: 77.5 }, { lat: 16.5, lng: 79.8 }, { lat: 16.1, lng: 80.8 }] },
  { name: "Mahanadi River", coords: [{ lat: 21.1, lng: 81.3 }, { lat: 21.5, lng: 83.9 }, { lat: 20.5, lng: 85.8 }, { lat: 20.3, lng: 86.7 }] },
  { name: "Cauvery River", coords: [{ lat: 12.4, lng: 75.7 }, { lat: 12.0, lng: 77.0 }, { lat: 11.3, lng: 78.0 }, { lat: 10.8, lng: 79.8 }] },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface MeteoTile {
  key: string;
  x: number;
  y: number;
  url: string;
  overlayUrl?: string | null;
  overlayOpacity?: number;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractCoords(m: any): { lat: number; lng: number } | null {
  if (!m) return null;
  const lat = Number(m.latitude ?? m.lat ?? m.Latitude ?? 0);
  const lng = Number(m.longitude ?? m.lng ?? m.lon ?? m.Longitude ?? 0);
  if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null;
  // Validate realistic India bounding box (very loose)
  if (lat < 6 || lat > 38 || lng < 68 || lng > 98) return null;
  return { lat, lng };
}

function mercator(lat: number, lng: number, zoom: number) {
  const clampedLat = Math.max(-85, Math.min(85, lat));
  const size = TILE_SIZE * 2 ** zoom;
  const sin = Math.sin((clampedLat * Math.PI) / 180);
  return {
    x: (((lng + 180) % 360) / 360) * size,
    y: (0.5 - Math.log((1 + sin) / Math.max(1e-10, 1 - sin)) / (4 * Math.PI)) * size,
  };
}

function unmercator(x: number, y: number, zoom: number): GeoPoint {
  const size = TILE_SIZE * 2 ** zoom;
  const longitude = (((x / size) * 360 - 180 + 540) % 360) - 180;
  const n = Math.PI - (2 * Math.PI * Math.max(0, Math.min(size, y))) / size;
  const latitude = Math.max(-85, Math.min(85, (180 / Math.PI) * Math.atan(Math.sinh(n))));
  return { latitude, longitude };
}

function degToCardinal(deg: number): string {
  const cardinals = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const val = Math.floor(deg / 22.5 + 0.5);
  return cardinals[val % 16];
}

function getMarkerColor(marker: MapMarker): string {
  if (marker.type === "reservoir") return "#0EA5E9";
  if (marker.type === "relief") return "#22C55E";
  if (marker.type === "ndrf") return "#16A34A";

  const sev = String(marker.extra?.severity || marker.level || "").toUpperCase();
  if (sev.includes("RED") || sev.includes("EXTREME") || sev.includes("CRITICAL") || marker.level === "danger" || marker.level === "critical") return "#EF4444";
  if (sev.includes("ORANGE") || sev.includes("SEVERE") || marker.level === "warning") return "#F97316";
  if (sev.includes("YELLOW") || sev.includes("MODERATE") || marker.level === "watch") return "#EAB308";
  if (marker.level === "safe") return "#22C55E";
  return "#EAB308";
}

function getMarkerIcon(marker: MapMarker): keyof typeof Ionicons.glyphMap {
  if (marker.type === "reservoir") return "water";
  if (marker.type === "relief") return "home";
  if (marker.type === "ndrf") return "shield-checkmark";
  if (marker.type === "landslide") return "trending-down";
  if (marker.type === "infrastructure") return "construct";
  if (marker.type === "report") return "alert";
  return "warning";
}

// ─── MapCanvas Component ──────────────────────────────────────────────────────

export function MapCanvas({
  markers,
  layers,
  language = "en",
  windDirectionDeg = 80,
  windSpeedKmh = 7,
  activeDistrictName = "INDIA",
  countdownFormatted = "1h 45m",
  focusCoords,
  userLocation,
  onMarker,
  onMapPress,
  pinMode,
}: Props) {
  const windowDims = Dimensions.get("window");
  const [size, setSize] = useState({ width: windowDims.width, height: windowDims.height });

  const [center, setCenter] = useState<GeoPoint>({
    latitude: focusCoords && focusCoords[0] ? focusCoords[0] : 13.0827,
    longitude: focusCoords && focusCoords[1] ? focusCoords[1] : 80.2707,
  });

  const [zoom, setZoom] = useState(7);
  const drag = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Basemap state — defaults to NASA Weather & Clouds Earth Observation Suite
  const [activeBasemap, setActiveBasemap] = useState<BasemapId>("nasa_clouds");
  const [basemapPickerOpen, setBasemapPickerOpen] = useState(false);

  // Filter tab
  const [activeFilter, setActiveFilter] = useState<"all" | "hazards" | "dams" | "shelters">("all");

  // ── Pulsing animation ──
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 2200, easing: Easing.out(Easing.ease), useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 0, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // ── Focus coordinate jump ──
  useEffect(() => {
    if (focusCoords && focusCoords[0] && focusCoords[1]) {
      setCenter({ latitude: focusCoords[0], longitude: focusCoords[1] });
      setZoom((z) => Math.max(z, 7));
    }
  }, [focusCoords]);

  const centerPx = useMemo(() => mercator(center.latitude, center.longitude, zoom), [center, zoom]);

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
    [centerPx, zoom, drag, size]
  );

  // ── Tile generation from active basemap (supports multi-layer NASA/ISRO overlays) ──
  const currentBasemap = useMemo(() => BASEMAPS.find((b) => b.id === activeBasemap) ?? BASEMAPS[0], [activeBasemap]);

  const visibleTiles = useMemo<MeteoTile[]>(() => {
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
        const url = currentBasemap.getTileUrl(zoom, wrappedX, ty);
        const overlayUrl = currentBasemap.getOverlayUrl ? currentBasemap.getOverlayUrl(zoom, wrappedX, ty) : null;
        tiles.push({
          key: `tile-${activeBasemap}-${zoom}-${tx}-${ty}`,
          x: screenX,
          y: screenY,
          url,
          overlayUrl,
          overlayOpacity: currentBasemap.overlayOpacity,
        });
      }
    }
    return tiles;
  }, [centerPx, zoom, size, activeBasemap, currentBasemap]);

  // ── Project Flood Inundation Corridors ──
  const projectedFloodPlains = useMemo(() => {
    return FLOOD_PLAINS.map((fp) => {
      const pts = fp.coords
        .map((c) => {
          const pt = mercator(c.lat, c.lng, zoom);
          return `${Math.round(pt.x - centerPx.x + size.width / 2)},${Math.round(pt.y - centerPx.y + size.height / 2)}`;
        })
        .join(" ");
      return { name: fp.name, risk: fp.risk, points: pts };
    });
  }, [centerPx, zoom, size]);

  // ── Project Major River Channels ──
  const projectedRivers = useMemo(() => {
    return MAJOR_RIVERS.map((r) => {
      const pts = r.coords
        .map((c) => {
          const pt = mercator(c.lat, c.lng, zoom);
          return `${Math.round(pt.x - centerPx.x + size.width / 2)},${Math.round(pt.y - centerPx.y + size.height / 2)}`;
        })
        .join(" ");
      return { name: r.name, points: pts };
    });
  }, [centerPx, zoom, size]);

  // ── Project markers onto screen ──
  const projectedMarkers = useMemo(() => {
    return markers
      .filter((marker) => {
        if (activeFilter === "hazards") return marker.type === "risk" || marker.type === "imd" || marker.type === "landslide" || marker.type === "report";
        if (activeFilter === "dams") return marker.type === "reservoir";
        if (activeFilter === "shelters") return marker.type === "relief" || marker.type === "ndrf";
        return true;
      })
      .map((marker) => {
        const coords = extractCoords(marker);
        if (!coords) return null;
        const point = mercator(coords.lat, coords.lng, zoom);
        const x = point.x - centerPx.x + size.width / 2;
        const y = point.y - centerPx.y + size.height / 2;
        return { marker, x, y };
      })
      .filter((item): item is { marker: MapMarker; x: number; y: number } => {
        if (!item) return false;
        return item.x > -80 && item.x < size.width + 80 && item.y > -80 && item.y < size.height + 80;
      });
  }, [markers, activeFilter, centerPx, zoom, size]);

  // ── Project Doppler radar network ──
  const projectedRadarStations = useMemo(() => {
    return MONITORED_RADAR_NETWORK.map((station) => {
      const pt = mercator(station.lat, station.lng, zoom);
      return { station, x: pt.x - centerPx.x + size.width / 2, y: pt.y - centerPx.y + size.height / 2 };
    }).filter((s) => s.x > -300 && s.x < size.width + 300 && s.y > -300 && s.y < size.height + 300);
  }, [centerPx, zoom, size]);

  // ── Project user GPS position ──
  const userScreenPos = useMemo(() => {
    if (!userLocation) return null;
    const pt = mercator(userLocation.latitude, userLocation.longitude, zoom);
    return { x: pt.x - centerPx.x + size.width / 2, y: pt.y - centerPx.y + size.height / 2 };
  }, [userLocation, centerPx, zoom, size]);

  const zoomBy = (amount: number) => setZoom((curr) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, curr + amount)));

  const activeBasemapDef = BASEMAPS.find((b) => b.id === activeBasemap) ?? BASEMAPS[0];

  return (
    <View
      style={mapStyles.root}
      onLayout={(event) => setSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
    >
      <View style={mapStyles.tileViewport} {...panResponder.panHandlers}>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: drag.x }, { translateY: drag.y }] }]}>
          {/* ── Base Map Tiles + Stacked Overlays ── */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {visibleTiles.map((tile) => (
              <View key={tile.key} style={{ position: "absolute", left: tile.x, top: tile.y, width: TILE_SIZE, height: TILE_SIZE }}>
                <TileImg
                  source={{ uri: tile.url }}
                  style={{ width: TILE_SIZE, height: TILE_SIZE }}
                  resizeMode="cover"
                />
                {tile.overlayUrl ? (
                  <TileImg
                    source={{ uri: tile.overlayUrl }}
                    style={{ position: "absolute", left: 0, top: 0, width: TILE_SIZE, height: TILE_SIZE, opacity: tile.overlayOpacity ?? 0.88 }}
                    resizeMode="cover"
                  />
                ) : null}
              </View>
            ))}
          </View>

          {/* ── Tap Plane ── */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={(event) => {
              const { locationX, locationY } = event.nativeEvent;
              onMapPress(toPoint(locationX, locationY));
            }}
          />

          {/* ── SVG Vector Layers: Flood Plains, Rivers, Halos & Radar Rings ── */}
          {size.width > 0 && size.height > 0 ? (
            <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill} pointerEvents="none">
              <Defs>
                <LinearGradient id="radarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#00e5ff" stopOpacity="0.25" />
                  <Stop offset="100%" stopColor="#0284c7" stopOpacity="0.05" />
                </LinearGradient>
              </Defs>

              {/* Doppler Radar Coverage Rings */}
              {projectedRadarStations.map(({ station, x, y }) => {
                const pxPerKm = (TILE_SIZE * 2 ** zoom) / (40075 * Math.cos((station.lat * Math.PI) / 180));
                const survR = Math.max(20, station.surveillanceRadiusKm * pxPerKm);
                const qpeR = Math.max(10, station.qpeRadiusKm * pxPerKm);
                return (
                  <G key={`radar-rings-${station.code}`}>
                    <Circle cx={x} cy={y} r={survR} stroke="#00e5ff" strokeWidth="1.2" strokeDasharray="5, 6" fill="rgba(0, 229, 255, 0.03)" />
                    <Circle cx={x} cy={y} r={qpeR} stroke="#00e5ff" strokeWidth="1" strokeDasharray="3, 4" fill="none" />
                  </G>
                );
              })}

              {/* Convective Threat Halos Under Warnings */}
              {projectedMarkers
                .filter(({ marker }) => marker.type === "risk" || marker.type === "imd" || marker.level === "critical" || marker.level === "danger" || marker.level === "warning")
                .map(({ marker, x, y }) => {
                  const color = getMarkerColor(marker);
                  const isSevere = marker.level === "critical" || marker.level === "danger";
                  const radius = isSevere ? 48 : 36;
                  return (
                    <G key={`hazard-halo-${marker.id}`}>
                      <Circle cx={x} cy={y} r={radius} fill={color} opacity={0.22} />
                      <Circle cx={x} cy={y} r={radius + 12} stroke={color} strokeWidth="1.2" strokeDasharray="4, 5" fill="none" opacity={0.5} />
                    </G>
                  );
                })}

              {/* User GPS Accuracy Halo */}
              {userScreenPos ? (
                <G key="user-accuracy-halo">
                  <Circle cx={userScreenPos.x} cy={userScreenPos.y} r={Math.min(42, Math.max(16, (userLocation?.accuracy ?? 25) * 0.7))} fill="rgba(56, 189, 248, 0.16)" />
                </G>
              ) : null}
            </Svg>
          ) : null}

          {/* ── PLOTTED MARKERS: PIN DROPS AT EXACT GEOLOCATIONS ── */}
          {size.width > 0 && size.height > 0 && projectedMarkers.map(({ marker, x, y }) => {
            const color = getMarkerColor(marker);
            const icon = getMarkerIcon(marker);
            const posX = Math.round(x - 17);
            const posY = Math.round(y - 30);
            return (
              <View
                key={marker.id}
                pointerEvents="box-none"
                style={[
                  mapStyles.pinDropWrapper,
                  {
                    left: posX,
                    top: posY,
                  },
                ]}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${marker.title}. ${marker.subtitle}`}
                  onPress={() => onMarker(marker)}
                  style={({ pressed }) => [
                    mapStyles.pinDropPressable,
                    pressed && { transform: [{ scale: 1.15 }] },
                  ]}
                >
                  <View style={[mapStyles.pinDropCircle, { backgroundColor: color }]}>
                    <Ionicons name={icon} size={15} color="#FFFFFF" />
                  </View>
                  <View style={[mapStyles.pinDropStem, { backgroundColor: color }]} />
                </Pressable>
              </View>
            );
          })}

          {/* ── Glowing Blue GPS Location Puck ── */}
          {userScreenPos ? (
            <View pointerEvents="none" style={[mapStyles.userPuckContainer, { left: userScreenPos.x - 16, top: userScreenPos.y - 16 }]}>
              <Animated.View
                style={[
                  mapStyles.userPuckRipple,
                  {
                    transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 2.5] }) }],
                    opacity: pulseAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.8, 0.35, 0] }),
                  },
                ]}
              />
              <View style={mapStyles.userPuckHalo} />
              <View style={mapStyles.userPuckDot} />
            </View>
          ) : null}

          {/* Pin drop prompt */}
          {pinMode ? (
            <View pointerEvents="none" style={[mapStyles.pinPrompt, { left: Math.max(16, size.width / 2 - 120), top: 16 }]}>
              <Ionicons name="location" size={16} color="#0A84FF" />
              <Text style={mapStyles.pinPromptText}>Tap anywhere to place report pin</Text>
            </View>
          ) : null}
        </Animated.View>
      </View>

      {/* ── TOP MAP CONTROLS ROW (Never overlaps on phones!) ── */}
      <View style={mapStyles.topControlsRow} pointerEvents="box-none">
        <View style={mapStyles.filterBar}>
          {(["all", "hazards", "dams", "shelters"] as const).map((cat) => {
            const isActive = activeFilter === cat;
            return (
              <Pressable
                key={cat}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${cat}`}
                onPress={() => setActiveFilter(cat)}
                style={[mapStyles.filterTab, isActive && mapStyles.filterTabActive]}
              >
                <Text style={[mapStyles.filterTabText, isActive && mapStyles.filterTabTextActive]}>
                  {cat.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Switch basemap"
          onPress={() => setBasemapPickerOpen(true)}
          style={({ pressed }) => [mapStyles.basemapBtn, pressed && { opacity: 0.8 }]}
        >
          <Ionicons name={activeBasemapDef.icon} size={13} color={activeBasemapDef.color} />
          <Text numberOfLines={1} style={[mapStyles.basemapBtnText, { color: activeBasemapDef.color }]}>
            {activeBasemapDef.label.replace("NASA ", "")}
          </Text>
          <Ionicons name="chevron-down" size={10} color="rgba(255,255,255,0.6)" />
        </Pressable>
      </View>

      {/* ── SATELLITE / RADAR STATUS PILLS ── */}
      <View style={mapStyles.topRightPills}>
        <View style={mapStyles.glassPill}>
          <View style={[mapStyles.liveBeacon, { backgroundColor: "#22C55E" }]} />
          <Text style={mapStyles.glassPillText}>NASA Weather Radar Feed</Text>
        </View>
        <View style={mapStyles.glassPill}>
          <View style={[mapStyles.liveBeacon, { backgroundColor: "#38BDF8" }]} />
          <Text style={mapStyles.glassPillText}>Doppler Radar</Text>
        </View>
      </View>

      {/* ── ZOOM CONTROLS ── */}
      <View style={mapStyles.zoomControls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Zoom in"
          onPress={() => zoomBy(1)}
          style={({ pressed }) => [mapStyles.zoomBtn, pressed && mapStyles.zoomBtnPressed]}
        >
          <Ionicons name="add" size={20} color="#1E293B" />
        </Pressable>
        <View style={mapStyles.zoomDivider} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Zoom out"
          onPress={() => zoomBy(-1)}
          style={({ pressed }) => [mapStyles.zoomBtn, pressed && mapStyles.zoomBtnPressed]}
        >
          <Ionicons name="remove" size={20} color="#1E293B" />
        </Pressable>
      </View>

      {/* ── WIND HUD (bottom left) ── */}
      <View style={mapStyles.bottomLeftControls}>
        <View style={mapStyles.compassRose}>
          <Ionicons name="navigate" size={12} color="#38BDF8" style={{ transform: [{ rotate: `${windDirectionDeg}deg` }] }} />
        </View>
        <View style={mapStyles.rainfallPill}>
          <Text style={mapStyles.rainfallPillText}>
            {degToCardinal(windDirectionDeg)} · {Math.round(windSpeedKmh)} km/h
          </Text>
        </View>
      </View>

      {/* ── CENTER COORDS CHIP ── */}
      <View style={mapStyles.locationChip} pointerEvents="none">
        <Text style={mapStyles.locationText}>
          {center.latitude.toFixed(4)}°N  {center.longitude.toFixed(4)}°E
        </Text>
      </View>

      {/* ── METEO-GIS BASEMAP PICKER MODAL ── */}
      <Modal visible={basemapPickerOpen} transparent animationType="fade" onRequestClose={() => setBasemapPickerOpen(false)}>
        <Pressable style={mapStyles.pickerScrim} onPress={() => setBasemapPickerOpen(false)}>
          <View style={mapStyles.pickerCard}>
            <Text style={mapStyles.pickerTitle}>METEO-GIS BASEMAPS & SATELLITE</Text>
            <Text style={mapStyles.pickerSubtitle}>NASA Earth Observation & Weather Radar Suites</Text>

            {BASEMAPS.map((bm) => {
              const isSelected = bm.id === activeBasemap;
              return (
                <Pressable
                  key={bm.id}
                  onPress={() => {
                    setActiveBasemap(bm.id);
                    setBasemapPickerOpen(false);
                  }}
                  style={({ pressed }) => [
                    mapStyles.pickerItem,
                    isSelected && { borderColor: bm.color, backgroundColor: `${bm.color}18` },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <View style={[mapStyles.pickerIconCircle, { backgroundColor: `${bm.color}22` }]}>
                    <Ionicons name={bm.icon} size={18} color={bm.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={[mapStyles.pickerItemLabel, isSelected && { color: bm.color }]}>{bm.label}</Text>
                      <Text style={{ fontSize: 9, color: bm.color, fontWeight: "700", textTransform: "uppercase" }}>{bm.category}</Text>
                    </View>
                    <Text style={mapStyles.pickerItemSub}>{bm.subtitle}</Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={18} color={bm.color} />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
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

  // ── Pin Drop Markers ──
  pinDropWrapper: {
    position: "absolute",
    width: 34,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  pinDropPressable: {
    width: 34,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  pinDropContainer: {
    position: "absolute",
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  pinDropCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    zIndex: 2,
  },
  pinDropStem: {
    position: "absolute",
    bottom: -4,
    width: 8,
    height: 8,
    transform: [{ rotate: "45deg" }],
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: "#FFFFFF",
    zIndex: 1,
  },

  // ── GPS Puck ──
  userPuckContainer: {
    position: "absolute",
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 15,
  },
  userPuckRipple: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#0A84FF",
    backgroundColor: "rgba(10, 132, 255, 0.25)",
  },
  userPuckHalo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0A84FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  userPuckDot: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#0A84FF",
  },

  // ── Top Controls Row (Filter Bar + Basemap Picker) ──
  topControlsRow: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    zIndex: 30,
  },
  filterBar: {
    flexDirection: "row",
    gap: 2,
    backgroundColor: "rgba(10, 16, 26, 0.92)",
    borderRadius: 16,
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
  },
  filterTab: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
  },
  filterTabActive: {
    backgroundColor: "rgba(56, 189, 248, 0.22)",
  },
  filterTabText: {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.2,
    fontFamily: SF_PRO,
  },
  filterTabTextActive: {
    color: "#38BDF8",
    fontWeight: "900",
  },

  // ── Basemap switcher button ──
  basemapBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(10, 16, 26, 0.92)",
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    maxWidth: 135,
  },
  basemapBtnText: {
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 0.2,
    fontFamily: SF_PRO,
  },

  // ── Status Pills (top right, below topControlsRow) ──
  topRightPills: {
    position: "absolute",
    top: 48,
    right: 10,
    flexDirection: "row",
    gap: 6,
    zIndex: 25,
  },
  glassPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: "rgba(10, 16, 26, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  liveBeacon: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  glassPillText: {
    color: "#E2E8F0",
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 0.3,
    fontFamily: SF_PRO,
  },

  // ── Zoom Controls ──
  zoomControls: {
    position: "absolute",
    right: 14,
    top: "42%",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderRadius: 14,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 30,
  },
  zoomBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomBtnPressed: {
    backgroundColor: "rgba(0, 0, 0, 0.08)",
  },
  zoomDivider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },

  // ── Wind Compass HUD ──
  bottomLeftControls: {
    position: "absolute",
    left: 14,
    bottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    zIndex: 25,
  },
  compassRose: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(10, 16, 26, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  rainfallPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "rgba(10, 16, 26, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  rainfallPillText: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 10,
    fontWeight: "600",
    fontFamily: SF_PRO,
  },

  // ── Coord Chip ──
  locationChip: {
    position: "absolute",
    bottom: 6,
    alignSelf: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  locationText: {
    color: "rgba(255, 255, 255, 0.35)",
    fontSize: 9,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },

  // ── Pin Prompt ──
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
    zIndex: 40,
  },
  pinPromptText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "600",
  },

  // ── Basemap Picker Modal ──
  pickerScrim: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
    paddingHorizontal: 0,
  },
  pickerCard: {
    backgroundColor: "rgba(18, 20, 28, 0.98)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    padding: 20,
    paddingBottom: 36,
    gap: 10,
  },
  pickerTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
    fontFamily: SF_PRO,
    marginBottom: 2,
  },
  pickerSubtitle: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 11,
    fontFamily: SF_PRO,
    marginBottom: 6,
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  pickerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerItemLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: SF_PRO,
    marginBottom: 2,
  },
  pickerItemSub: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 10,
    fontFamily: SF_PRO,
  },
});
