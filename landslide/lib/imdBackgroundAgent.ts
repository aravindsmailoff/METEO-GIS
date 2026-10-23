/**
 * IMD BACKGROUND REFRESH AGENT
 * 
 * This module implements a true server-side background data fetching agent.
 * It runs as a persistent in-process timer, proactively pulling fresh data
 * from all IMD endpoints every 5 minutes — completely independent of client requests.
 * 
 * Architecture:
 * - Started once via Next.js instrumentation.ts on server boot
 * - Uses forceRefresh=true to bypass the in-memory 5-minute cache gate
 * - Writes fresh data to both in-memory cache AND disk cache (/tmp/imd_cache/)
 * - All API routes read from this pre-warmed cache → zero latency on client request
 * - Logs clear timestamps so you can verify data freshness
 * 
 * Data Sources Polled:
 * 1. IMD AWS Station Network (1100+ stations) → aws_data_layer WFS
 * 2. IMD District Nowcast (750+ districts) → NowcastWarningDistrict WFS
 * 3. IMD District Warnings (750+ districts) → district_warnings_india WFS
 */

import {
  getLiveIMDAwsData,
  getLiveIMDDistrictNowcast,
  getLiveIMDDistrictWarning,
} from './imdClient';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes exactly

interface AgentStatus {
  isRunning: boolean;
  lastSuccessfulRefresh: Date | null;
  lastRefreshAttempt: Date | null;
  consecutiveFailures: number;
  totalRefreshCycles: number;
  awsStationCount: number;
  nowcastDistrictCount: number;
  warningDistrictCount: number;
}

const agentStatus: AgentStatus = {
  isRunning: false,
  lastSuccessfulRefresh: null,
  lastRefreshAttempt: null,
  consecutiveFailures: 0,
  totalRefreshCycles: 0,
  awsStationCount: 0,
  nowcastDistrictCount: 0,
  warningDistrictCount: 0,
};

/**
 * Performs a single full refresh cycle from all three IMD endpoints.
 * Uses forceRefresh=true to bypass cache and guarantee fresh data is fetched.
 */
