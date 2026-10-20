import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import axios from 'axios';
import { API_ROUTES, IS_DEV_RUNTIME } from '../config/api';
import { buildReferenceWarningsPayload } from '../data/indiaGeoCatalog';
import { resolveFeedOutcome } from '../safety/feedIntegrity';
import { useAppStore } from '../store/appStore';
import { DataState, WarningsPayload } from '../types/meteo';
import { FEED_TTL, isCacheStale, readCache, writeCache } from '../utils/cache';
import { useNetworkStatus } from './useNetworkStatus';

const EMPTY_WARNINGS: WarningsPayload = {
  status: 'EMPTY',
  warnings: [],
  activeAlertsCount: 0,
  totalDistricts: 0,
  isReferenceSnapshot: false,
};

export function useWarnings() {
  const selectedState = useAppStore((s) => s.selectedState);
  const refreshNonce = useAppStore((s) => s.refreshNonce);
  const useReferenceFallback = useAppStore((s) => s.useReferenceFallbackWhenUpstreamDown);
  const { isOnline } = useNetworkStatus();

  const [data, setData] = useState<WarningsPayload>(EMPTY_WARNINGS);
  const [dataState, setDataState] = useState<DataState>('loading');
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const failureStreakRef = useRef<number>(0);

  const cacheKey = `warnings:${selectedState}`;

  const load = useCallback(
    async (forceFresh = false) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const rawCached = await readCache<WarningsPayload>(cacheKey);
      const cached =
        rawCached && !rawCached.data?.isReferenceSnapshot ? rawCached : null;

      if (!isOnline) {
        if (cached) {
          setData(cached.data);
          setFetchedAt(cached.fetchedAt);
          setDataState('offline');
          return;
        }
        setData(EMPTY_WARNINGS);
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

        const res = await axios.get<WarningsPayload>(API_ROUTES.warnings(), {
          params,
          timeout: 8000,
          signal: controller.signal,
        });

        const payload = res.data;
        const hasLiveItems = Boolean(
          payload && Array.isArray(payload.warnings) && payload.warnings.length > 0
        );

        const outcome = resolveFeedOutcome<WarningsPayload>({
          upstreamPayload: payload,
          hasLiveItems,
          cached,
          emptyPayload: EMPTY_WARNINGS,
          buildSamplePayload: () => buildReferenceWarningsPayload(selectedState),
          isDev: IS_DEV_RUNTIME,
          qaSampleOptIn: useReferenceFallback,
        });

        failureStreakRef.current = outcome.dataState === 'error' ? failureStreakRef.current + 1 : 0;

        if (outcome.shouldPersistToCache) {
          const saved = await writeCache(
            cacheKey,
            outcome.payload,
            'api/live/warnings',
            FEED_TTL.warnings
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
          const sample = { ...buildReferenceWarningsPayload(selectedState), isReferenceSnapshot: true };
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
        setErrorMessage(err?.message || 'Unable to load /api/live/warnings');
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
      const delayMs = 60000 * backoffFactor;
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
      if (fetchedAt && Date.now() - fetchedAt > FEED_TTL.warnings && dataState === 'success') {
        setDataState('stale');
      }
    }, 20000);
    return () => clearInterval(staleTimer);
  }, [fetchedAt, dataState]);

  return {
    warningsPayload: data,
    warnings: data.warnings || [],
    dataState,
    fetchedAt,
    errorMessage,
    refetch: () => load(true),
  };
}
