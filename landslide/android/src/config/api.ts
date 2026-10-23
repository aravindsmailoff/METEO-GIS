import { NativeModules, Platform } from 'react-native';
import { BaseMapId } from '../types/meteo';

declare const process: { env?: Record<string, string | undefined> } | undefined;

export const IS_DEV_RUNTIME: boolean =
  typeof __DEV__ !== 'undefined' ? Boolean(__DEV__) : true;

export const PRODUCTION_API_URL = 'https://meteo-gis.vercel.app';
export const LOCAL_DEV_API_URL = 'http://10.0.2.2:3000';
export const ADB_REVERSE_DEV_API_URL = 'http://127.0.0.1:3000';
export const APPROVED_DEV_CLEARTEXT_HOSTS = ['10.0.2.2', '127.0.0.1', 'localhost'] as const;

export const DEFAULT_ANDROID_DEV_API = LOCAL_DEV_API_URL;
export const WEBVIEW_ORIGIN_WHITELIST = [
  'https://*',
  `${LOCAL_DEV_API_URL}/*`,
  `${ADB_REVERSE_DEV_API_URL}/*`,
  'http://localhost:3000/*',
];

const NATIVE_BUILD_PROD_API_URL: string | undefined =
  typeof NativeModules?.MeteoAppConfig?.PROD_API_URL === 'string' &&
  NativeModules.MeteoAppConfig.PROD_API_URL.trim().length > 0
    ? NativeModules.MeteoAppConfig.PROD_API_URL.trim()
    : undefined;

const ENV_PROD_API_URL =
  NATIVE_BUILD_PROD_API_URL ||
  (typeof process !== 'undefined' &&
    (process?.env?.PROD_API_URL ||
      process?.env?.VITE_PROD_API_URL ||
      process?.env?.METEOGIS_PROD_API_URL)) ||
  PRODUCTION_API_URL;

const ENV_USE_LOCAL_DEV_API =
  typeof process !== 'undefined' &&
  (process?.env?.USE_LOCAL_DEV_API === 'true' ||
    process?.env?.VITE_USE_LOCAL_DEV_API === 'true');

const FORBIDDEN_PROD_HOSTS = [
  '10.0.2.2',
  '127.0.0.1',
  'localhost',
  '0.0.0.0',
  '::1',
  '[::1]',
];

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
      FORBIDDEN_PROD_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`)) ||
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

  // Intentional local development: allow HTTPS anywhere OR cleartext HTTP strictly on approved loopback hosts
  if (parsed.protocol === 'https:') {
    return { valid: true, normalizedUrl: trimmed };
  }
  if (
    parsed.protocol === 'http:' &&
    (APPROVED_DEV_CLEARTEXT_HOSTS as readonly string[]).includes(host)
  ) {
    return { valid: true, normalizedUrl: trimmed };
  }

  return {
    valid: false,
    normalizedUrl: '',
    error: `Cleartext HTTP is restricted to approved development hosts (${APPROVED_DEV_CLEARTEXT_HOSTS.join(', ')}). Use HTTPS for remote hosts.`,
  };
}

let customApiBaseOverride: string | null = null;

/**
 * Shared gateway URL resolver used by 100% of Android network requests & WebViews:
 * - Native Android (both debug and release): defaults to `https://meteo-gis.vercel.app`
 * - Local Emulator Dev (`http://10.0.2.2:3000`): ONLY active when intentionally requested via
 *   `useLocalDevApi: true` / `USE_LOCAL_DEV_API=true` (when `isDev === true`) or explicit validated dev override
 * - Browser Preview (`Platform.OS === 'web'`): uses same-origin proxy `''` unless overridden
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
    options?.customOverrideUrl !== undefined ? options.customOverrideUrl : customApiBaseOverride;
  const configuredProd =
    options?.configuredProdUrl !== undefined ? options.configuredProdUrl : ENV_PROD_API_URL;
  const useLocalDevApi = options?.useLocalDevApi ?? ENV_USE_LOCAL_DEV_API;

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

  if (isDev && useLocalDevApi) {
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