async function runRefreshCycle(): Promise<void> {
  const cycleStart = new Date();
  agentStatus.lastRefreshAttempt = cycleStart;
  agentStatus.totalRefreshCycles++;

  const cycleNum = agentStatus.totalRefreshCycles;
  console.log(
    `[IMD-Agent] ⟳ Cycle #${cycleNum} started at ${cycleStart.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })} IST`
  );

  try {
    // Fetch all three endpoints in parallel, forcing a fresh fetch from IMD
    const [awsResult, nowcastResult, warningResult] = await Promise.allSettled([
      getLiveIMDAwsData(true),
      getLiveIMDDistrictNowcast(true),
      getLiveIMDDistrictWarning(true),
    ]);

    let anySuccess = false;

    if (awsResult.status === 'fulfilled') {
      const { stations, isLive } = awsResult.value;
      agentStatus.awsStationCount = stations.length;
      if (stations.length > 0) {
        anySuccess = true;
        console.log(
          `[IMD-Agent] ✓ AWS: ${stations.length} stations | isLive=${isLive}`
        );
      } else {
        console.warn(`[IMD-Agent] ⚠ AWS: 0 stations returned (IMD endpoint may be down)`);
      }
    } else {
      console.error(`[IMD-Agent] ✗ AWS fetch failed:`, awsResult.reason?.message || awsResult.reason);
    }

    if (nowcastResult.status === 'fulfilled') {
      const { nowcasts, isLive } = nowcastResult.value;
      agentStatus.nowcastDistrictCount = nowcasts.length;
      if (nowcasts.length > 0) {
        anySuccess = true;
        // Count non-green (active) alerts
        const activeCount = nowcasts.filter(
          (n) => n.color && n.color !== '1'
        ).length;
        console.log(
          `[IMD-Agent] ✓ Nowcast: ${nowcasts.length} districts | ${activeCount} active alerts | isLive=${isLive}`
        );
      } else {
        console.warn(`[IMD-Agent] ⚠ Nowcast: 0 districts returned (IMD endpoint may be down)`);
      }
    } else {
      console.error(`[IMD-Agent] ✗ Nowcast fetch failed:`, nowcastResult.reason?.message || nowcastResult.reason);
    }

    if (warningResult.status === 'fulfilled') {
      const { warnings, isLive } = warningResult.value;
      agentStatus.warningDistrictCount = warnings.length;
      if (warnings.length > 0) {
        anySuccess = true;
        // Count red alerts (Day1_Color === '1' = RED in IMD warning schema)
        const redCount = warnings.filter((w) => w.Day1_Color === '1').length;
        const orangeCount = warnings.filter((w) => w.Day1_Color === '2').length;
        console.log(
          `[IMD-Agent] ✓ Warnings: ${warnings.length} districts | RED=${redCount} ORANGE=${orangeCount} | isLive=${isLive}`
        );
      } else {
        console.warn(`[IMD-Agent] ⚠ Warnings: 0 districts returned (IMD endpoint may be down)`);
      }
    } else {
      console.error(`[IMD-Agent] ✗ Warnings fetch failed:`, warningResult.reason?.message || warningResult.reason);
    }

    if (anySuccess) {
      agentStatus.lastSuccessfulRefresh = new Date();
      agentStatus.consecutiveFailures = 0;
      const elapsed = Date.now() - cycleStart.getTime();
      console.log(
        `[IMD-Agent] ✅ Cycle #${cycleNum} complete in ${elapsed}ms. Cache warmed.`
      );
    } else {
      agentStatus.consecutiveFailures++;
      console.warn(
        `[IMD-Agent] ⚠ Cycle #${cycleNum}: All sources returned empty. ` +
        `Consecutive failures: ${agentStatus.consecutiveFailures}. ` +
        `Existing cache will serve previous real data until IMD responds.`
      );
    }
  } catch (err: any) {
    agentStatus.consecutiveFailures++;
    console.error(
      `[IMD-Agent] ✗ Cycle #${cycleNum} failed with error: ${err.message || err}. ` +
      `Consecutive failures: ${agentStatus.consecutiveFailures}.`
    );
  }
}

/**
 * Starts the IMD Background Refresh Agent.
 * Called once at server startup via instrumentation.ts.
 * Guards against double-start in dev mode (hot reload).
 */
export function startIMDBackgroundAgent(): void {
  // Guard: prevent multiple instances (e.g. in Next.js hot reload)
  if (agentStatus.isRunning) {
    console.log('[IMD-Agent] Already running. Skipping duplicate start.');
    return;
  }

  // Also guard via global to survive module cache invalidation in dev
  const globalKey = '__imdAgentStarted__';
  if ((global as any)[globalKey]) {
    console.log('[IMD-Agent] Global guard: Already started. Skipping.');
    agentStatus.isRunning = true;
    return;
  }
  (global as any)[globalKey] = true;

  agentStatus.isRunning = true;
  console.log(
    `[IMD-Agent] 🚀 Starting IMD Background Refresh Agent (interval: ${REFRESH_INTERVAL_MS / 60000} min)`
  );

  // Run immediately on startup to warm the cache before any client request
  runRefreshCycle().catch((err) => {
    console.error('[IMD-Agent] Initial warm-up cycle failed:', err?.message || err);
  });

  // Then schedule recurring 5-minute refresh
  const interval = setInterval(() => {
    runRefreshCycle().catch((err) => {
      console.error('[IMD-Agent] Scheduled refresh cycle failed:', err?.message || err);
    });
  }, REFRESH_INTERVAL_MS);

  // Ensure the interval doesn't block Node.js process exit
  if (interval.unref) {
    interval.unref();
  }

  console.log('[IMD-Agent] ⏱ Scheduled: IMD data will refresh every 5 minutes automatically.');
}

/**
 * Returns the current status of the background refresh agent.
 * Used by /api/live/audit to report data freshness.
 */
export function getAgentStatus(): AgentStatus {
  return { ...agentStatus };
}
