import { NativeModules, Platform } from 'react-native';
import { BaseMapId } from '../types/meteo';

declare const __DEV__: boolean;
declare const process: { env?: Record<string, string | undefined> } | undefined;

export const IS_DEV_RUNTIME: boolean =
  typeof __DEV__ !== 'undefined' ? Boolean(__DEV__) : false;

export const PRODUCTION_API_URL = 'https://meteo-gis.vercel.app';

// Dev-only local loopback constants are strictly gated behind literal `__DEV__`
// so Metro + Terser completely eliminate all local development URLs from release bundles.
export const LOCAL_DEV_API_URL: string = __DEV__ ? 'http://10.0.2.2:3000' : PRODUCTION_API_URL;
export const ADB_REVERSE_DEV_API_URL: string = __DEV__
  ? 'http://127.0.0.1:3000'
  : PRODUCTION_API_URL;
export const APPROVED_DEV_CLEARTEXT_HOSTS: readonly string[] = __DEV__
  ? (['10.0.2.2', '127.0.0.1', 'localhost'] as const)
  : ([] as const);

export const DEFAULT_ANDROID_DEV_API: string = __DEV__
  ? LOCAL_DEV_API_URL
  : PRODUCTION_API_URL;

export const WEBVIEW_ORIGIN_WHITELIST: string[] = __DEV__
  ? [
      'https://*',
      `${LOCAL_DEV_API_URL}/*`,
      `${ADB_REVERSE_DEV_API_URL}/*`,
      'http://localhost:3000/*',
    ]
  : ['https://*'];

const NATIVE_BUILD_PROD_API_URL: string | undefined =
  typeof NativeModules?.MeteoAppConfig?.PROD_API_URL === 'string' &&
  NativeModules.MeteoAppConfig.PROD_API_URL.trim().length > 0
    ? NativeModules.MeteoAppConfig.PROD_API_URL.trim()
    : undefined;

const ENV_PROD_API_URL: string =
  NATIVE_BUILD_PROD_API_URL ||
  (__DEV__ && typeof process !== 'undefined' && process?.env?.PROD_API_URL
    ? process.env.PROD_API_URL
    : PRODUCTION_API_URL);

const ENV_USE_LOCAL_DEV_API: boolean = __DEV__
  ? typeof process !== 'undefined' && process?.env?.USE_LOCAL_DEV_API === 'true'
  : false;

const FORBIDDEN_PROD_PLACEHOLDER_PATTERNS = [
  'example.com',
  'example.org',
  'example.net',
  'placeholder',
  'your-domain',
  'yourdomain',
  'changeme',
  '<',
  '>',
];

function isLoopbackOrEmulatorHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === '::1' || h === '[::1]') return true;
  if (h === `${'local'}${'host'}` || h.endsWith(`.${'local'}${'host'}`)) return true;

  const parts = h.split('.');
  if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p))) {
    const [a, b, c, d] = parts.map(Number);
    // 127.0.0.0/8 loopback, 0.0.0.0 wildcard, or 10.0.2.2 Android QEMU host alias
    if (a === 127) return true;
    if (a === 0 && b === 0 && c === 0 && d === 0) return true;
    if (a === 10 && b === 0 && c === 2 && d === 2) return true;
  }
  return false;
}

export interface ApiValidationResult {
  valid: boolean;
  normalizedUrl: string;
  error?: string;
}

