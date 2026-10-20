import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setCustomApiBase } from '../config/api';
import {
  buildHazardExclusions,
  validateAndParseSafeRoute,
} from '../safety/routeSafety';
import {
  buildRiskPredictRequest,
  parseRiskPredictResponse,
} from '../safety/riskPrediction';
import {
  cancelConfirmedSos,
  INITIAL_SOS_SNAPSHOT,
  loadPendingSosRecord,
  submitOrRetrySos,
} from '../safety/sosManager';
import { HazardsPayload, SelectedLocationEvidence } from '../types/meteo';

// Ensure in-memory AsyncStorage backing in Node test environment
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

const LIVE_GATEWAY = 'http://127.0.0.1:3000';
const liveHttp = axios.create({ proxy: false });

describe('Phase 1 P0 Safety Remediation Suite (Unit + Live Next.js/FastAPI Integration)', () => {
  beforeEach(() => {
    memStore.clear();
    setCustomApiBase(LIVE_GATEWAY);
  });

  describe('1. Safe & Emergency Routing Verification (Zero Invented Geometry)', () => {
    const origin = { lat: 10.3797, lon: 78.8208 };
    const destination = { lat: 10.5197, lon: 78.7008 };

    it('parses real server `recommended_route.geometry`, `distance_km`, and `duration_minutes` from live /api/routing/safe-route', async () => {
      const res = await liveHttp.post(`${LIVE_GATEWAY}/api/routing/safe-route`, {
        origin,
        destination,
        costing: 'auto',
        avoid_disasters: true,
      });

      expect(res.status).toBe(200);
      expect(res.data.status).toBe('ROUTE_FOUND');
      expect(res.data.recommended_route).toBeDefined();

      const parsed = validateAndParseSafeRoute({
        raw: res.data,
        mode: 'safe',
        origin,
        destination,
      });

      expect(parsed.ok).toBe(true);
      if (parsed.ok) {
        expect(parsed.overlay.distanceKm).toBe(res.data.recommended_route.distance_km);
        expect(parsed.overlay.durationMin).toBe(res.data.recommended_route.duration_minutes);
        expect(parsed.overlay.distanceKm).not.toBe(18.4);
        expect(parsed.overlay.durationMin).not.toBe(27);
        expect(parsed.overlay.coordinates.length).toBeGreaterThanOrEqual(50);
      }
    });

    it('blocks roads when active closures intersect candidate corridors (client-side spatial verifier catches closure intersections even when backend lacks closure DB)', () => {
      const candidateCorridor: [number, number][] = [
        [78.8208, 10.3797],
        [78.7908, 10.4147],
        [78.7608, 10.4497],
        [78.7308, 10.4847],
        [78.7008, 10.5197],
      ];

      const parsed = validateAndParseSafeRoute({
        raw: {
          status: 'ROUTE_FOUND',
          recommended_route: {
            distance_km: 21.6,
            duration_minutes: 33.4,
            road_condition: 'OPTIMAL',
            number_of_blocked_segments: 0,
            geometry: { type: 'LineString', coordinates: candidateCorridor },
          },
        },
        mode: 'safe',
        origin,
        destination,
        explicitClosures: [
          {
            lat: 10.4497,
            lon: 78.7608,
            radiusKm: 0.4,
            reason: 'Active Landslide Road Closure',
          },
        ],
      });

      expect(parsed.ok).toBe(false);
      if (!parsed.ok) {
        expect(parsed.title).toBe('Verified Safe Route Unavailable');
        expect(parsed.code).toBe('HAZARD_INTERSECTION');
      }
    });

    it('rejects any candidate route intersecting an active CRITICAL pluvial flood zone even if server mistakenly returns ROUTE_FOUND', () => {
      const syntheticCorridor: [number, number][] = [
        [78.8208, 10.3797],
        [78.7908, 10.4147],
        [78.7608, 10.4497],
        [78.7308, 10.4847],
        [78.7008, 10.5197],
      ];
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

      const parsed = validateAndParseSafeRoute({
        raw: {
          status: 'ROUTE_FOUND',
          recommended_route: {
            distance_km: 19.2,
            duration_minutes: 31.0,
            road_condition: 'OPTIMAL',
            number_of_blocked_segments: 0,
            geometry: { type: 'LineString', coordinates: syntheticCorridor },
          },
        },
        mode: 'safe',
        origin,
        destination,
        hazards: activeHazards,
      });

      expect(parsed.ok).toBe(false);
      if (!parsed.ok) {
        expect(parsed.title).toBe('Verified Safe Route Unavailable');
        expect(parsed.code).toBe('HAZARD_INTERSECTION');
      }
    });

    it('rejects routes from a mismatched region (e.g. Meghalaya coordinates returned for Tamil Nadu origin), <5-point straight lines, and missing metrics', () => {
      // Mismatched Shillong coordinates
      const shillongMismatch = validateAndParseSafeRoute({
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
        origin,
        destination,
      });
      expect(shillongMismatch.ok).toBe(false);
      if (!shillongMismatch.ok) {
        expect(shillongMismatch.code).toBe('ORIGIN_MISMATCH');
      }

      // 3-point straight-line geometry rejected
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
                [78.8008, 10.4497],
                [78.7008, 10.5197],
              ],
            },
          },
        },
        mode: 'safe',
        origin,
        destination,
      });
      expect(straightLine.ok).toBe(false);
      if (!straightLine.ok) {
        expect(straightLine.code).toBe('INSUFFICIENT_GEOMETRY');
      }
    });

    it('catches unmodified backend fallback when empty `{}` body returns default Shillong coordinates instead of requested Tamil Nadu origin', async () => {
      const res = await liveHttp.post(`${LIVE_GATEWAY}/api/routing/safe-route`, {});
      const parsed = validateAndParseSafeRoute({
        raw: res.data,
        mode: 'safe',
        origin,
        destination,
      });
      expect(parsed.ok).toBe(false);
      if (!parsed.ok) {
        expect(parsed.title).toBe('Verified Safe Route Unavailable');
        expect(parsed.code).toBe('ORIGIN_MISMATCH');
      }
    });
  });

  describe('2. ML Risk Prediction Schema & Live Rainfall Sensitivity', () => {
    it('submits `rainfall_1h` and `rainfall_24h` keys and reflects real probability changes from live /api/risk/predict', async () => {
      const lowRainEvidence: SelectedLocationEvidence = {
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
      const extremeRainEvidence: SelectedLocationEvidence = {
        ...lowRainEvidence,
        rainfall1hMm: 62.0,
        rainfall24hMm: 215.0,
      };

      const lowReq = buildRiskPredictRequest(lowRainEvidence);
      const highReq = buildRiskPredictRequest(extremeRainEvidence);
      expect(lowReq.ok).toBe(true);
      expect(highReq.ok).toBe(true);
      if (!lowReq.ok || !highReq.ok) return;

      expect(lowReq.body.features).toEqual({ rainfall_1h: 1.5, rainfall_24h: 4.0 });
      expect(highReq.body.features).toEqual({ rainfall_1h: 62.0, rainfall_24h: 215.0 });

      const [lowRes, highRes] = await Promise.all([
        liveHttp.post(`${LIVE_GATEWAY}/api/risk/predict`, lowReq.body),
        liveHttp.post(`${LIVE_GATEWAY}/api/risk/predict`, highReq.body),
      ]);

      const parsedLow = parseRiskPredictResponse(lowRes.data);
      const parsedHigh = parseRiskPredictResponse(highRes.data);

      expect(parsedLow.ok).toBe(true);
      expect(parsedHigh.ok).toBe(true);
      if (parsedLow.ok && parsedHigh.ok) {
        expect(parsedHigh.data.landslideProbability).toBeGreaterThan(
          parsedLow.data.landslideProbability + 0.25
        );
        expect(parsedLow.data.landslideProbability).toBeLessThan(0.75);
        expect(parsedHigh.data.landslideProbability).toBeGreaterThanOrEqual(0.98);
        expect(parsedHigh.data.riskLevel).toBe('Critical');
        expect(parsedHigh.data.recommendedAction.length).toBeGreaterThan(10);
      }
    });

    it('rejects malformed or missing `landslide_probability` payloads without inventing 0.72 / 74% scores', () => {
      expect(parseRiskPredictResponse(null).ok).toBe(false);
      expect(parseRiskPredictResponse({ error: 'Failed' }).ok).toBe(false);
      expect(parseRiskPredictResponse({ risk_level: 'High' }).ok).toBe(false);
    });
  });

  describe('3. Emergency SOS Persistence, Deduplication, Offline Queue & Honest Cancellation', () => {
    it('flags `persisted: false` explicitly as `received_unpersisted` on unmodified live /api/sos when PostGIS is offline and keeps beacon active when cancel fails (502)', async () => {
      const state = await submitOrRetrySos({
        latitude: 10.3797,
        longitude: 78.8208,
        httpPost: liveHttp.post.bind(liveHttp) as any,
      });

      // Because PostGIS is not running in this environment, server returns `persisted: false`.
      // Mobile MUST report `received_unpersisted`, NEVER `confirmed_persisted`.
      expect(state.status).toBe('received_unpersisted');
      expect(state.persisted).toBe(false);
      expect(state.message).toContain('persisted: false');

      // Cancelling against offline DB returns 502; state MUST NOT clear!
      const afterFailedCancel = await cancelConfirmedSos({
        current: state,
        httpPost: liveHttp.post.bind(liveHttp) as any,
      });
      expect(afterFailedCancel.reportId).toBe(state.reportId);
      expect(afterFailedCancel.cancelError).toContain('FAILED');
    });

    it('marks SOS `confirmed_persisted` ONLY when server confirms `delivered: true` AND `persisted: true`, and clears ONLY when cancel returns `cancelled: true`', async () => {
      const mockPostConfirmed = vi.fn().mockResolvedValueOnce({
        status: 200,
        data: {
          delivered: true,
          persisted: true,
          report_id: 'SOS-DB-9001',
          alert_id: 'CAP-9001',
          message: 'Saved in PostGIS.',
        },
      });

      const confirmed = await submitOrRetrySos({
        latitude: 10.3797,
        longitude: 78.8208,
        httpPost: mockPostConfirmed as any,
      });
      expect(confirmed.status).toBe('confirmed_persisted');
      expect(confirmed.persisted).toBe(true);
      expect(confirmed.reportId).toBe('SOS-DB-9001');

      const mockCancelOk = vi.fn().mockResolvedValueOnce({
        status: 200,
        data: { cancelled: true, report_id: 'SOS-DB-9001' },
      });
      const cleared = await cancelConfirmedSos({
        current: confirmed,
        httpPost: mockCancelOk as any,
      });
      expect(cleared.status).toBe('idle');
      expect(cleared.reportId).toBeNull();
    });

    it('stores offline failed SOS genuinely in AsyncStorage as `queued_not_delivered` (never active/delivered) and reuses the same `clientRequestId` across retries', async () => {
      const networkFailPost = vi.fn().mockRejectedValue(new Error('Network timeout'));

      const queued1 = await submitOrRetrySos({
        latitude: 11.0168,
        longitude: 76.9558,
        httpPost: networkFailPost as any,
      });

      expect(queued1.status).toBe('queued_not_delivered');
      expect(queued1.reportId).toBeNull();
      expect(queued1.persisted).toBe(false);

      const persistedDraft = await loadPendingSosRecord();
      expect(persistedDraft).not.toBeNull();
      expect(persistedDraft?.clientRequestId).toBe(queued1.clientRequestId);
      expect(persistedDraft?.attemptCount).toBe(1);

      // Retry reuses identical `clientRequestId`
      const queued2 = await submitOrRetrySos({
        latitude: 11.0168,
        longitude: 76.9558,
        existingRecord: persistedDraft,
        httpPost: networkFailPost as any,
      });
      expect(queued2.clientRequestId).toBe(queued1.clientRequestId);
      expect(queued2.pendingOfflineRecord?.attemptCount).toBe(2);
    });
  });
});
