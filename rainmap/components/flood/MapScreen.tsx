import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapCanvas } from "@/components/flood/MapCanvas";
import { ReportComposer } from "@/components/flood/ReportComposer";
import { ContextualIntelligencePanel } from "@/components/meteo/ContextualIntelligencePanel";
import { NearbySevereWarningCard } from "@/components/meteo/NearbySevereWarningCard";
import { ForecastHorizonSelector } from "@/components/meteo/ForecastHorizonSelector";
import { EmergencyAssistanceModal } from "@/components/meteo/EmergencyAssistanceModal";
import { BrandLogo3D } from "@/components/meteo/BrandLogo3D";
import { AppleDynamicIslandAlert } from "@/components/meteo/AppleDynamicIslandAlert";
import { SF_PRO } from "@/components/flood/ui";
import {
  WatermelonSpringButton,
  WatermelonShimmerBadge,
  WatermelonGlowCard,
} from "@/components/meteo/WatermelonAnimations";
import { KokonutStatusIsland, type KokonutTask } from "@/components/meteo/KokonutUI";
import { getAllMapMarkers, useFlood } from "@/lib/flood/FloodProvider";
import { getCountdownTime, type MeteoGisZone } from "@/lib/meteo/meteoGisData";
import {
  SEARCHABLE_LOCATIONS,
  getAllSevereAlerts,
  getNearbyAlerts,
  calculateDistanceKm,
  OFFICIAL_PRECAUTIONS,
  type SearchableLocation,
} from "@/lib/meteo/severeWeatherEngine";
import { detectRealLocation, DEFAULT_FALLBACK_LOCATION } from "@/lib/meteo/locationService";
import { fetchLiveMeteoGis, type MeteoGisPayload } from "@/lib/meteo/liveMeteoService";
import type {
  ForecastHorizon,
  GeoPoint,
  MapLayer,
  MapMarker,
  MonitoringRadiusKm,
  ReportDraft,
  SevereWeatherAlert,
  UserLocationState,
} from "@/lib/flood/types";

const QUICK_STATES = [
  { name: "All India", icon: "🇮🇳", lat: 22.9734, lng: 78.6569, zoom: 5 },
  { name: "Tamil Nadu", icon: "🏛️", lat: 11.1271, lng: 78.6569, zoom: 7 },
  { name: "Sikkim", icon: "🏔️", lat: 27.5330, lng: 88.5122, zoom: 9 },
  { name: "Kerala", icon: "🌴", lat: 10.8505, lng: 76.2711, zoom: 8 },
  { name: "Assam", icon: "🌊", lat: 26.2006, lng: 92.9376, zoom: 7 },
  { name: "Delhi", icon: "🏛️", lat: 28.6139, lng: 77.2090, zoom: 10 },
  { name: "Maharashtra", icon: "🏙️", lat: 19.7515, lng: 75.7139, zoom: 7 },
  { name: "West Bengal", icon: "🌾", lat: 22.9868, lng: 87.8550, zoom: 7 },
  { name: "Uttarakhand", icon: "🏔️", lat: 30.0668, lng: 79.0193, zoom: 8 },
  { name: "Himachal", icon: "⛰️", lat: 31.1048, lng: 77.1734, zoom: 8 },
];