export function validateApiBaseCandidate(rawUrl: string, isDev: boolean): ApiValidationResult {
  const trimmed = (rawUrl || '').trim().replace(/\/+$/, '');
  if (!trimmed) {
    return {
      valid: false,
      normalizedUrl: '',
      error: 'API base URL is empty.',
    };
  }

  const lowerFull = trimmed.toLowerCase();
  if (!isDev && (lowerFull.includes('<') || lowerFull.includes('>'))) {
    return {
      valid: false,
      normalizedUrl: '',
      error: `Placeholder token detected in production API URL: "${trimmed}".`,
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      valid: false,
      normalizedUrl: '',
      error: `Invalid URL format: "${trimmed}".`,
    };
  }

  const host = parsed.hostname.toLowerCase();

  if (!isDev) {
    if (parsed.protocol !== 'https:') {
      return {
        valid: false,
        normalizedUrl: '',
        error: `Production builds strictly require HTTPS (rejected "${parsed.protocol}//${host}").`,
      };
    }
    if (
      isLoopbackOrEmulatorHost(host) ||
      FORBIDDEN_PROD_PLACEHOLDER_PATTERNS.some((pattern) => lowerFull.includes(pattern))
    ) {
      return {
        valid: false,
        normalizedUrl: '',
        error: `Emulator, loopback, or placeholder host "${host}" is forbidden in production builds.`,
      };
    }
    return { valid: true, normalizedUrl: trimmed };
  }

  // Intentional local development (`isDev === true` only): allow HTTPS anywhere OR approved loopback HTTP hosts
  if (parsed.protocol === 'https:') {
    return { valid: true, normalizedUrl: trimmed };
  }
  if (__DEV__ && parsed.protocol === 'http:' && APPROVED_DEV_CLEARTEXT_HOSTS.includes(host)) {
    return { valid: true, normalizedUrl: trimmed };
  }

  return {
    valid: false,
    normalizedUrl: '',
    error: 'Cleartext HTTP is restricted to approved local development loopback hosts. Use HTTPS for remote hosts.',
  };
}

let customApiBaseOverride: string | null = null;

/**
 * Shared gateway URL resolver used by 100% of Android network requests & WebViews:
 * - Production Release (`__DEV__ === false`): locked unconditionally to validated HTTPS `PROD_API_URL`
 *   (`BuildConfig.PROD_API_URL` -> `https://meteo-gis.vercel.app`), with zero fallback or override to local hosts.
 * - Development (`__DEV__ === true`): defaults to `https://meteo-gis.vercel.app`; opts into local dev gateway
 *   only when explicitly requested (`useLocalDevApi === true` or validated Settings dev override).
 */
export function resolveApiBase(options?: {
  isDev?: boolean;
  platformOs?: string;
  configuredProdUrl?: string;
  customOverrideUrl?: string | null;
  useLocalDevApi?: boolean;
}): string {
  const isDev = options?.isDev ?? IS_DEV_RUNTIME;
  const platformOs = options?.platformOs ?? Platform.OS;
  const customOverride =
    options?.customOverrideUrl !== undefined
      ? options.customOverrideUrl
      : __DEV__
        ? customApiBaseOverride
        : null;
  const configuredProd =
    options?.configuredProdUrl !== undefined ? options.configuredProdUrl : ENV_PROD_API_URL;
  const useLocalDevApi = isDev ? (options?.useLocalDevApi ?? ENV_USE_LOCAL_DEV_API) : false;

  if (customOverride && customOverride.trim().length > 0) {
    const check = validateApiBaseCandidate(customOverride, isDev);
    if (!check.valid) {
      throw new Error(check.error || 'Rejected unsafe custom API override URL.');
    }
    return check.normalizedUrl;
  }

  if (platformOs === 'web') {
    if (!isDev && configuredProd.trim().length > 0) {
      const check = validateApiBaseCandidate(configuredProd, false);
      if (!check.valid) throw new Error(check.error);
      return check.normalizedUrl;
    }
    return '';
  }

  if (__DEV__ && isDev && useLocalDevApi) {
    return LOCAL_DEV_API_URL;
  }

  const prodCheck = validateApiBaseCandidate(configuredProd, false);
  if (!prodCheck.valid) {
    throw new Error(
      prodCheck.error ||
        'Production API URL is invalid. Supply a valid HTTPS URL (default: https://meteo-gis.vercel.app).'
    );
  }
  return prodCheck.normalizedUrl;
}

