import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Linking } from 'react-native';
import { API_ROUTES } from '../config/api';

export const PENDING_SOS_STORAGE_KEY = '@meteogis_pending_sos_v1';

export type SosDeliveryStatus =
  | 'idle'
  | 'sending'
  | 'confirmed_persisted'
  | 'received_unpersisted'
  | 'queued_not_delivered'
  | 'failed';

export interface PendingSosRecord {
  clientRequestId: string;
  latitude: number;
  longitude: number;
  accuracyM?: number;
  triggeredAtDevice: string;
  attemptCount: number;
  lastError: string;
}

export interface SosSnapshot {
  status: SosDeliveryStatus;
  reportId: string | null;
  alertId: string | null;
  persisted: boolean;
  clientRequestId: string | null;
  message: string | null;
  cancelError: string | null;
  pendingOfflineRecord: PendingSosRecord | null;
}

export const INITIAL_SOS_SNAPSHOT: SosSnapshot = {
  status: 'idle',
  reportId: null,
  alertId: null,
  persisted: false,
  clientRequestId: null,
  message: null,
  cancelError: null,
  pendingOfflineRecord: null,
};

export const EMERGENCY_HELPLINES = [
  { number: '112', label: '112 · National Emergency (ERSS)' },
  { number: '1077', label: '1077 · District Disaster Control' },
] as const;

export function createClientRequestId(): string {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `SOSREQ-${Date.now()}-${rand}`;
}

export async function loadPendingSosRecord(): Promise<PendingSosRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_SOS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.clientRequestId === 'string' &&
      typeof parsed.latitude === 'number' &&
      typeof parsed.longitude === 'number'
    ) {
      return parsed as PendingSosRecord;
    }
    return null;
  } catch {
    return null;
  }
}

async function savePendingSosRecord(record: PendingSosRecord): Promise<boolean> {
  try {
    await AsyncStorage.setItem(PENDING_SOS_STORAGE_KEY, JSON.stringify(record));
    const verifyRaw = await AsyncStorage.getItem(PENDING_SOS_STORAGE_KEY);
    return Boolean(verifyRaw && JSON.parse(verifyRaw)?.clientRequestId === record.clientRequestId);
  } catch {
    return false;
  }
}

export async function clearPendingSosRecord(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PENDING_SOS_STORAGE_KEY);
  } catch {
    // Ignore storage removal failure
  }
}

let activeInFlightSos: Promise<SosSnapshot> | null = null;

/**
 * Transmits or retries an SOS beacon with single-flight deduplication and strict server verification:
 * - `confirmed_persisted`: HTTP 200 AND `delivered === true` AND `persisted === true` AND non-empty `report_id`
 * - `received_unpersisted`: HTTP 200 AND `delivered === true` AND `persisted === false` (DB unreachable warning surfaced)
 * - `queued_not_delivered`: Network/5xx error AND verified saved in AsyncStorage with `clientRequestId` (NEVER shown as active/delivered!)
 * - `failed`: Validation error (4xx) or storage unavailable
 */
