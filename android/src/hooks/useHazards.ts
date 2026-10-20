import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import axios from 'axios';
import { API_ROUTES, IS_DEV_RUNTIME } from '../config/api';
import { buildReferenceHazardsPayload } from '../data/indiaGeoCatalog';
import { resolveFeedOutcome } from '../safety/feedIntegrity';
import { useAppStore } from '../store/appStore';
import { DataState, HazardsPayload } from '../types/meteo';
import { FEED_TTL, isCacheStale, readCache, writeCache } from '../utils/cache';
import { useNetworkStatus } from './useNetworkStatus';

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

export function useHazards() {
  const selectedState = useAppStore((s) => s.selectedState);
  const refreshNonce = useAppStore((s) => s.refreshNonce);
  const useReferenceFallback = useAppStore((s) => s.useReferenceFallbackWhenUpstreamDown);
  const { isOnline } = useNetworkStatus();

  const [data, setData] = useState<HazardsPayload>(EMPTY_HAZARDS);
  const [dataState, setDataState] = useState<DataState>('loading');
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const failureStreakRef = useRef<number>(0);

  const cacheKey = `hazards:${selectedState}`;

  const load = useCallback(
    async (forceFresh = false) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const rawCached = await readCache<HazardsPayload>(cacheKey);
      const cached =
        rawCached && !rawCached.data?.isReferenceSnapshot ? rawCached : null;

      if (!isOnline) {
        if (cached) {
          setData(cached.data);
          setFetchedAt(cached.fetchedAt);
          setDataState('offline');
          return;
        }
        setData(EMPTY_HAZARDS);
        setDataState('offline');
        return;
      }

      if (!cached) {
        setDataState('loading');
      }

      try {
        const params: Record<string, string | number> = { t: Date.now() };
        if (selectedState && selectedState !== 'All India') {
          params.state = selectedState;
        }
        if (forceFresh) {
          params.fresh = 1;
        }

        const res = await axios.get<HazardsPayload>(API_ROUTES.hazards(), {
          params,
          timeout: 8000,
          signal: controller.signal,
        });

        const payload = res.data;
        const hasLiveItems = Boolean(
          (payload?.events && payload.events.length > 0) ||
            (payload?.pluvialFloodZones && payload.pluvialFloodZones.length > 0)
        );

        const outcome = resolveFeedOutcome<HazardsPayload>({
          upstreamPayload: payload,
          hasLiveItems,
          cached,
          emptyPayload: EMPTY_HAZARDS,
          buildSamplePayload: () => buildReferenceHazardsPayload(selectedState),
          isDev: IS_DEV_RUNTIME,
          qaSampleOptIn: useReferenceFallback,
        });

        failureStreakRef.current = outcome.dataState === 'error' ? failureStreakRef.current + 1 : 0;

        if (outcome.shouldPersistToCache) {
          const saved = await writeCache(
            cacheKey,
            outcome.payload,
            'api/live/hazards',
            FEED_TTL.hazards
          );
          setData(saved.data);
          setFetchedAt(saved.fetchedAt);
        } else {
          setData(outcome.payload);
          setFetchedAt(outcome.dataState === 'stale' && cached ? cached.fetchedAt : Date.now());
        }

        setErrorMessage(outcome.errorMessage);
        setDataState(outcome.dataState);
      } catch (err: any) {
        if (controller.signal.aborted) return;
        failureStreakRef.current += 1;

        if (IS_DEV_RUNTIME && useReferenceFallback) {
          const sample = { ...buildReferenceHazardsPayload(selectedState), isReferenceSnapshot: true };
          setData(sample);
          setFetchedAt(Date.now());
          setErrorMessage(null);
          setDataState('sample');
          return;
        }

        if (cached) {
          setData(cached.data);
          setFetchedAt(cached.fetchedAt);
          setDataState(isCacheStale(cached) ? 'stale' : 'offline');
          return;
        }
        setErrorMessage(err?.message || 'Unable to reach /api/live/hazards');
        setDataState('error');
      }
    },
    [cacheKey, isOnline, selectedState, useReferenceFallback]
  );

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const scheduleNext = () => {
      const backoffFactor = Math.min(4, Math.pow(2, failureStreakRef.current));
      const delayMs = 30000 * backoffFactor;
      timer = setTimeout(async () => {
        if (cancelled) return;
        if (!AppState.currentState || AppState.currentState === 'active') {
          await load(false);
        }
        if (!cancelled) scheduleNext();
      }, delayMs);
    };

    load(false).finally(() => {
      if (!cancelled) scheduleNext();
    });

    return () => {
      cancelled = true;
      abortRef.current?.abort();
      if (timer) clearTimeout(timer);
    };
  }, [load, refreshNonce]);

  useEffect(() => {
    const staleTimer = setInterval(() => {
      if (fetchedAt && Date.now() - fetchedAt > FEED_TTL.hazards && dataState === 'success') {
        setDataState('stale');
      }
    }, 15000);
    return () => clearInterval(staleTimer);
  }, [fetchedAt, dataState]);

  return {
    hazards: data,
    dataState,
    fetchedAt,
    errorMessage,
    refetch: () => load(true),
  };
}
