import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
  APPROVED_DEV_CLEARTEXT_HOSTS,
  resolveApiBase,
  validateApiBaseCandidate,
} from '../config/api';
import { buildReferenceHazardsPayload } from '../data/indiaGeoCatalog';
import {
  getDataStatusBadgeConfig,
  resolveFeedOutcome,
} from '../safety/feedIntegrity';
import { useAppStore } from '../store/appStore';
import { CachedPayload, HazardsPayload } from '../types/meteo';

const EMPTY_HAZARDS: HazardsPayload = {
  status: 'EMPTY',
  events: [],
  pluvialFloodZones: [],
  counts: {
    totalEvents: 0,
    severeEventsCount: 0,
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
  isReferenceSnapshot: false,
};

describe('Phase 2 Data Integrity, Gradle Wrapper & Cleartext Security Suite', () => {
  describe('4. Sample Data Disabled by Default & Never Presented as Live', () => {
    it('disables sample fallback by default in store (`useReferenceFallbackWhenUpstreamDown === false`)', () => {
      expect(useAppStore.getState().useReferenceFallbackWhenUpstreamDown).toBe(false);
    });

    it('reports `IMD Feed Unavailable` (`error`) instead of sample data when official upstream feed is UNAVAILABLE and no cache exists', () => {
      const outcome = resolveFeedOutcome<HazardsPayload>({
        upstreamPayload: { ...EMPTY_HAZARDS, status: 'UNAVAILABLE' },
        hasLiveItems: false,
        cached: null,
        emptyPayload: EMPTY_HAZARDS,
        buildSamplePayload: () => buildReferenceHazardsPayload('All India'),
        isDev: true,
        qaSampleOptIn: false,
      });

      expect(outcome.dataState).toBe('error');
      expect(outcome.payload.events).toHaveLength(0);
      expect(outcome.shouldPersistToCache).toBe(false);

      // Also catches `/api/live/hazards` returning `{ status: 'OK', isLive: false }` when upstream IMD is down!
      const deceptiveOkNotLive = resolveFeedOutcome<HazardsPayload>({
        upstreamPayload: { ...EMPTY_HAZARDS, status: 'OK', isLive: false },
        hasLiveItems: false,
        cached: null,
        emptyPayload: EMPTY_HAZARDS,
        buildSamplePayload: () => buildReferenceHazardsPayload('All India'),
        isDev: true,
        qaSampleOptIn: false,
      });
      expect(deceptiveOkNotLive.dataState).toBe('error');
    });

    it('preserves usable cached data explicitly labeled `Cached · ...` (`stale`) when upstream refresh fails', () => {
      const fiveMinAgo = Date.now() - 5 * 60 * 1000;
      const realCached: CachedPayload<HazardsPayload> = {
        data: {
          ...EMPTY_HAZARDS,
          status: 'OK',
          isReferenceSnapshot: false,
        },
        fetchedAt: fiveMinAgo,
        expiresAt: fiveMinAgo + 120000,
        source: 'api/live/hazards',
      };

      const outcome = resolveFeedOutcome<HazardsPayload>({
        upstreamPayload: { ...EMPTY_HAZARDS, status: 'UNAVAILABLE' },
        hasLiveItems: false,
        cached: realCached,
        emptyPayload: EMPTY_HAZARDS,
        buildSamplePayload: () => buildReferenceHazardsPayload('All India'),
        isDev: true,
        qaSampleOptIn: false,
      });

      expect(outcome.dataState).toBe('stale');
      expect(outcome.shouldPersistToCache).toBe(false);
      const badge = getDataStatusBadgeConfig({
        state: outcome.dataState,
        fetchedAt: fiveMinAgo,
        nowMs: Date.now(),
      });
      expect(badge.label).toContain('Cached');
      expect(badge.label).not.toBe('Live');
    });

    it('never enables sample data in release builds (`isDev === false`) and always labels dev sample data `SAMPLE · NOT LIVE` without caching', () => {
      const blockedInProd = resolveFeedOutcome<HazardsPayload>({
        upstreamPayload: { ...EMPTY_HAZARDS, status: 'UNAVAILABLE' },
        hasLiveItems: false,
        cached: null,
        emptyPayload: EMPTY_HAZARDS,
        buildSamplePayload: () => buildReferenceHazardsPayload('All India'),
        isDev: false,
        qaSampleOptIn: true,
      });
      expect(blockedInProd.dataState).toBe('error');
      expect(blockedInProd.payload.events).toHaveLength(0);

      const devSample = resolveFeedOutcome<HazardsPayload>({
        upstreamPayload: { ...EMPTY_HAZARDS, status: 'UNAVAILABLE' },
        hasLiveItems: false,
        cached: null,
        emptyPayload: EMPTY_HAZARDS,
        buildSamplePayload: () => buildReferenceHazardsPayload('All India'),
        isDev: true,
        qaSampleOptIn: true,
      });
      expect(devSample.dataState).toBe('sample');
      expect(devSample.shouldPersistToCache).toBe(false);
      expect(devSample.payload.isReferenceSnapshot).toBe(true);

      // Even if a caller passed `state: 'success'`, `isReferenceSnapshot: true` MUST show `SAMPLE · NOT LIVE`
      const badge = getDataStatusBadgeConfig({
        state: 'success',
        fetchedAt: Date.now(),
        isReferenceSnapshot: true,
      });
      expect(badge.label).toBe('SAMPLE · NOT LIVE');
    });
  });

  describe('5 & 6. Reproducible Gradle Wrapper + Cleartext Loopback Restriction + Production HTTPS Enforcement', () => {
    it('rejects unconfigured, HTTP, emulator, localhost, and placeholder URLs in production mode while accepting valid HTTPS endpoints', () => {
      expect(() =>
        resolveApiBase({
          isDev: false,
          platformOs: 'android',
          configuredProdUrl: '',
          customOverrideUrl: null,
        })
      ).toThrow();

      expect(() =>
        resolveApiBase({
          isDev: false,
          platformOs: 'android',
          configuredProdUrl: 'http://10.0.2.2:3000',
          customOverrideUrl: null,
        })
      ).toThrow();

      expect(
        resolveApiBase({
          isDev: false,
          platformOs: 'android',
          configuredProdUrl: 'https://meteo-gis.vercel.app',
          customOverrideUrl: null,
        })
      ).toBe('https://meteo-gis.vercel.app');

      expect(() =>
        resolveApiBase({
          isDev: false,
          platformOs: 'android',
          configuredProdUrl: 'https://example.com',
          customOverrideUrl: null,
        })
      ).toThrow();

      expect(() =>
        resolveApiBase({
          isDev: false,
          platformOs: 'android',
          configuredProdUrl: 'http://api.meteo-gis.org',
          customOverrideUrl: null,
        })
      ).toThrow();

      expect(
        resolveApiBase({
          isDev: false,
          platformOs: 'android',
          configuredProdUrl: 'https://api.meteo-gis.org/',
          customOverrideUrl: null,
        })
      ).toBe('https://api.meteo-gis.org');

      // Even in dev mode, cleartext HTTP to arbitrary remote hosts is rejected
      expect(validateApiBaseCandidate('http://untrusted.remote.host:3000', true).valid).toBe(false);
      expect(validateApiBaseCandidate('http://127.0.0.1:3000', true).valid).toBe(true);
    });

    it('verifies Gradle wrapper artifacts, `OpenSourceMergedSoMapping`, `usesCleartextTraffic="false"`, and domain-scoped `network_security_config.xml`', () => {
      const nativeRoot = path.resolve(__dirname, '../../android');
      const gradlew = path.join(nativeRoot, 'gradlew');
      const gradlewBat = path.join(nativeRoot, 'gradlew.bat');
      const wrapperJar = path.join(nativeRoot, 'gradle/wrapper/gradle-wrapper.jar');
      const wrapperProps = path.join(nativeRoot, 'gradle/wrapper/gradle-wrapper.properties');
      const debugKeystore = path.join(nativeRoot, 'app/debug.keystore');
      const manifestXml = fs.readFileSync(
        path.join(nativeRoot, 'app/src/main/AndroidManifest.xml'),
        'utf-8'
      );
      const netSecXml = fs.readFileSync(
        path.join(nativeRoot, 'app/src/main/res/xml/network_security_config.xml'),
        'utf-8'
      );
      const appBuildGradle = fs.readFileSync(
        path.join(nativeRoot, 'app/build.gradle'),
        'utf-8'
      );
      const mainAppKt = fs.readFileSync(
        path.join(nativeRoot, 'app/src/main/java/com/meteogis/MainApplication.kt'),
        'utf-8'
      );

      expect(fs.existsSync(gradlew)).toBe(true);
      expect(fs.statSync(gradlew).mode & 0o111).toBeGreaterThan(0);
      expect(fs.existsSync(gradlewBat)).toBe(true);
      expect(fs.statSync(wrapperJar).size).toBeGreaterThan(30000);
      expect(fs.readFileSync(wrapperProps, 'utf-8')).toContain('gradle-8.10.2');
      expect(fs.existsSync(debugKeystore)).toBe(true);

      expect(manifestXml).toContain('android:usesCleartextTraffic="false"');
      expect(netSecXml).toContain('<base-config cleartextTrafficPermitted="false" />');
      for (const host of APPROVED_DEV_CLEARTEXT_HOSTS) {
        expect(netSecXml).toContain(`<domain includeSubdomains="false">${host}</domain>`);
      }

      expect(appBuildGradle).toContain('verifyReleaseApiConfig');
      expect(mainAppKt).toContain('OpenSourceMergedSoMapping');
    });
  });
});
