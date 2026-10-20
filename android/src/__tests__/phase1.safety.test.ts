import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setCustomApiBase } from '../config/api';
import {
  buildHazardExclusions,
  evaluateRoadClosureFeed,
  fetchVerifiedEvacuationRoute,
  validateAndParseSafeRoute,
} from '../safety/routeSafety';
import {
  buildRiskPredictRequest,
  executeRiskPrediction,
  parseRiskPredictResponse,
} from '../safety/riskPrediction';
import {
  cancelConfirmedSos,
  dialEmergencyNumber,
  loadPendingSosRecord,
  submitOrRetrySos,
} from '../safety/sosManager';
import { HazardsPayload, SelectedLocationEvidence } from '../types/meteo';

// Deterministic in-memory AsyncStorage backing in Node test environment
const memStore = new Map<string, string>();
vi.spyOn(AsyncStorage, 'getItem').mockImplementation(async (k: string) =>
  memStore.has(k) ? memStore.get(k)! : null
);
vi.spyOn(AsyncStorage, 'setItem').mockImplementation(async (k: string, v: string) => {
  memStore.set(k, v);
});
vi.spyOn(AsyncStorage, 'removeItem').mockImplementation(async (k: string) => {
  memStore.delete(k);
});
vi.spyOn(AsyncStorage, 'getAllKeys').mockImplementation(async () => Array.from(memStore.keys()));
vi.spyOn(AsyncStorage, 'multiRemove').mockImplementation(async (keys: readonly string[]) => {
  keys.forEach((k) => memStore.delete(k));
});

const FIXED_NOW_MS = Date.parse('2026-10-20T10:00:00Z');
const FRESH_VERIFIED_ISO = '2026-10-20T09:15:00Z'; // 45 min ago (< 6h threshold)
const STALE_VERIFIED_ISO = '2026-09-17T08:30:00Z'; // > 33 days old (matches unmodified static fallback)

const SAMPLE_CORRIDOR: [number, number][] = [
  [78.8208, 10.3797],
  [78.8020, 10.4050],
  [78.7810, 10.4320],
  [78.7608, 10.4497],
  [78.7350, 10.4860],
  [78.7008, 10.5197],
];

const SAMPLE_ORIGIN = { lat: 10.3797, lon: 78.8208 };
const SAMPLE_DESTINATION = { lat: 10.5197, lon: 78.7008 };

const SAMPLE_EVIDENCE: SelectedLocationEvidence = {
  lat: 27.3389,
  lng: 88.6065,
  locationName: 'Gangtok Ridge',
  district: 'East Sikkim',
  state: 'Sikkim',
  severity: 'GREEN',
  selectionKind: 'station',
  headline: 'Low Rain Sector',
  summary: 'Dry conditions',
  source: 'IMD AWS',
  temperatureC: 19,
  humidityPercent: 60,
  windSpeedKmh: 8,
  windDirectionDeg: 180,
  pressureHpa: 1011,
  rainfall1hMm: 1.5,
  rainfall24hMm: 4.0,
  stationName: 'Gangtok AWS',
  stationDistanceKm: 0.4,
  radarCode: 'agt',
  radarName: 'Agartala DWR',
  radarDistanceKm: 310,
  observationTimestampIST: '14:00 IST',
};

