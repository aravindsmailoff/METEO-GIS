/**
 * IMD API Client with Dual-Authentication (API Key + Persistent JWT Bearer Token)
 * 
 * Official India Meteorological Department (IMD) Ingestion Layer:
 * 1. X-API-KEY: <apiKey>
 * 2. Authorization: Bearer <jwtToken> (obtained via POST /api/oauth/token.php and persisted to disk)
 */

import fs from 'fs';
import path from 'path';

export interface IMDAwsStationRecord {
  ID: string;
  CALL_SIGN: string | null;
  DISTRICT: string;
  STATE: string;
  STATION: string;
  DATE: string;
  TIME: string;
  CURR_TEMP: string | null;
  DEW_POINT_TEMP: string | null;
  RH: string | null;
  WIND_DIRECTION: string | null;
  WIND_SPEED: number | string | null;
  MSLP: string | null;
  MIN_TEMP: string | null;
  MAX_TEMP: string | null;
  Latitude: string;
  Longitude: string;
  WEATHER_CODE: string | null;
  NEBULOSITY: string | null;
  RAINFALL_SEL: string | null; // Hourly rainfall mm
  RAINFALL: string | null; // 24-hr cumulative rainfall mm
  'Feel Like'?: string | null;
  WEATHER_ICON?: number | null;
  WEATHER_MESSAGE?: string | null;
  BACKGROUND?: string | null;
  BACKGROUND_URL?: string | null;
}

export interface IMDDistrictNowcastRecord {
  Obj_id: string;
  State_District: string;
  Date: string;
  cat1?: string;
  cat2?: string;
  cat3?: string;
  cat4?: string;
  cat5?: string;
  cat6?: string;
  cat7?: string;
  cat8?: string;
  cat9?: string;
  cat10?: string;
  cat11?: string;
  cat12?: string;
  cat13?: string;
  cat14?: string;
  cat15?: string;
  cat16?: string;
  cat17?: string;
  cat18?: string;
  cat19?: string;
  message?: string;
  toi: string; // Time of Issue, e.g. "1600"
  vupto: string; // Valid Upto, e.g. "1900"
  color: string; // 1 = Green, 2 = Yellow, 3 = Orange, 4 = Red
}

export interface IMDDistrictWarningRecord {
  Obj_id: string;
  Date: string;
  District: string;
  Day_1?: string;
  Day_2?: string;
  Day_3?: string;
  Day_4?: string;
  Day_5?: string;
  Day1_Color?: string; // 1 = Green, 2 = Yellow, 3 = Orange, 4 = Red
  Day2_Color?: string;
  Day3_Color?: string;
  Day4_Color?: string;
  Day5_Color?: string;
  updated_at?: string;
}

interface PersistentTokenData {
  token: string;
  expiresAt: number;
}

const TOKEN_FILE = path.resolve(process.cwd(), '.imd_token.json');
const CACHE_DIR = path.resolve(process.cwd(), 'scratch', 'imd_cache');

const IMD_API_BASE = 'https://api.imd.gov.in/api/v1';
const IMD_AUTH_URL = 'https://api.imd.gov.in/api/oauth/token.php';

function getEnvValue(key: string): string {
  if (process.env[key]) return process.env[key]!;
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
      if (match && match[1]) return match[1].trim();
    }
    const envLocalPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envLocalPath)) {
      const content = fs.readFileSync(envLocalPath, 'utf8');
      const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
      if (match && match[1]) return match[1].trim();
    }
  } catch {}
  return '';
}

/**
 * Retrieve a valid JWT Bearer token from disk or IMD OAuth endpoint
 */
export async function getIMDBearerToken(): Promise<string | null> {
  const now = Date.now();

  // 1. Check persistent disk file first
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const diskData: PersistentTokenData = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
      if (diskData.token && diskData.expiresAt > now + 60000) {
        return diskData.token;
      }
    }
  } catch {}

  // Known active token fallback if token endpoint is rate-limiting
  const knownActive = 'eyJ1aWQiOjQzMDUsImV4cCI6MTc5MDI0NjM4OX0.0c344fb5b3c2600a73f7f41076c9b93f53f00ab6f2828a1918905f2e88a160fa';

  const email = getEnvValue('IMD_EMAIL') || getEnvValue('IMD_USER_EMAIL') || 'aravindsmailoff@gmail.com';
  const password = getEnvValue('IMD_PASSWORD') || getEnvValue('IMD_USER_PASSWORD') || 'ARAVINDsvx#1465';

  if (!email || !password) {
    return knownActive;
  }

  try {
    const res = await fetch(IMD_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      const token = data.access_token || data.token || data.jwt;
      const expiresInSec = typeof data.expires_in === 'number' ? data.expires_in : 3600;

      if (token) {
        const tokenObj: PersistentTokenData = {
          token,
          expiresAt: now + (expiresInSec - 120) * 1000,
        };
        try {
          fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenObj, null, 2), 'utf8');
        } catch {}
        return token;
      }
    } else {
      console.warn(`[IMD OAuth] Token generation returned ${res.status}, using persistent token cache`);
    }
  } catch (err) {
    console.error('[IMD OAuth] Error connecting to token endpoint:', err);
  }

  // Save knownActive to disk if file didn't exist
  try {
    if (!fs.existsSync(TOKEN_FILE)) {
      fs.writeFileSync(TOKEN_FILE, JSON.stringify({ token: knownActive, expiresAt: now + 3600000 }, null, 2), 'utf8');
    }
  } catch {}

  return knownActive;
}

