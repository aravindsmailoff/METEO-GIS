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
  { id: "DWR-CHY", type: "imd", title: "IMD DWR Chennai", subtitle: "Operational Coastal Doppler (Port Trust)", latitude: 13.0827, longitude: 80.2707 },
  { id: "DWR-MNG", type: "imd", title: "IMD DWR Mangaluru", subtitle: "Coastal Karnataka Doppler Network (Panambur)", latitude: 12.9141, longitude: 74.8560 },
  { id: "DWR-MUM", type: "imd", title: "IMD DWR Mumbai", subtitle: "Colaba & Veravali Dual-Pol Doppler Systems", latitude: 18.8900, longitude: 72.8100 },
  { id: "DWR-KOC", type: "imd", title: "IMD DWR Kochi", subtitle: "Malabar Radar Network (Naval Base)", latitude: 9.9312, longitude: 76.2673 },
  { id: "DWR-KOL", type: "imd", title: "IMD DWR Kolkata", subtitle: "Gangetic Delta Severe Weather Radar", latitude: 22.5726, longitude: 88.3639 },
  { id: "DWR-DEL", type: "imd", title: "IMD DWR Delhi", subtitle: "Mausam Bhavan Headquarters Doppler", latitude: 28.5892, longitude: 77.2218 },
  { id: "DWR-SHI", type: "imd", title: "IMD DWR Shimla", subtitle: "Kufri Himalayan Convective Radar", latitude: 31.1048, longitude: 77.1734 },
  { id: "DWR-VIZ", type: "imd", title: "IMD DWR Visakhapatnam", subtitle: "Bay of Bengal Cyclone Warning Radar", latitude: 17.6868, longitude: 83.2185 },
  { id: "DWR-GUW", type: "imd", title: "IMD DWR Guwahati", subtitle: "Brahmaputra Basin Severe Weather Radar", latitude: 26.1445, longitude: 91.7362 },
];

let _cachedLiveApiMarkers: MapMarker[] = [];

