import { parseHttpUrl } from '../config/api';
import { MONITORED_DWR_NETWORK } from '../data/indiaGeoCatalog';

const APPROVED_RADAR_CODES = new Set(
  MONITORED_DWR_NETWORK.map((item) => item.code.toLowerCase())
);

export type ValidatedAnalyticsBridgeAction =
  | { valid: true; type: 'OPEN_RADAR'; stationCode: string }
  | { valid: false; reason: string };

/**
 * Validates untrusted `postMessage` payloads from embedded `/mobile-analytics` WebView / iframe:
 * 1. Verifies origin matches the configured gateway URL (`https://meteo-gis.vercel.app` or local proxy origin).
 * 2. Accepts strictly documented message schema `{ type: 'OPEN_RADAR', stationCode: string }`.
 * 3. Whitelists `stationCode` strictly against `MONITORED_DWR_NETWORK`.
 */
export function validateAnalyticsBridgeMessage(params: {
  rawData: unknown;
  messageOrigin?: string;
  targetUri: string;
  currentWindowOrigin?: string;
}): ValidatedAnalyticsBridgeAction {
  const { rawData, messageOrigin, targetUri, currentWindowOrigin } = params;

  if (typeof messageOrigin === 'string' && messageOrigin.length > 0) {
    const allowedOrigins = new Set<string>();
    if (currentWindowOrigin) {
      allowedOrigins.add(currentWindowOrigin);
    }
    const parsedTarget = parseHttpUrl(
      targetUri,
      currentWindowOrigin || 'https://meteo-gis.vercel.app'
    );
    if (!parsedTarget) {
      return { valid: false, reason: 'Invalid target URI origin.' };
    }
    allowedOrigins.add(parsedTarget.origin);

    if (!allowedOrigins.has(messageOrigin)) {
      return {
        valid: false,
        reason: `Rejected cross-origin WebView message from "${messageOrigin}".`,
      };
    }
  }

  let parsed: unknown = rawData;
  if (typeof rawData === 'string') {
    if (rawData.length > 4096) {
      return { valid: false, reason: 'Bridge payload exceeds maximum safe size.' };
    }
    try {
      parsed = JSON.parse(rawData);
    } catch {
      return { valid: false, reason: 'Bridge payload is not valid JSON.' };
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { valid: false, reason: 'Bridge payload must be a JSON object.' };
  }

  const record = parsed as Record<string, unknown>;
  if (record.type !== 'OPEN_RADAR') {
    return { valid: false, reason: `Unsupported message type "${String(record.type)}".` };
  }

  if (typeof record.stationCode !== 'string') {
    return { valid: false, reason: 'Missing string `stationCode`.' };
  }

  const normalizedCode = record.stationCode.trim().toLowerCase();
  if (!APPROVED_RADAR_CODES.has(normalizedCode)) {
    return {
      valid: false,
      reason: `Station code "${record.stationCode}" is not in approved IMD DWR station registry.`,
    };
  }

  return {
    valid: true,
    type: 'OPEN_RADAR',
    stationCode: normalizedCode,
  };
}
