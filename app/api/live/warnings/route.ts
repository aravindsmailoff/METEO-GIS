import { NextRequest, NextResponse } from 'next/server';
import { getLiveIMDDistrictWarning, getLiveIMDAwsData, IMDDistrictWarningRecord } from '@/lib/imdClient';
import { resolveDistrictGeo } from '@/lib/indianDistrictCoordinates';

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
  currentWarning?: string;
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

function decodeImdWarningHazard(codeOrText?: string, colorLevel?: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED'): string {
  if (colorLevel === 'GREEN' || !codeOrText || codeOrText === '1') {
    return 'No active meteorological warning (No Warning)';
  }
  const codes = String(codeOrText).split(',').map(s => s.trim());
  const decodedParts: string[] = [];

  for (const clean of codes) {
    switch (clean) {
      case '1': break; // Nil / No warning in IMD
      case '2': decodedParts.push('Heavy Rain (64.5-115.5 mm)'); break;
      case '3': decodedParts.push('Extremely Heavy Rainfall (Cloudburst Risk)'); break;
      case '4': decodedParts.push('Thunderstorm & Lightning / Squall'); break;
      case '5': decodedParts.push('Hailstorm Warning'); break;
      case '6': decodedParts.push('Squall / Strong Surface Winds'); break;
      case '8': decodedParts.push('Gusty Winds (30-40 km/h)'); break;
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

  return decodedParts.length > 0 ? decodedParts.join('; ') : 'No active meteorological warning (No Warning)';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const districtFilter = searchParams.get('district');
  const alertOnly = searchParams.get('alert_only') === 'true';
  const forceRefresh = searchParams.get('fresh') === '1' || searchParams.get('refresh') === 'true';

  try {
    const [warningRes, awsRes] = await Promise.all([
      getLiveIMDDistrictWarning(forceRefresh),
      getLiveIMDAwsData(forceRefresh).catch(() => ({ stations: [] as any }))
    ]);
    const { warnings, lastFetched, isLive } = warningRes;

    const finalWarnings = warnings || [];

    if (!finalWarnings || finalWarnings.length === 0) {
      return NextResponse.json({
        status: 'UNAVAILABLE',
        message: 'Official IMD District Warning feed temporarily unavailable',
        lastSuccessfulFetch: lastFetched ? new Date(lastFetched).toISOString() : null,
        warnings: [],
        totalCount: 0,
      }, { status: 200 });
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
    const istDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
    const now = new Date();
    const todayIST = istDateFormatter.format(now);
    const istTimeFormatter = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const timeNowIST = istTimeFormatter.format(now);
    const currentHour = parseInt(timeNowIST.split(':')[0], 10);
    const synopticCycle = currentHour >= 20 ? '20:30 Evening' : currentHour >= 16 ? '16:30 Afternoon' : currentHour >= 11 ? '11:30 Midday' : currentHour >= 5 ? '05:30 Morning' : '02:30 Early Morning';

    for (const item of finalWarnings) {
      const distName = (item.District || '').replace(/_/g, ' ').trim();
      if (!distName) continue;

      if (districtFilter && districtFilter !== 'All Districts') {
        if (!distName.toLowerCase().includes(districtFilter.toLowerCase())) {
          continue;
        }
      }

      // Determine day offset between bulletin Date and today in IST
      let dayIndex = 0;
      if (item.Date) {
        const bDate = new Date(`${item.Date}T00:00:00Z`).getTime();
        const tDate = new Date(`${todayIST}T00:00:00Z`).getTime();
        dayIndex = Math.max(0, Math.round((tDate - bDate) / (24 * 3600 * 1000)));
      }

      const allColors = [
        parseWarningColor(item.Day1_Color),
        parseWarningColor(item.Day2_Color),
        parseWarningColor(item.Day3_Color),
        parseWarningColor(item.Day4_Color),
        parseWarningColor(item.Day5_Color),
      ];

      const allCodes = [
        item.Day_1,
        item.Day_2,
        item.Day_3,
        item.Day_4,
        item.Day_5,
      ];

      // Active slot for today (Day 1..Day 5 of the ongoing multi-day forecast cycle)
      const activeSlot = dayIndex % 5;
      const currentLevel = allColors[activeSlot] || allColors[0];
      const currentWarningText = decodeImdWarningHazard(allCodes[activeSlot], currentLevel) || decodeImdWarningHazard(allCodes[0], currentLevel);

      if (alertOnly && currentLevel === 'GREEN') {
        continue;
      }

      const coords = distCoordsMap.get(distName.toLowerCase()) || 
        distCoordsMap.get(distName.toLowerCase().replace(/\s+/g, '')) ||
        Array.from(distCoordsMap.entries()).find(([k]) => k.includes(distName.toLowerCase()) || distName.toLowerCase().includes(k))?.[1];

      const stateHint = coords?.state || (item as any).State || '';
      const geoResolved = resolveDistrictGeo(distName, stateHint);

      const lat = coords?.lat ?? geoResolved?.lat;
      const lng = coords?.lng ?? geoResolved?.lng;
      const state = coords?.state || geoResolved?.state || '';

      // Rotate/re-index 5-day forecast starting from today (Day 1 = Today)
      const d1 = allColors[activeSlot];
      const d2 = allColors[(activeSlot + 1) % 5];
      const d3 = allColors[(activeSlot + 2) % 5];
      const d4 = allColors[(activeSlot + 3) % 5];
      const d5 = allColors[(activeSlot + 4) % 5];

      const w1 = decodeImdWarningHazard(allCodes[activeSlot], d1);
      const w2 = decodeImdWarningHazard(allCodes[(activeSlot + 1) % 5], d2);
      const w3 = decodeImdWarningHazard(allCodes[(activeSlot + 2) % 5], d3);
      const w4 = decodeImdWarningHazard(allCodes[(activeSlot + 3) % 5], d4);
      const w5 = decodeImdWarningHazard(allCodes[(activeSlot + 4) % 5], d5);

      validatedList.push({
        objId: item.Obj_id,
        district: distName,
        state,
        latitude: lat,
        longitude: lng,
        date: todayIST,
        updatedAtIST: `${todayIST} ${timeNowIST} IST (${synopticCycle} Bulletin)`,
        day1Color: d1,
        day2Color: d2,
        day3Color: d3,
        day4Color: d4,
        day5Color: d5,
        currentAlertLevel: currentLevel,
        currentWarning: currentWarningText,
        day1Warning: w1,
        day2Warning: w2,
        day3Warning: w3,
        day4Warning: w4,
        day5Warning: w5,
        source: 'India Meteorological Department (IMD) Multi-Day Synoptic Warning Division',
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
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
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
