import axios from 'axios';
import { API_ROUTES } from '../config/api';
import {
  ActiveRouteOverlay,
  ClosureFeedStatus,
  HazardsPayload,
  RouteClosureVerification,
} from '../types/meteo';

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

export interface ClosureFeedEvaluation {
  status: ClosureFeedStatus;
  authoritative: boolean;
  latestVerifiedMs: number | null;
  ageMs: number | null;
  blockedZones: HazardExclusionZone[];
  warning: string | null;
}

export type SafeRouteFailureCode =
  | 'MALFORMED_RESPONSE'
  | 'NO_SAFE_ROUTE'
  | 'STATIC_FALLBACK_ROUTE'
  | 'INSUFFICIENT_GEOMETRY'
  | 'MISSING_METRICS'
  | 'ORIGIN_MISMATCH'
  | 'DESTINATION_MISMATCH'
  | 'BLOCKED_SEGMENT'
  | 'HAZARD_INTERSECTION'
  | 'UPSTREAM_TIMEOUT'
  | 'UPSTREAM_UNAVAILABLE';

export type SafeRouteValidationResult =
  | {
      ok: true;
      mode: 'safe' | 'emergency';
      closureVerification: RouteClosureVerification;
      closureStatus: ClosureFeedStatus;
      verificationBadge: 'Verified Safe Route' | 'Road-Closure Safety Unverified';
      closureWarning: string | null;
      overlay: ActiveRouteOverlay;
      safetyScore: number | null;
      landslideRisk: number | null;
      excludedHazardCount: number;
      engine: string;
    }
  | {
      ok: false;
      code: SafeRouteFailureCode;
      title: 'Verified Safe Route Unavailable';
      detail: string;
    };

const UNAVAILABLE_TITLE = 'Verified Safe Route Unavailable' as const;
const UNVERIFIED_BADGE = 'Road-Closure Safety Unverified' as const;
const VERIFIED_BADGE = 'Verified Safe Route' as const;
const MAX_ENDPOINT_SNAP_KM = 5.0;
const DEFAULT_CLOSURE_RADIUS_KM = 0.4;
export const DEFAULT_MAX_CLOSURE_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours

const AUTHORITATIVE_DISASTER_ENGINES = new Set([
  'pyvalhalla_native',
  'pyvalhalla_road_engine',
  'valhalla_disaster_router',
  'postgis_valhalla',
]);

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
 * Evaluates authoritative road-closure / road-incident telemetry (`/api/roads/incidents`):
 * - Always extracts any active `BLOCKED` / `CLOSED` / `IMPASSABLE` road coordinates as hard exclusions
 *   (even when timestamps are stale — fail-closed against known blockages!).
 * - Marks `status: 'missing'` when feed is null, malformed, explicitly unavailable, or empty.
 * - Marks `status: 'stale'` when timestamps are missing or older than `maxAgeMs` (default 6h).
 * - Marks `status: 'fresh'` ONLY when live verified timestamps are within `maxAgeMs`.
 */
