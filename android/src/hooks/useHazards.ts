import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { API_ROUTES } from '../config/api';
import { buildReferenceHazardsPayload } from '../data/indiaGeoCatalog';
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

  const cacheKey = `hazards:${selectedState}`;

  const load = useCallback(
    async (forceFresh = false) => {
      const cached = await readCache<HazardsPayload>(cacheKey);

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
        });

        const payload = res.data;
        const hasRealEvents =
          payload &&
          payload.status === 'OK' &&
          ((payload.events && payload.events.length > 0) ||
            (payload.pluvialFloodZones && payload.pluvialFloodZones.length > 0));

        if (hasRealEvents) {
          const saved = await writeCache(cacheKey, payload, 'api/live/hazards', FEED_TTL.hazards);
          setData(saved.data);
          setFetchedAt(saved.fetchedAt);
          setErrorMessage(null);
          setDataState('success');
          return;
        }

        // Upstream IMD GeoServer unavailable or returned 0 items
        if (useReferenceFallback) {
          const fallback = buildReferenceHazardsPayload(selectedState);
          const saved = await writeCache(cacheKey, fallback, 'api/live/hazards', FEED_TTL.hazards);
          setData(saved.data);
          setFetchedAt(saved.fetchedAt);
          setErrorMessage(null);
          setDataState(fallback.events.length === 0 ? 'empty' : 'success');
          return;
        }

        if (cached) {
          setData(cached.data);
          setFetchedAt(cached.fetchedAt);
          setDataState('stale');
          return;
        }

        setData(EMPTY_HAZARDS);
        setFetchedAt(Date.now());
        setDataState('empty');
      } catch (err: any) {
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
    load(false);
    const pollId = setInterval(() => load(false), 30000); // Spec Section 7: 30s interval
    return () => clearInterval(pollId);
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