export async function submitOrRetrySos(params: {
  latitude: number;
  longitude: number;
  accuracyM?: number;
  existingRecord?: PendingSosRecord | null;
  httpPost?: typeof axios.post;
}): Promise<SosSnapshot> {
  if (activeInFlightSos) {
    return activeInFlightSos;
  }

  const run = async (): Promise<SosSnapshot> => {
    const postFn = params.httpPost || axios.post;
    const { latitude, longitude, accuracyM, existingRecord } = params;

    if (
      typeof latitude !== 'number' ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      typeof longitude !== 'number' ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      return {
        ...INITIAL_SOS_SNAPSHOT,
        status: 'failed',
        message: 'Cannot transmit SOS: valid device/sector GPS coordinates are required.',
      };
    }

    const clientRequestId = existingRecord?.clientRequestId || createClientRequestId();
    const triggeredAtDevice = existingRecord?.triggeredAtDevice || new Date().toISOString();
    const attemptCount = (existingRecord?.attemptCount || 0) + 1;

    try {
      const res = await postFn(
        API_ROUTES.sos(),
        {
          latitude,
          longitude,
          accuracy_m: accuracyM,
          triggered_at_device: triggeredAtDevice,
          client_request_id: clientRequestId,
        },
        { timeout: 6000 }
      );

      const data = res?.data;
      if (data && data.delivered === true && typeof data.report_id === 'string' && data.report_id) {
        await clearPendingSosRecord();

        if (data.persisted === true) {
          return {
            status: 'confirmed_persisted',
            reportId: data.report_id,
            alertId: typeof data.alert_id === 'string' ? data.alert_id : null,
            persisted: true,
            clientRequestId,
            message:
              data.message ||
              'Confirmed: SOS beacon saved to emergency database and broadcast to dispatch.',
            cancelError: null,
            pendingOfflineRecord: null,
          };
        }

        return {
          status: 'received_unpersisted',
          reportId: data.report_id,
          alertId: null,
          persisted: false,
          clientRequestId,
          message:
            'WARNING — Server received beacon (' +
            data.report_id +
            '), but `persisted: false` (emergency database unreachable). Responder delivery is NOT guaranteed — call 112 or 1077 immediately.',
          cancelError: null,
          pendingOfflineRecord: null,
        };
      }

      throw new Error(data?.error || 'Server did not confirm SOS delivery.');
    } catch (err: any) {
      const httpStatus = err?.response?.status;
      const errMsg =
        err?.response?.data?.error ||
        err?.message ||
        'Emergency server unreachable — SOS was NOT delivered.';

      // Non-retryable client error (e.g. 400 / 422)
      if (typeof httpStatus === 'number' && httpStatus >= 400 && httpStatus < 500) {
        return {
          ...INITIAL_SOS_SNAPSHOT,
          status: 'failed',
          clientRequestId,
          message: `SOS rejected (${httpStatus}): ${errMsg}`,
        };
      }

      const record: PendingSosRecord = {
        clientRequestId,
        latitude,
        longitude,
        accuracyM,
        triggeredAtDevice,
        attemptCount,
        lastError: errMsg,
      };
      const saved = await savePendingSosRecord(record);

      if (saved) {
        return {
          status: 'queued_not_delivered',
          reportId: null,
          alertId: null,
          persisted: false,
          clientRequestId,
          message:
            `NOT DELIVERED — Server unreachable (attempt #${attemptCount}). Saved locally offline for non-duplicate retry. Call 112 or 1077 directly.`,
          cancelError: null,
          pendingOfflineRecord: record,
        };
      }

      return {
        ...INITIAL_SOS_SNAPSHOT,
        status: 'failed',
        clientRequestId,
        message: `NOT DELIVERED — ${errMsg} Call 112 or 1077 immediately.`,
      };
    }
  };

  activeInFlightSos = run().finally(() => {
    activeInFlightSos = null;
  });
  return activeInFlightSos;
}

/**
 * Cancels an SOS beacon ONLY when server explicitly confirms `{ cancelled: true }`.
 * Never clears active server beacon state on 502/503 or unconfirmed responses.
 */
export async function cancelConfirmedSos(params: {
  current: SosSnapshot;
  httpPost?: typeof axios.post;
}): Promise<SosSnapshot> {
  const { current } = params;
  const postFn = params.httpPost || axios.post;

  // If the alert was NEVER delivered to the server (only saved locally offline), discard local queue cleanly
  if (current.status === 'queued_not_delivered' && !current.reportId) {
    await clearPendingSosRecord();
    return {
      ...INITIAL_SOS_SNAPSHOT,
      status: 'idle',
      message: 'Local unsent SOS draft removed (no alert had reached the server).',
    };
  }

  if (!current.reportId) {
    return INITIAL_SOS_SNAPSHOT;
  }

  try {
    const res = await postFn(
      API_ROUTES.sosCancel(),
      { report_id: current.reportId },
      { timeout: 5000 }
    );
    if (res?.status === 200 && res?.data?.cancelled === true) {
      await clearPendingSosRecord();
      return {
        ...INITIAL_SOS_SNAPSHOT,
        status: 'idle',
        message: `SOS ${current.reportId} cancellation confirmed by server.`,
      };
    }
    return {
      ...current,
      cancelError:
        `Cancellation NOT confirmed (${res?.data?.error || 'DB unreachable'}). ` +
        `Beacon ${current.reportId} must still be treated as active — call 1077 to confirm all-clear.`,
    };
  } catch (err: any) {
    const serverReason = err?.response?.data?.error || err?.message || 'Network/DB error';
    return {
      ...current,
      cancelError:
        `Cancellation FAILED (${serverReason}). Beacon ${current.reportId} remains active — retry or call 1077 to confirm all-clear.`,
    };
  }
}

export async function dialEmergencyNumber(number: '112' | '1077'): Promise<boolean> {
  const url = `tel:${number}`;
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
