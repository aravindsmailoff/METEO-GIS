import { NextRequest, NextResponse } from 'next/server';
import { getLiveIMDAwsData } from '@/lib/imdClient';

export const dynamic = 'force-dynamic';

export interface RainfallObservationPoint {
  id: string;
  stationName: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  rainfall1hMm: number;
  rainfall24hMm: number;
  category: 'NO_RAIN' | 'LIGHT' | 'MODERATE' | 'HEAVY' | 'VERY_HEAVY' | 'EXTREMELY_HEAVY';
  observationTimestampIST: string;
  dataAgeMinutes: number;
  observationType: 'GROUND_OBSERVATION';
  source: string;
}

export function classifyRainfall(mm24h: number, mm1h: number): 'NO_RAIN' | 'LIGHT' | 'MODERATE' | 'HEAVY' | 'VERY_HEAVY' | 'EXTREMELY_HEAVY' {
  // IMD Standard 24h & 1h Rainfall Classification
  if (mm24h >= 204.5 || mm1h >= 50.0) return 'EXTREMELY_HEAVY';
  if (mm24h >= 115.6 || mm1h >= 30.0) return 'VERY_HEAVY';
  if (mm24h >= 64.5 || mm1h >= 15.0) return 'HEAVY';
  if (mm24h >= 15.6 || mm1h >= 5.0) return 'MODERATE';
  if (mm24h >= 0.1 || mm1h > 0) return 'LIGHT';
  return 'NO_RAIN';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const onlyActiveRain = searchParams.get('active_only') !== 'false';
  const stateFilter = searchParams.get('state');

  try {
    const { stations, lastFetched, isLive } = await getLiveIMDAwsData();
    const finalStations = stations || [];

    if (!finalStations || finalStations.length === 0) {
      return NextResponse.json({
        status: 'UNAVAILABLE',
        message: 'Official IMD rainfall observation feed temporarily unavailable',
        lastSuccessfulFetch: lastFetched ? new Date(lastFetched).toISOString() : null,
        rainfallPoints: [],
        totalReporting: 0,
      }, { status: 200 });
    }

    const now = new Date();
    const istDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
    const todayIST = istDateFormatter.format(now);
    const rainfallPoints: RainfallObservationPoint[] = [];
    const stateBreakdown: Record<string, { totalStations: number; stationsWithRain: number; maxRain24h: number; maxRain1h: number; topStation: string }> = {};

    for (const st of finalStations) {
      const lat = parseFloat(st.Latitude);
      const lng = parseFloat(st.Longitude);
      if (isNaN(lat) || isNaN(lng) || lat < 6.0 || lat > 38.0 || lng < 68.0 || lng > 98.0) continue;

      const stateName = st.STATE.replace(/_/g, ' ');
      if (stateFilter && stateFilter !== 'All India' && stateFilter !== 'All States') {
        if (!stateName.toLowerCase().includes(stateFilter.toLowerCase())) {
          continue;
        }
      }

      const rain1h = st.RAINFALL_SEL !== null && st.RAINFALL_SEL !== undefined ? Math.max(0, parseFloat(String(st.RAINFALL_SEL)) || 0) : 0;
      const rain24h = st.RAINFALL !== null && st.RAINFALL !== undefined ? Math.max(0, parseFloat(String(st.RAINFALL)) || 0) : 0;

      // Update state summary
      if (!stateBreakdown[stateName]) {
        stateBreakdown[stateName] = { totalStations: 0, stationsWithRain: 0, maxRain24h: 0, maxRain1h: 0, topStation: '' };
      }
      stateBreakdown[stateName].totalStations++;
      if (rain1h > 0 || rain24h > 0) {
        stateBreakdown[stateName].stationsWithRain++;
        if (rain24h > stateBreakdown[stateName].maxRain24h) {
          stateBreakdown[stateName].maxRain24h = rain24h;
          stateBreakdown[stateName].maxRain1h = rain1h;
          stateBreakdown[stateName].topStation = st.STATION.replace(/_/g, ' ');
        }
      }

      // If active_only is requested, skip stations with 0 rain
      if (onlyActiveRain && rain1h === 0 && rain24h === 0) {
        continue;
      }

      let dataAgeMin = 30;
      if (st.DATE && st.TIME) {
        try {
          const [yr, mo, dy] = st.DATE.split('-').map(Number);
          const [hr, mi] = st.TIME.split(':').map(Number);
          const obsDate = new Date(Date.UTC(yr, mo - 1, dy, hr - 5, mi - 30));
          const diffMs = now.getTime() - obsDate.getTime();
          if (!isNaN(diffMs) && diffMs >= 0) {
            dataAgeMin = Math.round(diffMs / 60000);
          }
        } catch {}
      }

      rainfallPoints.push({
        id: st.ID,
        stationName: st.STATION.replace(/_/g, ' '),
        district: st.DISTRICT.replace(/_/g, ' '),
        state: stateName,
        latitude: lat,
        longitude: lng,
        rainfall1hMm: rain1h,
        rainfall24hMm: rain24h,
        category: classifyRainfall(rain24h, rain1h),
        observationTimestampIST: `${st.DATE} ${st.TIME} IST`,
        dataAgeMinutes: dataAgeMin,
        observationType: 'GROUND_OBSERVATION',
        source: 'India Meteorological Department (IMD) Ground Rain Gauge / AWS Network',
      });
    }

    // Sort by heaviest rainfall descending
    rainfallPoints.sort((a, b) => b.rainfall24hMm - a.rainfall24hMm || b.rainfall1hMm - a.rainfall1hMm);

    return NextResponse.json({
      status: isLive ? 'OK' : 'DEGRADED',
      source: 'India Meteorological Department (IMD) AWS Network',
      observationType: 'GROUND_OBSERVATION',
      unit: 'mm',
      legend: {
        NO_RAIN: '0.0 mm',
        LIGHT: '0.1 – 15.5 mm (IMD Light)',
        MODERATE: '15.6 – 64.4 mm (IMD Moderate)',
        HEAVY: '64.5 – 115.5 mm (IMD Heavy)',
        VERY_HEAVY: '115.6 – 204.4 mm (IMD Very Heavy)',
        EXTREMELY_HEAVY: '≥ 204.5 mm / ≥ 50 mm/h (IMD Extremely Heavy)',
      },
      totalPoints: rainfallPoints.length,
      activeRainStations: rainfallPoints.filter(p => p.rainfall1hMm > 0 || p.rainfall24hMm > 0).length,
      heavyRainStations: rainfallPoints.filter(p => p.category === 'HEAVY' || p.category === 'VERY_HEAVY' || p.category === 'EXTREMELY_HEAVY').length,
      stateBreakdown,
      rainfallPoints,
      receivedTimestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, max-age=120, stale-while-revalidate=60',
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'ERROR',
      message: err.message || 'Internal error processing rainfall data',
      rainfallPoints: [],
    }, { status: 500 });
  }
}