export function evaluateRoadClosureFeed(
  rawFeed: any,
  options?: { nowMs?: number; maxAgeMs?: number }
): ClosureFeedEvaluation {
  const nowMs = options?.nowMs ?? Date.now();
  const maxAgeMs = options?.maxAgeMs ?? DEFAULT_MAX_CLOSURE_AGE_MS;

  if (!rawFeed || typeof rawFeed !== 'object' || rawFeed.available === false) {
    return {
      status: 'missing',
      authoritative: false,
      latestVerifiedMs: null,
      ageMs: null,
      blockedZones: [],
      warning:
        'Authoritative road-closure telemetry is unavailable; route has NOT been verified against live PWD/NHAI road closures.',
    };
  }

  const items = Array.isArray(rawFeed.data)
    ? rawFeed.data
    : Array.isArray(rawFeed.closures)
      ? rawFeed.closures
      : Array.isArray(rawFeed.incidents)
        ? rawFeed.incidents
        : null;

  if (!items || items.length === 0) {
    return {
      status: 'missing',
      authoritative: false,
      latestVerifiedMs: null,
      ageMs: null,
      blockedZones: [],
      warning:
        'No authoritative road-closure records were returned; route safety against active closures is unverified.',
    };
  }

  const blockedZones: HazardExclusionZone[] = [];
  let latestVerifiedMs: number | null = null;
  let allTimestampsValid = true;

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const lat = Number(item.lat ?? item.latitude);
    const lon = Number(item.lon ?? item.lng ?? item.longitude);
    const statusStr = String(item.status || '').toUpperCase();
    const isBlocked =
      item.requires_routing_exclusion === true ||
      statusStr === 'BLOCKED' ||
      statusStr === 'CLOSED' ||
      statusStr === 'IMPASSABLE';

    if (
      isBlocked &&
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180
    ) {
      blockedZones.push({
        lat,
        lon,
        radiusKm:
          typeof item.radius_km === 'number' && item.radius_km > 0
            ? item.radius_km
            : DEFAULT_CLOSURE_RADIUS_KM,
        reason: String(item.road_name || item.reason || 'Blocked road segment'),
      });
    }

    const tsRaw = item.verified_time || item.updated_at || item.reported_time;
    const parsedMs = typeof tsRaw === 'string' || typeof tsRaw === 'number' ? Date.parse(String(tsRaw)) : NaN;
    if (Number.isFinite(parsedMs)) {
      if (latestVerifiedMs === null || parsedMs > latestVerifiedMs) {
        latestVerifiedMs = parsedMs;
      }
    } else {
      allTimestampsValid = false;
    }
  }

  if (latestVerifiedMs === null || !allTimestampsValid) {
    return {
      status: 'stale',
      authoritative: false,
      latestVerifiedMs,
      ageMs: null,
      blockedZones,
      warning:
        'Road-closure records lacked fresh verification timestamps; route safety against current road closures is unverified.',
    };
  }

  const ageMs = Math.max(0, nowMs - latestVerifiedMs);
  if (ageMs > maxAgeMs) {
    const hoursOld = Math.max(1, Math.round(ageMs / (60 * 60 * 1000)));
    return {
      status: 'stale',
      authoritative: false,
      latestVerifiedMs,
      ageMs,
      blockedZones,
      warning: `Road-closure feed is stale (last verified ~${hoursOld}h ago); route has NOT been verified against current road closures.`,
    };
  }

  return {
    status: 'fresh',
    authoritative: true,
    latestVerifiedMs,
    ageMs,
    blockedZones,
    warning: null,
  };
}

/**
 * Removes misleading upstream labels ("Verified Safe", "Verified", "Disaster-Safe", "All Clear")
 * whenever full road-closure verification is unverified.
 */
