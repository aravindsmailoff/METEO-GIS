import { ActiveRouteOverlay, HazardsPayload } from '../types/meteo';

export interface LatLon {
  lat: number;
  lon: number;
}

export interface HazardExclusionZone {
  lat: number;
  lon: number;
  radiusKm: number;
  reason: string;
}

export type SafeRouteValidationResult =
  | {
      ok: true;
      mode: 'safe' | 'emergency';
      overlay: ActiveRouteOverlay;
      safetyScore: number | null;
      landslideRisk: number | null;
      excludedHazardCount: number;
      engine: string;
    }
  | {
      ok: false;
      code:
        | 'MALFORMED_RESPONSE'
        | 'NO_SAFE_ROUTE'
        | 'INSUFFICIENT_GEOMETRY'
        | 'MISSING_METRICS'
        | 'ORIGIN_MISMATCH'
        | 'DESTINATION_MISMATCH'
        | 'BLOCKED_SEGMENT'
        | 'HAZARD_INTERSECTION';
      title: 'Verified Safe Route Unavailable';
      detail: string;
    };

const UNAVAILABLE_TITLE = 'Verified Safe Route Unavailable' as const;
const MAX_ENDPOINT_SNAP_KM = 5.0;
const DEFAULT_CLOSURE_RADIUS_KM = 0.4;

