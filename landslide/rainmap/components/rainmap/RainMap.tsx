import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Animated,
  PanResponder,
  Image,
  Dimensions,
} from "react-native";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const TILE_SIZE = 256;

interface Hotspot {
  id: string;
  lat: number;
  lng: number;
  name: string;
  rain: string;
  status: string;
  color: string;
  detail: string;
}

interface DamMarker {
  id: string;
  lat: number;
  lng: number;
  name: string;
  fill: string;
  gates: string;
  color: string;
  detail: string;
}

interface ShelterMarker {
  id: string;
  lat: number;
  lng: number;
  name: string;
  capacity: string;
  color: string;
}

const HOTSPOTS: Hotspot[] = [
  { id: "h1", lat: 27.238, lng: 88.502, name: "Singtam", rain: "92.4 mm/h", status: "CRITICAL", color: "#ef4444", detail: "Flash flood probability: 96%" },
  { id: "h2", lat: 27.178, lng: 88.527, name: "Rangpo", rain: "78.2 mm/h", status: "HIGH", color: "#ef4444", detail: "Downstream surge wave rising" },
  { id: "h3", lat: 27.328, lng: 88.612, name: "Gangtok", rain: "64.0 mm/h", status: "ALERT", color: "#f97316", detail: "Valley slope runoff high" },
  { id: "h4", lat: 27.193, lng: 88.378, name: "Namchi", rain: "48.5 mm/h", status: "MODERATE", color: "#eab308", detail: "Precautionary watch" },
  { id: "h5", lat: 27.595, lng: 88.480, name: "Mangan", rain: "38.1 mm/h", status: "WATCH", color: "#38bdf8", detail: "Catchment tributary monitor" },
];

const DAMS: DamMarker[] = [
  { id: "d1", lat: 27.290, lng: 88.480, name: "Teesta-V Dam", fill: "91.4%", gates: "3 Gates Open", color: "#ef4444", detail: "Downstream warning active in Teesta riverbed." },
  { id: "d2", lat: 27.410, lng: 88.310, name: "Rathong-Chu HEP", fill: "74.0%", gates: "1 Gate Open", color: "#f97316", detail: "Controlled spillway operational." },
  { id: "d3", lat: 27.350, lng: 88.510, name: "Dikchu Dam", fill: "58.2%", gates: "Gates Closed", color: "#eab308", detail: "Normal storage retention." },
];

const SHELTERS: ShelterMarker[] = [
  { id: "s1", lat: 27.225, lng: 88.495, name: "Singtam Govt. Camp", capacity: "340 / 500 beds", color: "#22c55e" },
  { id: "s2", lat: 27.182, lng: 88.540, name: "Rangpo Relief Hall", capacity: "190 / 300 beds", color: "#22c55e" },
];

function mercator(lat: number, lng: number, zoom: number) {
  const size = TILE_SIZE * 2 ** zoom;
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * size,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size,
  };
}

function unmercator(x: number, y: number, zoom: number) {
  const size = TILE_SIZE * 2 ** zoom;
  const lng = (x / size) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / size;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return { lat, lng };
}

