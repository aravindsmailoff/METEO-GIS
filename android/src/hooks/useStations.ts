import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { API_ROUTES } from '../config/api';
import { buildReferenceStationsPayload } from '../data/indiaGeoCatalog';
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

  const cacheKey = `stations:${selectedState}`;

  const load = useCallback(
    async (forceFresh = false) => {
      const cached = await readCache<StationsPayload>(cacheKey);

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
          axios.get<{ stations?: ValidatedStationObservation[]; totalCount?: number }>(
            API_ROUTES.stations(),
            { params, timeout: 8000 }
          ),
          axios
            .get<{ rainfallPoints?: RainfallObservationPoint[] }>(API_ROUTES.rainfall(), {
              params: { ...params, active_only: 'false' },
              timeout: 8000,
            })
            .catch(() => ({ data: { rainfallPoints: [] } })),
        ]);

        const stns = stnRes.data?.stations || [];
        const rainPts = rainRes.data?.rainfallPoints || [];

        if (stns.length > 0 || rainPts.length > 0) {
          const combined: StationsPayload = {
            status: 'OK',
            stations: stns,
            rainfallPoints: rainPts,
            totalCount: stnRes.data?.totalCount || stns.length,
          };
          const saved = await writeCache(cacheKey, combined, 'api/live/stations', FEED_TTL.stations);
          setData(saved.data);
          setFetchedAt(saved.fetchedAt);
          setErrorMessage(null);
          setDataState('success');
          return;
        }

        if (useReferenceFallback) {
          const fallback = buildReferenceStationsPayload(selectedState);
          const saved = await writeCache(cacheKey, fallback, 'api/live/stations', FEED_TTL.stations);
          setData(saved.data);
          setFetchedAt(saved.fetchedAt);
          setErrorMessage(null);
          setDataState(fallback.stations.length === 0 ? 'empty' : 'success');
          return;
        }

        if (cached) {
          setData(cached.data);
          setFetchedAt(cached.fetchedAt);
          setDataState('stale');
          return;
        }

        setData(EMPTY_STATIONS);
        setFetchedAt(Date.now());
        setDataState('empty');
      } catch (err: any) {
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
    load(false);
    const pollId = setInterval(() => load(false), 120000); // Spec Section 7: 120s interval
    return () => clearInterval(pollId);
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