describe('Phase 1, 4 & 5 Safety Remediation Suite (Routing Closure Authority, Risk Prediction & Non-Destructive SOS)', () => {
  beforeEach(() => {
    memStore.clear();
    setCustomApiBase(null);
    vi.clearAllMocks();
  });

  describe('1. Road-Closure Safety Verification vs Unverified Corridor Handling (Phase 4)', () => {
    it('marks route `verified` ONLY when an authoritative Valhalla/PostGIS engine and a fresh road-closure feed both pass', () => {
      const freshClosureFeed = {
        available: true,
        source: 'PostGIS NHAI/PWD Live Closures',
        count: 1,
        data: [
          {
            incident_id: 'INC-1',
            road_name: 'NH-06 Clear Section',
            lat: 10.95,
            lng: 79.25,
            status: 'OPEN',
            verified_time: FRESH_VERIFIED_ISO,
            requires_routing_exclusion: false,
          },
        ],
      };

      const parsed = validateAndParseSafeRoute({
        raw: {
          status: 'ROUTE_FOUND',
          engine: 'pyvalhalla_native',
          postgis_connected: true,
          closures_verified: true,
          recommended_route: {
            title: 'Disaster-Safe Verified Corridor',
            distance_km: 21.6,
            duration_minutes: 33.4,
            road_condition: 'OPTIMAL',
            number_of_blocked_segments: 0,
            safety_score: 0.95,
            landslide_risk: 0.05,
            geometry: { type: 'LineString', coordinates: SAMPLE_CORRIDOR },
          },
        },
        mode: 'safe',
        origin: SAMPLE_ORIGIN,
        destination: SAMPLE_DESTINATION,
        closureFeed: freshClosureFeed,
        nowMs: FIXED_NOW_MS,
      });

      expect(parsed.ok).toBe(true);
      if (parsed.ok) {
        expect(parsed.closureVerification).toBe('verified');
        expect(parsed.closureStatus).toBe('fresh');
        expect(parsed.verificationBadge).toBe('Verified Safe Route');
        expect(parsed.closureWarning).toBeNull();
        expect(parsed.overlay.distanceKm).toBe(21.6);
        expect(parsed.overlay.durationMin).toBe(33.4);
      }
    });

    it('marks geometrically valid routes as `closure_unverified` ("Road-Closure Safety Unverified") and NEVER "Verified Safe" when closure data is missing or OSRM fallback is used', () => {
      // Case A: OSRM fallback with misleading upstream "All Clear" title + missing closure feed
      const osrmRoute = validateAndParseSafeRoute({
        raw: {
          status: 'ROUTE_FOUND',
          debug_info: {
            engine: 'osrm_live_openstreetmap_graph',
            excluded_segments: 0,
          },
          recommended_route: {
            title: 'via NH-06 Shillong Expressway (Direct Road - All Clear)',
            distance_km: 19.8,
            duration_minutes: 29.2,
            road_condition: 'ALL_WEATHER_FREE_FLOW',
            number_of_blocked_segments: 0,
            geometry: { type: 'LineString', coordinates: SAMPLE_CORRIDOR },
          },
        },
        mode: 'safe',
        origin: SAMPLE_ORIGIN,
        destination: SAMPLE_DESTINATION,
        closureFeed: null,
        nowMs: FIXED_NOW_MS,
      });

      expect(osrmRoute.ok).toBe(true);
      if (osrmRoute.ok) {
        expect(osrmRoute.closureVerification).toBe('closure_unverified');
        expect(osrmRoute.closureStatus).toBe('missing');
        expect(osrmRoute.verificationBadge).toBe('Road-Closure Safety Unverified');
        expect(osrmRoute.overlay.summary).toContain('Road-Closure Safety Unverified');
        expect(osrmRoute.overlay.summary.toLowerCase()).not.toContain('verified safe');
        expect(osrmRoute.overlay.summary.toLowerCase()).not.toContain('all clear');
        expect(osrmRoute.closureWarning).toBeTruthy();
      }

      // Case B: Authoritative engine name, but closure feed is missing (`available: false`)
      const missingClosureRoute = validateAndParseSafeRoute({
        raw: {
          status: 'ROUTE_FOUND',
          engine: 'pyvalhalla_road_engine',
          recommended_route: {
            title: 'Disaster-Safe Verified Corridor (Bypasses Active Landslides)',
            distance_km: 21.6,
            duration_minutes: 33.4,
            road_condition: 'OPTIMAL',
            number_of_blocked_segments: 0,
            geometry: { type: 'LineString', coordinates: SAMPLE_CORRIDOR },
          },
        },
        mode: 'safe',
        origin: SAMPLE_ORIGIN,
        destination: SAMPLE_DESTINATION,
        closureFeed: { available: false, data: [] },
        nowMs: FIXED_NOW_MS,
      });

      expect(missingClosureRoute.ok).toBe(true);
      if (missingClosureRoute.ok) {
        expect(missingClosureRoute.closureVerification).toBe('closure_unverified');
        expect(missingClosureRoute.closureStatus).toBe('missing');
        expect(missingClosureRoute.overlay.summary.toLowerCase()).not.toContain('verified safe');
        expect(missingClosureRoute.overlay.summary.toLowerCase()).not.toContain('disaster-safe');
      }
    });

    it('marks routes `closure_unverified` when closure timestamps are stale AND still fail-closes if the corridor crosses a stale BLOCKED segment', () => {
      const staleNonIntersectingFeed = {
        available: true,
        data: [
          {
            incident_id: 'INC-STALE-OPEN',
            road_name: 'NH-206 Stretch',
            lat: 25.308,
            lng: 91.905,
            status: 'OPEN',
            verified_time: STALE_VERIFIED_ISO,
          },
        ],
      };

      const evalResult = evaluateRoadClosureFeed(staleNonIntersectingFeed, { nowMs: FIXED_NOW_MS });
      expect(evalResult.status).toBe('stale');
      expect(evalResult.authoritative).toBe(false);

      const staleRoute = validateAndParseSafeRoute({
        raw: {
          status: 'ROUTE_FOUND',
          engine: 'pyvalhalla_native',
          recommended_route: {
            title: 'Verified Safe Highway Bypass',
            distance_km: 21.6,
            duration_minutes: 33.4,
            road_condition: 'OPTIMAL',
            number_of_blocked_segments: 0,
            geometry: { type: 'LineString', coordinates: SAMPLE_CORRIDOR },
          },
        },
        mode: 'safe',
        origin: SAMPLE_ORIGIN,
        destination: SAMPLE_DESTINATION,
        closureFeed: staleNonIntersectingFeed,
        nowMs: FIXED_NOW_MS,
      });

      expect(staleRoute.ok).toBe(true);
      if (staleRoute.ok) {
        expect(staleRoute.closureVerification).toBe('closure_unverified');
        expect(staleRoute.closureStatus).toBe('stale');
        expect(staleRoute.verificationBadge).toBe('Road-Closure Safety Unverified');
        expect(staleRoute.overlay.summary.toLowerCase()).not.toContain('verified safe');
        expect(staleRoute.closureWarning).toContain('stale');
      }

      // Now place a BLOCKED incident directly on the corridor inside a stale feed -> MUST reject fail-closed!
      const staleIntersectingBlockedFeed = {
        available: true,
        data: [
          {
            incident_id: 'INC-STALE-BLOCKED',
            road_name: 'Ghat Km 14 Rockfall',
            lat: 10.4497,
            lng: 78.7608,
            status: 'BLOCKED',
            requires_routing_exclusion: true,
            verified_time: STALE_VERIFIED_ISO,
          },
        ],
      };

      const blockedByStale = validateAndParseSafeRoute({
        raw: {
          status: 'ROUTE_FOUND',
          engine: 'pyvalhalla_native',
          recommended_route: {
            distance_km: 21.6,
            duration_minutes: 33.4,
            road_condition: 'OPTIMAL',
            number_of_blocked_segments: 0,
            geometry: { type: 'LineString', coordinates: SAMPLE_CORRIDOR },
          },
        },
        mode: 'safe',
        origin: SAMPLE_ORIGIN,
        destination: SAMPLE_DESTINATION,
        closureFeed: staleIntersectingBlockedFeed,
        nowMs: FIXED_NOW_MS,
      });

      expect(blockedByStale.ok).toBe(false);
      if (!blockedByStale.ok) {
        expect(blockedByStale.code).toBe('HAZARD_INTERSECTION');
        expect(blockedByStale.title).toBe('Verified Safe Route Unavailable');
      }
    });

    it('rejects blocked segments reported by backend (`BLOCKED_SEGMENT`) and active CRITICAL pluvial flood intersections (`HAZARD_INTERSECTION`)', () => {
      const backendBlocked = validateAndParseSafeRoute({
        raw: {
          status: 'ROUTE_FOUND',
          recommended_route: {
            distance_km: 21.6,
            duration_minutes: 33.4,
            road_condition: 'ROAD_BLOCKED_DEBRIS',
            number_of_blocked_segments: 1,
            geometry: { type: 'LineString', coordinates: SAMPLE_CORRIDOR },
          },
        },
        mode: 'safe',
        origin: SAMPLE_ORIGIN,
        destination: SAMPLE_DESTINATION,
      });
      expect(backendBlocked.ok).toBe(false);
      if (!backendBlocked.ok) {
        expect(backendBlocked.code).toBe('BLOCKED_SEGMENT');
      }

      const activeHazards: HazardsPayload = {
        status: 'OK',
        events: [],
        pluvialFloodZones: [
          {
            id: 'FZ-1',
            district: 'Pudukkottai',
            state: 'Tamil Nadu',
            zoneName: 'Subway Inundation Basin',
            latitude: 10.4497,
            longitude: 78.7608,
            pluvialFloodRisk: 'CRITICAL',
            estimatedHousesAtRisk: 420,
            relativeDepressionM: 2.3,
            demElevationM: 88,
            liveRainRateMmH: 48,
            cumulativeRain24hMm: 162,
            trend: 'RISING',
            confidence: 'HIGH',
            freshness: 'Live',
            drainageContext: 'Urban basin',
          },
        ],
        counts: {
          totalEvents: 0,
          severeEventsCount: 1,
          displayedCount: 0,
          thunderstorms: 0,
          hailstorms: 0,
          cloudbursts: 0,
        },
        userSegmentation: {
          touristsInRedZones: 0,
          fieldOfficersInRedZones: 0,
          citizensInRedZones: 0,
          totalPersonsAtRisk: 0,
        },
      };

      expect(buildHazardExclusions(activeHazards)).toHaveLength(1);
      const floodRejected = validateAndParseSafeRoute({
        raw: {
          status: 'ROUTE_FOUND',
          recommended_route: {
            distance_km: 19.2,
            duration_minutes: 31.0,
            road_condition: 'OPTIMAL',
            number_of_blocked_segments: 0,
            geometry: { type: 'LineString', coordinates: SAMPLE_CORRIDOR },
          },
        },
        mode: 'safe',
        origin: SAMPLE_ORIGIN,
        destination: SAMPLE_DESTINATION,
        hazards: activeHazards,
      });
      expect(floodRejected.ok).toBe(false);
      if (!floodRejected.ok) {
        expect(floodRejected.code).toBe('HAZARD_INTERSECTION');
      }
    });

    it('rejects origin mismatch, destination mismatch, static cached Shillong fallback, invalid geometry, missing metrics, and upstream routing timeouts', async () => {
      // 1. Origin mismatch (Meghalaya/Shillong coordinates returned for Tamil Nadu request)
      const originMismatch = validateAndParseSafeRoute({
        raw: {
          status: 'ROUTE_FOUND',
          recommended_route: {
            distance_km: 24.5,
            duration_minutes: 38,
            geometry: {
              type: 'LineString',
              coordinates: [
                [91.924, 25.682],
                [91.912, 25.652],
                [91.901, 25.622],
                [91.891, 25.601],
                [91.88, 25.578],
              ],
            },
          },
        },
        mode: 'safe',
        origin: SAMPLE_ORIGIN,
        destination: SAMPLE_DESTINATION,
      });
      expect(originMismatch.ok).toBe(false);
      if (!originMismatch.ok) expect(originMismatch.code).toBe('ORIGIN_MISMATCH');

      // 2. Destination mismatch (starts at requested origin, ends > 50 km away)
      const destMismatch = validateAndParseSafeRoute({
        raw: {
          status: 'ROUTE_FOUND',
          recommended_route: {
            distance_km: 62.0,
            duration_minutes: 75,
            geometry: {
              type: 'LineString',
              coordinates: [
                [78.8208, 10.3797],
                [78.9, 10.5],
                [79.0, 10.65],
                [79.1, 10.8],
                [79.25, 10.95],
              ],
            },
          },
        },
        mode: 'safe',
        origin: SAMPLE_ORIGIN,
        destination: SAMPLE_DESTINATION,
      });
      expect(destMismatch.ok).toBe(false);
      if (!destMismatch.ok) expect(destMismatch.code).toBe('DESTINATION_MISMATCH');

      // 3. Static pre-cached OSM fallback (`cached_high_density_osm_graph`) rejected EVEN when requested near Shillong!
      const staticShillongFallback = validateAndParseSafeRoute({
        raw: {
          status: 'ROUTE_FOUND',
          debug_info: { engine: 'cached_high_density_osm_graph' },
          recommended_route: {
            distance_km: 24.5,
            duration_minutes: 38,
            geometry: {
              type: 'LineString',
              coordinates: [
                [91.924, 25.682],
                [91.912, 25.652],
                [91.901, 25.622],
                [91.891, 25.601],
                [91.88, 25.578],
              ],
            },
          },
        },
        mode: 'safe',
        origin: { lat: 25.682, lon: 91.924 },
        destination: { lat: 25.578, lon: 91.88 },
      });
      expect(staticShillongFallback.ok).toBe(false);
      if (!staticShillongFallback.ok) {
        expect(staticShillongFallback.code).toBe('STATIC_FALLBACK_ROUTE');
      }

      // 4. Invalid / < 5-vertex straight line & NaN coordinates & missing metrics
      const straightLine = validateAndParseSafeRoute({
        raw: {
          status: 'ROUTE_FOUND',
          recommended_route: {
            distance_km: 18.4,
            duration_minutes: 27,
            geometry: {
              type: 'LineString',
              coordinates: [
                [78.8208, 10.3797],
                [78.7608, 10.4497],
                [78.7008, 10.5197],
              ],
            },
          },
        },
        mode: 'safe',
        origin: SAMPLE_ORIGIN,
        destination: SAMPLE_DESTINATION,
      });
      expect(straightLine.ok).toBe(false);
      if (!straightLine.ok) expect(straightLine.code).toBe('INSUFFICIENT_GEOMETRY');

      const nanCoords = validateAndParseSafeRoute({
        raw: {
          status: 'ROUTE_FOUND',
          recommended_route: {
            distance_km: 18.4,
            duration_minutes: 27,
            geometry: {
              type: 'LineString',
              coordinates: [
                [78.8208, 10.3797],
                [NaN, 10.41],
                [78.76, 10.45],
                [78.73, 10.49],
                [78.7008, 10.5197],
              ],
            },
          },
        },
        mode: 'safe',
        origin: SAMPLE_ORIGIN,
        destination: SAMPLE_DESTINATION,
      });
      expect(nanCoords.ok).toBe(false);
      if (!nanCoords.ok) expect(nanCoords.code).toBe('MALFORMED_RESPONSE');

      const missingMetrics = validateAndParseSafeRoute({
        raw: {
          status: 'ROUTE_FOUND',
          recommended_route: {
            distance_km: 0,
            geometry: { type: 'LineString', coordinates: SAMPLE_CORRIDOR },
          },
        },
        mode: 'safe',
        origin: SAMPLE_ORIGIN,
        destination: SAMPLE_DESTINATION,
      });
      expect(missingMetrics.ok).toBe(false);
      if (!missingMetrics.ok) expect(missingMetrics.code).toBe('MISSING_METRICS');

      // 5. Upstream routing timeout (`ECONNABORTED`) handled cleanly with zero invented fallback coordinates
      const timeoutErr = Object.assign(new Error('timeout of 7000ms exceeded'), {
        code: 'ECONNABORTED',
      });
      const timedOutRoute = await fetchVerifiedEvacuationRoute({
        mode: 'safe',
        origin: SAMPLE_ORIGIN,
        destination: SAMPLE_DESTINATION,
        httpPost: vi.fn().mockRejectedValueOnce(timeoutErr) as any,
        httpGet: vi.fn().mockResolvedValueOnce({ data: null }) as any,
      });
      expect(timedOutRoute.ok).toBe(false);
      if (!timedOutRoute.ok) {
        expect(timedOutRoute.code).toBe('UPSTREAM_TIMEOUT');
        expect(timedOutRoute.title).toBe('Verified Safe Route Unavailable');
      }
    });
  });

  describe('2. ML Risk Prediction Schema, Malformed Payloads, Timeouts & Service Unavailable (Phase 5)', () => {
    it('submits `rainfall_1h` and `rainfall_24h` keys and parses valid inference responses accurately', async () => {
      const req = buildRiskPredictRequest({
        ...SAMPLE_EVIDENCE,
        rainfall1hMm: 62.0,
        rainfall24hMm: 215.0,
      });
      expect(req.ok).toBe(true);
      if (!req.ok) return;
      expect(req.body.features).toEqual({ rainfall_1h: 62.0, rainfall_24h: 215.0 });

      const okOutcome = await executeRiskPrediction({
        evidence: { ...SAMPLE_EVIDENCE, rainfall1hMm: 62.0, rainfall24hMm: 215.0 },
        httpPost: vi.fn().mockResolvedValueOnce({
          status: 200,
          data: {
            landslide_probability: 0.984,
            risk_level: 'Critical',
            recommended_action: 'Evacuate steep cut-slope sectors immediately.',
            top_trigger: '24h Cumulative Rainfall',
            district: 'East Sikkim',
            features_evaluated: { rainfall_1h: 62, rainfall_24h: 215 },
            shap_breakdown: [{ feature: 'rainfall_24h', impact: 0.44, percentage: 58 }],
          },
        }) as any,
      });

      expect(okOutcome.ok).toBe(true);
      if (okOutcome.ok) {
        expect(okOutcome.data.landslideProbability).toBe(0.984);
        expect(okOutcome.data.probabilityPercent).toBe(98.4);
        expect(okOutcome.data.riskLevel).toBe('Critical');
      }
    });

    it('cleanly handles malformed responses, timeouts (`ECONNABORTED`), and unavailable 503 services without fabricating fallback scores', async () => {
      expect(parseRiskPredictResponse(null)).toMatchObject({ ok: false, code: 'MALFORMED_RESPONSE' });
      expect(parseRiskPredictResponse('<html>502 Bad Gateway</html>')).toMatchObject({
        ok: false,
        code: 'MALFORMED_RESPONSE',
      });
      expect(
        parseRiskPredictResponse({
          landslide_probability: 1.45,
          risk_level: 'High',
          recommended_action: 'Monitor',
        })
      ).toMatchObject({ ok: false, code: 'MALFORMED_RESPONSE' });
      expect(
        parseRiskPredictResponse({
          landslide_probability: 0.61,
          risk_level: '',
          recommended_action: 'Monitor',
        })
      ).toMatchObject({ ok: false, code: 'MALFORMED_RESPONSE' });

      // Upstream timeout
      const timeoutRes = await executeRiskPrediction({
        evidence: SAMPLE_EVIDENCE,
        httpPost: vi.fn().mockRejectedValueOnce(
          Object.assign(new Error('timeout of 6000ms exceeded'), { code: 'ECONNABORTED' })
        ) as any,
      });
      expect(timeoutRes).toMatchObject({ ok: false, code: 'TIMEOUT' });

      // Upstream 503 service unavailable
      const unavailableRes = await executeRiskPrediction({
        evidence: SAMPLE_EVIDENCE,
        httpPost: vi.fn().mockRejectedValueOnce({
          response: { status: 503, data: { error: 'ML inference worker unavailable' } },
        }) as any,
      });
      expect(unavailableRes).toMatchObject({
        ok: false,
        code: 'SERVICE_UNAVAILABLE',
        error: 'ML inference worker unavailable',
      });
    });
  });

  describe('3. Emergency SOS & Cancel Persistence, Malformed Payloads, Timeouts & Zero Real Calls (Phase 5)', () => {
    it('flags `persisted: false` explicitly as `received_unpersisted` and keeps beacon active when cancel fails (502/503/timeout/malformed) with zero phone calls triggered', async () => {
      const openUrlSpy = vi.spyOn(Linking, 'openURL').mockResolvedValue(true as any);

      // Exact payload shape when FastAPI receives SOS while PostGIS DB is unreachable
      const state = await submitOrRetrySos({
        latitude: 10.3797,
        longitude: 78.8208,
        httpPost: vi.fn().mockResolvedValueOnce({
          status: 200,
          data: {
            delivered: true,
            persisted: false,
            report_id: 'SOS-MEM-4012',
          },
        }) as any,
      });

      expect(state.status).toBe('received_unpersisted');
      expect(state.persisted).toBe(false);
      expect(state.message).toContain('persisted: false');
      expect(openUrlSpy).not.toHaveBeenCalled();

      // Cancel fails with HTTP 502 (DB offline) -> active beacon MUST NOT clear
      const after502Cancel = await cancelConfirmedSos({
        current: state,
        httpPost: vi.fn().mockRejectedValueOnce({
          response: { status: 502, data: { cancelled: false, error: 'PostGIS offline' } },
        }) as any,
      });
      expect(after502Cancel.reportId).toBe('SOS-MEM-4012');
      expect(after502Cancel.cancelError).toContain('FAILED');

      // Cancel times out -> active beacon MUST NOT clear
      const afterTimeoutCancel = await cancelConfirmedSos({
        current: state,
        httpPost: vi.fn().mockRejectedValueOnce(
          Object.assign(new Error('timeout of 5000ms exceeded'), { code: 'ECONNABORTED' })
        ) as any,
      });
      expect(afterTimeoutCancel.reportId).toBe('SOS-MEM-4012');
      expect(afterTimeoutCancel.cancelError).toContain('timed out');

      // Cancel returns malformed HTML / unconfirmed `{}` -> active beacon MUST NOT clear
      const afterMalformedCancel = await cancelConfirmedSos({
        current: state,
        httpPost: vi.fn().mockResolvedValueOnce({
          status: 200,
          data: '<html>Gateway Error</html>',
        }) as any,
      });
      expect(afterMalformedCancel.reportId).toBe('SOS-MEM-4012');
      expect(afterMalformedCancel.cancelError).toContain('NOT confirmed');
      expect(openUrlSpy).not.toHaveBeenCalled();
    });

    it('marks SOS `confirmed_persisted` ONLY when `delivered: true` AND `persisted: true`, clears ONLY on `{ cancelled: true }`, and invokes dialer ONLY on explicit user action', async () => {
      const openUrlSpy = vi.spyOn(Linking, 'openURL').mockResolvedValue(true as any);

      const confirmed = await submitOrRetrySos({
        latitude: 10.3797,
        longitude: 78.8208,
        httpPost: vi.fn().mockResolvedValueOnce({
          status: 200,
          data: {
            delivered: true,
            persisted: true,
            report_id: 'SOS-DB-9001',
            alert_id: 'CAP-9001',
            message: 'Saved in PostGIS.',
          },
        }) as any,
      });
      expect(confirmed.status).toBe('confirmed_persisted');
      expect(confirmed.persisted).toBe(true);
      expect(confirmed.reportId).toBe('SOS-DB-9001');

      const cleared = await cancelConfirmedSos({
        current: confirmed,
        httpPost: vi.fn().mockResolvedValueOnce({
          status: 200,
          data: { cancelled: true, report_id: 'SOS-DB-9001' },
        }) as any,
      });
      expect(cleared.status).toBe('idle');
      expect(cleared.reportId).toBeNull();
      expect(openUrlSpy).not.toHaveBeenCalled();

      // Explicit user tap on 112 dial button opens `tel:112`
      const dialed = await dialEmergencyNumber('112');
      expect(dialed).toBe(true);
      expect(openUrlSpy).toHaveBeenCalledTimes(1);
      expect(openUrlSpy).toHaveBeenCalledWith('tel:112');
    });

    it('queues failed SOS locally as `queued_not_delivered` across 503 unavailable, timeouts, and malformed 200 responses while reusing idempotent `clientRequestId`', async () => {
      // Exact HTTP 503 response returned by unmodified Vercel standalone `/api/sos`
      const vercel503 = await submitOrRetrySos({
        latitude: 11.0168,
        longitude: 76.9558,
        httpPost: vi.fn().mockRejectedValueOnce({
          response: {
            status: 503,
            data: {
              delivered: false,
              persisted: false,
              error: 'Emergency server unreachable — SOS could not be saved.',
            },
          },
        }) as any,
      });

      expect(vercel503.status).toBe('queued_not_delivered');
      expect(vercel503.reportId).toBeNull();
      expect(vercel503.persisted).toBe(false);

      const persistedDraft = await loadPendingSosRecord();
      expect(persistedDraft).not.toBeNull();
      expect(persistedDraft?.clientRequestId).toBe(vercel503.clientRequestId);
      expect(persistedDraft?.attemptCount).toBe(1);

      // Retry encounters upstream timeout (`ECONNABORTED`) -> preserves same `clientRequestId`
      const retryTimedOut = await submitOrRetrySos({
        latitude: 11.0168,
        longitude: 76.9558,
        existingRecord: persistedDraft,
        httpPost: vi.fn().mockRejectedValueOnce(
          Object.assign(new Error('timeout of 6000ms exceeded'), { code: 'ECONNABORTED' })
        ) as any,
      });
      expect(retryTimedOut.status).toBe('queued_not_delivered');
      expect(retryTimedOut.clientRequestId).toBe(vercel503.clientRequestId);
      expect(retryTimedOut.pendingOfflineRecord?.attemptCount).toBe(2);
      expect(retryTimedOut.message).toContain('timed out');

      // Malformed HTTP 200 missing `report_id` -> NEVER falsely marked delivered!
      const malformed200 = await submitOrRetrySos({
        latitude: 11.0168,
        longitude: 76.9558,
        existingRecord: retryTimedOut.pendingOfflineRecord,
        httpPost: vi.fn().mockResolvedValueOnce({
          status: 200,
          data: { delivered: true, report_id: '' },
        }) as any,
      });
      expect(malformed200.status).toBe('queued_not_delivered');
      expect(malformed200.reportId).toBeNull();
    });
  });
});
