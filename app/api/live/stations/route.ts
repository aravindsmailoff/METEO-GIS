import { NextRequest, NextResponse } from 'next/server';
import { getLiveIMDAwsData, IMDAwsStationRecord } from '@/lib/imdClient';

export const dynamic = 'force-dynamic';

export interface ValidatedStationObservation {
  id: string;
  stationName: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  observationDate: string;
  observationTime: string;
  observationTimestampIST: string;
  dataAgeMinutes: number;
  temperatureC: number | null;
  humidityPercent: number | null;
  windSpeedKmh: number | null;
  windDirectionDeg: number | null;
  pressureHpa: number | null;
  rainfall1hMm: number | null;
  rainfall24hMm: number | null;
  weatherCode: string | null;
  weatherMessage: string | null;
  status: 'LIVE' | 'NEAR-REAL-TIME' | 'DELAYED';
  source: string;
  sourceProduct: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stateFilter = searchParams.get('state');
  const districtFilter = searchParams.get('district');
  const minRain = parseFloat(searchParams.get('min_rain') || '0');
  const queryLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
  const queryLng = searchParams.get('lng') || searchParams.get('lon') ? parseFloat(searchParams.get('lng') || searchParams.get('lon')!) : null;
  const maxDistanceKm = parseFloat(searchParams.get('max_distance_km') || '120');

