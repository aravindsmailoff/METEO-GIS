import { NextRequest, NextResponse } from 'next/server';
import { getDataHealthAudit, runIngestionCycle } from '@/lib/realtimeIncidentEngine';
import { getAgentStatus } from '@/lib/imdBackgroundAgent';

export const dynamic = 'force-dynamic';

/**
 * GET /api/live/audit
 * Returns official real-time Data Health Audit metrics:
 * - Connection status
 * - Last successful fetch timestamp
 * - Latest source data timestamp
 * - Data age in minutes
 * - Records ingested, new, updated, and expired
 * - Multi-source health verification (IMD, INSAT-3DR, DWR Radar, Bhuvan, DEM)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    let audit = getDataHealthAudit();
    const agentStatusSnapshot = getAgentStatus();

    if (forceRefresh || audit.apiStatus !== 'CONNECTED' || audit.recordsReceived === 0) {
      const result = await runIngestionCycle();
      audit = result.audit;
      return NextResponse.json({
        status: 'OK',
        audit,
        activeIncidentsCount: result.activeIncidents.length,
        expiredIncidentsCount: result.expiredIncidents.length,
        backgroundAgent: {
          isRunning: agentStatusSnapshot.isRunning,
          lastSuccessfulRefresh: agentStatusSnapshot.lastSuccessfulRefresh?.toISOString() || null,
          lastRefreshAttempt: agentStatusSnapshot.lastRefreshAttempt?.toISOString() || null,
          totalRefreshCycles: agentStatusSnapshot.totalRefreshCycles,
          consecutiveFailures: agentStatusSnapshot.consecutiveFailures,
          awsStationCount: agentStatusSnapshot.awsStationCount,
          nowcastDistrictCount: agentStatusSnapshot.nowcastDistrictCount,
          warningDistrictCount: agentStatusSnapshot.warningDistrictCount,
          refreshIntervalMinutes: 5,
        },
      });
    }

    return NextResponse.json({
      status: 'OK',
      audit,
      backgroundAgent: {
        isRunning: agentStatusSnapshot.isRunning,
        lastSuccessfulRefresh: agentStatusSnapshot.lastSuccessfulRefresh?.toISOString() || null,
        lastRefreshAttempt: agentStatusSnapshot.lastRefreshAttempt?.toISOString() || null,
        totalRefreshCycles: agentStatusSnapshot.totalRefreshCycles,
        consecutiveFailures: agentStatusSnapshot.consecutiveFailures,
        awsStationCount: agentStatusSnapshot.awsStationCount,
        nowcastDistrictCount: agentStatusSnapshot.nowcastDistrictCount,
        warningDistrictCount: agentStatusSnapshot.warningDistrictCount,
        refreshIntervalMinutes: 5,
      },
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'ERROR',
      message: err.message || 'Error generating data health audit',
    }, { status: 500 });
  }
}
