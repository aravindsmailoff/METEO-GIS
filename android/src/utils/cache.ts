import AsyncStorage from '@react-native-async-storage/async-storage';
import { CachedPayload } from '../types/meteo';

const CACHE_PREFIX = '@meteogis_cache_v1:';

export const FEED_TTL = {
  warnings: 15 * 60 * 1000, // 15 min (IMD synoptic cycle)
  hazards: 5 * 60 * 1000,   // 5 min
  stations: 2 * 60 * 1000,  // 2 min
  rainfall: 2 * 60 * 1000,  // 2 min
  telemetry: 5 * 60 * 1000, // 5 min
} as const;

export async function writeCache<T>(
  key: string,
  data: T,
  source: string,
  ttlMs: number
): Promise<CachedPayload<T>> {
  const now = Date.now();
  const payload: CachedPayload<T> = {
    data,
    fetchedAt: now,
    source,
    expiresAt: now + ttlMs,
  };
  try {
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(payload));
  } catch {
    // Storage full or unavailable: still return in-memory payload safely
  }
  return payload;
}

export async function readCache<T>(key: string): Promise<CachedPayload<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPayload<T>;
    if (!parsed || typeof parsed.fetchedAt !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isCacheStale<T>(entry: CachedPayload<T> | null, now = Date.now()): boolean {
  if (!entry) return true;
  return now > entry.expiresAt;
}

export async function listCacheMetadata(): Promise<
  Array<{ key: string; fetchedAt: number; expiresAt: number; source: string }>
> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const matchKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (matchKeys.length === 0) return [];
    const pairs = await AsyncStorage.multiGet(matchKeys);
    return pairs
      .map(([k, val]) => {
        if (!val) return null;
        try {
          const parsed = JSON.parse(val);
          return {
            key: k.replace(CACHE_PREFIX, ''),
            fetchedAt: parsed.fetchedAt || 0,
            expiresAt: parsed.expiresAt || 0,
            source: parsed.source || '',
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean) as Array<{ key: string; fetchedAt: number; expiresAt: number; source: string }>;
  } catch {
    return [];
  }
}

export async function clearAllFeedCache(): Promise<number> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const matchKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (matchKeys.length > 0) {
      await AsyncStorage.multiRemove(matchKeys);
    }
    return matchKeys.length;
  } catch {
    return 0;
  }
}
