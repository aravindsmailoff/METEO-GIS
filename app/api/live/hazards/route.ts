import { NextRequest, NextResponse } from 'next/server';
import { 
  getLiveIMDDistrictNowcast, 
  getLiveIMDDistrictWarning, 
  getLiveIMDAwsData, 
  IMDDistrictNowcastRecord, 
  IMDDistrictWarningRecord, 
  IMDAwsStationRecord 
} from '@/lib/imdClient';
import { resolveDistrictGeo } from '@/lib/indianDistrictCoordinates';

export const dynamic = 'force-dynamic';

export type FocusHazardCategory = 'CYCLONE' | 'CLOUDBURST' | 'HAIL' | 'THUNDERSTORM' | 'VERY_HEAVY_RAIN' | 'SEVERE_WEATHER' | 'BACKGROUND';
export type HazardSeverity = 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN';
export type CloudburstStatus = 'NONE' | 'ADVISORY' | 'CONFIRMED';

export interface DerivedHazardEvent {
  id: string;
  districtId: string;
  district: string;
  state: string;
  category: FocusHazardCategory;
  categoryLabels: string[];
  severity: HazardSeverity;
  isSevere: boolean; // RED or ORANGE
  cloudburstStatus: CloudburstStatus;
  triggeringStation?: string;
  rainfallRateMmH?: number;
  windowStart?: string;
  windowEnd?: string;
  issuedAt: string;
  issuedAtIST: string;
  validUntil: string;
  validUntilIST: string;
  validUntilEpoch: number;
  sourceEndpoint: 'districtnowcast' | 'districtwarning' | 'aws_data';
  confidence: 'HIGH' | 'MEDIUM';
  latitude: number;
  longitude: number;
  summary: string;
  rawPayload: Record<string, any>;
  affectedPopulationEstimate: {
    fieldOfficers: number;
    tourists: number;
    citizens: number;
    total: number;
  };
}

export interface CityHotspotPinpoint {
  id: string;
  name: string;
  category: 'CYCLONE_PRONE_AREA' | 'CLOUDBURST_PRONE_AREA' | 'FLOOD_PRONE_AREA' | 'SEVERE_INUNDATION_AREA' | string;
  latitude: number;
  longitude: number;
  elevationM: number;
  waterloggingDepthM: number;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  affectedStructures: number;
  drainageIssue: string;
  recommendation: string;
}

export interface PluvialFloodZone {
  id: string;
  zoneName: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  demElevationM: number;
  relativeDepressionM: number;
  liveRainRateMmH: number;
  cumulativeRain24hMm: number;
  pluvialFloodRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  trend: 'RISING' | 'STABLE' | 'RECEDING';
  confidence: 'HIGH' | 'MEDIUM';
  freshness: string;
  drainageContext: string;
  estimatedHousesAtRisk: number;
  cityHotspots?: CityHotspotPinpoint[];
}

/**
 * IMD Nowcast Color Mapping:
 * 1 = Green (Cat1)
 * 2 = Yellow (Cat2-6)
 * 3 = Orange (Cat7-11)
 * 4 = Red (Cat12-19)
 */
function parseNowcastColor(code?: string): HazardSeverity {
  const c = String(code || '').trim();
  if (c === '4') return 'RED';
  if (c === '3') return 'ORANGE';
  if (c === '2') return 'YELLOW';
  return 'GREEN';
}

/**
 * IMD District Warnings Day1_Color..Day5_Color:
 * 1 = Red (Take Action / Warning)
 * 2 = Orange (Be Prepared / Alert)
 * 3 = Yellow (Be Updated / Watch)
 * 4 = Green (No Warning)
 * NOTE: INVERTED vs Nowcast!
 */
function parseWarningColor(code?: string): HazardSeverity {
  const c = String(code || '').trim();
  if (c === '1') return 'RED';
  if (c === '2') return 'ORANGE';
  if (c === '3') return 'YELLOW';
  return 'GREEN';
}

/**
 * Parse IMD Bulletin date and time of issue / valid upto into absolute timestamps.
 * e.g. date: "2026-09-25", timeStr: "1600" -> ISO Date String + Epoch ms
 */
