export type AppLanguage = "en" | "ta";
export type ReportKind = "flood" | "stuck" | "medical" | "infrastructure";
export type ReportStatus = "Saved on this device" | "Marked for local follow-up";
export type RiskLevel = "safe" | "watch" | "warning" | "danger" | "critical";
export type MapLayer = "rain" | "wind" | "risk" | "imd" | "reports" | "water" | "relief" | "infrastructure" | "route" | "rescue";

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface LocalReport extends GeoPoint {
  id: string;
  kind: ReportKind;
  description: string;
  photoUri?: string;
  createdAt: string;
  status: ReportStatus;
}

export type ReportDraft = Pick<LocalReport, "kind" | "description" | "photoUri">;

export interface MapMarker extends GeoPoint {
  id: string;
  title: string;
  subtitle: string;
  type: "risk" | "report" | "reservoir" | "relief" | "infrastructure" | "imd" | "landslide" | "ndrf";
  level?: RiskLevel;
  reportKind?: ReportKind;
  extra?: Record<string, any>;
}

export interface ReservoirDemo {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  level: number;
  inflow: string;
  outflow: string;
  status: RiskLevel;
  trend: number[];
}

export interface UserLocationState {
  coords: GeoPoint | null;
  accuracyMeters: number | null;
  localityName: string;
  isGpsActive: boolean;
  permissionDenied: boolean;
}

export type ForecastHorizon = "6h" | "12h" | "24h" | "48h";
export type MonitoringRadiusKm = 5 | 10 | 25 | 50;

export interface SevereWeatherAlert {
  id: string;
  category: "THUNDERSTORM" | "HAILSTORM" | "CLOUDBURST" | "VERY_HEAVY_RAIN" | "LIGHTNING" | "HIGH_WIND" | "LANDSLIDE" | "CYCLONE";
  severity: "EXTREME" | "SEVERE" | "MODERATE" | "INFORMATION";
  headline: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
  isWithinRadius?: boolean;
  issuedAt: string;
  validUntil: string;
  source: string;
  precautions: string[];
  rainfallMmH?: number;
  windSpeedKmh?: number;
  windDirectionDeg?: number;
  windCardinal?: string;
  radarEchoDbz?: number;
  bulletinDetails?: string;
  day1Color?: "RED" | "ORANGE" | "YELLOW" | "GREEN";
  day2Color?: "RED" | "ORANGE" | "YELLOW" | "GREEN";
  day3Color?: "RED" | "ORANGE" | "YELLOW" | "GREEN";
  day4Color?: "RED" | "ORANGE" | "YELLOW" | "GREEN";
  day5Color?: "RED" | "ORANGE" | "YELLOW" | "GREEN";
}