export async function fetchLiveBackendMarkers(): Promise<MapMarker[]> {
  try {
    const { getMeteoBackendUrl } = await import("@/lib/meteo/meteoBackendClient");
    const backend = getMeteoBackendUrl();
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 3500);

    const [stationsRes, warningsRes, hazardsRes] = await Promise.allSettled([
      fetch(`${backend}/api/live/stations`, { signal: ctrl.signal }),
      fetch(`${backend}/api/live/warnings`, { signal: ctrl.signal }),
      fetch(`${backend}/api/live/hazards`, { signal: ctrl.signal }),
    ]);
    clearTimeout(timeout);

    const newMarkers: MapMarker[] = [];

    // Real-time IMD Multi-Hazard Events (Thunderstorm, Hailstorm, Cyclone, Landslide, Cloudburst)
    if (hazardsRes.status === "fulfilled" && hazardsRes.value.ok) {
      const hData = await hazardsRes.value.json();
      const eventsList = Array.isArray(hData.events) ? hData.events : Array.isArray(hData.hazards) ? hData.hazards : [];
      for (const h of eventsList) {
        if (!isNaN(h.latitude) && !isNaN(h.longitude)) {
          newMarkers.push({
            id: `haz-${h.id}`,
            type: h.category === "LANDSLIDE" ? ("landslide" as const) : ("risk" as const),
            title: h.headline || `${h.category}: ${h.district}`,
            subtitle: `${h.summary || `${h.category} alert`} · Wind: ${h.windCardinal || "NNW"} ${h.windSpeedKmh || 32} km/h`,
            latitude: h.latitude,
            longitude: h.longitude,
            level: h.severity === "RED" ? "critical" : h.severity === "ORANGE" ? "danger" : "warning",
            extra: {
              id: h.id,
              category: h.category,
              severity: h.severity,
              headline: h.headline,
              district: h.district,
              state: h.state,
              rainfallRateMmH: h.rainfallRateMmH,
              windSpeedKmh: h.windSpeedKmh,
              windDirectionDeg: h.windDirectionDeg,
              windCardinal: h.windCardinal,
              issuedAt: h.issuedAtIST,
              validUntil: h.validUntilIST,
              source: h.source || "IMD Hydromet Hazard Engine",
              summary: h.summary,
            },
          });
        }
      }
    }

    // Real-time IMD AWS Weather Stations
    if (stationsRes.status === "fulfilled" && stationsRes.value.ok) {
      const data = await stationsRes.value.json();
      if (Array.isArray(data.stations)) {
        for (const st of data.stations.slice(0, 30)) {
          if (!isNaN(st.latitude) && !isNaN(st.longitude)) {
            newMarkers.push({
              id: `aws-${st.id}`,
              type: "imd" as const,
              title: st.stationName,
              subtitle: `Temp: ${st.temperatureC ?? 29}°C · Wind: ${st.windCardinal || "NNW"} ${st.windSpeedKmh} km/h · Rain: ${st.rainfall1hMm} mm`,
              latitude: st.latitude,
              longitude: st.longitude,
              extra: {
                temp: st.temperatureC,
                rh: st.humidityPercent,
                wind: st.windSpeedKmh,
                windDirectionDeg: st.windDirectionDeg,
                windCardinal: st.windCardinal,
                rain: st.rainfall1hMm,
                source: "Official IMD Automatic Weather Station (AWS)",
              },
            });
          }
        }
      }
    }

    // Real-time IMD District Warnings
    if (warningsRes.status === "fulfilled" && warningsRes.value.ok) {
      const data = await warningsRes.value.json();
      if (Array.isArray(data.warnings)) {
        for (const w of data.warnings) {
          if (w.currentAlertLevel !== "GREEN" && !isNaN(w.latitude) && !isNaN(w.longitude)) {
            newMarkers.push({
              id: `warn-${w.objId}`,
              type: "risk" as const,
              title: `IMD ${w.currentAlertLevel}: ${w.district}`,
              subtitle: `${w.currentWarning} (${w.state})`,
              latitude: w.latitude,
              longitude: w.longitude,
              level: w.currentAlertLevel === "RED" ? "critical" : w.currentAlertLevel === "ORANGE" ? "danger" : "warning",
              extra: {
                level: w.currentAlertLevel,
                warning: w.currentWarning,
                source: "IMD District Warning Division",
              },
            });
          }
        }
      }
    }

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

  const liveAlerts = getCachedLiveAlerts();
  const hazardMarkers: MapMarker[] = liveAlerts.map((alert) => ({
    id: `live-${alert.id}`,
    type: alert.category === "LANDSLIDE" ? ("landslide" as const) : ("risk" as const),
    title: alert.headline,
    subtitle: `${alert.district}, ${alert.state} · ${alert.source}`,
    latitude: alert.latitude,
    longitude: alert.longitude,
    level: alert.severity === "EXTREME" ? "critical" : alert.severity === "SEVERE" ? "danger" : "warning",
    extra: {
      category: alert.category,
      issuedAt: alert.issuedAt,
      validUntil: alert.validUntil,
      precautions: alert.precautions,
    },
  }));

  const operationalMarkers: MapMarker[] = [
    ...DEMO_MARKERS,
    ...RESERVOIRS.map((res) => ({
      id: `res-${res.id}`,
      type: "reservoir" as const,
      title: res.name,
      subtitle: `${res.level}% Capacity · Inflow: ${res.inflow}`,
      latitude: res.latitude,
      longitude: res.longitude,
      level: res.status,
    })),
  ];

  return [
    ...LIVE_IMD_RADAR_MARKERS,
    ..._cachedLiveApiMarkers,
    ...rescueMarkers,
    ...hazardMarkers,
    ...operationalMarkers,
    ...localMarkers,
  ];
}
