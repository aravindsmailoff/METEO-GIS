import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { API_ROUTES } from '../config/api';
import { buildReferenceWarningsPayload } from '../data/indiaGeoCatalog';
import { useAppStore } from '../store/appStore';
import { DataState, WarningsPayload } from '../types/meteo';
import { FEED_TTL, isCacheStale, readCache, writeCache } from '../utils/cache';
import { useNetworkStatus } from './useNetworkStatus';

const EMPTY_WARNINGS: WarningsPayload = {
  status: 'EMPTY',
  warnings: [],
  activeAlertsCount: 0,
  totalDistricts: 0,
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

  const cacheKey = `warnings:${selectedState}`;

  const load = useCallback(
    async (forceFresh = false) => {
      const cached = await readCache<WarningsPayload>(cacheKey);

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
        });

        const payload = res.data;
        const hasRealWarnings =
          payload && payload.warnings && Array.isArray(payload.warnings) && payload.warnings.length > 0;

        if (hasRealWarnings) {
          const saved = await writeCache(cacheKey, payload, 'api/live/warnings', FEED_TTL.warnings);
          setData(saved.data);
          setFetchedAt(saved.fetchedAt);
          setErrorMessage(null);
          setDataState('success');
          return;
        }

        if (useReferenceFallback) {
          const fallback = buildReferenceWarningsPayload(selectedState);
          const saved = await writeCache(cacheKey, fallback, 'api/live/warnings', FEED_TTL.warnings);
          setData(saved.data);
          setFetchedAt(saved.fetchedAt);
          setErrorMessage(null);
          setDataState(fallback.warnings.length === 0 ? 'empty' : 'success');
          return;
        }

        if (cached) {
          setData(cached.data);
          setFetchedAt(cached.fetchedAt);
          setDataState('stale');
          return;
        }

        setData(EMPTY_WARNINGS);
        setFetchedAt(Date.now());
        setDataState('empty');
      } catch (err: any) {
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
    load(false);
    const pollId = setInterval(() => load(false), 60000); // Spec Section 7: 60s interval
    return () => clearInterval(pollId);
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
