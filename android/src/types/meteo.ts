export type DataState = 'loading' | 'success' | 'stale' | 'error' | 'offline' | 'empty';

export interface CachedPayload<T> {
  data: T;
  fetchedAt: number;
  source: string;
  expiresAt: number;
}

export type HazardSeverity = 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN';

export type FocusHazardCategory =
  | 'CYCLONE'
  | 'CLOUDBURST'
  | 'HAIL'
  | 'THUNDERSTORM'
  | 'VERY_HEAVY_RAIN'
  | 'SEVERE_WEATHER'
  | 'BACKGROUND';

export type BaseMapId =
  | 'nasa_clouds'
  | 'bhuvan_sat'
  | 'bhuvan_2d'
  | 'bhuvan_topo'
  | 'bhuvan_infra'
  | 'bhuvan_flood'
  | 'bhuvan_drainage'
  | 'bhuvan_admin'
  | 'nasa_precip';

export type BottomSheetSnap = 'collapsed' | 'half' | 'full';

export type InspectorTab =
  | 'overview'
  | 'warnings'
  | 'obs'
  | 'impact'
  | 'data'
  | 'analytics';

export type OperationalMode = 'LIVE' | 'HISTORICAL';

export interface DerivedHazardEvent {
  id: string;
  districtId: string;
  district: string;
  state: string;
  category: FocusHazardCategory;
  categoryLabels?: string[];
  severity: HazardSeverity;
  isSevere: boolean;
  cloudburstStatus?: 'NONE' | 'ADVISORY' | 'CONFIRMED';
  triggeringStation?: string;
  rainfallRateMmH?: number;
  issuedAt: string;
  issuedAtIST: string;
  validUntil: string;
  validUntilIST: string;
  validUntilEpoch: number;
  sourceEndpoint: string;
  confidence: 'HIGH' | 'MEDIUM';
  latitude: number;
  longitude: number;
  summary: string;
  headline?: string;
  affectedPopulationEstimate?: {
    fieldOfficers: number;
    tourists: number;
    citizens: number;
    total: number;
  };
}

export interface CityHotspotPinpoint {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  elevationM: number;
  waterloggingDepthM: number;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  affectedStructures: number;
  drainageIssue: string;
  recommendation: string;
}

export interface PluvialFloodZone {
  id: string;
  zoneName: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  demElevationM: number;
  relativeDepressionM: number;
  liveRainRateMmH: number;
  cumulativeRain24hMm: number;
  pluvialFloodRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  trend: 'RISING' | 'STABLE' | 'RECEDING';
  confidence: 'HIGH' | 'MEDIUM';
  freshness: string;
  drainageContext: string;
  estimatedHousesAtRisk: number;
  polygon?: [number, number][];
  cityHotspots?: CityHotspotPinpoint[];
}

export interface HazardCounts {
  totalEvents: number;
  severeEventsCount: number;
  displayedCount: number;
  thunderstorms: number;
  hailstorms: number;
  cloudbursts: number;
}

export interface UserSegmentation {
  touristsInRedZones: number;
  fieldOfficersInRedZones: number;
  citizensInRedZones: number;
  totalPersonsAtRisk: number;
}

export interface HazardsPayload {
  status: string;
  events: DerivedHazardEvent[];
  pluvialFloodZones: PluvialFloodZone[];
  counts: HazardCounts;
  userSegmentation: UserSegmentation;
  isReferenceSnapshot?: boolean;
}

export interface ValidatedDistrictWarning {
  objId: string;
  district: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  date: string;
  updatedAtIST: string;
  day1Color: HazardSeverity;
  day2Color: HazardSeverity;
  day3Color: HazardSeverity;
  day4Color: HazardSeverity;
  day5Color: HazardSeverity;
  currentAlertLevel: HazardSeverity;
  currentWarning?: string;
  day1Warning: string;
  day2Warning: string;
  day3Warning: string;
  day4Warning: string;
  day5Warning: string;
  source: string;
  sourceProduct: string;
}

export interface WarningsPayload {
  status: string;
  warnings: ValidatedDistrictWarning[];
  activeAlertsCount: number;
  totalDistricts: number;
  isReferenceSnapshot?: boolean;
}

export interface ValidatedStationObservation {
  id: string;
  stationName: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  observationDate: string;
  observationTime: string;
  observationTimestampIST: string;
  dataAgeMinutes: number;
  temperatureC: number | null;
  humidityPercent: number | null;
  windSpeedKmh: number | null;
  windDirectionDeg: number | null;
  pressureHpa: number | null;
  rainfall1hMm: number | null;
  rainfall24hMm: number | null;
  weatherCode: string | null;
  weatherMessage: string | null;
  status: 'LIVE' | 'NEAR-REAL-TIME' | 'DELAYED';
  source: string;
  sourceProduct: string;
}

export interface RainfallObservationPoint {
  id: string;
  stationName: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  rainfall1hMm: number;
  rainfall24hMm: number;
  category: 'NO_RAIN' | 'LIGHT' | 'MODERATE' | 'HEAVY' | 'VERY_HEAVY' | 'EXTREMELY_HEAVY';
  observationTimestampIST: string;
  dataAgeMinutes: number;
  observationType: 'GROUND_OBSERVATION';
  source: string;
}

export interface StationsPayload {
  status: string;
  stations: ValidatedStationObservation[];
  rainfallPoints: RainfallObservationPoint[];
  totalCount: number;
  isReferenceSnapshot?: boolean;
}

export interface SelectedLocationEvidence {
  lat: number;
  lng: number;
  locationName: string;
  district: string;
  state: string;
  severity: HazardSeverity;
  selectionKind: 'warning' | 'hazard' | 'zone' | 'station' | 'search' | 'gps';
  headline: string;
  summary: string;
  source: string;
  validUntilEpoch?: number;
  validUntilIST?: string;
  temperatureC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  pressureHpa: number;
  rainfall1hMm: number;
  rainfall24hMm: number;
  stationName: string;
  stationDistanceKm: number;
  radarCode: string;
  radarName: string;
  radarDistanceKm: number;
  observationTimestampIST: string;
}

export interface TelemetryProvider {
  id: string;
  name: string;
  category: string;
  endpoint: string;
  auth_type: string;
  token_configured: boolean;
  status: string;
  latency_ms: number;
  last_sync: string;
  refresh_rate: string;
  records_cached: number;
  description: string;
}

export interface ActiveRouteOverlay {
  mode: 'safe' | 'emergency';
  distanceKm: number;
  durationMin: number;
  summary: string;
  coordinates: [number, number][]; // [lng, lat] pairs
}

export interface LayerPreferences {
  baseMap: BaseMapId;
  showDistrictWarnings: boolean;
  showLiveRainfall: boolean;
  showAwsStations: boolean;
  showDwrRings: boolean;
  showPluvialFloodLayer: boolean;
}