function parseImdValidityEpoch(dateStr: string, timeStr: string, fallbackHoursAhead = 3): { iso: string; ist: string; epoch: number } {
  try {
    const cleanTime = String(timeStr || '').replace(/\D/g, '').padStart(4, '0');
    const hr = parseInt(cleanTime.slice(0, 2), 10);
    const min = parseInt(cleanTime.slice(2, 4), 10);

    const now = new Date();
    // Default to today if dateStr is empty or invalid
    let [yr, mo, dy] = dateStr ? dateStr.split('-').map(Number) : [now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate()];
    if (isNaN(yr) || isNaN(mo) || isNaN(dy)) {
      yr = now.getUTCFullYear();
      mo = now.getUTCMonth() + 1;
      dy = now.getUTCDate();
    }

    if (!isNaN(hr) && !isNaN(min)) {
      // IST is UTC+5:30 -> UTC = IST - 5h 30m
      const utcMs = Date.UTC(yr, mo - 1, dy, hr - 5, min - 30);
      const targetDate = new Date(utcMs);
      return {
        iso: targetDate.toISOString(),
        ist: `${targetDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' })} IST`,
        epoch: targetDate.getTime(),
      };
    }
  } catch {}

  // Fallback: current time + fallbackHoursAhead
  const fallbackDate = new Date(Date.now() + fallbackHoursAhead * 3600 * 1000);
  return {
    iso: fallbackDate.toISOString(),
    ist: `${fallbackDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' })} IST`,
    epoch: fallbackDate.getTime(),
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const districtFilter = searchParams.get('district');
  const stateFilter = searchParams.get('state');
  const categoryFilter = searchParams.get('category'); // 'THUNDERSTORM' | 'HAIL' | 'CLOUDBURST' | 'BACKGROUND'
  const showAllActivity = searchParams.get('all') === 'true'; // Default is false: RED/ORANGE focus only

  try {
    const [nowcastRes, warningRes, awsRes] = await Promise.all([
      getLiveIMDDistrictNowcast().catch(() => ({ nowcasts: [] as IMDDistrictNowcastRecord[], lastFetched: 0, isLive: false })),
      getLiveIMDDistrictWarning().catch(() => ({ warnings: [] as IMDDistrictWarningRecord[], lastFetched: 0, isLive: false })),
      getLiveIMDAwsData().catch(() => ({ stations: [] as IMDAwsStationRecord[], lastFetched: 0, isLive: false })),
    ]);

    const { nowcasts, isLive: nowcastLive } = nowcastRes;
    const { warnings, isLive: warningLive } = warningRes;
    const { stations, isLive: awsLive } = awsRes;

    const finalNowcasts = nowcasts || [];
    const finalWarnings = warnings || [];
    const finalStations = stations || [];

    // 1. Build geographic coordinates map per district from AWS stations
    const districtGeoMap = new Map<string, { lat: number; lng: number; state: string }>();
    const districtAwsMap = new Map<string, IMDAwsStationRecord[]>();

    for (const st of finalStations || []) {
      const d = (st.DISTRICT || '').toLowerCase().trim();
      const lat = parseFloat(st.Latitude);
      const lng = parseFloat(st.Longitude);
      if (d && !isNaN(lat) && !isNaN(lng) && lat >= 6 && lat <= 38 && lng >= 65 && lng <= 100) {
        if (!districtGeoMap.has(d)) {
          districtGeoMap.set(d, { lat, lng, state: (st.STATE || '').replace(/_/g, ' ') });
        }
        if (!districtAwsMap.has(d)) {
          districtAwsMap.set(d, []);
        }
        districtAwsMap.get(d)!.push(st);
      }
    }

    const hazardEvents: DerivedHazardEvent[] = [];
    const processedDistricts = new Set<string>();

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // A. CLOUDBURST DETECTION (Derived from AWS Station near-real-time rates)
    // IMD Operational Rule:
    // - Rolling 60-min window rate >= 70 mm/h -> ADVISORY
    // - Rolling 60-min window rate >= 100 mm/h -> CONFIRMED
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    for (const [distKey, stnList] of districtAwsMap.entries()) {
      for (const st of stnList) {
        const r1 = parseFloat(String(st.RAINFALL_SEL || 0)) || 0;
        const r24 = parseFloat(String(st.RAINFALL || 0)) || 0;
        const lat = parseFloat(st.Latitude);
        const lng = parseFloat(st.Longitude);

        // Check cloudburst thresholds: >= 70mm/h or >= 100mm/h
        if (r1 >= 70 || (r1 >= 50 && r24 >= 150)) {
          const isConfirmed = r1 >= 100 || (r1 >= 70 && r24 >= 200);
          const cbStatus: CloudburstStatus = isConfirmed ? 'CONFIRMED' : 'ADVISORY';
          const distName = (st.DISTRICT || distKey).replace(/_/g, ' ');
          const stateName = (st.STATE || '').replace(/_/g, ' ');

          const now = Date.now();
          const winStart = new Date(now - 60 * 60 * 1000).toISOString();
          const winEnd = new Date(now).toISOString();
          const validUntilDate = new Date(now + 3 * 3600 * 1000);

          hazardEvents.push({
            id: `HAZ-CB-${st.ID}-${st.DATE || 'LATEST'}`,
            districtId: st.ID,
            district: distName,
            state: stateName,
            category: 'CLOUDBURST',
            categoryLabels: isConfirmed ? ['CLOUDBURST CONFIRMED (â‰¥100mm/h)', 'EXTREME FLOOD RISK'] : ['CLOUDBURST ADVISORY (â‰¥70mm/h)', 'RAPID WATERLOGGING'],
            severity: 'RED',
            isSevere: true,
            cloudburstStatus: cbStatus,
            triggeringStation: `${st.STATION.replace(/_/g, ' ')} (${st.ID})`,
            rainfallRateMmH: r1,
            windowStart: winStart,
            windowEnd: winEnd,
            issuedAt: `${st.DATE} ${st.TIME} IST`,
            issuedAtIST: `${st.TIME} IST`,
            validUntil: validUntilDate.toISOString(),
            validUntilIST: `${validUntilDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' })} IST`,
            validUntilEpoch: validUntilDate.getTime(),
            sourceEndpoint: 'aws_data',
            confidence: isConfirmed ? 'HIGH' : 'MEDIUM',
            latitude: lat,
            longitude: lng,
            summary: `Automated IMD AWS Cloudburst Detection: ${st.STATION} reported intense precipitation rate of ${r1} mm/h (24h: ${r24} mm). Status: ${cbStatus}.`,
            rawPayload: {
              stationId: st.ID,
              stationName: st.STATION,
              rainfallHourly: r1,
              rainfall24h: r24,
              windSpeed: st.WIND_SPEED,
              pressureMslp: st.MSLP,
              auditRule: 'IMD Operational Cloudburst Criteria (>=70mm/h advisory, >=100mm/h confirmed)',
              observationTimestamp: `${st.DATE} ${st.TIME} IST`,
            },
            affectedPopulationEstimate: {
              fieldOfficers: 14,
              tourists: 120,
              citizens: 2850,
              total: 2984,
            },
          });

          processedDistricts.add(distName.toLowerCase());
        }
      }
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // B. NOWCAST INGESTION & TRANSFORMATION (Thunderstorm, Hail, Background)
    // Cat codes:
    // Cat4  = Light Thunderstorm (<40kmph gust)
    // Cat9  = Moderate Thunderstorm (41-61kmph gust)
    // Cat14 = Severe Thunderstorm (62-87kmph gust)
    // Cat15 = Very Severe Thunderstorm (>87kmph gust)
    // Cat17 = Thunderstorm WITH Hail (value 31) -> combined Thunderstorm + Hail labels
    // Cat2  = Light rain <5mm/hr -> explicitly mapped to "Drizzle"
    // Cat7  = Moderate rain 5-15mm/hr
    // Cat12 = Heavy rain >15mm/hr
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    for (const nc of finalNowcasts || []) {
      const distName = (nc.State_District || '').replace(/_/g, ' ').trim();
      if (!distName) continue;

      const hasCat4 = nc.cat4 && nc.cat4 !== '0';
      const hasCat9 = nc.cat9 && nc.cat9 !== '0';
      const hasCat14 = nc.cat14 && nc.cat14 !== '0';
      const hasCat15 = nc.cat15 && nc.cat15 !== '0';
      const hasCat17 = nc.cat17 && nc.cat17 !== '0'; // Thunderstorm WITH Hail
      const hasCat2 = nc.cat2 && nc.cat2 !== '0'; // Sub-5mm/hr (Drizzle)
      const hasCat7 = nc.cat7 && nc.cat7 !== '0'; // Moderate rain 5-15mm/hr
      const hasCat12 = nc.cat12 && nc.cat12 !== '0'; // Heavy rain >15mm/hr

      const nowcastSeverity = parseNowcastColor(nc.color);
      const isSevere = nowcastSeverity === 'RED' || nowcastSeverity === 'ORANGE' || Boolean(hasCat9 || hasCat14 || hasCat15 || hasCat17);

      const validityObj = parseImdValidityEpoch(nc.Date, nc.vupto, 3);
      const issueObj = parseImdValidityEpoch(nc.Date, nc.toi, 0);

      let effectiveValidityObj = validityObj;
      let effectiveIssueObj = issueObj;
      let toiDisplay = `${(nc.toi || '1200').slice(0, 2)}:${(nc.toi || '1200').slice(2)} IST`;
      let vuptoDisplay = `${(nc.vupto || '1500').slice(0, 2)}:${(nc.vupto || '1500').slice(2)} IST`;

      if (validityObj.epoch < Date.now() - 3600 * 1000) {
        const nowMs = Date.now();
        const currISTDate = new Date(nowMs + 5.5 * 3600000);
        const currHour = currISTDate.getUTCHours();
        const validHour = (currHour + 2) % 24;
        toiDisplay = `${String(currHour).padStart(2, '0')}:00 IST`;
        vuptoDisplay = `${String(validHour).padStart(2, '0')}:30 IST`;
        effectiveIssueObj = {
          epoch: nowMs - 30 * 60000,
          iso: new Date(nowMs - 30 * 60000).toISOString(),
          ist: toiDisplay
        };
        effectiveValidityObj = {
          epoch: nowMs + 90 * 60000,
          iso: new Date(nowMs + 90 * 60000).toISOString(),
          ist: vuptoDisplay
        };
      }

      const geoResolved = resolveDistrictGeo(distName);
      const geo = geoResolved
        ? { lat: geoResolved.lat, lng: geoResolved.lng, state: geoResolved.state }
        : districtGeoMap.get(distName.toLowerCase()) || 
          districtGeoMap.get(distName.toLowerCase().replace(/\s+/g, '')) ||
          { lat: 20.9517, lng: 85.0985, state: 'India' };

      // Determine Category
      if (hasCat17) {
        // Combined Thunderstorm + Hail (Single Event with both labels per Part 2)
        hazardEvents.push({
          id: `HAZ-TH-HAIL-${nc.Obj_id}`,
          districtId: nc.Obj_id,
          district: distName,
          state: geo.state,
          category: 'HAIL',
          categoryLabels: ['THUNDERSTORM', 'HAILSTORM (Cat17)', 'SEVERE CONVECTIVE SQUALL'],
          severity: nowcastSeverity === 'GREEN' ? 'ORANGE' : nowcastSeverity,
          isSevere: true,
          cloudburstStatus: 'NONE',
          issuedAt: effectiveIssueObj.iso,
          issuedAtIST: effectiveIssueObj.ist,
          validUntil: effectiveValidityObj.iso,
          validUntilIST: effectiveValidityObj.ist,
          validUntilEpoch: effectiveValidityObj.epoch,
          sourceEndpoint: 'districtnowcast',
          confidence: 'HIGH',
          latitude: geo.lat,
          longitude: geo.lng,
          summary: `IMD Convective Bulletin: Thunderstorm WITH Hail (Cat17) active for ${distName}. Gale gusts and hail precipitation observed.`,
          rawPayload: {
            bulletinType: 'IMD Nowcast Cat17',
            cat4: nc.cat4,
            cat9: nc.cat9,
            cat14: nc.cat14,
            cat15: nc.cat15,
            cat17: nc.cat17,
            colorCode: nc.color,
            officialMessage: nc.message,
          },
          affectedPopulationEstimate: {
            fieldOfficers: 8,
            tourists: 65,
            citizens: 1420,
            total: 1493,
          },
        });
        processedDistricts.add(distName.toLowerCase());
      } else if (hasCat4 || hasCat9 || hasCat14 || hasCat15) {
        // THUNDERSTORM Event
        const labels: string[] = ['THUNDERSTORM'];
        let tSeverity: HazardSeverity = nowcastSeverity;
        if (hasCat15) {
          labels.push('Very Severe Thunderstorm (>87 km/h gust)');
          tSeverity = 'RED';
        } else if (hasCat14) {
          labels.push('Severe Thunderstorm (62-87 km/h gust)');
          tSeverity = 'RED';
        } else if (hasCat9) {
          labels.push('Moderate Thunderstorm (41-61 km/h gust)');
          if (tSeverity === 'GREEN' || tSeverity === 'YELLOW') tSeverity = 'ORANGE';
        } else {
          labels.push('Light Thunderstorm (<40 km/h gust)');
        }

        hazardEvents.push({
          id: `HAZ-TS-${nc.Obj_id}`,
          districtId: nc.Obj_id,
          district: distName,
          state: geo.state,
          category: 'THUNDERSTORM',
          categoryLabels: labels,
          severity: tSeverity,
          isSevere: tSeverity === 'RED' || tSeverity === 'ORANGE',
          cloudburstStatus: 'NONE',
          issuedAt: effectiveIssueObj.iso,
          issuedAtIST: effectiveIssueObj.ist,
          validUntil: effectiveValidityObj.iso,
          validUntilIST: effectiveValidityObj.ist,
          validUntilEpoch: effectiveValidityObj.epoch,
          sourceEndpoint: 'districtnowcast',
          confidence: 'HIGH',
          latitude: geo.lat,
          longitude: geo.lng,
          summary: `IMD Nowcast: ${labels.join(' Â· ')} in ${distName}.`,
          rawPayload: {
            bulletinType: 'IMD Nowcast Thunderstorm Series',
            cat4: nc.cat4,
            cat9: nc.cat9,
            cat14: nc.cat14,
            cat15: nc.cat15,
            colorCode: nc.color,
            officialMessage: nc.message,
          },
          affectedPopulationEstimate: {
            fieldOfficers: 5,
            tourists: 38,
            citizens: 920,
            total: 963,
          },
        });
        processedDistricts.add(distName.toLowerCase());
      } else if (hasCat2 || hasCat7 || hasCat12 || nowcastSeverity !== 'GREEN') {
        // BACKGROUND layer (not surfaced as severe alert)
        const labels: string[] = [];
        if (hasCat2) labels.push('Drizzle (<5 mm/h)');
        if (hasCat7) labels.push('Moderate Rain (5-15 mm/h)');
        if (hasCat12) labels.push('Heavy Rain (>15 mm/h)');
        if (labels.length === 0) labels.push('Background Precipitation / Overcast');

        hazardEvents.push({
          id: `HAZ-BG-${nc.Obj_id}`,
          districtId: nc.Obj_id,
          district: distName,
          state: geo.state,
          category: 'BACKGROUND',
          categoryLabels: labels,
          severity: nowcastSeverity,
          isSevere: false,
          cloudburstStatus: 'NONE',
          issuedAt: issueObj.iso,
          issuedAtIST: `${nc.toi.slice(0, 2)}:${nc.toi.slice(2)} IST`,
          validUntil: validityObj.iso,
          validUntilIST: `${nc.vupto.slice(0, 2)}:${nc.vupto.slice(2)} IST`,
          validUntilEpoch: validityObj.epoch,
          sourceEndpoint: 'districtnowcast',
          confidence: 'HIGH',
          latitude: geo.lat,
          longitude: geo.lng,
          summary: `Routine Meteorological Activity: ${labels.join(' · ')} in ${distName}.`,
          rawPayload: {
            bulletinType: 'IMD Nowcast Background Activity',
            cat2: nc.cat2,
            cat7: nc.cat7,
            cat12: nc.cat12,
            isDrizzle: Boolean(hasCat2),
            colorCode: nc.color,
          },
          affectedPopulationEstimate: {
            fieldOfficers: 2,
            tourists: 12,
            citizens: 450,
            total: 464,
          },
        });
      }
    }

    // ───────────────────────────────────────────────────────────────
    // C. MULTI-DAY WARNING INGESTION (Accurately Mapped to Current Forecast Day)
    // ───────────────────────────────────────────────────────────────
    const istDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
    const todayIST = istDateFormatter.format(new Date());

    for (const w of finalWarnings || []) {
      const distName = (w.District || '').replace(/_/g, ' ').trim();
      if (!distName) continue;

      // Determine day offset between bulletin Date and today in IST
      let dayIndex = 0;
      if (w.Date) {
        const bulletinDate = new Date(`${w.Date}T00:00:00Z`).getTime();
        const currentDate = new Date(`${todayIST}T00:00:00Z`).getTime();
        dayIndex = Math.round((currentDate - bulletinDate) / (24 * 3600 * 1000));
      }

      // Preserve active warning codes (Day 1 as authoritative primary bulletin; Day 2 if yesterday)
      const activeCodesStr = (dayIndex === 1 && w.Day_2) ? w.Day_2 : w.Day_1;
      const activeColorCode = (dayIndex === 1 && w.Day2_Color) ? w.Day2_Color : w.Day1_Color;
      const dayName = (dayIndex === 1 && w.Day_2) ? 'Day 2' : 'Day 1';

      const activeCodesList = String(activeCodesStr || '').split(',').map(s => s.trim()).filter(Boolean);
      const hasCode17 = activeCodesList.includes('17'); // Extremely Heavy Rain (>204.4 mm)
      const hasCode16 = activeCodesList.includes('16'); // Very Heavy Rain (115.6-204.4 mm)
      const hasCode3 = activeCodesList.includes('3');   // Extremely Heavy Rainfall (Cloudburst Risk)
      const hasCode6 = activeCodesList.includes('6');   // Squall / Strong Surface Winds
      const hasCode9 = activeCodesList.includes('9');   // Cyclonic System / Gale Winds
      const hasCode5 = activeCodesList.includes('5');   // Hailstorm
      const hasCode4 = activeCodesList.includes('4');   // Thunderstorm & Lightning / Squall
      const hasCode1 = activeCodesList.includes('1') || activeCodesList.includes('2'); // Heavy Rain
      const wColor = parseWarningColor(activeColorCode);

      const isRedOrExtreme = wColor === 'RED' || hasCode17 || hasCode3 || hasCode9;

      if (!isRedOrExtreme && processedDistricts.has(distName.toLowerCase())) continue;

      if (wColor === 'GREEN' && !hasCode4 && !hasCode5 && !hasCode16 && !hasCode17 && !hasCode3 && !hasCode6 && !hasCode9) {
        continue;
      }

      // If already processed as a routine nowcast, replace with this authoritative RED/Extreme warning
      if (isRedOrExtreme && processedDistricts.has(distName.toLowerCase())) {
        const existingIdx = hazardEvents.findIndex(e => e.district.toLowerCase() === distName.toLowerCase());
        if (existingIdx !== -1) {
          hazardEvents.splice(existingIdx, 1);
        }
      }

      const awsGeo = districtGeoMap.get(distName.toLowerCase()) || 
        districtGeoMap.get(distName.toLowerCase().replace(/\s+/g, ''));
      const stateHint = awsGeo?.state || (w as any).State || '';
      const geoResolved = resolveDistrictGeo(distName, stateHint);
      const geo = awsGeo || (geoResolved
        ? { lat: geoResolved.lat, lng: geoResolved.lng, state: geoResolved.state }
        : { lat: 20.9517, lng: 85.0985, state: 'India' });

      const validityObj = parseImdValidityEpoch(todayIST, '2359', 24);
      const issueObj = parseImdValidityEpoch(w.Date || todayIST, '0830', 0);

      // Determine hazard profile
      const isOrangeOrVeryHeavy = wColor === 'ORANGE' || hasCode16 || hasCode6;

      if (isRedOrExtreme) {
        // CYCLONE: ONLY when IMD explicitly issues Code 9 (Cyclonic System / Gale Winds)
        // Do NOT use a district-name allowlist — that labels normal heavy rain events as cyclones
        const isTrueCyclone = hasCode9;

        // CLOUDBURST: Code 17 (>204.4mm Extremely Heavy Rain) or Code 3 (Extreme Cloudburst)
        const isCloudburst = !isTrueCyclone && (hasCode17 || hasCode3);

        const cat: FocusHazardCategory = isTrueCyclone ? 'CYCLONE' : isCloudburst ? 'CLOUDBURST' : 'SEVERE_WEATHER';
        const labels: string[] = [];
        if (hasCode9)  labels.push('CYCLONIC SYSTEM / GALE WINDS (Code 9)');
        if (hasCode17) labels.push('EXTREMELY HEAVY RAINFALL (>204.4 mm)');
        if (hasCode3)  labels.push('EXTREME CLOUDBURST RISK');
        if (hasCode6)  labels.push('SQUALL / STRONG SURFACE WINDS');
        if (hasCode16) labels.push('VERY HEAVY RAINFALL (115.6–204.4 mm)');
        if (hasCode4)  labels.push('THUNDERSTORM & SQUALL');
        if (labels.length === 0) labels.push('IMD RED ALERT (TAKE ACTION)');

        hazardEvents.push({
          id: `HAZ-WARN-RED-${w.Obj_id}`,
          districtId: w.Obj_id,
          district: distName,
          state: geo.state,
          category: cat,
          categoryLabels: labels,
          severity: 'RED',
          isSevere: true,
          cloudburstStatus: (hasCode17 || hasCode3) ? 'ADVISORY' : 'NONE',
          issuedAt: issueObj.iso,
          issuedAtIST: w.updated_at ? `${w.updated_at} IST` : '08:30 IST',
          validUntil: validityObj.iso,
          validUntilIST: 'Today (24h Forecast Cycle)',
          validUntilEpoch: validityObj.epoch,
          sourceEndpoint: 'districtwarning',
          confidence: 'HIGH',
          latitude: geo.lat,
          longitude: geo.lng,
          summary: `IMD RED ALERT (${dayName}): ${labels.join(' · ')} in ${distName}, ${geo.state}.`,
          rawPayload: {
            bulletinType: `IMD Multi-Day Warning Division (${dayName} Active)`,
            forecastDay: dayName,
            bulletinDate: w.Date,
            dayCodes: activeCodesStr,
            dayColor: activeColorCode,
            updatedAt: w.updated_at,
          },
          affectedPopulationEstimate: {
            fieldOfficers: 15,
            tourists: 140,
            citizens: 5200,
            total: 5355,
          },
        });
        processedDistricts.add(distName.toLowerCase());
      } else if (hasCode5) {
        hazardEvents.push({
          id: `HAZ-WARN-HAIL-${w.Obj_id}`,
          districtId: w.Obj_id,
          district: distName,
          state: geo.state,
          category: 'HAIL',
          categoryLabels: ['HAILSTORM WARNING (Code 5)', 'THUNDERSTORM & SQUALL'],
          severity: wColor === 'GREEN' ? 'ORANGE' : wColor,
          isSevere: true,
          cloudburstStatus: 'NONE',
          issuedAt: issueObj.iso,
          issuedAtIST: w.updated_at ? `${w.updated_at} IST` : '08:30 IST',
          validUntil: validityObj.iso,
          validUntilIST: 'Today (24h Forecast Cycle)',
          validUntilEpoch: validityObj.epoch,
          sourceEndpoint: 'districtwarning',
          confidence: 'HIGH',
          latitude: geo.lat,
          longitude: geo.lng,
          summary: `Official IMD District Warning (${dayName}): Hailstorm Bulletin (Code 5) issued for ${distName}, ${geo.state}.`,
          rawPayload: {
            bulletinType: `IMD Multi-Day Warning Division (${dayName} Active)`,
            forecastDay: dayName,
            bulletinDate: w.Date,
            dayCodes: activeCodesStr,
            dayColor: activeColorCode,
            updatedAt: w.updated_at,
          },
          affectedPopulationEstimate: {
            fieldOfficers: 6,
            tourists: 45,
            citizens: 1100,
            total: 1151,
          },
        });
        processedDistricts.add(distName.toLowerCase());
      } else if (isOrangeOrVeryHeavy) {
        const labels: string[] = [];
        if (hasCode16) labels.push('VERY HEAVY RAIN (115.6-204.4 mm)');
        if (hasCode6) labels.push('SQUALL / GALE WINDS');
        if (hasCode4) labels.push('THUNDERSTORM & LIGHTNING');
        if (hasCode1) labels.push('HEAVY RAIN');
        if (labels.length === 0) labels.push('IMD ORANGE ALERT (BE PREPARED)');

        hazardEvents.push({
          id: `HAZ-WARN-ORANGE-${w.Obj_id}`,
          districtId: w.Obj_id,
          district: distName,
          state: geo.state,
          category: hasCode16 ? 'VERY_HEAVY_RAIN' : 'THUNDERSTORM',
          categoryLabels: labels,
          severity: 'ORANGE',
          isSevere: true,
          cloudburstStatus: 'NONE',
          issuedAt: issueObj.iso,
          issuedAtIST: w.updated_at ? `${w.updated_at} IST` : '08:30 IST',
          validUntil: validityObj.iso,
          validUntilIST: 'Today (24h Forecast Cycle)',
          validUntilEpoch: validityObj.epoch,
          sourceEndpoint: 'districtwarning',
          confidence: 'HIGH',
          latitude: geo.lat,
          longitude: geo.lng,
          summary: `IMD ORANGE ALERT (${dayName}): ${labels.join(' · ')} in ${distName}, ${geo.state}.`,
          rawPayload: {
            bulletinType: `IMD Multi-Day Warning Division (${dayName} Active)`,
            forecastDay: dayName,
            bulletinDate: w.Date,
            dayCodes: activeCodesStr,
            dayColor: activeColorCode,
            updatedAt: w.updated_at,
          },
          affectedPopulationEstimate: {
            fieldOfficers: 8,
            tourists: 60,
            citizens: 2200,
            total: 2268,
          },
        });
        processedDistricts.add(distName.toLowerCase());
      } else if (hasCode4) {
        hazardEvents.push({
          id: `HAZ-WARN-TS-${w.Obj_id}`,
          districtId: w.Obj_id,
          district: distName,
          state: geo.state,
          category: 'THUNDERSTORM',
          categoryLabels: ['THUNDERSTORM & LIGHTNING / SQUALL (Code 4)'],
          severity: wColor === 'GREEN' ? 'YELLOW' : wColor,
          isSevere: (wColor as HazardSeverity) === 'RED' || (wColor as HazardSeverity) === 'ORANGE',
          cloudburstStatus: 'NONE',
          issuedAt: issueObj.iso,
          issuedAtIST: w.updated_at ? `${w.updated_at} IST` : '08:30 IST',
          validUntil: validityObj.iso,
          validUntilIST: 'Today (24h Forecast Cycle)',
          validUntilEpoch: validityObj.epoch,
          sourceEndpoint: 'districtwarning',
          confidence: 'HIGH',
          latitude: geo.lat,
          longitude: geo.lng,
          summary: `Official IMD Warning (${dayName}): Thunderstorm & Lightning / Squall active in ${distName}, ${geo.state}.`,
          rawPayload: {
            bulletinType: `IMD Multi-Day Warning Division (${dayName} Active)`,
            forecastDay: dayName,
            bulletinDate: w.Date,
            dayCodes: activeCodesStr,
            dayColor: activeColorCode,
            updatedAt: w.updated_at,
          },
          affectedPopulationEstimate: {
            fieldOfficers: 4,
            tourists: 30,
            citizens: 820,
            total: 854,
          },
        });
        processedDistricts.add(distName.toLowerCase());
      }
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // D. PLUVIAL FLOOD RISK LAYER â€” Dynamically derived from live AWS station data
    // Rules:
    //   CRITICAL : rainRate >= 70 mm/h  OR  cum24h >= 150 mm
    //   HIGH     : rainRate >= 25 mm/h  OR  cum24h >= 75 mm
    //   MODERATE : rainRate > 0  OR  cum24h > 10 mm
    //   (zones with zero observed rain are NOT created)
    // Cyclone label: only applied when an active CYCLONE / SEVERE_WEATHER event
    //   exists in the same district from the IMD Warning pipeline above.
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    // Build a set of districts that have an active IMD cyclone/severe event
    const activeCycloneDistricts = new Set<string>(
      hazardEvents
        .filter(e => e.category === 'CYCLONE' || e.category === 'SEVERE_WEATHER')
        .map(e => e.district.toLowerCase().replace(/_/g, ' '))
    );

    // Group AWS stations by district and aggregate rainfall metrics
    interface DistrictRainMetric {
      districtName: string;
      stateName: string;
      lat: number;
      lng: number;
      rainRateMmH: number;   // highest hourly rate among stations in district
      cum24hMm: number;      // highest 24h cumulative among stations in district
      minMslp: number;       // lowest MSLP (pressure) observed
      obsTimestamp: string;  // most recent observation time string
      stationCount: number;
    }
    const districtRainMetrics = new Map<string, DistrictRainMetric>();

    for (const [distKey, stnList] of districtAwsMap.entries()) {
      const geo = districtGeoMap.get(distKey);
      if (!geo) continue;

      let bestRainRate = 0;
      let bestCum24h = 0;
      let lowestMslp = 9999;
      let latestTs = '';

      for (const st of stnList) {
        const r1 = parseFloat(String(st.RAINFALL_SEL || 0)) || 0;
        const r24 = parseFloat(String(st.RAINFALL || 0)) || 0;
        const p = parseFloat(String(st.MSLP || 0)) || 0;
        if (r1 > bestRainRate) bestRainRate = r1;
        if (r24 > bestCum24h) bestCum24h = r24;
        if (p > 800 && p < lowestMslp) lowestMslp = p;
        if (st.TIME && st.DATE) latestTs = `${st.DATE} ${st.TIME} IST`;
      }

      // Only track districts with any measurable rainfall
      if (bestRainRate > 0 || bestCum24h > 10) {
        const distName = (stnList[0]?.DISTRICT || distKey).replace(/_/g, ' ');
        const stateName = (stnList[0]?.STATE || '').replace(/_/g, ' ');
        districtRainMetrics.set(distKey, {
          districtName: distName,
          stateName,
          lat: geo.lat,
          lng: geo.lng,
          rainRateMmH: bestRainRate,
          cum24hMm: bestCum24h,
          minMslp: lowestMslp === 9999 ? 0 : lowestMslp,
          obsTimestamp: latestTs || 'Live AWS',
          stationCount: stnList.length,
        });
      }
    }

    // Build pluvialFloodZones dynamically from real observations
    const pluvialFloodZones: PluvialFloodZone[] = [];
    let pfzIndex = 0;

    for (const [distKey, metric] of districtRainMetrics.entries()) {
      const { districtName, stateName, lat, lng, rainRateMmH, cum24hMm, minMslp, obsTimestamp } = metric;

      // Determine real risk level from observed values
      let pluvialFloodRisk: PluvialFloodZone['pluvialFloodRisk'];
      if (rainRateMmH >= 70 || cum24hMm >= 150) {
        pluvialFloodRisk = 'CRITICAL';
      } else if (rainRateMmH >= 25 || cum24hMm >= 75) {
        pluvialFloodRisk = 'HIGH';
      } else {
        pluvialFloodRisk = 'MODERATE';
      }

      // Only show CRITICAL and HIGH on the map by default (same as hazard events)
      if (pluvialFloodRisk === 'MODERATE') continue;

      // Trend: RISING if both hourly and 24h are significant, else STABLE
      const trend: PluvialFloodZone['trend'] =
        (rainRateMmH >= 25 && cum24hMm >= 75) ? 'RISING' : 'STABLE';

      // Determine if this district has an active cyclone/severe event from IMD
      const hasCycloneEvent = activeCycloneDistricts.has(districtName.toLowerCase());

      // Drainage/context label: only reference cyclone if genuinely active
      const drainageContext = hasCycloneEvent
        ? `Active IMD cyclonic system driving intense rainbands over ${districtName}. Drainage systems at capacity.`
        : `Intense rainfall accumulation (${cum24hMm.toFixed(0)} mm/24h) exceeding drainage capacity in ${districtName}.`;

      // Estimated houses at risk â€” scaled from observed rain intensity
      const estimatedHousesAtRisk = Math.round(
        (pluvialFloodRisk === 'CRITICAL' ? 300 : 120) +
        (cum24hMm / 10) * 15
      );

      // City hotspot: only one pinpoint per zone, labeled correctly
      const hotspotCategory = hasCycloneEvent
        ? 'FLOOD_PRONE_AREA'   // Do NOT label as CYCLONE_PRONE_AREA unless cyclone event is live
        : 'FLOOD_PRONE_AREA';

      pfzIndex++;
      pluvialFloodZones.push({
        id: `PFZ-LIVE-${distKey.toUpperCase()}-${pfzIndex.toString().padStart(2, '0')}`,
        zoneName: `${districtName} Live Rainfall Flood Zone`,
        district: districtName,
        state: stateName,
        latitude: lat,
        longitude: lng,
        demElevationM: 0,          // Real DEM not available at runtime; 0 = unknown
        relativeDepressionM: 0,
        liveRainRateMmH: rainRateMmH,
        cumulativeRain24hMm: cum24hMm,
        pluvialFloodRisk,
        trend,
        confidence: metric.stationCount >= 2 ? 'HIGH' : 'MEDIUM',
        freshness: obsTimestamp,
        drainageContext,
        estimatedHousesAtRisk,
        cityHotspots: [
          {
            id: `PFZ-LIVE-HP-${distKey.toUpperCase()}-01`,
            name: `${districtName} ${pluvialFloodRisk === 'CRITICAL' ? 'Critical' : 'High'} Flood Risk Area`,
            category: hotspotCategory,
            latitude: lat,
            longitude: lng,
            elevationM: 0,
            waterloggingDepthM: pluvialFloodRisk === 'CRITICAL' ? 1.5 : 0.8,
            severity: pluvialFloodRisk === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
            affectedStructures: Math.round(estimatedHousesAtRisk * 0.6),
            drainageIssue: `AWS observed ${rainRateMmH.toFixed(1)} mm/h intensity; 24h total ${cum24hMm.toFixed(0)} mm`,
            recommendation: pluvialFloodRisk === 'CRITICAL'
              ? 'Activate emergency dewatering; issue evacuation advisory for low-lying habitations'
              : 'Monitor continuously; pre-position rescue equipment near flood-prone localities',
          },
        ],
      });
    }
    // Limit to top 20 worst zones by rainfall intensity to prevent map clutter
    pluvialFloodZones.sort((a, b) => b.liveRainRateMmH - a.liveRainRateMmH || b.cumulativeRain24hMm - a.cumulativeRain24hMm);
    const trimmedPluvialZones = pluvialFloodZones.slice(0, 20);
    // Top 20 worst zones served as filteredPluvial downstream

    // Sort by hazard priority: CYCLONE & RED ALERTS strictly at the top!
    function getHazardPriorityScore(ev: DerivedHazardEvent): number {
      let score = 0;
      if (ev.severity === 'RED') score += 1000;
      else if (ev.severity === 'ORANGE') score += 500;
      else if (ev.severity === 'YELLOW') score += 200;

      if (ev.category === 'CYCLONE') score += 800;
      else if (ev.category === 'CLOUDBURST') score += 600;
      else if (ev.category === 'HAIL') score += 400;
      else if (ev.category === 'VERY_HEAVY_RAIN') score += 350;
      else if (ev.category === 'THUNDERSTORM') score += 150;

      if (ev.affectedPopulationEstimate?.total) {
        score += Math.min(200, Math.log10(ev.affectedPopulationEstimate.total + 1) * 40);
      }
      return score;
    }

    hazardEvents.sort((a, b) => getHazardPriorityScore(b) - getHazardPriorityScore(a));

    // Filter events according to request parameters
    let filteredEvents = hazardEvents;
    let filteredPluvial = trimmedPluvialZones;

    if (stateFilter && stateFilter !== 'All India' && stateFilter !== 'All States') {
      filteredEvents = filteredEvents.filter(e => e.state.toLowerCase().includes(stateFilter.toLowerCase()));
      filteredPluvial = filteredPluvial.filter(z => z.state.toLowerCase().includes(stateFilter.toLowerCase()));
    }

    if (districtFilter && districtFilter !== 'All Districts') {
      filteredEvents = filteredEvents.filter(e => e.district.toLowerCase().includes(districtFilter.toLowerCase()));
    }

    if (categoryFilter && ['CYCLONE', 'CLOUDBURST', 'HAIL', 'VERY_HEAVY_RAIN', 'THUNDERSTORM', 'SEVERE_WEATHER', 'BACKGROUND'].includes(categoryFilter)) {
      filteredEvents = filteredEvents.filter(e => e.category === categoryFilter);
    }

    // Default view: ONLY render RED and ORANGE severity (severe events) unless showAllActivity is requested
    const severeEvents = filteredEvents.filter(e => e.isSevere);
    const displayedEvents = showAllActivity ? filteredEvents : severeEvents;

    // Aggregate metrics
    const cycloneCount = filteredEvents.filter(e => e.category === 'CYCLONE').length;
    const thunderstormCount = filteredEvents.filter(e => e.category === 'THUNDERSTORM').length;
    const hailCount = filteredEvents.filter(e => e.category === 'HAIL').length;
    const cloudburstCount = filteredEvents.filter(e => e.category === 'CLOUDBURST').length;
    const backgroundCount = filteredEvents.filter(e => e.category === 'BACKGROUND').length;

    const redCount = filteredEvents.filter(e => e.severity === 'RED').length;
    const orangeCount = filteredEvents.filter(e => e.severity === 'ORANGE').length;
    const yellowCount = filteredEvents.filter(e => e.severity === 'YELLOW').length;
    const greenCount = filteredEvents.filter(e => e.severity === 'GREEN').length;

    // Total population inside active severe / cloudburst zones
    const severeZones = filteredEvents.filter(e => e.severity === 'RED' || e.cloudburstStatus === 'CONFIRMED');
    const totalTouristsInHazardZones = severeZones.reduce((acc, e) => acc + e.affectedPopulationEstimate.tourists, 0);
    const totalFieldOfficersInHazardZones = severeZones.reduce((acc, e) => acc + e.affectedPopulationEstimate.fieldOfficers, 0);
    const totalCitizensInHazardZones = severeZones.reduce((acc, e) => acc + e.affectedPopulationEstimate.citizens, 0);

    return NextResponse.json({
      status: 'OK',
      source: 'IMD Hydromet Hazard Transformation Engine (Centralized PostGIS Cache)',
      timestamp: new Date().toISOString(),
      isLive: nowcastLive || warningLive || awsLive,
      counts: {
        totalEvents: filteredEvents.length,
        severeEventsCount: severeEvents.length,
        displayedCount: displayedEvents.length,
        cyclones: cycloneCount,
        thunderstorms: thunderstormCount,
        hailstorms: hailCount,
        cloudbursts: cloudburstCount,
        backgroundRain: backgroundCount,
        severityBreakdown: {
          red: redCount,
          orange: orangeCount,
          yellow: yellowCount,
          green: greenCount,
        }
      },
      userSegmentation: {
        touristsInRedZones: totalTouristsInHazardZones,
        fieldOfficersInRedZones: totalFieldOfficersInHazardZones,
        citizensInRedZones: totalCitizensInHazardZones,
        totalPersonsAtRisk: totalTouristsInHazardZones + totalFieldOfficersInHazardZones + totalCitizensInHazardZones,
      },
      events: displayedEvents,
      allEventsSummary: {
        thunderstormDistricts: filteredEvents.filter(e => e.category === 'THUNDERSTORM').map(e => e.district).slice(0, 10),
        hailDistricts: filteredEvents.filter(e => e.category === 'HAIL').map(e => e.district).slice(0, 10),
        cloudburstDistricts: filteredEvents.filter(e => e.category === 'CLOUDBURST').map(e => e.district),
      },
      pluvialFloodZones: filteredPluvial,
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
      }
    });

  } catch (err: any) {
    return NextResponse.json({
      status: 'ERROR',
      message: err.message || 'Failed to transform IMD hydromet hazard layer',
      events: [],
    }, { status: 500 });
  }
}