  // Haversine distance formula for accurate kilometre calculations across India
  const getHaversineDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  try {
    const { stations, lastFetched, isLive } = await getLiveIMDAwsData();

    if (!stations || stations.length === 0) {
      return NextResponse.json({
        status: 'UNAVAILABLE',
        message: 'Live data unavailable from official IMD AWS feed',
        lastSuccessfulFetch: lastFetched ? new Date(lastFetched).toISOString() : null,
        stations: [],
        totalCount: 0,
      }, { status: 503 });
    }

    const now = new Date();
    const validatedStations: ValidatedStationObservation[] = [];

    for (const st of stations) {
      const lat = parseFloat(st.Latitude);
      const lng = parseFloat(st.Longitude);

      // 1. Strict Coordinate Validation for India territory (6°N to 38°N, 68°E to 98°E)
      if (isNaN(lat) || isNaN(lng) || lat < 6.0 || lat > 38.0 || lng < 68.0 || lng > 98.0) {
        continue;
      }

      // 2. Filter by State or District if specified
      if (stateFilter && stateFilter !== 'All India' && stateFilter !== 'All States') {
        const normStState = st.STATE.replace(/_/g, ' ').toLowerCase();
        const normFilterState = stateFilter.toLowerCase();
        if (!normStState.includes(normFilterState) && !normFilterState.includes(normStState)) {
          continue;
        }
      }

      if (districtFilter && districtFilter !== 'All Districts') {
        const normStDist = st.DISTRICT.replace(/_/g, ' ').toLowerCase();
        const normFilterDist = districtFilter.toLowerCase();
        if (!normStDist.includes(normFilterDist) && !normFilterDist.includes(normStDist)) {
          continue;
        }
      }

      // 3. Values extraction & numerical validation
      const tempVal = st.CURR_TEMP !== null && st.CURR_TEMP !== undefined ? parseFloat(String(st.CURR_TEMP)) : null;
      const validTemp = tempVal !== null && !isNaN(tempVal) && tempVal >= -15 && tempVal <= 55 ? tempVal : null;

      const rhVal = st.RH !== null && st.RH !== undefined ? parseFloat(String(st.RH)) : null;
      const validRh = rhVal !== null && !isNaN(rhVal) && rhVal >= 0 && rhVal <= 100 ? rhVal : null;

      const windVal = st.WIND_SPEED !== null && st.WIND_SPEED !== undefined ? parseFloat(String(st.WIND_SPEED)) : null;
      const validWind = windVal !== null && !isNaN(windVal) && windVal >= 0 && windVal <= 250 ? windVal : null;

      const windDirVal = st.WIND_DIRECTION !== null && st.WIND_DIRECTION !== undefined ? parseFloat(String(st.WIND_DIRECTION)) : null;
      const validWindDir = windDirVal !== null && !isNaN(windDirVal) && windDirVal >= 0 && windDirVal <= 360 ? windDirVal : null;

      const mslpVal = st.MSLP !== null && st.MSLP !== undefined ? parseFloat(String(st.MSLP)) : null;
      const validMslp = mslpVal !== null && !isNaN(mslpVal) && mslpVal >= 880 && mslpVal <= 1080 ? mslpVal : null;

      const rain1hVal = st.RAINFALL_SEL !== null && st.RAINFALL_SEL !== undefined ? parseFloat(String(st.RAINFALL_SEL)) : null;
      const validRain1h = rain1hVal !== null && !isNaN(rain1hVal) && rain1hVal >= 0 && rain1hVal <= 500 ? rain1hVal : 0;

      const rain24hVal = st.RAINFALL !== null && st.RAINFALL !== undefined ? parseFloat(String(st.RAINFALL)) : null;
      const validRain24h = rain24hVal !== null && !isNaN(rain24hVal) && rain24hVal >= 0 && rain24hVal <= 1500 ? rain24hVal : 0;

      if (minRain > 0 && validRain1h < minRain && validRain24h < minRain) {
        continue;
      }

      // 4. Data age calculation
      let dataAgeMin = 30; // fallback default
      if (st.DATE && st.TIME) {
        try {
          const [yr, mo, dy] = st.DATE.split('-').map(Number);
          const [hr, mi] = st.TIME.split(':').map(Number);
          const obsDate = new Date(Date.UTC(yr, mo - 1, dy, hr - 5, mi - 30)); // IST to UTC
          const diffMs = now.getTime() - obsDate.getTime();
          if (!isNaN(diffMs) && diffMs >= 0) {
            dataAgeMin = Math.round(diffMs / 60000);
          }
        } catch {}
      }

      const status: 'LIVE' | 'NEAR-REAL-TIME' | 'DELAYED' =
        dataAgeMin <= 90 ? 'LIVE' : dataAgeMin <= 240 ? 'NEAR-REAL-TIME' : 'DELAYED';

      validatedStations.push({
        id: st.ID,
        stationName: st.STATION.replace(/_/g, ' '),
        district: st.DISTRICT.replace(/_/g, ' '),
        state: st.STATE.replace(/_/g, ' '),
        latitude: lat,
        longitude: lng,
        observationDate: st.DATE,
        observationTime: st.TIME,
        observationTimestampIST: `${st.DATE} ${st.TIME} IST`,
        dataAgeMinutes: dataAgeMin,
        temperatureC: validTemp,
        humidityPercent: validRh,
        windSpeedKmh: validWind,
        windDirectionDeg: validWindDir,
        pressureHpa: validMslp,
        rainfall1hMm: validRain1h,
        rainfall24hMm: validRain24h,
        weatherCode: st.WEATHER_CODE,
        weatherMessage: st.WEATHER_MESSAGE || (validRain1h > 0 ? `${validRain1h} mm/h rain` : null),
        status,
        source: 'India Meteorological Department (IMD) Automatic Weather Station (AWS) Network',
        sourceProduct: 'api.imd.gov.in/api/v1/aws_data',
      });
    }

    // If query coordinates provided, calculate the nearest station across India
    let nearestStation: ValidatedStationObservation | null = null;
    let minDistanceKm: number | null = null;

    if (queryLat !== null && queryLng !== null && !isNaN(queryLat) && !isNaN(queryLng)) {
      let minD = 999999;
      for (const st of validatedStations) {
        const d = getHaversineDistanceKm(queryLat, queryLng, st.latitude, st.longitude);
        if (d < minD) {
          minD = d;
          nearestStation = st;
        }
      }
      if (nearestStation) {
        minDistanceKm = Math.round(minD * 10) / 10;
      }
    }

    const isWithinRange = minDistanceKm !== null ? minDistanceKm <= maxDistanceKm : false;

    return NextResponse.json({
      status: isLive ? 'OK' : 'DEGRADED',
      source: 'India Meteorological Department (IMD) AWS Network',
      endpoint: 'https://api.imd.gov.in/api/v1/aws_data',
      totalCount: validatedStations.length,
      reportingRainCount: validatedStations.filter(s => (s.rainfall1hMm && s.rainfall1hMm > 0) || (s.rainfall24hMm && s.rainfall24hMm > 0)).length,
      queryCoordinates: queryLat !== null && queryLng !== null ? { lat: queryLat, lng: queryLng } : undefined,
      nearestStation: isWithinRange ? nearestStation : null,
      nearestStationAnyDistance: nearestStation,
      distanceKm: minDistanceKm,
      isWithinRange,
      maxDistanceKm,
      stations: validatedStations,
      receivedTimestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, max-age=120, stale-while-revalidate=60',
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'ERROR',
      message: err.message || 'Internal error fetching IMD station data',
      stations: [],
      totalCount: 0,
    }, { status: 500 });
  }
}
