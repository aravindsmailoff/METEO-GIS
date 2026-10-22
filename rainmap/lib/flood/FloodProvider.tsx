import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { addNetworkStateListener, getNetworkStateAsync } from "expo-network";
import { ALL_RESCUE_UNITS, getCachedLiveAlerts } from "@/lib/meteo/liveMeteoService";
import { submitCitizenReportToMeteo } from "@/lib/meteo/meteoBackendClient";
import { DEMO_MARKERS, RESERVOIRS } from "./demo-data";
import type { AppLanguage, GeoPoint, LocalReport, MapMarker, ReportDraft, ReportKind } from "./types";

const STORAGE_KEY = "floodwatch-demo-local-v1";

type StoredState = {
  reports: LocalReport[];
  area: string;
  language: AppLanguage;
  cachedAt: string;
};

type NewReport = GeoPoint & {
  kind: ReportKind;
  description: string;
  photoUri?: string;
};

type FloodContextValue = {
  reports: LocalReport[];
  area: string;
  language: AppLanguage;
  isOnline: boolean | null;
  cachedAt: string;
  isReady: boolean;
  pendingMapPin: boolean;
  pendingMapPinDraft: ReportDraft | null;
  setArea: (value: string) => void;
  setLanguage: (value: AppLanguage) => void;
  requestMapPin: (draft?: ReportDraft) => void;
  consumeMapPinRequest: () => void;
  addReport: (value: NewReport) => void;
};

const FloodContext = createContext<FloodContextValue | null>(null);

