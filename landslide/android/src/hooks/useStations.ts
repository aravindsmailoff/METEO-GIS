import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import axios from 'axios';
import { API_ROUTES, IS_DEV_RUNTIME } from '../config/api';
import { buildReferenceStationsPayload } from '../data/indiaGeoCatalog';
import { resolveFeedOutcome } from '../safety/feedIntegrity';
import { useAppStore } from '../store/appStore';
import {
  DataState,
  RainfallObservationPoint,
  StationsPayload,
  ValidatedStationObservation,
} from '../types/meteo';
import { FEED_TTL, isCacheStale, readCache, writeCache } from '../utils/cache';
import { useNetworkStatus } from './useNetworkStatus';

const EMPTY_STATIONS: StationsPayload = {
  status: 'EMPTY',
  stations: [],
  rainfallPoints: [],
  totalCount: 0,
  isReferenceSnapshot: false,
};

export function useStations() {
  const selectedState = useAppStore((s) => s.selectedState);
  const refreshNonce = useAppStore((s) => s.refreshNonce);
  const useReferenceFallback = useAppStore((s) => s.useReferenceFallbackWhenUpstreamDown);
  const { isOnline } = useNetworkStatus();

  const [data, setData] = useState<StationsPayload>(EMPTY_STATIONS);
  const [dataState, setDataState] = useState<DataState>('loading');
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const failureStreakRef = useRef<number>(0);

  const cacheKey = `stations:${selectedState}`;

  const load = useCallback(
    async (forceFresh = false) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const rawCached = await readCache<StationsPayload>(cacheKey);
      const cached =
        rawCached && !rawCached.data?.isReferenceSnapshot ? rawCached : null;

      if (!isOnline) {
        if (cached) {
          setData(cached.data);
          setFetchedAt(cached.fetchedAt);
          setDataState('offline');
          return;
        }
        setData(EMPTY_STATIONS);
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

        const [stnRes, rainRes] = await Promise.all([
          axios.get<{ status?: string; stations?: ValidatedStationObservation[]; totalCount?: number }>(
            API_ROUTES.stations(),
            { params, timeout: 8000, signal: controller.signal }
          ),
          axios
            .get<{ status?: string; rainfallPoints?: RainfallObservationPoint[] }>(
              API_ROUTES.rainfall(),
              {
                params: { ...params, active_only: 'false' },
                timeout: 8000,
                signal: controller.signal,
              }
            )
            .catch(() => ({ data: { status: 'UNAVAILABLE', rainfallPoints: [] } })),
        ]);

        const stns = stnRes.data?.stations || [];
        const rainPts = rainRes.data?.rainfallPoints || [];
        const upstreamOk = stnRes.data?.status === 'OK' || stns.length > 0 || rainPts.length > 0;

        const upstreamCombined: StationsPayload = {
          status: upstreamOk ? 'OK' : stnRes.data?.status || 'UNAVAILABLE',
          stations: stns,
          rainfallPoints: rainPts,
          totalCount: stnRes.data?.totalCount || stns.length,
          isReferenceSnapshot: false,
        };

        const outcome = resolveFeedOutcome<StationsPayload>({
          upstreamPayload: upstreamCombined,
          hasLiveItems: stns.length > 0 || rainPts.length > 0,
          cached,
          emptyPayload: EMPTY_STATIONS,
          buildSamplePayload: () => buildReferenceStationsPayload(selectedState),
          isDev: IS_DEV_RUNTIME,
          qaSampleOptIn: useReferenceFallback,
        });

        failureStreakRef.current = outcome.dataState === 'error' ? failureStreakRef.current + 1 : 0;

        if (outcome.shouldPersistToCache) {
          const saved = await writeCache(
            cacheKey,
            outcome.payload,
            'api/live/stations',
            FEED_TTL.stations
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
          const sample = { ...buildReferenceStationsPayload(selectedState), isReferenceSnapshot: true };
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
        setErrorMessage(err?.message || 'Unable to load /api/live/stations');
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
      const delayMs = 120000 * backoffFactor;
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

  return {
    stationsPayload: data,
    stations: data.stations || [],
    rainfallPoints: data.rainfallPoints || [],
    dataState,
    fetchedAt,
    errorMessage,
    refetch: () => load(true),
  };
}
