import { NextRequest, NextResponse } from 'next/server';
import { getLiveIMDDistrictWarning, getLiveIMDAwsData, IMDDistrictWarningRecord } from '@/lib/imdClient';

export const dynamic = 'force-dynamic';

export interface ValidatedDistrictWarning {
  objId: string;
  district: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  date: string;
  updatedAtIST: string;
  day1Color: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  day2Color: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  day3Color: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  day4Color: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  day5Color: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  currentAlertLevel: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  day1Warning: string;
  day2Warning: string;
  day3Warning: string;
  day4Warning: string;
  day5Warning: string;
  source: string;
  sourceProduct: string;
}

/**
 * IMD District Warnings Day1_Color..Day5_Color:
 * 1 = RED (Take Action / Warning)
 * 2 = ORANGE (Be Prepared / Alert)
 * 3 = YELLOW (Be Updated / Watch)
 * 4 = GREEN (No Warning)
 * NOTE: Inverted vs Nowcast color codes!
 */
function parseWarningColor(code?: string): 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' {
  const clean = String(code || '').trim();
  if (clean === '1') return 'RED';
  if (clean === '2') return 'ORANGE';
  if (clean === '3') return 'YELLOW';
  if (clean === '4') return 'GREEN';
  return 'GREEN';
}

function decodeImdWarningHazard(codeOrText?: string): string {
  if (!codeOrText) return 'No active meteorological warning';
  const codes = String(codeOrText).split(',').map(s => s.trim());
  const decodedParts: string[] = [];

  for (const clean of codes) {
    switch (clean) {
      case '1': decodedParts.push('Heavy Rain (64.5-115.5 mm)'); break;
      case '2': decodedParts.push('Heavy Rain (64.5-115.5 mm)'); break;
      case '3': decodedParts.push('Extremely Heavy Rainfall (Cloudburst Risk)'); break;
      case '4': decodedParts.push('Thunderstorm & Lightning / Squall'); break;
      case '5': decodedParts.push('Hailstorm Warning'); break;
      case '6': decodedParts.push('Squall / Strong Surface Winds'); break;
      case '16': decodedParts.push('Very Heavy Rain (115.6-204.4 mm)'); break;
      case '17': decodedParts.push('Extremely Heavy Rain (>204.4 mm)'); break;
      default:
        if (/^\d+$/.test(clean)) {
          decodedParts.push(`Hazard Code #${clean}`);
        } else if (clean) {
          decodedParts.push(clean);
        }
    }
  }

  return decodedParts.length > 0 ? decodedParts.join('; ') : 'No active meteorological warning';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const districtFilter = searchParams.get('district');
  const alertOnly = searchParams.get('alert_only') === 'true';

  try {
    const [warningRes, awsRes] = await Promise.all([
      getLiveIMDDistrictWarning(),
      getLiveIMDAwsData().catch(() => ({ stations: [] as any }))
    ]);
    const { warnings, lastFetched, isLive } = warningRes;

    if (!warnings || warnings.length === 0) {
      return NextResponse.json({
        status: 'UNAVAILABLE',
        message: 'Official IMD District Warning feed temporarily unavailable',
        lastSuccessfulFetch: lastFetched ? new Date(lastFetched).toISOString() : null,
        warnings: [],
        totalCount: 0,
      }, { status: 503 });
    }

    const distCoordsMap = new Map<string, { lat: number; lng: number; state: string }>();
    if (awsRes && Array.isArray(awsRes.stations)) {
      for (const st of awsRes.stations) {
        const d = (st.DISTRICT || '').toLowerCase().trim();
        const lat = parseFloat(st.Latitude);
        const lng = parseFloat(st.Longitude);
        if (d && !isNaN(lat) && !isNaN(lng) && lat >= 6 && lat <= 38 && lng >= 65 && lng <= 100) {
          if (!distCoordsMap.has(d)) {
            distCoordsMap.set(d, { lat, lng, state: st.STATE || '' });
          }
        }
      }
    }

    const validatedList: ValidatedDistrictWarning[] = [];

    for (const item of warnings) {
      const distName = (item.District || '').replace(/_/g, ' ').trim();
      if (!distName) continue;

      if (districtFilter && districtFilter !== 'All Districts') {
        if (!distName.toLowerCase().includes(districtFilter.toLowerCase())) {
          continue;
        }
      }

      const d1 = parseWarningColor(item.Day1_Color);
      const d2 = parseWarningColor(item.Day2_Color);
      const d3 = parseWarningColor(item.Day3_Color);
      const d4 = parseWarningColor(item.Day4_Color);
      const d5 = parseWarningColor(item.Day5_Color);

      if (alertOnly && d1 === 'GREEN' && d2 === 'GREEN') {
        continue;
      }

      const coords = distCoordsMap.get(distName.toLowerCase()) || 
        distCoordsMap.get(distName.toLowerCase().replace(/\s+/g, '')) ||
        Array.from(distCoordsMap.entries()).find(([k]) => k.includes(distName.toLowerCase()) || distName.toLowerCase().includes(k))?.[1];

      validatedList.push({
        objId: item.Obj_id,
        district: distName,
        state: coords?.state || '',
        latitude: coords?.lat,
        longitude: coords?.lng,
        date: item.Date,
        updatedAtIST: item.updated_at ? `${item.updated_at} IST` : 'Latest Synoptic Cycle',
        day1Color: d1,
        day2Color: d2,
        day3Color: d3,
        day4Color: d4,
        day5Color: d5,
        currentAlertLevel: d1,
        day1Warning: decodeImdWarningHazard(item.Day_1),
        day2Warning: decodeImdWarningHazard(item.Day_2),
        day3Warning: decodeImdWarningHazard(item.Day_3),
        day4Warning: decodeImdWarningHazard(item.Day_4),
        day5Warning: decodeImdWarningHazard(item.Day_5),
        source: 'India Meteorological Department (IMD) Multi-Day Warning Division',
        sourceProduct: 'api.imd.gov.in/api/v1/districtwarning',
      });
    }

    return NextResponse.json({
      status: isLive ? 'OK' : 'DEGRADED',
      source: 'India Meteorological Department (IMD) District Warning Bulletin',
      totalCount: validatedList.length,
      totalDistricts: validatedList.length,
      activeAlertsCount: validatedList.filter(w => w.currentAlertLevel !== 'GREEN').length,
      redAlertsCount: validatedList.filter(w => w.currentAlertLevel === 'RED').length,
      orangeAlertsCount: validatedList.filter(w => w.currentAlertLevel === 'ORANGE').length,
      yellowAlertsCount: validatedList.filter(w => w.currentAlertLevel === 'YELLOW').length,
      warnings: validatedList,
      receivedTimestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'ERROR',
      message: err.message || 'Internal error fetching district warnings',
      warnings: [],
    }, { status: 500 });
  }
}