/**
 * Make an authenticated request to the IMD API
 */
export async function fetchIMD<T = any>(endpoint: string): Promise<T | null> {
  const apiKey = getEnvValue('IMD_API_KEY') || getEnvValue('NEXT_PUBLIC_IMD_API_KEY') || process.env.IMD_API_KEY || 'efdbe388e1778135b7f96808731a898a67e77ff40527b8867e2cb6670a69f768';
  if (!apiKey) return null;

  const jwtToken = await getIMDBearerToken();

  const headers: Record<string, string> = {
    'x-api-key': apiKey,
    'Accept': 'application/json',
  };

  if (jwtToken) {
    headers['Authorization'] = `Bearer ${jwtToken}`;
  }

  try {
    const url = endpoint.startsWith('http') ? endpoint : `${IMD_API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const res = await fetch(url, {
      headers,
      cache: 'no-store',
    });

    if (res.ok) {
      return (await res.json()) as T;
    }

    console.warn(`[IMD API] ${endpoint} returned HTTP ${res.status}`);
    return null;
  } catch (err) {
    console.error(`[IMD API] Fetch failed for ${endpoint}:`, err);
    return null;
  }
}

function ensureCacheDir() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
  } catch {}
}

function readDiskCache<T>(name: string): { data: T | null; timestamp: number } {
  try {
    ensureCacheDir();
    const filePath = path.join(CACHE_DIR, `${name}.json`);
    if (fs.existsSync(filePath)) {
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return { data: raw.data as T, timestamp: raw.timestamp || 0 };
    }
  } catch {}
  return { data: null, timestamp: 0 };
}

function writeDiskCache<T>(name: string, data: T) {
  try {
    ensureCacheDir();
    const filePath = path.join(CACHE_DIR, `${name}.json`);
    fs.writeFileSync(filePath, JSON.stringify({ data, timestamp: Date.now() }, null, 2), 'utf8');
  } catch {}
}

/**
 * Fetch all live IMD Automatic Weather Station (AWS) observations (1,100+ stations)
 */
export async function getLiveIMDAwsData(): Promise<{ stations: IMDAwsStationRecord[]; lastFetched: number; isLive: boolean }> {
  const cached = readDiskCache<IMDAwsStationRecord[]>('aws_data');
  const now = Date.now();

  // If cache is less than 3 minutes old, serve immediately
  if (cached.data && Array.isArray(cached.data) && cached.data.length > 0 && now - cached.timestamp < 180000) {
    return { stations: cached.data, lastFetched: cached.timestamp, isLive: true };
  }

  const live = await fetchIMD<IMDAwsStationRecord[]>('/aws_data');
  if (Array.isArray(live) && live.length > 0) {
    writeDiskCache('aws_data', live);
    return { stations: live, lastFetched: now, isLive: true };
  }

  // Fallback to previous disk cache if upstream temporary glitch, flag status
  if (cached.data && Array.isArray(cached.data) && cached.data.length > 0) {
    return { stations: cached.data, lastFetched: cached.timestamp, isLive: false };
  }

  return { stations: [], lastFetched: 0, isLive: false };
}

/**
 * Fetch official IMD District Nowcast (750+ districts)
 */
export async function getLiveIMDDistrictNowcast(): Promise<{ nowcasts: IMDDistrictNowcastRecord[]; lastFetched: number; isLive: boolean }> {
  const cached = readDiskCache<IMDDistrictNowcastRecord[]>('districtnowcast');
  const now = Date.now();

  // If cache is less than 5 minutes old, serve immediately
  if (cached.data && Array.isArray(cached.data) && cached.data.length > 0 && now - cached.timestamp < 300000) {
    return { nowcasts: cached.data, lastFetched: cached.timestamp, isLive: true };
  }

  const live = await fetchIMD<IMDDistrictNowcastRecord[]>('/districtnowcast');
  if (Array.isArray(live) && live.length > 0) {
    writeDiskCache('districtnowcast', live);
    return { nowcasts: live, lastFetched: now, isLive: true };
  }

  if (cached.data && Array.isArray(cached.data) && cached.data.length > 0) {
    return { nowcasts: cached.data, lastFetched: cached.timestamp, isLive: false };
  }

  return { nowcasts: [], lastFetched: 0, isLive: false };
}

/**
 * Fetch official IMD District Warnings (750+ districts)
 */
export async function getLiveIMDDistrictWarning(): Promise<{ warnings: IMDDistrictWarningRecord[]; lastFetched: number; isLive: boolean }> {
  const cached = readDiskCache<IMDDistrictWarningRecord[]>('districtwarning');
  const now = Date.now();

  // If cache is less than 10 minutes old, serve immediately
  if (cached.data && Array.isArray(cached.data) && cached.data.length > 0 && now - cached.timestamp < 600000) {
    return { warnings: cached.data, lastFetched: cached.timestamp, isLive: true };
  }

  const live = await fetchIMD<IMDDistrictWarningRecord[]>('/districtwarning');
  if (Array.isArray(live) && live.length > 0) {
    writeDiskCache('districtwarning', live);
    return { warnings: live, lastFetched: now, isLive: true };
  }

  if (cached.data && Array.isArray(cached.data) && cached.data.length > 0) {
    return { warnings: cached.data, lastFetched: cached.timestamp, isLive: false };
  }

  return { warnings: [], lastFetched: 0, isLive: false };
}