export function RainMap() {
  const [viewportSize, setViewportSize] = useState({
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  });

  const [center, setCenter] = useState({ lat: 27.28, lng: 88.48 });
  const [zoom, setZoom] = useState(11);
  const [activeFilter, setActiveFilter] = useState<"all" | "rain" | "dams" | "shelters">("all");
  const [selectedPopup, setSelectedPopup] = useState<any | null>(null);

  const drag = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Pulsing Sonar Wave
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const centerPx = useMemo(() => mercator(center.lat, center.lng, zoom), [center, zoom]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
        onPanResponderMove: (_, g) => drag.setValue({ x: g.dx, y: g.dy }),
        onPanResponderRelease: (_, g) => {
          const next = unmercator(centerPx.x - g.dx, centerPx.y - g.dy, zoom);
          setCenter(next);
          drag.setValue({ x: 0, y: 0 });
        },
        onPanResponderTerminate: () => drag.setValue({ x: 0, y: 0 }),
      }),
    [centerPx, zoom, drag]
  );

  // CartoDB Dark Base Layer Tiles
  const visibleTiles = useMemo(() => {
    const { width, height } = viewportSize;
    if (width <= 0 || height <= 0) return [];
    const maxTileIndex = 2 ** zoom;
    const tiles: { key: string; x: number; y: number; url: string }[] = [];
    const minTX = Math.floor((centerPx.x - width / 2) / TILE_SIZE) - 1;
    const maxTX = Math.floor((centerPx.x + width / 2) / TILE_SIZE) + 1;
    const minTY = Math.floor((centerPx.y - height / 2) / TILE_SIZE) - 1;
    const maxTY = Math.floor((centerPx.y + height / 2) / TILE_SIZE) + 1;

    for (let ty = minTY; ty <= maxTY; ty++) {
      if (ty < 0 || ty >= maxTileIndex) continue;
      for (let tx = minTX; tx <= maxTX; tx++) {
        const wrappedX = ((tx % maxTileIndex) + maxTileIndex) % maxTileIndex;
        const screenX = tx * TILE_SIZE - centerPx.x + width / 2;
        const screenY = ty * TILE_SIZE - centerPx.y + height / 2;

        // Dark Basemap (CartoDB Dark All)
        const sub = ["a", "b", "c", "d"][(tx + ty) % 4];
        const url = `https://${sub}.basemaps.cartocdn.com/dark_all/${zoom}/${wrappedX}/${ty}.png`;

        tiles.push({
          key: `tile-${zoom}-${tx}-${ty}`,
          x: screenX,
          y: screenY,
          url,
        });
      }
    }
    return tiles;
  }, [centerPx, zoom, viewportSize]);

  // Screen Positions for Hotspots
  const screenHotspots = useMemo(() => {
    return HOTSPOTS.map((h) => {
      const p = mercator(h.lat, h.lng, zoom);
      return {
        ...h,
        x: p.x - centerPx.x + viewportSize.width / 2,
        y: p.y - centerPx.y + viewportSize.height / 2,
      };
    });
  }, [centerPx, zoom, viewportSize]);

  // Screen Positions for Dams
  const screenDams = useMemo(() => {
    return DAMS.map((d) => {
      const p = mercator(d.lat, d.lng, zoom);
      return {
        ...d,
        x: p.x - centerPx.x + viewportSize.width / 2,
        y: p.y - centerPx.y + viewportSize.height / 2,
      };
    });
  }, [centerPx, zoom, viewportSize]);

  // Screen Positions for Shelters
  const screenShelters = useMemo(() => {
    return SHELTERS.map((s) => {
      const p = mercator(s.lat, s.lng, zoom);
      return {
        ...s,
        x: p.x - centerPx.x + viewportSize.width / 2,
        y: p.y - centerPx.y + viewportSize.height / 2,
      };
    });
  }, [centerPx, zoom, viewportSize]);

  const handleRecenter = () => {
    setCenter({ lat: 27.238, lng: 88.502 });
    setZoom(12);
  };

  const handleZoom = (delta: number) => {
    setZoom((z) => Math.min(16, Math.max(8, z + delta)));
  };

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setViewportSize({ width, height });
      }}
      {...panResponder.panHandlers}
    >
      {/* ── Tile Canvas ── */}
      <Animated.View
        style={[
          styles.tileContainer,
          { transform: [{ translateX: drag.x }, { translateY: drag.y }] },
        ]}
      >
        {visibleTiles.map((tile) => (
          <Image
            key={tile.key}
            source={{ uri: tile.url }}
            style={[
              styles.tileImage,
              { left: tile.x, top: tile.y, width: TILE_SIZE, height: TILE_SIZE },
            ]}
          />
        ))}

        {/* ── Hotspot Markers ── */}
        {(activeFilter === "all" || activeFilter === "rain") &&
          screenHotspots.map((h) => (
            <View
              key={h.id}
              style={[
                styles.markerAnchor,
                { left: h.x, top: h.y },
              ]}
            >
              {/* Pulsing Sonar Ring */}
              <Animated.View
                style={[
                  styles.sonarRing,
                  {
                    backgroundColor: `${h.color}33`,
                    borderColor: `${h.color}66`,
                    transform: [
                      {
                        scale: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.6, 2.2],
                        }),
                      },
                    ],
                    opacity: pulseAnim.interpolate({
                      inputRange: [0, 0.7, 1],
                      outputRange: [0.8, 0.3, 0],
                    }),
                  },
                ]}
              />

              {/* Marker Pill */}
              <Pressable
                onPress={() => setSelectedPopup(h)}
                style={[styles.hotspotPill, { borderColor: h.color }]}
              >
                <View style={[styles.markerDot, { backgroundColor: h.color }]} />
                <Text style={styles.hotspotName}>{h.name}</Text>
                <Text style={[styles.hotspotRain, { color: h.color }]}>
                  {h.rain}
                </Text>
              </Pressable>
            </View>
          ))}

        {/* ── Dam Markers ── */}
        {(activeFilter === "all" || activeFilter === "dams") &&
          screenDams.map((d) => (
            <View
              key={d.id}
              style={[
                styles.markerAnchor,
                { left: d.x, top: d.y },
              ]}
            >
              <Pressable
                onPress={() => setSelectedPopup(d)}
                style={[styles.damPill, { borderColor: d.color }]}
              >
                <MaterialCommunityIcons name="waves" size={13} color="#38bdf8" />
                <View>
                  <Text style={styles.damName}>{d.name}</Text>
                  <Text style={[styles.damSub, { color: d.color }]}>
                    {d.fill} • {d.gates}
                  </Text>
                </View>
              </Pressable>
            </View>
          ))}

        {/* ── Shelter Markers ── */}
        {(activeFilter === "all" || activeFilter === "shelters") &&
          screenShelters.map((s) => (
            <View
              key={s.id}
              style={[
                styles.markerAnchor,
                { left: s.x, top: s.y },
              ]}
            >
              <Pressable
                onPress={() => setSelectedPopup(s)}
                style={styles.shelterPill}
              >
                <Ionicons name="home" size={11} color="#22c55e" />
                <Text style={styles.shelterName}>{s.name}</Text>
              </Pressable>
            </View>
          ))}
      </Animated.View>

      {/* ── Interactive Info Popup Card ── */}
      {selectedPopup && (
        <View style={styles.popupCard}>
          <View style={styles.popupHeader}>
            <Text style={styles.popupTitle}>{selectedPopup.name}</Text>
            <Pressable
              onPress={() => setSelectedPopup(null)}
              hitSlop={8}
            >
              <Ionicons name="close" size={16} color="rgba(255, 255, 255, 0.6)" />
            </Pressable>
          </View>
          {selectedPopup.rain && (
            <Text style={[styles.popupSub, { color: selectedPopup.color }]}>
              {selectedPopup.status} • {selectedPopup.rain}
            </Text>
          )}
          {selectedPopup.fill && (
            <Text style={[styles.popupSub, { color: selectedPopup.color }]}>
              {selectedPopup.fill} Capacity • {selectedPopup.gates}
            </Text>
          )}
          {selectedPopup.capacity && (
            <Text style={[styles.popupSub, { color: "#22c55e" }]}>
              Available: {selectedPopup.capacity}
            </Text>
          )}
          {selectedPopup.detail && (
            <Text style={styles.popupDetail}>{selectedPopup.detail}</Text>
          )}
        </View>
      )}

      {/* ── Floating Filter Bar (Top Left) ── */}
      <View style={styles.filterBar}>
        {(["all", "rain", "dams", "shelters"] as const).map((filter) => (
          <Pressable
            key={filter}
            onPress={() => setActiveFilter(filter)}
            style={[
              styles.filterBtn,
              activeFilter === filter && styles.filterBtnActive,
            ]}
          >
            <Text
              style={[
                styles.filterBtnText,
                activeFilter === filter && styles.filterBtnTextActive,
              ]}
            >
              {filter.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── Floating Map Navigation Controls (Top Right) ── */}
      <View style={styles.mapControls}>
        <Pressable
          onPress={handleRecenter}
          style={({ pressed }) => [
            styles.ctrlBtn,
            pressed && { opacity: 0.8 },
          ]}
        >
          <Ionicons name="locate" size={17} color="#ffffff" />
        </Pressable>

        <View style={styles.zoomStack}>
          <Pressable
            onPress={() => handleZoom(1)}
            style={({ pressed }) => [
              styles.zoomBtn,
              pressed && { backgroundColor: "rgba(255, 255, 255, 0.15)" },
            ]}
          >
            <Ionicons name="add" size={18} color="#ffffff" />
          </Pressable>
          <View style={styles.zoomDivider} />
          <Pressable
            onPress={() => handleZoom(-1)}
            style={({ pressed }) => [
              styles.zoomBtn,
              pressed && { backgroundColor: "rgba(255, 255, 255, 0.15)" },
            ]}
          >
            <Ionicons name="remove" size={18} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#000000",
    overflow: "hidden",
  },
  tileContainer: {
    ...StyleSheet.absoluteFill,
  },
  tileImage: {
    position: "absolute",
    backgroundColor: "#000000",
  },
  markerAnchor: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateX: -60 }, { translateY: -16 }],
  },
  sonarRing: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
  },
  hotspotPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(10, 10, 14, 0.88)",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  markerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  hotspotName: {
    fontSize: 10,
    fontWeight: "700",
    color: "#ffffff",
  },
  hotspotRain: {
    fontSize: 9,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  damPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(14, 14, 20, 0.92)",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 8,
  },
  damName: {
    fontSize: 10,
    fontWeight: "800",
    color: "#ffffff",
  },
  damSub: {
    fontSize: 8,
    fontFamily: "monospace",
    fontWeight: "800",
    marginTop: 1,
  },
  shelterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(10, 10, 14, 0.88)",
    borderWidth: 1,
    borderColor: "#22c55e",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  shelterName: {
    fontSize: 9,
    fontWeight: "700",
    color: "#ffffff",
  },
  filterBar: {
    position: "absolute",
    top: 76,
    left: 14,
    flexDirection: "row",
    backgroundColor: "rgba(10, 10, 14, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: 16,
    padding: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 100,
  },
  filterBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },
  filterBtnActive: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  filterBtnText: {
    fontSize: 9,
    fontFamily: "monospace",
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.55)",
  },
  filterBtnTextActive: {
    color: "#ffffff",
  },
  mapControls: {
    position: "absolute",
    top: 76,
    right: 14,
    gap: 8,
    zIndex: 100,
  },
  ctrlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(10, 10, 14, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 10,
  },
  zoomStack: {
    borderRadius: 16,
    backgroundColor: "rgba(10, 10, 14, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 10,
  },
  zoomBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  popupCard: {
    position: "absolute",
    top: 130,
    left: 20,
    right: 20,
    backgroundColor: "rgba(16, 16, 22, 0.94)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.7,
    shadowRadius: 28,
    elevation: 16,
    zIndex: 150,
  },
  popupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  popupTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },
  popupSub: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  popupDetail: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.65)",
    marginTop: 6,
    lineHeight: 15,
  },
});