function sanitizeUnverifiedCorridorTitle(rawTitle: string | undefined, mode: 'safe' | 'emergency'): string {
  const cleaned = (rawTitle || '')
    .replace(/\bverified\s+safe\b/gi, '')
    .replace(/\bdisaster-safe\b/gi, '')
    .replace(/\bverified\b/gi, '')
    .replace(/[-–—·\s]*all\s+clear\b/gi, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (cleaned.length > 0) {
    return cleaned;
  }
  return mode === 'emergency'
    ? 'Candidate Emergency Road Corridor'
    : 'Candidate Road-Network Corridor';
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
 * responses against requested origin/destination, active IMD hazards, and authoritative road-closure status.
 *
 * - NEVER fabricates coordinates, straight-line fallbacks, distances, or durations.
 * - Rejects pre-cached static Meghalaya/Shillong OSM fallback (`cached_high_density_osm_graph`) unconditionally.
 * - Labels any corridor whose authoritative road-closure telemetry is missing, stale, or computed via public OSRM
 *   as `closure_unverified` (`"Road-Closure Safety Unverified"`), NEVER `"Verified Safe"`.
 */
export function validateAndParseSafeRoute(params: {
  raw: any;
  mode: 'safe' | 'emergency';
  origin: LatLon;
  destination: LatLon;
  hazards?: HazardsPayload | null;
  explicitClosures?: HazardExclusionZone[];
  closureFeed?: any;
  nowMs?: number;
  maxClosureAgeMs?: number;
}): SafeRouteValidationResult {
  const {
    raw,
    mode,
    origin,
    destination,
    hazards,
    explicitClosures = [],
    closureFeed,
    nowMs,
    maxClosureAgeMs,
  } = params;

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

  const engineName = String(raw.engine || raw.debug_info?.engine || 'unknown_router');
  if (engineName === 'cached_high_density_osm_graph') {
    return {
      ok: false,
      code: 'STATIC_FALLBACK_ROUTE',
      title: UNAVAILABLE_TITLE,
      detail:
        'Upstream routing fell back to pre-cached static OSM corridors instead of live road calculation — rejected for safety.',
    };
  }

  // `safe-route` nests canonical metrics/geometry inside `recommended_route`,
  // while `emergency-route` places them at top-level.
  const routeNode =
    raw.recommended_route && typeof raw.recommended_route === 'object'
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
        'Route lacked physical road-network LineString geometry (minimum 5 road vertices required).',
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
      detail: 'Route response omitted positive road-network distance_km or duration_minutes metrics.',
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

  const closureEval = evaluateRoadClosureFeed(closureFeed, {
    nowMs,
    maxAgeMs: maxClosureAgeMs,
  });

  // Check explicit closures + blocked segments from `/api/roads/incidents` first so blocked roads report `BLOCKED_SEGMENT` / `HAZARD_INTERSECTION`
  const knownRoadClosures = [...explicitClosures, ...closureEval.blockedZones];
  for (const closure of knownRoadClosures) {
    const clearanceKm = minDistanceToPolylineKm(
      { lat: closure.lat, lon: closure.lon },
      coordinates
    );
    const minAllowedKm =
      closure.radiusKm > 0 ? closure.radiusKm : DEFAULT_CLOSURE_RADIUS_KM;
    if (clearanceKm < minAllowedKm) {
      return {
        ok: false,
        code: 'HAZARD_INTERSECTION',
        title: UNAVAILABLE_TITLE,
        detail: `Candidate route passes within ${(clearanceKm * 1000).toFixed(0)}m of active road closure (${closure.reason}).`,
      };
    }
  }

  const liveHazardZones = buildHazardExclusions(hazards);
  for (const hz of liveHazardZones) {
    const clearanceKm = minDistanceToPolylineKm({ lat: hz.lat, lon: hz.lon }, coordinates);
    const minAllowedKm = hz.radiusKm > 0 ? hz.radiusKm : DEFAULT_CLOSURE_RADIUS_KM;
    if (clearanceKm < minAllowedKm) {
      return {
        ok: false,
        code: 'HAZARD_INTERSECTION',
        title: UNAVAILABLE_TITLE,
        detail: `Candidate route passes within ${(clearanceKm * 1000).toFixed(0)}m of active hazard (${hz.reason}).`,
      };
    }
  }

  const routerUsedAuthoritativeGraph =
    AUTHORITATIVE_DISASTER_ENGINES.has(engineName) &&
    raw.closures_verified !== false &&
    raw.postgis_connected !== false;

  const isFullyVerified = routerUsedAuthoritativeGraph && closureEval.authoritative;
  const closureVerification: RouteClosureVerification = isFullyVerified
    ? 'verified'
    : 'closure_unverified';
  const verificationBadge = isFullyVerified ? VERIFIED_BADGE : UNVERIFIED_BADGE;

  const rawTitle =
    typeof routeNode.title === 'string' && routeNode.title.trim().length > 0
      ? routeNode.title.trim()
      : typeof raw.recommended_bypass === 'string' && raw.recommended_bypass.trim().length > 0
        ? raw.recommended_bypass.trim()
        : undefined;

  let summary: string;
  let closureWarning: string | null = null;

  if (isFullyVerified) {
    summary =
      rawTitle ||
      (mode === 'emergency'
        ? 'Verified Priority Emergency Corridor'
        : 'Verified Safe Road-Network Route');
  } else {
    const cleanCorridorName = sanitizeUnverifiedCorridorTitle(rawTitle, mode);
    summary = `${UNVERIFIED_BADGE} · ${cleanCorridorName}`;
    if (engineName === 'osrm_live_openstreetmap_graph') {
      closureWarning =
        closureEval.status === 'stale'
          ? `Computed via OpenStreetMap (OSRM) without PostGIS road-closure exclusion, and road-closure feed is stale. Checked against live IMD hazards only — verify local road status before travel.`
          : `Computed via OpenStreetMap (OSRM) without authoritative PostGIS road-closure exclusion. Checked against live IMD hazards only — verify local road status before travel.`;
    } else {
      closureWarning =
        closureEval.warning ||
        'Authoritative road-closure verification was unavailable for this corridor. Verify local road conditions before travel.';
    }
  }

  const safetyScore =
    typeof routeNode.safety_score === 'number' && Number.isFinite(routeNode.safety_score)
      ? routeNode.safety_score
      : null;
  const landslideRisk =
    typeof routeNode.landslide_risk === 'number' && Number.isFinite(routeNode.landslide_risk)
      ? routeNode.landslide_risk
      : null;

  const totalExclusions = knownRoadClosures.length + liveHazardZones.length;

  return {
    ok: true,
    mode,
    closureVerification,
    closureStatus: closureEval.status,
    verificationBadge,
    closureWarning,
    overlay: {
      mode,
      distanceKm,
      durationMin,
      summary,
      coordinates,
      closureVerification,
      closureStatus: closureEval.status,
      verificationBadge,
      closureWarning,
    },
    safetyScore,
    landslideRisk,
    excludedHazardCount: totalExclusions,
    engine: engineName,
  };
}

/**
 * Fetches both the candidate road route (`/api/routing/safe-route` or `/api/routing/emergency-route`)
 * and authoritative road-closure status (`/api/roads/incidents`), enforcing timeouts and strict validation.
 */
export async function fetchVerifiedEvacuationRoute(params: {
  mode: 'safe' | 'emergency';
  origin: LatLon;
  destination: LatLon;
  hazards?: HazardsPayload | null;
  explicitClosures?: HazardExclusionZone[];
  httpPost?: typeof axios.post;
  httpGet?: typeof axios.get;
  timeoutMs?: number;
  nowMs?: number;
}): Promise<SafeRouteValidationResult> {
  const {
    mode,
    origin,
    destination,
    hazards,
    explicitClosures = [],
    httpPost = axios.post,
    httpGet = axios.get,
    timeoutMs = 7000,
    nowMs,
  } = params;

  const hazardExclusions = buildHazardExclusions(hazards);
  const customExclusions = hazardExclusions.map((z) => ({ lat: z.lat, lon: z.lon }));
  const endpoint =
    mode === 'emergency' ? API_ROUTES.emergencyRoute() : API_ROUTES.safeRoute();
  const requestBody =
    mode === 'emergency'
      ? {
          origin,
          destination,
          responder_type: 'ambulance',
          costing: 'emergency',
          custom_exclusions: customExclusions,
        }
      : {
          origin,
          destination,
          costing: 'auto',
          avoid_disasters: true,
          custom_exclusions: customExclusions,
        };

  const closurePromise = httpGet(API_ROUTES.roadIncidents(), {
    timeout: Math.min(timeoutMs, 4500),
  })
    .then((r) => r?.data ?? null)
    .catch(() => null);

  try {
    const [routeRes, closureFeed] = await Promise.all([
      httpPost(endpoint, requestBody, { timeout: timeoutMs }),
      closurePromise,
    ]);

    return validateAndParseSafeRoute({
      raw: routeRes?.data,
      mode,
      origin,
      destination,
      hazards,
      explicitClosures,
      closureFeed,
      nowMs,
    });
  } catch (err: any) {
    const isTimeout =
      err?.code === 'ECONNABORTED' ||
      err?.code === 'ETIMEDOUT' ||
      /timeout|timed out/i.test(String(err?.message || ''));

    if (isTimeout) {
      return {
        ok: false,
        code: 'UPSTREAM_TIMEOUT',
        title: UNAVAILABLE_TITLE,
        detail:
          'Routing request timed out before road-network safety could be verified. Please retry.',
      };
    }

    const serverDetail =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      'Routing engine is unreachable — safety constraints cannot be verified.';

    return {
      ok: false,
      code: 'UPSTREAM_UNAVAILABLE',
      title: UNAVAILABLE_TITLE,
      detail: String(serverDetail),
    };
  }
}
