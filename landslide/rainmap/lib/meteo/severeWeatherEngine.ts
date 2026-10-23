import type { GeoPoint, MonitoringRadiusKm, SevereWeatherAlert } from "../flood/types";
import { METEO_GIS_ZONES } from "./meteoGisData";

/**
 * Calculates Haversine distance between two coordinates in kilometers
 */
export function calculateDistanceKm(p1: GeoPoint, p2: GeoPoint): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((p2.latitude - p1.latitude) * Math.PI) / 180;
  const dLon = ((p2.longitude - p1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.latitude * Math.PI) / 180) *
      Math.cos((p2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export { OFFICIAL_PRECAUTIONS } from "./precautions";

/**
 * Searchable Indian localities and districts for quick map jump
 */
export interface SearchableLocation {
  name: string;
  state: string;
  coords: GeoPoint;
  region: string;
}

export const SEARCHABLE_LOCATIONS: SearchableLocation[] = [
  { name: "Chennai", state: "Tamil Nadu", coords: { latitude: 13.0827, longitude: 80.2707 }, region: "Coastal Tamil Nadu" },
  { name: "Coimbatore", state: "Tamil Nadu", coords: { latitude: 11.0168, longitude: 76.9558 }, region: "Kongu Region" },
  { name: "Nilgiris (Ooty)", state: "Tamil Nadu", coords: { latitude: 11.4102, longitude: 76.695 }, region: "Nilgiri Biosphere" },
  { name: "Madurai", state: "Tamil Nadu", coords: { latitude: 9.9252, longitude: 78.1198 }, region: "South Tamil Nadu" },
  { name: "Tiruvallur", state: "Tamil Nadu", coords: { latitude: 13.1432, longitude: 79.9079 }, region: "Kosasthalaiyar Basin" },
  { name: "Chengalpattu", state: "Tamil Nadu", coords: { latitude: 12.6922, longitude: 79.9774 }, region: "Palar Catchment" },
  { name: "Bengaluru", state: "Karnataka", coords: { latitude: 12.9716, longitude: 77.5946 }, region: "South Interior" },
  { name: "Mangaluru", state: "Karnataka", coords: { latitude: 12.9141, longitude: 74.856 }, region: "Coastal Karnataka" },
  { name: "Wayanad", state: "Kerala", coords: { latitude: 11.6854, longitude: 76.132 }, region: "Western Ghats" },
  { name: "Kochi", state: "Kerala", coords: { latitude: 9.9312, longitude: 76.2673 }, region: "Malabar Coast" },
  { name: "Hyderabad", state: "Telangana", coords: { latitude: 17.385, longitude: 78.4867 }, region: "Deccan Plateau" },
  { name: "Mumbai", state: "Maharashtra", coords: { latitude: 19.076, longitude: 72.8777 }, region: "Konkan Coast" },
  { name: "Delhi NCR", state: "Delhi", coords: { latitude: 28.6139, longitude: 77.209 }, region: "Yamuna Basin" },
  { name: "Kolkata", state: "West Bengal", coords: { latitude: 22.5726, longitude: 88.3639 }, region: "Gangetic Delta" },
];

import { getCachedLiveAlerts } from "./liveMeteoService";
import type { DirectImdHazard } from "./imdDirectService";

/**
 * Transforms direct IMD hazards from government GeoServer into SevereWeatherAlert
 */
export function mapDirectImdHazardsToSevereAlerts(hazards: DirectImdHazard[]): SevereWeatherAlert[] {
  return hazards.map((h) => ({
    id: h.id,
    category: h.category,
    severity: h.severity,
    headline: h.headline,
    district: h.district,
    state: h.state,
    latitude: h.latitude,
    longitude: h.longitude,
    issuedAt: h.issuedAt,
    validUntil: h.validUntil,
    source: h.source,
    precautions: h.precautions,
    rainfallMmH: h.rainfallMmH,
    windSpeedKmh: h.windSpeedKmh,
    windDirectionDeg: h.windDirectionDeg,
    windCardinal: h.windCardinal,
    radarEchoDbz: h.radarEchoDbz,
    slopeDeg: h.slopeDeg,
    statusBadge: h.statusBadge,
    bulletinDetails: h.bulletinDetails,
    day1Color: h.day1Color,
    day2Color: h.day2Color,
    day3Color: h.day3Color,
    day4Color: h.day4Color,
    day5Color: h.day5Color,
  }));
}

/**
 * Builds normalized severe weather alerts from live IMD telemetry
 */
export function getAllSevereAlerts(
  referenceLocation?: GeoPoint | null,
  liveAlertsOverride?: SevereWeatherAlert[] | null
): SevereWeatherAlert[] {
  const alerts: SevereWeatherAlert[] =
    liveAlertsOverride && liveAlertsOverride.length > 0
      ? liveAlertsOverride
      : getCachedLiveAlerts();

  if (referenceLocation && alerts.length > 0) {
    return alerts.map((alert) => {
      const distanceKm = calculateDistanceKm(referenceLocation, {
        latitude: alert.latitude,
        longitude: alert.longitude,
      });
      return { ...alert, distanceKm };
    });
  }

  return alerts;
}

/**
 * Filters and prioritizes alerts within user's configured monitoring radius
 */
export function getNearbyAlerts(
  center: GeoPoint,
  radiusKm: MonitoringRadiusKm,
  allAlerts: SevereWeatherAlert[]
): {
  nearbyAlerts: SevereWeatherAlert[];
  approachingAlerts: SevereWeatherAlert[];
  highestPriorityAlert: SevereWeatherAlert | null;
} {
  const alertsWithDist = allAlerts.map((a) => {
    const dist = calculateDistanceKm(center, { latitude: a.latitude, longitude: a.longitude });
    return {
      ...a,
      distanceKm: dist,
      isWithinRadius: dist <= radiusKm,
    };
  });

  const nearby = alertsWithDist
    .filter((a) => a.distanceKm! <= radiusKm)
    .sort((a, b) => {
      // Priority 1: EXTREME before SEVERE before MODERATE
      const rank = (s: string) => (s === "EXTREME" ? 3 : s === "SEVERE" ? 2 : 1);
      const diff = rank(b.severity) - rank(a.severity);
      if (diff !== 0) return diff;
      return (a.distanceKm || 0) - (b.distanceKm || 0);
    });

  // Approaching / buffer zone (up to 2x radius)
  const approaching = alertsWithDist
    .filter((a) => a.distanceKm! > radiusKm && a.distanceKm! <= radiusKm * 2)
    .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

  return {
    nearbyAlerts: nearby,
    approachingAlerts: approaching,
    highestPriorityAlert: nearby.length > 0 ? nearby[0] : null,
  };
}
