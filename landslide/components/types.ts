export type RiskLevel = 'Critical' | 'High' | 'Moderate' | 'Low';

/**
 * 1. Historical Landslide Record (ISRO/NRSC Landslide Atlas of India, GSI Historical Inventories)
 * Used strictly for historical training, validation, and historical risk context.
 * NEVER alters active road status or triggers road closures.
 */
export interface HistoricalLandslide {
  id: string;
  name: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  event_date: string;
  source: string; // 'ISRO / NRSC Landslide Atlas of India', 'GSI Historical Inventory'
  confidence: string;
  trigger_type: string;
  estimated_volume_m3?: number;
  fatalities?: number;
  road_impact_at_event_time?: string;
  is_historical: boolean;
  active_closure: boolean; // Always false
}

/**
 * 2. Confirmed / Detected Landslide Event
 * Authoritative detections from GSI, NDEM, ISRO, NHAI, State PWD, District Admin, or Verified Field Report.
 */
export interface ConfirmedLandslideEvent {
  id: string;
  event_code: string;
  event_name: string;
  district: string;
  state: string;
  event_timestamp: string;
  source: string; // 'GSI', 'ISRO/NRSC', 'NDEM', 'NHAI', 'State PWD', 'District Administration'
  verification_status: 'VERIFIED' | 'REPORTED' | 'UNVERIFIED';
  confidence: number;
  event_type: string;
  estimated_debris_m3?: number;
  lat: number;
  lng: number;
  authority: string;
}

/**
 * 3. Verified Road Incident & Disruption
 * Stored in road_incidents. ONLY status = 'BLOCKED' triggers routing exclusion.
 */
export interface RoadIncident {
  incident_id: string;
  road_name: string;
  road_class?: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  cause: 'LANDSLIDE' | 'DEBRIS' | 'FLOOD' | 'ACCIDENT' | 'ROAD_WORK' | 'OTHER';
  status: 'OPEN' | 'RESTRICTED' | 'BLOCKED' | 'UNKNOWN';
  source: string;
  authority: string;
  reported_time: string;
  verified_time?: string;
  verification_status: 'VERIFIED' | 'REPORTED' | 'UNVERIFIED';
  expected_reopening?: string;
  notes?: string;
  active: boolean;
  requires_routing_exclusion: boolean;
}

/**
 * 4. Model Predicted Landslide Risk / Susceptibility Unit
 * Output of ML Inference (NASA POWER + Copernicus DEM + Sentinel Soil Moisture).
 * Represents hazard probability. Road remains OPEN unless a confirmed RoadIncident exists.
 */
export interface HazardIncident {
  id: string;
  name: string;
  district: string;
  state: string;
  type: string;
  risk: RiskLevel;
  probability: number; // 0.00 to 1.00
  time: string;
  lat: number;
  lng: number;
  road: 'Blocked' | 'Restricted' | 'Open' | 'Bypass Active';
  roadName: string;
  roadIncidentStatus?: 'OPEN' | 'RESTRICTED' | 'BLOCKED'; // Explicit road state
  hasConfirmedBlockage?: boolean;
  blockageNotice?: string;
  impact: string;
  rainfall1h: number; // mm
  rainfall24h: number; // mm
  slopeDeg: number; // degrees
  soilMoisture: number; // 0-1
  topTrigger: string;
  exposedPopulation: number;
  // Geotechnical & Hydrological Parameters
  soilBearingCapacityKpa?: number;
  soilCohesionKpa?: number;
  frictionAngleDeg?: number;
  factorOfSafety?: number;
  poreWaterPressureKpa?: number;
  spi30d?: number;
  // Copernicus & NASA Remote Sensing Attributes
  insarDeformationMmYr?: number;
  sentinel2Ndwi?: number;
  copernicusGlo30Elev?: number;
  nasaGpmRain24h?: number;
  nasaPowerSoilMoisture?: number;
  lithology?: string;
  lastUpdated?: string;
  status?: string;
  severity?: string;
  evacuatedCount?: number;
  slopeStabilityIndex?: number;
  poreWaterKPa?: number;
  displacementMm?: number;
  velocityMmDay?: number;
}

export interface ShapItem {
  feature: string;
  impact: number;
  percentage: number;
}

export interface IsolatedVillage {
  id: string;
  name: string;
  district: string;
  state: string;
  population: number;
  elevation_m: number;
  coordinates: [number, number];
  blocked_road: string;
  primary_access_road?: string;
  isolation_probability: number;
  status: 'CRITICAL_ISOLATION' | 'HIGH_RISK' | 'MODERATE_RISK' | 'ACCESSIBLE';
  food_supplies_hrs: number;
  medical_staff: boolean;
  recommended_bypass: string;
  backup_route_status?: string;
  bypass_distance_km: number;
  nearest_shelter: string;
  last_contact: string;
}

export interface DeployedUnit {
  id: string;
  callsign: string;
  agency: 'NDRF' | 'SDRF' | 'BRO' | 'ITBP';
  sector: string;
  personnel: number;
  coordinates: [number, number];
  status: 'DEPLOYED' | 'CLEARING_DEBRIS' | 'EN_ROUTE' | 'EVACUATING';
  equipment: string;
}

export interface ReliefShelter {
  id: string;
  name: string;
  district: string;
  capacity: number;
  occupancy: number;
  coordinates: [number, number];
  status: 'OPEN' | 'NEAR_CAPACITY' | 'FULL';
  hasMedical: boolean;
  hasGenerator: boolean;
  distanceKm?: number;
}

export interface UpstreamProvider {
  id: string;
  name: string;
  category: string;
  endpoint: string;
  auth_type: string;
  token_configured: boolean;
  status: 'OPERATIONAL' | 'DEGRADED' | 'STANDBY';
  latency_ms: number;
  last_sync: string;
  refresh_rate: string;
  records_cached: number;
  description: string;
}

export interface CitizenReport {
  id: string;
  incident_type: string;
  severity: RiskLevel;
  description: string;
  lat: number;
  lng: number;
  location_name: string;
  road_blocked: boolean;
  casualties_reported: number;
  timestamp: string;
  status: 'PENDING_VERIFICATION' | 'VERIFIED_ACTIVE' | 'DISPATCHED';
}

export interface RouteDebugInfo {
  status: string;
  geometry_points: number;
  legs_count: number;
  distance_km: number;
  duration_minutes: number;
  maneuver_count: number;
  excluded_segments: number;
  geometry_validation: string;
  road_network_route: string;
  engine: string;
  origin?: {
    requested: { lat: number; lon: number };
    snapped: { lat: number; lon: number };
  };
  destination?: {
    requested: { lat: number; lon: number };
    snapped: { lat: number; lon: number };
  };
}

export interface ValhallaRouteState {
  coordinates: [number, number][];
  distanceKm: number;
  durationMinutes: number;
  safetyScore: number;
  landslideRisk: number;
  title: string;
  roadCondition: string;
  maneuvers: any[];
  legs: any[];
  originDetail?: any;
  destDetail?: any;
  debugInfo?: RouteDebugInfo;
  active: boolean;
}