export function isValidCoordinatePair(c: unknown): c is [number, number] {
  if (!Array.isArray(c) || c.length < 2) return false;
  const lon = c[0];
  const lat = c[1];
  return (
    typeof lon === 'number' &&
    typeof lat === 'number' &&
    Number.isFinite(lon) &&
    Number.isFinite(lat) &&
    lon >= -180 &&
    lon <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
}

export function haversineKm(a: LatLon, b: LatLon): number {
  const R = 6371.0;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLon * sinLon;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Computes minimum geodesic distance (in km) from `target` to any segment along `polyline` ([lon, lat][]).
 */
export function minDistanceToPolylineKm(target: LatLon, polyline: [number, number][]): number {
  if (polyline.length === 0) return Infinity;
  if (polyline.length === 1) {
    return haversineKm(target, { lat: polyline[0][1], lon: polyline[0][0] });
  }

  const cosLat = Math.cos((target.lat * Math.PI) / 180);
  const toXY = (lon: number, lat: number) => ({
    x: (lon - target.lon) * 111.32 * cosLat,
    y: (lat - target.lat) * 110.574,
  });

  let minKm = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const p1 = toXY(polyline[i][0], polyline[i][1]);
    const p2 = toXY(polyline[i + 1][0], polyline[i + 1][1]);
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lenSq = dx * dx + dy * dy;

    let t = 0;
    if (lenSq > 1e-12) {
      t = Math.max(0, Math.min(1, (-p1.x * dx - p1.y * dy) / lenSq));
    }
    const projX = p1.x + t * dx;
    const projY = p1.y + t * dy;
    const dist = Math.hypot(projX, projY);
    if (dist < minKm) {
      minKm = dist;
    }
  }
  return minKm;
}

/**
 * Extracts active severe hazard events and critical/high pluvial flood depressions
 * so both the routing request (`custom_exclusions`) and client spatial verifier avoid them.
 */
export function buildHazardExclusions(hazards?: HazardsPayload | null): HazardExclusionZone[] {
  if (!hazards) return [];
  const zones: HazardExclusionZone[] = [];

  for (const ev of hazards.events || []) {
    if (
      (ev.severity === 'RED' || ev.isSevere) &&
      Number.isFinite(ev.latitude) &&
      Number.isFinite(ev.longitude)
    ) {
      zones.push({
        lat: ev.latitude,
        lon: ev.longitude,
        radiusKm: DEFAULT_CLOSURE_RADIUS_KM,
        reason: `${ev.category} (${ev.district})`,
      });
    }
  }

  for (const fz of hazards.pluvialFloodZones || []) {
    if (
      (fz.pluvialFloodRisk === 'CRITICAL' || fz.pluvialFloodRisk === 'HIGH') &&
      Number.isFinite(fz.latitude) &&
      Number.isFinite(fz.longitude)
    ) {
      zones.push({
        lat: fz.latitude,
        lon: fz.longitude,
        radiusKm: DEFAULT_CLOSURE_RADIUS_KM,
        reason: `Pluvial flood depression: ${fz.zoneName}`,
      });
    }
    for (const hs of fz.cityHotspots || []) {
      if (
        (hs.severity === 'CRITICAL' || hs.severity === 'HIGH') &&
        Number.isFinite(hs.latitude) &&
        Number.isFinite(hs.longitude)
      ) {
        zones.push({
          lat: hs.latitude,
          lon: hs.longitude,
          radiusKm: DEFAULT_CLOSURE_RADIUS_KM,
          reason: `Inundation hotspot: ${hs.name}`,
        });
      }
    }
  }

  return zones;
}

/**
 * Strictly parses and validates `/api/routing/safe-route` and `/api/routing/emergency-route`
 * responses against requested origin/destination and active road-closure / hazard constraints.
 * NEVER fabricates coordinates, distances, or durations.
 */
export function validateAndParseSafeRoute(params: {
  raw: any;
  mode: 'safe' | 'emergency';
  origin: LatLon;
  destination: LatLon;
  hazards?: HazardsPayload | null;
  explicitClosures?: HazardExclusionZone[];
}): SafeRouteValidationResult {
  const { raw, mode, origin, destination, hazards, explicitClosures = [] } = params;

  if (!raw || typeof raw !== 'object') {
    return {
      ok: false,
      code: 'MALFORMED_RESPONSE',
      title: UNAVAILABLE_TITLE,
      detail: 'Routing service returned an empty or malformed payload.',
    };
  }

  const status = String(raw.status || '');
  if (status !== 'ROUTE_FOUND') {
    const msg =
      typeof raw.message === 'string' && raw.message.trim().length > 0
        ? raw.message.trim()
        : typeof raw.error === 'string' && raw.error.trim().length > 0
          ? raw.error.trim()
          : `Routing engine reported status "${status || 'UNKNOWN'}".`;
    return {
      ok: false,
      code: 'NO_SAFE_ROUTE',
      title: UNAVAILABLE_TITLE,
      detail: msg,
    };
  }

  // `safe-route` nests canonical metrics/geometry inside `recommended_route`,
  // while `emergency-route` places them at top-level.
  const routeNode = raw.recommended_route && typeof raw.recommended_route === 'object'
    ? raw.recommended_route
    : raw;

  const roadCondition = String(routeNode.road_condition || '').toUpperCase();
  const blockedCount = Number(routeNode.number_of_blocked_segments ?? 0);
  const blockedList = Array.isArray(routeNode.blocked_segments)
    ? routeNode.blocked_segments
    : Array.isArray(raw.blocked_segments)
      ? raw.blocked_segments
      : [];

  if (
    blockedCount > 0 ||
    blockedList.length > 0 ||
    roadCondition.includes('BLOCKED') ||
    roadCondition.includes('CLOSED') ||
    roadCondition.includes('IMPASSABLE')
  ) {
    return {
      ok: false,
      code: 'BLOCKED_SEGMENT',
      title: UNAVAILABLE_TITLE,
      detail: 'Candidate route passes through an active road closure or debris blockage.',
    };
  }

  const geom = routeNode.geometry;
  if (
    !geom ||
    geom.type !== 'LineString' ||
    !Array.isArray(geom.coordinates) ||
    geom.coordinates.length < 5
  ) {
    return {
      ok: false,
      code: 'INSUFFICIENT_GEOMETRY',
      title: UNAVAILABLE_TITLE,
      detail:
        'Route lacked verified road-network LineString geometry (minimum 5 road vertices required).',
    };
  }

  const coordinates: [number, number][] = [];
  for (const pt of geom.coordinates) {
    if (!isValidCoordinatePair(pt)) {
      return {
        ok: false,
        code: 'MALFORMED_RESPONSE',
        title: UNAVAILABLE_TITLE,
        detail: 'Route geometry contained invalid coordinates.',
      };
    }
    coordinates.push([pt[0], pt[1]]);
  }

  const distanceKm = Number(routeNode.distance_km ?? raw.distance_km);
  const durationMin = Number(routeNode.duration_minutes ?? raw.duration_minutes);
  if (
    !Number.isFinite(distanceKm) ||
    distanceKm <= 0 ||
    !Number.isFinite(durationMin) ||
    durationMin <= 0
  ) {
    return {
      ok: false,
      code: 'MISSING_METRICS',
      title: UNAVAILABLE_TITLE,
      detail: 'Route response omitted verified distance_km or duration_minutes metrics.',
    };
  }

  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  const startSnapKm = haversineKm({ lat: first[1], lon: first[0] }, origin);
  if (startSnapKm > MAX_ENDPOINT_SNAP_KM) {
    return {
      ok: false,
      code: 'ORIGIN_MISMATCH',
      title: UNAVAILABLE_TITLE,
      detail: `Returned route start (${first[1].toFixed(3)}, ${first[0].toFixed(3)}) is ${startSnapKm.toFixed(1)} km away from requested origin.`,
    };
  }

  const endSnapKm = haversineKm({ lat: last[1], lon: last[0] }, destination);
  if (endSnapKm > MAX_ENDPOINT_SNAP_KM) {
    return {
      ok: false,
      code: 'DESTINATION_MISMATCH',
      title: UNAVAILABLE_TITLE,
      detail: `Returned route end (${last[1].toFixed(3)}, ${last[0].toFixed(3)}) is ${endSnapKm.toFixed(1)} km away from requested destination.`,
    };
  }

  const allExclusions = [...buildHazardExclusions(hazards), ...explicitClosures];
  for (const hz of allExclusions) {
    const clearanceKm = minDistanceToPolylineKm({ lat: hz.lat, lon: hz.lon }, coordinates);
    const minAllowedKm = hz.radiusKm > 0 ? hz.radiusKm : DEFAULT_CLOSURE_RADIUS_KM;
    if (clearanceKm < minAllowedKm) {
      return {
        ok: false,
        code: 'HAZARD_INTERSECTION',
        title: UNAVAILABLE_TITLE,
        detail: `Candidate route passes within ${(clearanceKm * 1000).toFixed(0)}m of active hazard/closure (${hz.reason}).`,
      };
    }
  }

  const engineName = String(raw.engine || raw.debug_info?.engine || 'verified_road_graph');
  const rawTitle =
    typeof routeNode.title === 'string' && routeNode.title.trim().length > 0
      ? routeNode.title.trim()
      : typeof raw.recommended_bypass === 'string' && raw.recommended_bypass.trim().length > 0
        ? raw.recommended_bypass.trim()
        : mode === 'emergency'
          ? 'Verified Priority Emergency Corridor'
          : 'Verified Safe Road-Network Route';

  const summary =
    engineName === 'osrm_live_openstreetmap_graph'
      ? `${rawTitle} (OSRM Graph · Checked vs Live Hazards; PostGIS Closures Offline)`
      : rawTitle;

  const safetyScore =
    typeof routeNode.safety_score === 'number' && Number.isFinite(routeNode.safety_score)
      ? routeNode.safety_score
      : null;
  const landslideRisk =
    typeof routeNode.landslide_risk === 'number' && Number.isFinite(routeNode.landslide_risk)
      ? routeNode.landslide_risk
      : null;

  return {
    ok: true,
    mode,
    overlay: {
      mode,
      distanceKm,
      durationMin,
      summary,
      coordinates,
    },
    safetyScore,
    landslideRisk,
    excludedHazardCount: allExclusions.length,
    engine: engineName,
  };
}
