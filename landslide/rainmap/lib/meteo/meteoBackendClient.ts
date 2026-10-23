import { Platform } from "react-native";
import Constants from "expo-constants";
import type { LocalReport, ReportKind } from "@/lib/flood/types";

/**
 * Resolves the active Meteo-GIS unified backend address across platforms:
 * - Web Browser: http://localhost:3000
 * - Android Emulator: http://10.0.2.2:3000
 * - Physical Phone / Standby: Host LAN IP (10.152.124.118:3000) or auto-detected debugger host
 */
export function getMeteoBackendUrl(): string {
  // 1. Explicit override via EXPO_PUBLIC_METEO_GIS_URL (used for production cloud hosting & Play Store)
  const envUrl = process.env.EXPO_PUBLIC_METEO_GIS_URL;
  if (envUrl && envUrl.startsWith("http")) {
    return envUrl.replace(/\/+$/, "");
  }

  if (Platform.OS === "web") {
    return "http://localhost:3001";
  }

  // 2. Physical device automatic LAN IP detection during Expo development
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri;

  if (hostUri) {
    const ip = hostUri.split(":")[0];
    if (ip && ip !== "localhost" && ip !== "127.0.0.1") {
      return `http://${ip}:3001`;
    }
  }

  // 3. Android LAN fallback
  if (Platform.OS === "android") {
    const lanUrl = process.env.EXPO_PUBLIC_METEO_GIS_LAN_URL;
    return lanUrl ? lanUrl.replace(/\/+$/, "") : "http://10.0.2.2:3001";
  }

  return "http://localhost:3001";
}

export interface BackendHazardsResponse {
  kpis?: {
    warnings: number;
    stations: number;
    rainPoints: number;
    nowcasts: number;
  };
  events?: any[];
  pinpoints?: any[];
  stormCells?: any[];
}

export interface BackendIncidentsResponse {
  status: string;
  count: number;
  incidents: any[];
}

export interface BackendNowcastResponse {
  station_name?: string;
  distance_km?: number;
  wind_assessment?: {
    sustained_kmh: number;
    gust_kmh: number;
    direction_degrees: number;
    cardinal: string;
  };
  observations?: {
    parameter: string;
    value: number;
    unit: string;
  }[];
  alerts?: any[];
}

export interface CitizenReportSubmissionResult {
  report_id: string;
  status: string;
  received_at: string;
  message: string;
}

/**
 * Fetches real-time Meteo-GIS hazard intelligence from the shared backend
 */
export async function fetchMeteoHazards(): Promise<BackendHazardsResponse | null> {
  const backend = getMeteoBackendUrl();
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(`${backend}/api/live/hazards`, { signal: ctrl.signal });
    clearTimeout(timeout);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Offline or unreachable
  }
  return null;
}

/**
 * Fetches real-time incidents from the shared backend
 */
export async function fetchMeteoIncidents(state?: string, district?: string): Promise<BackendIncidentsResponse | null> {
  const backend = getMeteoBackendUrl();
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 3000);
    const q = new URLSearchParams();
    if (state) q.set("state", state);
    if (district) q.set("district", district);

    const res = await fetch(`${backend}/api/incidents?${q.toString()}`, { signal: ctrl.signal });
    clearTimeout(timeout);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Offline or unreachable
  }
  return null;
}

/**
 * Fetches live Doppler radar nowcast observations for given GPS coordinates
 */
export async function fetchMeteoNowcast(lat: number, lng: number): Promise<BackendNowcastResponse | null> {
  const backend = getMeteoBackendUrl();
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(`${backend}/api/imd/nowcast?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}`, { signal: ctrl.signal });
    clearTimeout(timeout);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Offline or unreachable
  }
  return null;
}

/**
 * Submits citizen report directly into shared Meteo-GIS backend for NDRF triage
 */
export async function submitCitizenReportToMeteo(report: {
  kind: ReportKind;
  description: string;
  latitude: number;
  longitude: number;
  photoUri?: string;
}): Promise<CitizenReportSubmissionResult | null> {
  const backend = getMeteoBackendUrl();
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 4000);

    const payload = {
      incident_type: report.kind.toUpperCase(),
      severity: report.kind === "medical" || report.kind === "stuck" ? "CRITICAL" : "HIGH",
      description: report.description,
      latitude: report.latitude,
      longitude: report.longitude,
      road_blocked: report.kind === "infrastructure",
      photo_uri: report.photoUri || null,
      source: "CITIZEN_MOBILE_APP",
    };

    const res = await fetch(`${backend}/api/citizen/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Offline or unreachable
  }
  return null;
}