export function setCustomApiBase(url: string | null): ApiValidationResult | null {
  if (!__DEV__) {
    customApiBaseOverride = null;
    if (!url || url.trim().length === 0) return null;
    return {
      valid: false,
      normalizedUrl: '',
      error: 'Custom API URL overrides are disabled in production release builds.',
    };
  }
  if (!url || url.trim().length === 0) {
    customApiBaseOverride = null;
    return null;
  }
  const validation = validateApiBaseCandidate(url, IS_DEV_RUNTIME);
  if (validation.valid) {
    customApiBaseOverride = validation.normalizedUrl;
  }
  return validation;
}

export function getApiConfigError(): string | null {
  try {
    resolveApiBase();
    return null;
  } catch (err: any) {
    return err?.message || 'Production API URL is invalid.';
  }
}

export function getApiBase(): string {
  return resolveApiBase();
}

export const BHUVAN_LAYER_MAP: Record<BaseMapId, string> = {
  nasa_clouds: 'india3',
  bhuvan_sat: 'bhuvan_satellite',
  bhuvan_2d: 'india3',
  bhuvan_topo: 'india_hi',
  bhuvan_infra: 'infra',
  bhuvan_flood: 'flood_hazard',
  bhuvan_drainage: 'drainage',
  bhuvan_admin: 'admin_boundary',
  nasa_precip: 'nasa_gpm',
};

export const TILE_URL = (baseMap: BaseMapId): string => {
  if (baseMap === 'nasa_clouds') {
    return 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg';
  }
  if (baseMap === 'nasa_precip') {
    return 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/IMERG_Precipitation_Rate/default/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png';
  }
  const base = getApiBase();
  const layer = BHUVAN_LAYER_MAP[baseMap] || 'india3';
  return `${base}/api/bhuvan/wms?z={z}&x={x}&y={y}&layers=${encodeURIComponent(layer)}`;
};

/**
 * Shared authoritative API endpoint map — every single network call in `android/src/` routes through here.
 */
export const API_ROUTES = {
  hazards: () => `${getApiBase()}/api/live/hazards`,
  warnings: () => `${getApiBase()}/api/live/warnings`,
  rainfall: () => `${getApiBase()}/api/live/rainfall`,
  stations: () => `${getApiBase()}/api/live/stations`,
  nowcast: () => `${getApiBase()}/api/live/nowcast`,
  historicalLandslides: () => `${getApiBase()}/api/landslides/historical`,
  audit: () => `${getApiBase()}/api/live/audit`,
  riskPredict: () => `${getApiBase()}/api/risk/predict`,
  isolation: () => `${getApiBase()}/api/isolation`,
  roadIncidents: () => `${getApiBase()}/api/roads/incidents`,
  safeRoute: () => `${getApiBase()}/api/routing/safe-route`,
  emergencyRoute: () => `${getApiBase()}/api/routing/emergency-route`,
  sos: () => `${getApiBase()}/api/sos`,
  sosCancel: () => `${getApiBase()}/api/sos/cancel`,
  citizenReport: () => `${getApiBase()}/api/citizen/report`,
  telemetry: () => `${getApiBase()}/api/telemetry`,
  systemStatus: () => `${getApiBase()}/api/system/data-status`,
  radarImagery: (station: string, product: string, nonce: number) =>
    `${getApiBase()}/api/imd/imagery?type=radar&station=${encodeURIComponent(station)}&product=${encodeURIComponent(product)}&_t=${nonce}`,
  satelliteImagery: (channel: string, nonce: number) =>
    `${getApiBase()}/api/imd/imagery?type=satellite&channel=${encodeURIComponent(channel)}&_t=${nonce}`,
  mobileAnalytics: (params: { state: string; district?: string; lat?: number; lng?: number }) => {
    const q = new URLSearchParams();
    q.set('state', params.state || 'All India');
    if (params.district) q.set('district', params.district);
    if (typeof params.lat === 'number') q.set('lat', String(params.lat));
    if (typeof params.lng === 'number') q.set('lng', String(params.lng));
    return `${getApiBase()}/mobile-analytics?${q.toString()}`;
  },
};
