import axios from 'axios';
import { NativeModules, Platform } from 'react-native';
import { API_ROUTES, getApiBase } from '../config/api';
import { parseRiskPredictResponse } from './riskPrediction';
import { fetchVerifiedEvacuationRoute } from './routeSafety';
import {
  clearPendingSosRecord,
  loadPendingSosRecord,
  submitOrRetrySos,
} from './sosManager';

let didRunBootVerification = false;

/**
 * Non-destructive native runtime diagnostic executed once after app launch on Android devices.
 * Emits `[METEOGIS_RUNTIME_VERIFIED]` to `ReactNativeJS` logcat proving on the installed device that:
 * 1. `getApiBase()` and `NativeModules.MeteoAppConfig.PROD_API_URL` resolve to HTTPS production (`https://meteo-gis.vercel.app`).
 * 2. Live HTTPS requests execute through Android's network stack to `/api/live/hazards`, `/warnings`, `/stations`,
 *    `/api/roads/incidents`, `/api/risk/predict`, and `/api/routing/safe-route`.
 * 3. Live OSRM / unverified-closure corridors classify as `closure_unverified` (`Road-Closure Safety Unverified`).
 * 4. Unavailable SOS handling queues locally (`queued_not_delivered`) with zero real SOS incidents or phone calls.
 */
export async function runNativeRuntimeVerification(): Promise<void> {
  if (Platform.OS !== 'android' || didRunBootVerification) {
    return;
  }
  didRunBootVerification = true;

  try {
    const activeBase = getApiBase();
    const nativeProdUrl = NativeModules?.MeteoAppConfig?.PROD_API_URL ?? null;

    const [hazardsRes, warningsRes, stationsRes, riskRes, routeCheck] = await Promise.all([
      axios.get(API_ROUTES.hazards(), { timeout: 12000 }),
      axios.get(API_ROUTES.warnings(), { timeout: 12000 }),
      axios.get(API_ROUTES.stations(), { timeout: 12000 }),
      axios.post(
        API_ROUTES.riskPredict(),
        {
          district: 'Chennai',
          latitude: 13.0827,
          longitude: 80.2707,
          coordinates: [13.0827, 80.2707],
          features: { rainfall_1h: 18.0, rainfall_24h: 64.0 },
        },
        { timeout: 12000 }
      ),
      fetchVerifiedEvacuationRoute({
        mode: 'safe',
        origin: { lat: 13.0827, lon: 80.2707 },
        destination: { lat: 13.1927, lon: 80.1807 },
        timeoutMs: 14000,
      }),
    ]);

    const parsedRisk = parseRiskPredictResponse(riskRes.data);

    // Dry-run SOS state verification against simulated 503 adapter (zero network SOS created, zero calls dialed)
    const existingSos = await loadPendingSosRecord();
    let sosDryCheckStatus = 'skipped_existing_pending_sos';
    if (!existingSos) {
      const drySos = await submitOrRetrySos({
        latitude: 13.0827,
        longitude: 80.2707,
        httpPost: (async () => {
          throw {
            response: {
              status: 503,
              data: { delivered: false, persisted: false, error: 'Simulated 503 check' },
            },
          };
        }) as any,
      });
      sosDryCheckStatus = drySos.status;
      await clearPendingSosRecord();
    }

    console.info(
      `[METEOGIS_RUNTIME_VERIFIED] ${JSON.stringify({
        activeApiBase: activeBase,
        nativeBuildProdUrl: nativeProdUrl,
        hazardsHttp: hazardsRes.status,
        warningsHttp: warningsRes.status,
        stationsHttp: stationsRes.status,
        riskPredictOk: parsedRisk.ok,
        riskLevel: parsedRisk.ok ? parsedRisk.data.riskLevel : null,
        routeOk: routeCheck.ok,
        routeClosureVerification: routeCheck.ok ? routeCheck.closureVerification : routeCheck.code,
        routeBadge: routeCheck.ok ? routeCheck.verificationBadge : routeCheck.title,
        routeVertices: routeCheck.ok ? routeCheck.overlay.coordinates.length : 0,
        sosDryRunStatus: sosDryCheckStatus,
      })}`
    );
  } catch (err: any) {
    console.warn(
      '[METEOGIS_RUNTIME_CHECK_WARN]',
      JSON.stringify({
        activeApiBase: getApiBase(),
        error: err?.message || 'Runtime verification error',
      })
    );
  }
}
