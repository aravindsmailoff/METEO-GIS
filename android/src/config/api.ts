import { Platform } from 'react-native';
import { BaseMapId } from '../types/meteo';

/**
 * Single API Gateway configuration (Spec Section 1):
 * - On Android Studio Emulator: http://10.0.2.2:3000 reaches host localhost:3000
 * - On Physical Android Phone: run `adb reverse tcp:3000 tcp:3000` (and set custom override to http://127.0.0.1:3000) or LAN IP in Settings
 * - On Web Preview: relative path '' uses Vite proxy directly to Next.js :3000 (never localhost in browser)
 */
const IS_DEV = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

export const DEFAULT_ANDROID_DEV_API = 'http://10.0.2.2:3000';
export const DEFAULT_PROD_API = 'https://meteo-gis.vercel.app';

let customApiBaseOverride: string | null = null;

export function setCustomApiBase(url: string | null) {
  customApiBaseOverride = url && url.trim().length > 0 ? url.trim().replace(/\/+$/, '') : null;
}

export function getApiBase(): string {
  if (customApiBaseOverride) {
    return customApiBaseOverride;
  }
  if (Platform.OS === 'web') {
    return '';
  }
  return IS_DEV ? DEFAULT_ANDROID_DEV_API : DEFAULT_PROD_API;
}

export const API_BASE = Platform.OS === 'web'
  ? ''
  : IS_DEV
    ? DEFAULT_ANDROID_DEV_API
    : DEFAULT_PROD_API;

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
  const base = getApiBase();
  if (baseMap === 'nasa_clouds') {
    return 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg';
  }
  if (baseMap === 'nasa_precip') {
    return 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/IMERG_Precipitation_Rate/default/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png';
  }
  const layer = BHUVAN_LAYER_MAP[baseMap] || 'india3';
  return `${base}/api/bhuvan/wms?z={z}&x={x}&y={y}&layers=${encodeURIComponent(layer)}`;
};

export const API_ROUTES = {
  hazards: () => `${getApiBase()}/api/live/hazards`,
  warnings: () => `${getApiBase()}/api/live/warnings`,
  rainfall: () => `${getApiBase()}/api/live/rainfall`,
  stations: () => `${getApiBase()}/api/live/stations`,
  nowcast: () => `${getApiBase()}/api/live/nowcast`,
  events: () => `${getApiBase()}/api/live/events`,
  incidents: () => `${getApiBase()}/api/incidents`,
  audit: () => `${getApiBase()}/api/live/audit`,
  riskPredict: () => `${getApiBase()}/api/risk/predict`,
  isolation: () => `${getApiBase()}/api/isolation`,
  safeRoute: () => `${getApiBase()}/api/routing/safe-route`,
  emergencyRoute: () => `${getApiBase()}/api/routing/emergency-route`,
  sos: () => `${getApiBase()}/api/sos`,
  sosCancel: () => `${getApiBase()}/api/sos/cancel`,
  citizenReport: () => `${getApiBase()}/api/citizen/report`,
  alertsBroadcast: () => `${getApiBase()}/api/alerts/broadcast`,
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