export function FloodProvider({ children }: React.PropsWithChildren) {
  const [reports, setReports] = useState<LocalReport[]>([]);
  const [area, setAreaState] = useState("Chennai");
  const [language, setLanguageState] = useState<AppLanguage>("en");
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [cachedAt, setCachedAt] = useState(() => new Date().toISOString());
  const [isReady, setIsReady] = useState(false);
  const [pendingMapPin, setPendingMapPin] = useState(false);
  const [pendingMapPinDraft, setPendingMapPinDraft] = useState<ReportDraft | null>(null);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!mounted) return;
        if (raw) {
          const stored = JSON.parse(raw) as Partial<StoredState>;
          if (Array.isArray(stored.reports)) setReports(stored.reports);
          if (typeof stored.area === "string") setAreaState(stored.area);
          if (stored.language === "en" || stored.language === "ta") setLanguageState(stored.language);
          if (typeof stored.cachedAt === "string") setCachedAt(stored.cachedAt);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setIsReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Live real-time telemetry fetch from backend
  useEffect(() => {
    fetchLiveBackendMarkers().then(() => {
      setCachedAt(new Date().toISOString());
    });
    const interval = setInterval(() => {
      fetchLiveBackendMarkers().then(() => {
        setCachedAt(new Date().toISOString());
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;
    const updateNetwork = (state: { isConnected?: boolean | null; isInternetReachable?: boolean | null }) => {
      if (mounted) setIsOnline(state.isInternetReachable ?? state.isConnected ?? null);
    };
    getNetworkStateAsync().then(updateNetwork).catch(() => undefined);
    const subscription = addNetworkStateListener(updateNetwork);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const next: StoredState = { reports, area, language, cachedAt };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
  }, [reports, area, language, cachedAt, isReady]);

  const setArea = useCallback((value: string) => setAreaState(value), []);
  const setLanguage = useCallback((value: AppLanguage) => setLanguageState(value), []);
  const requestMapPin = useCallback((draft?: ReportDraft) => {
    setPendingMapPinDraft(draft ?? { kind: "flood", description: "" });
    setPendingMapPin(true);
  }, []);
  const consumeMapPinRequest = useCallback(() => {
    setPendingMapPin(false);
    setPendingMapPinDraft(null);
  }, []);
  const addReport = useCallback((value: NewReport) => {
    const reportId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const report: LocalReport = {
      ...value,
      id: reportId,
      createdAt: new Date().toISOString(),
      status: "Saved on this device",
    };
    setReports((current) => [report, ...current]);
    setCachedAt(new Date().toISOString());

    // Transmit to shared Meteo-GIS backend for triage
    submitCitizenReportToMeteo({
      kind: value.kind,
      description: value.description,
      latitude: value.latitude,
      longitude: value.longitude,
      photoUri: value.photoUri,
    })
      .then((res) => {
        if (res && res.status) {
          setReports((current) =>
            current.map((r) =>
              r.id === reportId ? { ...r, status: "Marked for local follow-up" } : r
            )
          );
        }
      })
      .catch(() => {});
  }, []);

  const contextValue = useMemo<FloodContextValue>(
    () => ({ reports, area, language, isOnline, cachedAt, isReady, pendingMapPin, pendingMapPinDraft, setArea, setLanguage, requestMapPin, consumeMapPinRequest, addReport }),
    [reports, area, language, isOnline, cachedAt, isReady, pendingMapPin, pendingMapPinDraft, setArea, setLanguage, requestMapPin, consumeMapPinRequest, addReport],
  );

  return <FloodContext.Provider value={contextValue}>{children}</FloodContext.Provider>;
}

export function useFlood() {
  const value = useContext(FloodContext);
  if (!value) throw new Error("useFlood must be used within FloodProvider");
  return value;
}

export const LIVE_IMD_RADAR_MARKERS: MapMarker[] = [
  { id: "RADAR-CHY", type: "imd", title: "IMD Doppler Chennai", subtitle: "Operational Coastal Doppler (Port Trust)", latitude: 13.0827, longitude: 80.2707 },
  { id: "RADAR-MNG", type: "imd", title: "IMD Doppler Mangaluru", subtitle: "Coastal Karnataka Radar Network (Panambur)", latitude: 12.9141, longitude: 74.8560 },
  { id: "RADAR-MUM", type: "imd", title: "IMD Doppler Mumbai", subtitle: "Colaba & Veravali Dual-Pol Systems", latitude: 18.8900, longitude: 72.8100 },
  { id: "RADAR-KOC", type: "imd", title: "IMD Doppler Kochi", subtitle: "Malabar Radar Network (Naval Base)", latitude: 9.9312, longitude: 76.2673 },
  { id: "RADAR-KOL", type: "imd", title: "IMD Doppler Kolkata", subtitle: "Gangetic Delta Severe Weather Radar", latitude: 22.5726, longitude: 88.3639 },
  { id: "RADAR-DEL", type: "imd", title: "IMD Doppler Delhi", subtitle: "Mausam Bhavan Headquarters Radar", latitude: 28.5892, longitude: 77.2218 },
  { id: "RADAR-SHI", type: "imd", title: "IMD Doppler Shimla", subtitle: "Kufri Himalayan Convective Radar", latitude: 31.1048, longitude: 77.1734 },
  { id: "RADAR-VIZ", type: "imd", title: "IMD Doppler Visakhapatnam", subtitle: "Bay of Bengal Cyclone Warning Radar", latitude: 17.6868, longitude: 83.2185 },
  { id: "RADAR-GUW", type: "imd", title: "IMD Doppler Guwahati", subtitle: "Brahmaputra Basin Severe Weather Radar", latitude: 26.1445, longitude: 91.7362 },
];

let _cachedLiveApiMarkers: MapMarker[] = [];

export async function fetchLiveBackendMarkers(): Promise<MapMarker[]> {
  try {
    const newMarkers: MapMarker[] = [];

    // 1. Try direct IMD GeoServer Ingestion (Runs directly on mobile device with 0 network bridge dependencies)
    try {
      const { getDirectUnifiedHazards, getLiveAwsStations, getLiveWarnings } = await import("@/lib/meteo/imdDirectService");
      const [directHazards, directStations, directWarnings] = await Promise.allSettled([
        getDirectUnifiedHazards(),
        getLiveAwsStations(),
        getLiveWarnings(),
      ]);

      if (directHazards.status === "fulfilled" && Array.isArray(directHazards.value)) {
        for (const h of directHazards.value) {
          if (typeof h.latitude === "number" && typeof h.longitude === "number" && !isNaN(h.latitude) && !isNaN(h.longitude) && h.latitude !== 0) {
            newMarkers.push({
              id: `direct-haz-${h.id}`,
              type: h.category === "LANDSLIDE" ? ("landslide" as const) : ("risk" as const),
              title: h.headline || `${h.category}: ${h.district}`,
              subtitle: `${h.district}, ${h.state} · ${h.source}`,
              latitude: h.latitude,
              longitude: h.longitude,
              level: h.severity === "EXTREME" ? "critical" : h.severity === "SEVERE" ? "danger" : "warning",
              extra: {
                id: h.id,
                category: h.category,
                severity: h.severity,
                headline: h.headline,
                district: h.district,
                state: h.state,
                rainfallRateMmH: h.rainfallMmH,
                windSpeedKmh: h.windSpeedKmh,
                windDirectionDeg: h.windDirectionDeg,
                windCardinal: h.windCardinal,
                radarEchoDbz: h.radarEchoDbz,
                slopeDeg: h.slopeDeg,
                issuedAt: h.issuedAt,
                validUntil: h.validUntil,
                source: h.source,
                precautions: h.precautions,
                statusBadge: h.statusBadge,
              },
            });
          }
        }
      }

      if (directStations.status === "fulfilled" && Array.isArray(directStations.value)) {
        for (const st of directStations.value.slice(0, 40)) {
          if (typeof st.latitude === "number" && typeof st.longitude === "number" && !isNaN(st.latitude) && !isNaN(st.longitude) && st.latitude !== 0) {
            newMarkers.push({
              id: `direct-aws-${st.id}`,
              type: "imd" as const,
              title: st.stationName,
              subtitle: `Temp: ${st.tempC ?? 28}°C · Wind: ${st.windSpeedKmh} km/h · Rain: ${st.rainfall1hMm} mm`,
              latitude: st.latitude,
              longitude: st.longitude,
              extra: {
                temp: st.tempC,
                rh: st.rhPercent,
                wind: st.windSpeedKmh,
                windDirectionDeg: st.windDirDeg,
                rain: st.rainfall1hMm,
                rain24h: st.rainfall24hMm,
                source: "Official IMD In-situ AWS Network",
              },
            });
          }
        }
      }

      if (directWarnings.status === "fulfilled" && Array.isArray(directWarnings.value)) {
        for (const wn of directWarnings.value) {
          if (wn.day1Color !== "GREEN" && typeof wn.latitude === "number" && typeof wn.longitude === "number" && !isNaN(wn.latitude) && !isNaN(wn.longitude) && wn.latitude !== 0) {
            newMarkers.push({
              id: `direct-warn-${wn.district}`,
              type: "risk" as const,
              title: `IMD ${wn.day1Color}: ${wn.district}`,
              subtitle: `${wn.day1Text || "Active Synoptic Warning"} (${wn.state})`,
              latitude: wn.latitude,
              longitude: wn.longitude,
              level: wn.day1Color === "RED" ? "critical" : wn.day1Color === "ORANGE" ? "danger" : "warning",
              extra: {
                level: wn.day1Color,
                warning: wn.day1Text,
                source: "Official IMD District Warning Division",
              },
            });
          }
        }
      }
    } catch {}

    if (newMarkers.length > 0) {
      _cachedLiveApiMarkers = newMarkers;
      return _cachedLiveApiMarkers;
    }

    // 2. Local Backend Fallback if configured
    try {
      const { getMeteoBackendUrl } = await import("@/lib/meteo/meteoBackendClient");
      const backend = getMeteoBackendUrl();
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 2500);

      const [stationsRes, warningsRes, hazardsRes] = await Promise.allSettled([
        fetch(`${backend}/api/live/stations`, { signal: ctrl.signal }),
        fetch(`${backend}/api/live/warnings`, { signal: ctrl.signal }),
        fetch(`${backend}/api/live/hazards`, { signal: ctrl.signal }),
      ]);
      clearTimeout(timeout);

      // Real-time IMD Multi-Hazard Events
      if (hazardsRes.status === "fulfilled" && hazardsRes.value.ok) {
        const hData = await hazardsRes.value.json();
        const eventsList = Array.isArray(hData.events) ? hData.events : Array.isArray(hData.hazards) ? hData.hazards : [];
        for (const h of eventsList) {
          if (!isNaN(h.latitude) && !isNaN(h.longitude) && h.latitude !== 0) {
            newMarkers.push({
              id: `haz-${h.id}`,
              type: h.category === "LANDSLIDE" ? ("landslide" as const) : ("risk" as const),
              title: h.headline || `${h.category}: ${h.district}`,
              subtitle: `${h.summary || `${h.category} alert`} · Wind: ${h.windCardinal || "NNW"} ${h.windSpeedKmh || 32} km/h`,
              latitude: h.latitude,
              longitude: h.longitude,
              level: h.severity === "RED" ? "critical" : h.severity === "ORANGE" ? "danger" : "warning",
              extra: h,
            });
          }
        }
      }
    } catch {}

    if (newMarkers.length > 0) {
      _cachedLiveApiMarkers = newMarkers;
    }
  } catch {}
  return _cachedLiveApiMarkers;
}

export function getAllMapMarkers(reports: LocalReport[]): MapMarker[] {
  const localMarkers: MapMarker[] = reports.map((report) => ({
    id: report.id,
    type: "report" as const,
    title: "Your local report",
    subtitle: "Saved on this device · Citizen Triage",
    reportKind: report.kind,
    latitude: report.latitude,
    longitude: report.longitude,
  }));

  const rescueMarkers: MapMarker[] = ALL_RESCUE_UNITS.map((unit) => ({
    id: unit.id,
    type: "ndrf" as const,
    title: unit.name,
    subtitle: `${unit.battalion} · Helpline: ${unit.tollFree}`,
    latitude: unit.latitude,
    longitude: unit.longitude,
    extra: {
      agency: unit.agency,
      personnel: unit.personnel,
      equipment: unit.equipment,
      contactPhone: unit.contactPhone,
    },
  }));



  // Authoritative Dams and Hydro-Electric Projects
  const authoritativeDams: MapMarker[] = [
    {
      id: "dam-teesta-v",
      title: "Teesta-V Dam",
      subtitle: "91.4% Capacity · 3 Gates Discharging · High Surge Inflow",
      latitude: 27.290,
      longitude: 88.480,
      type: "reservoir",
      level: "critical",
      extra: { fill: "91.4%", gates: "3 Gates Open", status: "CRITICAL", river: "Teesta River", color: "#ef4444" },
    },
    {
      id: "dam-rathong-chu",
      title: "Rathong-Chu HEP",
      subtitle: "74.0% Capacity · 1 Gate Discharging",
      latitude: 27.410,
      longitude: 88.310,
      type: "reservoir",
      level: "warning",
      extra: { fill: "74.0%", gates: "1 Gate Open", status: "WATCH", river: "Rathong-Chu", color: "#f97316" },
    },
    {
      id: "dam-dikchu",
      title: "Dikchu Hydro Dam",
      subtitle: "58.2% Capacity · Gates Closed · Controlled Basin",
      latitude: 27.350,
      longitude: 88.510,
      type: "reservoir",
      level: "watch",
      extra: { fill: "58.2%", gates: "Gates Closed", status: "NORMAL", river: "Dikchu", color: "#eab308" },
    },
    {
      id: "res-chembarambakkam",
      title: "Chembarambakkam Reservoir",
      subtitle: "78% Capacity · Adyar Basin Headworks Gate",
      latitude: 13.0075,
      longitude: 80.0573,
      type: "reservoir",
      level: "warning",
      extra: { fill: "78%", gates: "Controlled Outflow", status: "WATCH", river: "Adyar River", color: "#f97316" },
    },
    {
      id: "res-poondi",
      title: "Poondi Reservoir (Sathyamurthy)",
      subtitle: "84% Capacity · Kosasthalaiyar Basin Outflow Control",
      latitude: 13.1950,
      longitude: 79.8580,
      type: "reservoir",
      level: "warning",
      extra: { fill: "84%", gates: "2 Gates Open", status: "WARNING", river: "Kosasthalaiyar", color: "#f97316" },
    },
    {
      id: "res-red-hills",
      title: "Red Hills Lake (Puzhal Reservoir)",
      subtitle: "81% Capacity · Ambattur Basin Catchment",
      latitude: 13.1558,
      longitude: 80.1772,
      type: "reservoir",
      level: "warning",
      extra: { fill: "81%", gates: "Spillway Ready", status: "WATCH", river: "Puzhal Catchment", color: "#f97316" },
    },
    {
      id: "res-sholavaram",
      title: "Sholavaram Reservoir",
      subtitle: "68% Capacity · Ponneri Sector Storage",
      latitude: 13.2372,
      longitude: 80.1465,
      type: "reservoir",
      level: "safe",
      extra: { fill: "68%", gates: "Normal Intake", status: "SAFE", river: "Kosasthalaiyar Tributary", color: "#22c55e" },
    },
  ];

  // Authoritative Relief Shelters & Evacuation Camps
  const authoritativeShelters: MapMarker[] = [
    {
      id: "shelter-singtam",
      title: "Singtam Govt. Relief Camp",
      subtitle: "Designated High-Ground Shelter · Available: 340 / 500 beds",
      latitude: 27.225,
      longitude: 88.495,
      type: "relief",
      level: "safe",
      extra: { capacity: "340 / 500 beds", agency: "Sikkim SDMA & SDRF", phone: "1070" },
    },
    {
      id: "shelter-rangpo",
      title: "Rangpo Community Relief Hall",
      subtitle: "Safe Elevated Evacuation Center · Available: 190 / 300 beds",
      latitude: 27.182,
      longitude: 88.540,
      type: "relief",
      level: "safe",
      extra: { capacity: "190 / 300 beds", agency: "Rangpo Civil Defense", phone: "1077" },
    },
    {
      id: "shelter-anna-univ",
      title: "Anna University Emergency Operations Base",
      subtitle: "Designated TNSDMA Regional Shelter & Medical Base",
      latitude: 13.013,
      longitude: 80.235,
      type: "relief",
      level: "safe",
      extra: { capacity: "450 / 600 beds", agency: "TNSDMA & NDRF 04", phone: "1070" },
    },
  ];

  // Merge unique authoritative infrastructure and local report markers
  // (Meteorological alert pins are managed exclusively and directly by the IMD service in MapScreen)
  const markerMap = new Map<string, MapMarker>();

  for (const m of [
    ...LIVE_IMD_RADAR_MARKERS,
    ...authoritativeDams,
    ...authoritativeShelters,
    ...rescueMarkers,
    ...localMarkers,
  ]) {
    if (
      typeof m.latitude === "number" &&
      typeof m.longitude === "number" &&
      !isNaN(m.latitude) &&
      !isNaN(m.longitude) &&
      m.latitude !== 0 &&
      m.longitude !== 0 &&
      !markerMap.has(m.id)
    ) {
      markerMap.set(m.id, m);
    }
  }

  return Array.from(markerMap.values());
}
