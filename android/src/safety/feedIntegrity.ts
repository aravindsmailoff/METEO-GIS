import { CachedPayload, DataState } from '../types/meteo';
import { formatRelativeMinutes } from '../utils/formatters';

export interface StatusBadgeDescriptor {
  dot: string;
  bg: string;
  border: string;
  text: string;
  label: string;
}

/**
 * Pure feed resolution helper guaranteeing strict scientific data integrity:
 * 1. Sample/reference data is NEVER returned unless BOTH `isDev === true` AND `qaSampleOptIn === true`.
 * 2. Sample/reference data is NEVER written into persistent cache (`shouldPersistToCache: false`).
 * 3. When upstream official feeds report `status !== 'OK'` (e.g. `UNAVAILABLE`), normal operation preserves
 *    usable non-sample cache as `'stale'` (`Cached · Xm ago`) or reports `'error'` (`IMD Feed Unavailable`) —
 *    NEVER green `'Live'` and NEVER misleading `'No Active Alerts'`.
 * 4. `'empty'` (`Live · 0 Active Alerts`) is used ONLY when the official upstream feed explicitly succeeded (`status === 'OK'`) with 0 items.
 */
export function resolveFeedOutcome<
  T extends { status?: string; isLive?: boolean; isReferenceSnapshot?: boolean },
>(params: {
  upstreamPayload: T | null;
  hasLiveItems: boolean;
  cached: CachedPayload<T> | null;
  emptyPayload: T;
  buildSamplePayload: () => T;
  isDev: boolean;
  qaSampleOptIn: boolean;
}): {
  payload: T;
  dataState: DataState;
  shouldPersistToCache: boolean;
  errorMessage: string | null;
} {
  const {
    upstreamPayload,
    hasLiveItems,
    cached,
    emptyPayload,
    buildSamplePayload,
    isDev,
    qaSampleOptIn,
  } = params;

  const usableRealCache =
    cached && cached.data && !cached.data.isReferenceSnapshot ? cached : null;

  // Case 1: Official upstream feed genuinely succeeded (`status === 'OK'` AND `isLive !== false`)
  if (upstreamPayload && upstreamPayload.status === 'OK' && upstreamPayload.isLive !== false) {
    const cleanPayload: T = { ...upstreamPayload, isReferenceSnapshot: false };
    return {
      payload: cleanPayload,
      dataState: hasLiveItems ? 'success' : 'empty',
      shouldPersistToCache: true,
      errorMessage: null,
    };
  }

  // Case 2: Explicit QA sample mode (strictly development-only, NEVER persisted, ALWAYS labeled SAMPLE / NOT LIVE)
  if (isDev && qaSampleOptIn) {
    const sample = { ...buildSamplePayload(), isReferenceSnapshot: true };
    return {
      payload: sample,
      dataState: 'sample',
      shouldPersistToCache: false,
      errorMessage: null,
    };
  }

  // Case 3: Upstream official feed unavailable/degraded — preserve real cached data clearly marked as STALE
  if (usableRealCache) {
    return {
      payload: usableRealCache.data,
      dataState: 'stale',
      shouldPersistToCache: false,
      errorMessage: 'Official IMD feed temporarily unavailable — showing last verified cached snapshot.',
    };
  }

  // Case 4: Upstream official feed unavailable and no verified cache exists -> explicit Feed Unavailable error
  return {
    payload: emptyPayload,
    dataState: 'error',
    shouldPersistToCache: false,
    errorMessage:
      'Official IMD feed unavailable — live hazard verification cannot be completed right now.',
  };
}

/**
 * Pure status-badge config builder ensuring sample/reference data NEVER displays as Live.
 */
export function getDataStatusBadgeConfig(params: {
  state: DataState;
  fetchedAt: number | null;
  nowMs?: number;
  isReferenceSnapshot?: boolean;
}): StatusBadgeDescriptor {
  const { state, fetchedAt, nowMs = Date.now(), isReferenceSnapshot = false } = params;

  // Hard invariant: sample/reference payloads NEVER appear as Live under any state!
  if (state === 'sample' || isReferenceSnapshot) {
    return {
      dot: '#e879f9',
      bg: 'rgba(162, 28, 175, 0.28)',
      border: '#e879f9',
      text: '#f5d0fe',
      label: 'SAMPLE · NOT LIVE',
    };
  }

  switch (state) {
    case 'loading':
      return {
        dot: '#38bdf8',
        bg: 'rgba(56, 189, 248, 0.14)',
        border: 'rgba(56, 189, 248, 0.35)',
        text: '#7dd3fc',
        label: 'Syncing…',
      };
    case 'stale':
      return {
        dot: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.16)',
        border: 'rgba(245, 158, 11, 0.4)',
        text: '#fcd34d',
        label: `Cached · ${formatRelativeMinutes(fetchedAt, nowMs)}`,
      };
    case 'offline':
      return {
        dot: '#f97316',
        bg: 'rgba(249, 115, 22, 0.16)',
        border: 'rgba(249, 115, 22, 0.42)',
        text: '#fdba74',
        label: fetchedAt ? `Offline · ${formatRelativeMinutes(fetchedAt, nowMs)}` : 'Offline',
      };
    case 'error':
      return {
        dot: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.18)',
        border: 'rgba(239, 68, 68, 0.5)',
        text: '#fca5a5',
        label: 'IMD Feed Unavailable',
      };
    case 'empty':
      return {
        dot: '#10b981',
        bg: 'rgba(16, 185, 129, 0.12)',
        border: 'rgba(16, 185, 129, 0.35)',
        text: '#a7f3d0',
        label: 'Live · 0 Active Alerts',
      };
    case 'success':
    default:
      return {
        dot: '#10b981',
        bg: 'rgba(16, 185, 129, 0.15)',
        border: 'rgba(16, 185, 129, 0.4)',
        text: '#6ee7b7',
        label: 'Live',
      };
  }
}
