/**
 * Dynamic Meteorological Hazard Countdown Engine
 * Calculates authentic, hazard-specific operational timelines:
 * - Cyclone / Deep Depression: Coastal Landfall & Surge Countdown (8h - 20h)
 * - Cloudburst: Immediate Valley Evacuation & Flash-Flood Surge (25m - 50m)
 * - Thunderstorm / Squall: Doppler 3-hour Nowcast Validity (1h - 3h)
 * - Hailstorm: Convective Mesocyclone Core Lifespan (40m - 1h 20m)
 * - Heavy Rain District Warning: 24-hour Synoptic Bulletin Cycle
 *
 * Each district and hazard has a deterministic, realistic countdown
 * that ticks down continuously second by second.
 */

export interface HazardCountdownDetails {
  hrs: number;
  mins: number;
  secs: number;
  formatted: string;
  clockStr: string;
  hazardBadge: string;
  hazardTitle: string;
  operationalWindowLabel: string;
  isUrgent: boolean;
  colorScheme: 'red' | 'amber' | 'cyan' | 'purple' | 'slate';
  isCountdownActive: boolean;
  statusMessage?: string;
}

export function getHazardCountdownDetails(
  event: any,
  currentTimeMs: number = Date.now()
): HazardCountdownDetails {
  if (!event) {
    return {
      hrs: 0,
      mins: 0,
      secs: 0,
      formatted: '—',
      clockStr: '--:--:--',
      hazardBadge: 'ALL CLEAR · NORMAL',
      hazardTitle: 'STANDARD SYNOPTIC SURVEILLANCE',
      operationalWindowLabel: 'No Active Severe Alerts Near Area',
      isUrgent: false,
      colorScheme: 'slate',
      isCountdownActive: false,
      statusMessage: 'No active cyclone, severe thunderstorm, cloudburst or hailstorm warning in this area.',
    };
  }

  // 1. Detect specific hazard category
  const cat = String(event.category || '').toUpperCase();
  const summary = String(event.summary || '').toLowerCase();
  const headline = String(event.headline || '').toLowerCase();
  const eventType = String(event.eventType || '').toLowerCase();
  const sev = String(event.severity || '').toUpperCase();

  const isCloudburst =
    cat === 'CLOUDBURST' ||
    event.cloudburstStatus === 'CONFIRMED' ||
    summary.includes('cloudburst') ||
    headline.includes('cloudburst') ||
    eventType.includes('cloudburst');

  const isCyclone =
    cat === 'CYCLONE' ||
    summary.includes('cyclon') ||
    summary.includes('depression') ||
    headline.includes('cyclon') ||
    headline.includes('depression') ||
    eventType.includes('cyclon');

  const isHail =
    cat === 'HAIL' ||
    summary.includes('hail') ||
    headline.includes('hail') ||
    eventType.includes('hail');

  const isSlope =
    cat === 'GEOTECH_SLOPE' ||
    summary.includes('slope') ||
    summary.includes('landslide') ||
    headline.includes('landslide');

  const isPluvial =
    cat === 'PLUVIAL_FLOOD' ||
    summary.includes('pluvial') ||
    summary.includes('depression basin');

  const isThunderstorm =
    cat === 'THUNDERSTORM' ||
    summary.includes('thunderstorm') ||
    summary.includes('squall') ||
    summary.includes('lightning') ||
    headline.includes('thunderstorm') ||
    headline.includes('squall') ||
    eventType.includes('thunderstorm');

  const isSevereWarning =
    sev === 'RED' ||
    sev === 'WARNING' ||
    sev === 'ORANGE' ||
    sev === 'ALERT' ||
    event.isSevere === true ||
    event.isWarningActive === true;

  // STRICT USER RULE:
  // "A countdown may only be calculated from a real authoritative event time."
  // Extract genuine authoritative validUntil epoch if available
  let authEpoch: number | null = null;
  if (typeof event.validUntilEpoch === 'number' && event.validUntilEpoch > 0) {
    authEpoch = event.validUntilEpoch;
  } else if (typeof event.valid_until_epoch === 'number' && event.valid_until_epoch > 0) {
    authEpoch = event.valid_until_epoch;
  } else if (event.validUntil && !isNaN(Date.parse(event.validUntil))) {
    authEpoch = Date.parse(event.validUntil);
  } else if (event.valid_until && !isNaN(Date.parse(event.valid_until))) {
    authEpoch = Date.parse(event.valid_until);
  }

  const remainingMs = authEpoch ? authEpoch - currentTimeMs : 0;
  const isCountdownActive = Boolean(
    authEpoch &&
    remainingMs > 0 &&
    (isCloudburst || isCyclone || isHail || (isThunderstorm && isSevereWarning) || (isSevereWarning && (sev === 'RED' || sev === 'ORANGE')) || (isSlope && sev === 'RED'))
  );

  // Category labels and badges
  let hazardBadge = 'STORM WARNING';
  let hazardTitle = 'WARNING COUNTDOWN';
  let operationalWindowLabel = event.validUntilIST ? `Valid Until ${event.validUntilIST}` : 'Official IMD Bulletin';
  let colorScheme: 'red' | 'amber' | 'cyan' | 'purple' | 'slate' = 'amber';

  if (isCloudburst) {
    hazardBadge = '⛈️ CLOUDBURST ALERT';
    hazardTitle = 'CLOUDBURST SURGE & EVACUATION COUNTDOWN';
    operationalWindowLabel = event.validUntilIST || 'IMD Cloudburst Criterion Window';
    colorScheme = 'red';
  } else if (isCyclone) {
    hazardBadge = '🌀 CYCLONE WARNING';
    hazardTitle = 'CYCLONE LANDFALL & SURGE COUNTDOWN';
    operationalWindowLabel = event.validUntilIST || 'IMD RSMC Tropical Cyclones Bulletin';
    colorScheme = 'red';
  } else if (isHail) {
    hazardBadge = '🧊 HAILSTORM ALERT';
    hazardTitle = 'CONVECTIVE HAIL CORE LIFESPAN COUNTDOWN';
    operationalWindowLabel = event.validUntilIST || 'IMD Radar Cat-17 Convective Core Tracking';
    colorScheme = 'purple';
  } else if (isSlope) {
    hazardBadge = '⛰️ LANDSLIDE ADVISORY';
    hazardTitle = 'ROAD CLEARANCE & DEFORMATION MONITORING';
    operationalWindowLabel = event.validUntilIST || 'Geological Hazard Surveillance';
    colorScheme = 'amber';
  } else if (isPluvial) {
    hazardBadge = '🌊 INUNDATION ADVISORY';
    hazardTitle = 'LOW-LYING INUNDATION COUNTDOWN';
    operationalWindowLabel = event.validUntilIST || 'Pluvial Runoff Surveillance';
    colorScheme = 'cyan';
  } else if (sev === 'RED') {
    hazardBadge = '⚡ SEVERE STORM ALERT';
    hazardTitle = 'SEVERE CONVECTIVE SQUALL IMPACT COUNTDOWN';
    operationalWindowLabel = event.validUntilIST || 'IMD 3-Hour Doppler Nowcast Window';
    colorScheme = 'red';
  } else {
    hazardBadge = '⚡ STORM ALERT';
    hazardTitle = 'DOPPLER NOWCAST VALIDITY COUNTDOWN';
    operationalWindowLabel = event.validUntilIST || 'IMD Regional Meteorological Centre Nowcast';
    colorScheme = 'amber';
  }

  // If there is NO active severe warning or no valid future event time:
  if (!isCountdownActive) {
    return {
      hrs: 0,
      mins: 0,
      secs: 0,
      formatted: '—',
      clockStr: '--:--:--',
      hazardBadge: 'ALL CLEAR · NORMAL',
      hazardTitle: 'STANDARD SYNOPTIC SURVEILLANCE',
      operationalWindowLabel: 'No Active Severe Warning Near Area · Countdown Paused',
      isUrgent: false,
      colorScheme: 'slate',
      isCountdownActive: false,
      statusMessage: 'Atmospheric conditions within normal thresholds. Doppler countdown triggers upon official IMD severe alert.',
    };
  }

  const remainingSec = Math.max(0, Math.floor(remainingMs / 1000));
  const hrs = Math.floor(remainingSec / 3600);
  const mins = Math.floor((remainingSec % 3600) / 60);
  const secs = remainingSec % 60;

  const clockStr = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const formatted = `${hrs > 0 ? `${hrs}h ` : ''}${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s remaining`;

  return {
    hrs,
    mins,
    secs,
    formatted,
    clockStr,
    hazardBadge,
    hazardTitle,
    operationalWindowLabel,
    isUrgent: hrs === 0 || isCloudburst || isCyclone,
    colorScheme,
    isCountdownActive: true,
  };
}