export default function MapScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const isWide = screenWidth >= 960;

  const { reports, language, cachedAt, addReport, pendingMapPin, pendingMapPinDraft, consumeMapPinRequest } = useFlood();

  // ── Real Location State (Defaults to Chennai / Tamil Nadu, immediately detected on mount) ──
  const [userLocation, setUserLocation] = useState<UserLocationState>({
    coords: { latitude: DEFAULT_FALLBACK_LOCATION.latitude, longitude: DEFAULT_FALLBACK_LOCATION.longitude },
    accuracyMeters: DEFAULT_FALLBACK_LOCATION.accuracyMeters,
    localityName: DEFAULT_FALLBACK_LOCATION.localityName,
    isGpsActive: false,
    permissionDenied: false,
  });

  // Current viewing location on map (defaults to user's real location, immediately detected on mount)
  const [viewCenter, setViewCenter] = useState<GeoPoint>({
    latitude: DEFAULT_FALLBACK_LOCATION.latitude,
    longitude: DEFAULT_FALLBACK_LOCATION.longitude,
  });
  const [viewingLocationName, setViewingLocationName] = useState<string>(DEFAULT_FALLBACK_LOCATION.localityName);
  const [isExploringOtherLocation, setIsExploringOtherLocation] = useState<boolean>(false);
  const [selectedState, setSelectedState] = useState<string>("All India");

  // Severe Alert Monitoring Radius (5 km, 10 km, 25 km, 50 km)
  const [monitoringRadiusKm, setMonitoringRadiusKm] = useState<MonitoringRadiusKm>(25);

  // Forecast Horizon (6h, 12h, 24h, 48h)
  const [selectedHorizon, setSelectedHorizon] = useState<ForecastHorizon>("6h");

  // Search UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  // Emergency Modal State
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);

  // ── Live Meteo-GIS & IMD / NASA Telemetry Payload ──
  const [livePayload, setLivePayload] = useState<MeteoGisPayload | null>(null);

  // Drawer / Bottom sheet active tab: "alerts" | "overview"
  const [activeDrawerTab, setActiveDrawerTab] = useState<"alerts" | "overview">("alerts");
  const [sheetExpanded, setSheetExpanded] = useState(true);

  // Layer Toggles (Rain and Wind disabled for pristine satellite clarity)
  const [layers, setLayers] = useState<Record<MapLayer, boolean>>({
    rain: false,
    wind: false,
    imd: true,
    risk: true,
    reports: true,
    water: true,
    relief: true,
    infrastructure: false,
    route: false,
    rescue: false,
  });

  const [selected, setSelected] = useState<MapMarker | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [pinMode, setPinMode] = useState(false);
  const [pin, setPin] = useState<GeoPoint>(viewCenter);
  const [composerDraft, setComposerDraft] = useState<ReportDraft>({ kind: "flood", description: "" });
  const [composerSession, setComposerSession] = useState(0);

  // ── Real Geolocation Detection (Dual HTML5 GPS + Instant IP Fallback) ──
  useEffect(() => {
    let active = true;

    async function initUserLocation() {
      const loc = await detectRealLocation();
      if (!active) return;

      const userCoords: GeoPoint = {
        latitude: loc.latitude,
        longitude: loc.longitude,
      };

      setUserLocation({
        coords: userCoords,
        accuracyMeters: loc.accuracyMeters,
        localityName: loc.localityName,
        isGpsActive: loc.isGps,
        permissionDenied: false,
      });

      // Automatically center map and warnings on user's detected authentic location!
      setViewCenter(userCoords);
      setViewingLocationName(loc.localityName);
      setIsExploringOtherLocation(false);
    }

    initUserLocation();

    // Continuous watch if browser permits
    let watchId: number | null = null;
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      try {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            if (!active) return;
            setUserLocation((curr) => ({
              ...curr,
              coords: {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              },
              accuracyMeters: pos.coords.accuracy || 20,
              isGpsActive: true,
            }));
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 60000, timeout: 12000 }
        );
      } catch {
        // Ignore
      }
    }

    return () => {
      active = false;
      if (watchId !== null && typeof window !== "undefined" && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // ── Live IMD, NASA & Bhuvan Sync for Current Map Center ──
  const handleSyncFeeds = async () => {
    try {
      const payload = await fetchLiveMeteoGis(viewCenter.latitude, viewCenter.longitude);
      setLivePayload(payload);
    } catch {
      // Silently maintain cached telemetry
    }
  };

  useEffect(() => {
    let active = true;

    async function sync() {
      try {
        const payload = await fetchLiveMeteoGis(viewCenter.latitude, viewCenter.longitude);
        if (active) {
          setLivePayload(payload);
        }
      } catch {
        // Silently maintain cached telemetry
      }
    }

    sync();
    const interval = setInterval(sync, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [viewCenter.latitude, viewCenter.longitude]);

  // All severe alerts from national sources
  const allSevereAlerts = useMemo(() => {
    return getAllSevereAlerts(viewCenter, livePayload?.liveSevereAlerts);
  }, [viewCenter, livePayload?.liveSevereAlerts]);

  // Spatial Geofenced Alert Calculation around current viewCenter
  const { nearbyAlerts, approachingAlerts, highestPriorityAlert } = useMemo(
    () => getNearbyAlerts(viewCenter, monitoringRadiusKm, allSevereAlerts),
    [viewCenter, monitoringRadiusKm, allSevereAlerts]
  );

  // Dedicated Active Alert Resolution for clicked areas or markers
  const selectedMarkerAlert: SevereWeatherAlert | null = useMemo(() => {
    if (!selected) return null;
    const directMatch = allSevereAlerts.find(
      (a) =>
        selected.id.includes(a.id) ||
        a.id.includes(selected.id) ||
        (selected.extra?.id && a.id === selected.extra.id) ||
        (selected.title && a.district && selected.title.toLowerCase().includes(a.district.toLowerCase()))
    );
    if (directMatch) return directMatch;

    if (selected.type === "risk" || selected.type === "landslide" || selected.type === "imd") {
      const extra = selected.extra || {};
      const cat = (extra.category || (selected.type === "landslide" ? "LANDSLIDE" : "THUNDERSTORM")).toUpperCase();
      let category: SevereWeatherAlert["category"] = "THUNDERSTORM";
      if (cat.includes("HAIL")) category = "HAILSTORM";
      else if (cat.includes("CLOUDBURST")) category = "CLOUDBURST";
      else if (cat.includes("RAIN")) category = "VERY_HEAVY_RAIN";
      else if (cat.includes("WIND") || cat.includes("SQUALL")) category = "HIGH_WIND";
      else if (cat.includes("LANDSLIDE")) category = "LANDSLIDE";

      const sev = (extra.severity || extra.level || (selected.level === "critical" ? "RED" : selected.level === "danger" ? "ORANGE" : "YELLOW")).toUpperCase();
      let severity: SevereWeatherAlert["severity"] = "MODERATE";
      if (sev.includes("RED") || sev.includes("EXTREME") || sev.includes("CRITICAL")) severity = "EXTREME";
      else if (sev.includes("ORANGE") || sev.includes("SEVERE") || sev.includes("DANGER")) severity = "SEVERE";

      return {
        id: selected.id,
        category,
        severity,
        headline: extra.headline || selected.title,
        district: extra.district || (selected.title.split(":")[1] || selected.title).trim(),
        state: extra.state || "India",
        latitude: selected.latitude,
        longitude: selected.longitude,
        distanceKm: 0,
        isWithinRadius: true,
        issuedAt: extra.issuedAt || "Live Government Bulletin",
        validUntil: extra.validUntil || "24h Synoptic Cycle",
        source: extra.source || "Official IMD / Meteo-GIS Alert Division",
        precautions: OFFICIAL_PRECAUTIONS[category] || OFFICIAL_PRECAUTIONS.THUNDERSTORM,
        rainfallMmH: extra.rainfallRateMmH || extra.rain || (category === "CLOUDBURST" ? 84 : 32),
        windSpeedKmh: extra.windSpeedKmh || extra.wind || livePayload?.wind?.speedKmh || 42,
        windDirectionDeg: extra.windDirectionDeg || livePayload?.wind?.directionDeg || 338,
        windCardinal: extra.windCardinal || livePayload?.wind?.cardinal || "NNW",
        radarEchoDbz: 50,
      };
    }
    return null;
  }, [selected, allSevereAlerts, livePayload?.wind]);

  const nearestAlertToCenter = useMemo(() => {
    if (!allSevereAlerts.length) return null;
    let closest: SevereWeatherAlert | null = null;
    let minDist = Infinity;
    const distName = (viewingLocationName.split(",")[0] || "").toLowerCase().trim();

    for (const a of allSevereAlerts) {
      if (distName && a.district.toLowerCase().includes(distName)) {
        return a;
      }
      const d = calculateDistanceKm(viewCenter, { latitude: a.latitude, longitude: a.longitude });
      if (d < minDist) {
        minDist = d;
        closest = { ...a, distanceKm: d };
      }
    }
    return closest;
  }, [allSevereAlerts, viewCenter, viewingLocationName]);

  const activeAlertForDisplay = selectedMarkerAlert || highestPriorityAlert || nearestAlertToCenter || allSevereAlerts[0] || null;

  // Construct Dynamic Authentic Meteo-GIS Zone from Live Telemetry
  const liveZone: MeteoGisZone = useMemo(() => {
    const wind = livePayload?.wind;
    const isro = livePayload?.isroBhuvan;
    const districtName = (viewingLocationName.split(",")[0] || "CHENNAI").trim().toUpperCase();
    const topAlert = highestPriorityAlert;

    return {
      id: `ZONE-${districtName}`,
      district: districtName,
      state: isro?.state || "TAMIL NADU",
      category: (topAlert?.category as any) || "THUNDERSTORM",
      severity: topAlert?.severity === "EXTREME" ? "RED" : topAlert?.severity === "SEVERE" ? "ORANGE" : "YELLOW",
      badgeLabel: topAlert ? `${topAlert.category} ${topAlert.severity}` : "IMD NOWCAST LIVE",
      headline: topAlert?.headline || `LIVE IMD / AWS TELEMETRY FOR ${districtName}`,
      summary: topAlert?.headline || `Real-time surface observations from IMD automatic weather station network and NASA GPM satellite climatology.`,
      lat: viewCenter.latitude,
      lng: viewCenter.longitude,
      tempC: wind?.temperatureC ?? 29,
      humidityPercent: wind?.humidityPercent ?? 74,
      rain1hMm: wind?.rainfall1hMm ?? 0.0,
      windSpeedKmh: wind?.speedKmh ?? 14,
      validDurationHours: 6.0,
      sourceFeed: wind?.dataSource || "IMD Surface Stations & Doppler Radar",
      slopeDeg: isro?.elevationDemM ? Math.min(30, Math.round(isro.elevationDemM * 0.4)) : 6,
    };
  }, [livePayload, highestPriorityAlert, viewingLocationName, viewCenter]);

  // Live countdown string
  const [countdown, setCountdown] = useState(
    getCountdownTime(liveZone.validDurationHours, 0)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdownTime(liveZone.validDurationHours, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [liveZone.validDurationHours]);

  // Kokonut UI: Active Meteorological Telemetry Task Feeds
  const kokonutTasks: KokonutTask[] = useMemo(() => [
    {
      id: "doppler-radar",
      label: "Doppler Storm Radar",
      detail: `${viewingLocationName.split(",")[0]} Radar Sweep Active`,
      status: "synced",
      source: "Doppler Radar Network",
    },
    {
      id: "aws-telemetry",
      label: "Automatic Weather Station",
      detail: `${liveZone.tempC}°C · ${liveZone.windSpeedKmh} km/h · ${liveZone.rain1hMm} mm`,
      status: "synced",
      source: "MoES AWS Feed",
    },
    {
      id: "nasa-gibs",
      label: "NASA GIBS Weather Satellite",
      detail: "MODIS / VIIRS Live Orbit Active",
      status: "synced",
      source: "NASA EarthData / GIBS",
    },
    {
      id: "nasa-gpm",
      label: "NASA GPM Precipitation",
      detail: "Half-Hourly Multi-Satellite IMERG",
      status: "synced",
      source: "NASA EarthData",
    },
  ], [viewingLocationName, liveZone, livePayload]);

  // Authoritative markers plotted at exact government geolocations
  const baseMarkers = useMemo(() => getAllMapMarkers(reports), [reports, cachedAt]);
  const markers = useMemo(() => {
    const markerMap = new Map<string, MapMarker>();

    for (const m of baseMarkers) {
      markerMap.set(m.id, m);
    }

    for (const a of allSevereAlerts) {
      if (!markerMap.has(a.id) && !markerMap.has(`hotspot-${a.district.toLowerCase()}`)) {
        markerMap.set(a.id, {
          id: a.id,
          title: `${a.district} · ${a.category.replace(/_/g, " ")}`,
          subtitle: a.headline,
          latitude: a.latitude,
          longitude: a.longitude,
          type: a.category === "LANDSLIDE" ? "landslide" : "imd",
          level: a.severity === "EXTREME" ? "critical" : a.severity === "SEVERE" ? "danger" : "warning",
          extra: {
            impact: a.headline,
            headline: a.headline,
            source: a.source,
            category: a.category,
            severity: a.severity,
            district: a.district,
            state: a.state,
            precautions: a.precautions,
            rainfallRateMmH: a.rainfallMmH,
          },
        });
      }
    }

    return Array.from(markerMap.values());
  }, [baseMarkers, allSevereAlerts]);

  // Filtered search suggestions
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return SEARCHABLE_LOCATIONS.slice(0, 5);
    const q = searchQuery.toLowerCase();
    return SEARCHABLE_LOCATIONS.filter(
      (loc) => loc.name.toLowerCase().includes(q) || loc.state.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Recenter on user's GPS
  const handleRecenterOnMe = async () => {
    try {
      const loc = await detectRealLocation();
      const coords = { latitude: loc.latitude, longitude: loc.longitude };
      setUserLocation({
        coords,
        accuracyMeters: loc.accuracyMeters,
        localityName: loc.localityName,
        isGpsActive: loc.isGps,
        permissionDenied: false,
      });
      setViewCenter(coords);
      setViewingLocationName(loc.localityName);
      setIsExploringOtherLocation(false);
      setSearchOpen(false);
    } catch {
      if (userLocation.coords) {
        setViewCenter(userLocation.coords);
        setViewingLocationName(userLocation.localityName);
        setIsExploringOtherLocation(false);
        setSearchOpen(false);
      }
    }
  };

  // Inspect specific hazard on map
  const handleInspectHazard = (alert: SevereWeatherAlert) => {
    const target = { latitude: alert.latitude, longitude: alert.longitude };
    setViewCenter(target);
    setViewingLocationName(`${alert.district}, ${alert.state}`);
    setIsExploringOtherLocation(true);
  };

  // Select searched location
  const handleSelectLocation = (loc: SearchableLocation) => {
    setViewCenter(loc.coords);
    setViewingLocationName(`${loc.name}, ${loc.state}`);
    setIsExploringOtherLocation(true);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const selectingPin = pinMode || pendingMapPin;

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      {/* ── TOP HUD: 2026 FLOATING GLASS CAPSULE (Kokonut UI & Uiverse style) ── */}
      <View style={styles.topHud}>
        {/* Left: 2026 3D Holographic Weather Emblem & Brand */}
        <BrandLogo3D compact={!isWide} />

        {/* Center / Right: Search, Recenter, Prominent SOS Action */}
        <View style={styles.topActionsRow}>
          {/* Location Chip (if exploring on wide screens) */}
          {isExploringOtherLocation && isWide ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Recenter location"
              onPress={handleRecenterOnMe}
              style={styles.exploringChip}
            >
              <Ionicons name="compass" size={12} color="#0A84FF" />
              <Text numberOfLines={1} style={styles.exploringChipText}>
                {viewingLocationName.split(",")[0]}
              </Text>
              <Ionicons name="close-circle" size={12} color="rgba(255, 255, 255, 0.5)" />
            </Pressable>
          ) : null}

          {/* Search Trigger Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search locations"
            onPress={() => setSearchOpen(true)}
            style={({ pressed }) => [styles.searchBtn, pressed && { opacity: 0.75 }]}
          >
            <Ionicons name="search" size={13} color="#0A84FF" />
            <Text style={styles.searchBtnText}>Search</Text>
          </Pressable>

          {/* Recenter on Me GPS Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Locate my position"
            onPress={handleRecenterOnMe}
            style={({ pressed }) => [
              styles.gpsBtn,
              !isExploringOtherLocation && styles.gpsBtnActive,
              pressed && { opacity: 0.75 },
            ]}
          >
            <Ionicons
              name={isExploringOtherLocation ? "locate-outline" : "locate"}
              size={15}
              color={isExploringOtherLocation ? "rgba(255, 255, 255, 0.6)" : "#0A84FF"}
            />
          </Pressable>

          {/* ── Apple Emergency SOS Beacon Button (PROMINENT & HIGH-VISIBILITY) ── */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Satellite Emergency SOS Beacon"
            onPress={() => setEmergencyModalOpen(true)}
            style={({ pressed }) => [
              styles.emergencyPill,
              pressed && { transform: [{ scale: 0.94 }], opacity: 0.9 },
            ]}
          >
            <View style={styles.sosLiveBeaconDot} />
            <Ionicons name="warning" size={13} color="#FFFFFF" />
            <Text style={styles.emergencyPillText}>SOS</Text>
          </Pressable>
        </View>
      </View>

      {/* ── METEO-GIS QUICK STATE SELECTOR CHIPS ── */}
      <View style={styles.quickStatesBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickStatesContent}
        >
          {QUICK_STATES.map((st) => {
            const active = selectedState === st.name;
            return (
              <Pressable
                key={st.name}
                accessibilityRole="button"
                accessibilityLabel={`View ${st.name}`}
                onPress={() => {
                  setViewCenter({ latitude: st.lat, longitude: st.lng });
                  setViewingLocationName(st.name);
                  setSelectedState(st.name);
                  setIsExploringOtherLocation(st.name !== "All India");
                }}
                style={({ pressed }) => [
                  styles.stateChip,
                  active && styles.stateChipActive,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.stateChipIcon}>{st.icon}</Text>
                <Text style={[styles.stateChipLabel, active && styles.stateChipLabelActive]}>
                  {st.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── FORECAST HORIZON SELECTOR (6h / 12h / 24h / 48h) ── */}
      <View style={styles.horizonBar}>
        <ForecastHorizonSelector
          selectedHorizon={selectedHorizon}
          onChangeHorizon={setSelectedHorizon}
        />
      </View>

      {/* ── MAIN WORKSPACE: MAP CANVAS + GLASS INTELLIGENCE DOCK ── */}
      <View style={styles.workspace}>
        {/* Full Edge-to-Edge Satellite Map Canvas */}
        <View style={styles.mapContainer}>
          <MapCanvas
            markers={markers}
            layers={layers}
            language={language}
            windDirectionDeg={livePayload?.wind.directionDeg ?? 140}
            windSpeedKmh={liveZone.windSpeedKmh}
            activeDistrictName={viewingLocationName.toUpperCase()}
            countdownFormatted={countdown.remainingFormatted}
            focusCoords={[viewCenter.latitude, viewCenter.longitude]}
            userLocation={
              userLocation.coords
                ? {
                    latitude: userLocation.coords.latitude,
                    longitude: userLocation.coords.longitude,
                    accuracy: userLocation.accuracyMeters ?? 25,
                  }
                : null
            }
            pinMode={selectingPin}
            onMarker={(marker) => {
              setSelected(marker);
              setViewCenter({ latitude: marker.latitude, longitude: marker.longitude });
              setIsExploringOtherLocation(true);
              setViewingLocationName(marker.title.replace(/^IMD (RED|ORANGE|YELLOW): /, ""));
              setActiveDrawerTab("alerts");
              if (!isWide) {
                setSheetExpanded(true);
              }
            }}
            onMapPress={(point) => {
              setPin(point);
              setViewCenter(point);
              setSelected(null);
              setIsExploringOtherLocation(true);
              setViewingLocationName(`${point.latitude.toFixed(2)}°N, ${point.longitude.toFixed(2)}°E`);
              if (selectingPin) {
                if (pendingMapPin) {
                  setComposerDraft(pendingMapPinDraft ?? { kind: "flood", description: "" });
                  setComposerSession((current) => current + 1);
                }
                setPinMode(false);
                consumeMapPinRequest();
                setComposerOpen(true);
              } else {
                setActiveDrawerTab("alerts");
                if (!isWide) {
                  setSheetExpanded(true);
                }
              }
            }}
          />

          {/* ── MOBILE APPLE DOCKED BOTTOM SHEET (Severe Alerts & Overview) ── */}
          {!isWide ? (
            <View style={[styles.mobileBottomSheet, sheetExpanded && styles.mobileBottomSheetExpanded]}>
              {/* Grab Handle & Sheet Toggle */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Toggle bottom sheet expansion"
                onPress={() => setSheetExpanded(!sheetExpanded)}
                style={styles.sheetHandleRow}
              >
                <View style={styles.sheetHandle} />
                <View style={styles.handleActionHint}>
                  <Ionicons
                    name={sheetExpanded ? "chevron-down" : "chevron-up"}
                    size={12}
                    color="rgba(255, 255, 255, 0.45)"
                  />
                  <Text style={styles.handleHintText}>
                    {sheetExpanded ? "COLLAPSE" : "EXPAND INTELLIGENCE"}
                  </Text>
                </View>
              </Pressable>

              {/* Glass Tab Switcher: Nearby Severe Alerts vs Overview */}
              <View style={styles.dockTabsRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Nearby Severe Weather Warnings tab"
                  onPress={() => setActiveDrawerTab("alerts")}
                  style={[styles.dockTabBtn, activeDrawerTab === "alerts" && styles.dockTabBtnActive]}
                >
                  <Ionicons
                    name="alert-circle"
                    size={13}
                    color={activeDrawerTab === "alerts" ? "#F59E0B" : "rgba(255, 255, 255, 0.5)"}
                  />
                  <Text
                    style={[
                      styles.dockTabLabel,
                      activeDrawerTab === "alerts" && styles.dockTabLabelActive,
                    ]}
                  >
                    Nearby Severe Alerts
                  </Text>
                  {nearbyAlerts.length > 0 ? (
                    <View style={styles.alertCountBadge}>
                      <Text style={styles.alertCountText}>{nearbyAlerts.length}</Text>
                    </View>
                  ) : null}
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Disaster Intelligence Overview tab"
                  onPress={() => setActiveDrawerTab("overview")}
                  style={[styles.dockTabBtn, activeDrawerTab === "overview" && styles.dockTabBtnActive]}
                >
                  <Ionicons
                    name="stats-chart"
                    size={13}
                    color={activeDrawerTab === "overview" ? "#38BDF8" : "rgba(255, 255, 255, 0.5)"}
                  />
                  <Text
                    style={[
                      styles.dockTabLabel,
                      activeDrawerTab === "overview" && styles.dockTabLabelActive,
                    ]}
                  >
                    Telemetry Overview
                  </Text>
                </Pressable>
              </View>

              {/* Sheet Content Area */}
              <ScrollView
                style={styles.mobileSheetContent}
                contentContainerStyle={styles.sheetScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {activeDrawerTab === "alerts" ? (
                  <NearbySevereWarningCard
                    alert={activeAlertForDisplay}
                    radiusKm={monitoringRadiusKm}
                    onChangeRadius={setMonitoringRadiusKm}
                    onInspectHazard={handleInspectHazard}
                    isExploringOtherLocation={isExploringOtherLocation}
                    viewingLocationName={viewingLocationName}
                    onReturnToMyLocation={handleRecenterOnMe}
                    windDirectionDeg={livePayload?.wind?.directionDeg}
                    windSpeedKmh={livePayload?.wind?.speedKmh}
                    windCardinal={livePayload?.wind?.cardinal}
                  />
                ) : (
                  <ContextualIntelligencePanel
                    currentZone={liveZone}
                    zoneIndex={0}
                  />
                )}
              </ScrollView>
            </View>
          ) : null}
        </View>

        {/* ── DESKTOP DOCKED SIDEBAR PANEL ── */}
        {isWide ? (
          <View style={styles.desktopSidebar}>
            {/* Desktop Tabs Header */}
            <View style={styles.dockTabsRow}>
              <Pressable
                onPress={() => setActiveDrawerTab("alerts")}
                style={[styles.dockTabBtn, activeDrawerTab === "alerts" && styles.dockTabBtnActive]}
              >
                <Ionicons
                  name="alert-circle"
                  size={13}
                  color={activeDrawerTab === "alerts" ? "#F59E0B" : "rgba(255, 255, 255, 0.5)"}
                />
                <Text
                  style={[
                    styles.dockTabLabel,
                    activeDrawerTab === "alerts" && styles.dockTabLabelActive,
                  ]}
                >
                  Nearby Severe Alerts
                </Text>
                {nearbyAlerts.length > 0 ? (
                  <View style={styles.alertCountBadge}>
                    <Text style={styles.alertCountText}>{nearbyAlerts.length}</Text>
                  </View>
                ) : null}
              </Pressable>

              <Pressable
                onPress={() => setActiveDrawerTab("overview")}
                style={[styles.dockTabBtn, activeDrawerTab === "overview" && styles.dockTabBtnActive]}
              >
                <Ionicons
                  name="stats-chart"
                  size={13}
                  color={activeDrawerTab === "overview" ? "#38BDF8" : "rgba(255, 255, 255, 0.5)"}
                />
                <Text
                  style={[
                    styles.dockTabLabel,
                    activeDrawerTab === "overview" && styles.dockTabLabelActive,
                  ]}
                >
                  Telemetry Overview
                </Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.desktopScroll}
              contentContainerStyle={styles.desktopScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {activeDrawerTab === "alerts" ? (
                <NearbySevereWarningCard
                  alert={activeAlertForDisplay}
                  radiusKm={monitoringRadiusKm}
                  onChangeRadius={setMonitoringRadiusKm}
                  onInspectHazard={handleInspectHazard}
                  isExploringOtherLocation={isExploringOtherLocation}
                  viewingLocationName={viewingLocationName}
                  onReturnToMyLocation={handleRecenterOnMe}
                  windDirectionDeg={livePayload?.wind?.directionDeg}
                  windSpeedKmh={livePayload?.wind?.speedKmh}
                  windCardinal={livePayload?.wind?.cardinal}
                />
              ) : (
                <ContextualIntelligencePanel
                  currentZone={liveZone}
                  zoneIndex={0}
                />
              )}
            </ScrollView>
          </View>
        ) : null}
      </View>

      {/* ── SEARCH MODAL ── */}
      <Modal visible={searchOpen} transparent animationType="fade" onRequestClose={() => setSearchOpen(false)}>
        <View style={styles.searchModalScrim}>
          <View style={styles.searchModalCard}>
            <View style={styles.searchModalHead}>
              <Ionicons name="search" size={16} color="#38BDF8" />
              <TextInput
                autoFocus
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search city, district, or mountain sector..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                style={styles.searchInput}
              />
              <Pressable onPress={() => setSearchOpen(false)} style={styles.searchCloseBtn}>
                <Ionicons name="close" size={16} color="rgba(255, 255, 255, 0.7)" />
              </Pressable>
            </View>

            <ScrollView style={styles.searchResultsList} showsVerticalScrollIndicator={false}>
              <Text style={styles.searchSectionLabel}>KEY SEVERE WEATHER SECTORS</Text>
              {searchResults.map((item) => (
                <Pressable
                  key={item.name}
                  onPress={() => handleSelectLocation(item)}
                  style={styles.searchItem}
                >
                  <View style={styles.searchItemIcon}>
                    <Ionicons name="location" size={14} color="#38BDF8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.searchItemName}>{item.name}</Text>
                    <Text style={styles.searchItemSub}>
                      {item.region} · {item.state}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color="rgba(255, 255, 255, 0.3)" />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── DEDICATED EMERGENCY ASSISTANCE MODAL (Apple Glass) ── */}
      <EmergencyAssistanceModal
        visible={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
        activeDistrict={viewingLocationName}
        coords={viewCenter}
      />

      {/* ── REPORT COMPOSER MODAL ── */}
      <ReportComposer
        key={composerSession}
        initialDraft={composerDraft}
        visible={composerOpen}
        location={pin}
        onClose={() => setComposerOpen(false)}
        onPickLocation={(draft) => {
          setComposerDraft(draft);
          setComposerOpen(false);
          setPinMode(true);
        }}
        onSave={(value) => {
          addReport(value);
          setComposerOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000000",
    display: "flex",
    flexDirection: "column",
  },
  topHud: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 4,
    borderRadius: 18,
    backgroundColor: "rgba(28, 28, 30, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 20,
    zIndex: 35,
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.16)",
  },
  kokonutIslandContainer: {
    marginHorizontal: 12,
    marginBottom: 4,
    zIndex: 36,
  },
  quickStatesBar: {
    marginHorizontal: 12,
    marginBottom: 6,
    zIndex: 35,
  },
  quickStatesContent: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  stateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  stateChipActive: {
    backgroundColor: "rgba(10, 132, 255, 0.22)",
    borderColor: "#0A84FF",
  },
  stateChipIcon: {
    fontSize: 12,
  },
  stateChipLabel: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 11,
    fontWeight: "600",
    fontFamily: SF_PRO,
  },
  stateChipLabelActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  topActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  exploringChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(10, 132, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(10, 132, 255, 0.35)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    maxWidth: 105,
  },
  exploringChipText: {
    color: "#0A84FF",
    fontSize: 10.5,
    fontWeight: "700",
    fontFamily: SF_PRO,
  },
  searchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255, 255, 255, 0.09)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },
  searchBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
    fontFamily: SF_PRO,
    letterSpacing: 0.1,
  },
  gpsBtn: {
    width: 31,
    height: 31,
    borderRadius: 9,
    backgroundColor: "rgba(255, 255, 255, 0.09)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  gpsBtnActive: {
    backgroundColor: "rgba(10, 132, 255, 0.22)",
    borderColor: "#0A84FF",
  },
  emergencyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FF453A",
    paddingHorizontal: 11,
    paddingVertical: 6.5,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
    shadowColor: "#FF453A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 10,
    boxShadow: "0 3px 14px rgba(255, 69, 58, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.4)",
  },
  emergencyPillText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "800",
    fontFamily: SF_PRO,
    letterSpacing: 0.3,
  },
  sosLiveBeaconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  floatingMapSosBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FF453A",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
    shadowColor: "#FF453A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 12,
    boxShadow: "0 6px 20px rgba(255, 69, 58, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.4)",
  },
  floatingMapSosText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "800",
    fontFamily: SF_PRO,
    letterSpacing: 0.4,
  },
  horizonBar: {
    paddingVertical: 3,
    alignItems: "center",
    zIndex: 25,
  },
  workspace: {
    flex: 1,
    flexDirection: "row",
    position: "relative",
    overflow: "hidden",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  mobileBottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: "rgba(22, 22, 26, 0.94)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 25,
    zIndex: 40,
    overflow: "hidden",
  },
  mobileBottomSheetExpanded: {
    height: "80%",
    zIndex: 105,
    elevation: 35,
  },
  sheetHandleRow: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: "rgba(35, 35, 38, 0.9)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    marginBottom: 3,
  },
  handleActionHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  handleHintText: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 8.5,
    fontWeight: "700",
    fontFamily: SF_PRO,
    letterSpacing: 0.6,
  },
  dockTabsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(35, 35, 38, 0.9)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  dockTabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  dockTabBtnActive: {
    borderBottomColor: "#0A84FF",
    backgroundColor: "rgba(10, 132, 255, 0.12)",
  },
  dockTabLabel: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 11,
    fontWeight: "700",
    fontFamily: SF_PRO,
  },
  dockTabLabelActive: {
    color: "#FFFFFF",
  },
  alertCountBadge: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  alertCountText: {
    color: "#000000",
    fontSize: 9,
    fontWeight: "900",
    fontFamily: SF_PRO,
  },
  mobileSheetContent: {
    flex: 1,
  },
  sheetScrollContent: {
    padding: 12,
    paddingBottom: 72,
  },
  desktopSidebar: {
    width: 380,
    height: "100%",
    backgroundColor: "rgba(10, 15, 29, 0.96)",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255, 255, 255, 0.12)",
    display: "flex",
    flexDirection: "column",
  },
  desktopScroll: {
    flex: 1,
  },
  desktopScrollContent: {
    padding: 14,
    gap: 12,
  },
  searchModalScrim: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  searchModalCard: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "#0A0F1D",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  searchModalHead: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13.5,
    fontFamily: SF_PRO,
    padding: 0,
  },
  searchCloseBtn: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  searchResultsList: {
    maxHeight: 320,
    padding: 8,
  },
  searchSectionLabel: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    fontFamily: SF_PRO,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  searchItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
  },
  searchItemIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchItemName: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
    fontFamily: SF_PRO,
  },
  searchItemSub: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 10.5,
    fontFamily: SF_PRO,
    marginTop: 1,
  },
});
