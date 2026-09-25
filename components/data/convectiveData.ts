/**
 * SIH 2026 Problem Statement 26084: Convective-Scale Nowcasting System (0-6 hr)
 * Region: Chennai & North Tamil Nadu Coastal Radar Belt (13.0827°N, 80.2707°E)
 * Coverage: Chennai S-Band, NIOT Pallikaranai X-Band, Sriharikota S-Band, Karaikal S-Band
 */

export interface DwrRadarStation {
  id: string;
  name: string;
  band: 'S-Band' | 'X-Band';
  location: string;
  lat: number;
  lng: number;
  maxRangeKm: number;
  status: 'OPERATIONAL' | 'STANDBY' | 'MAINTENANCE';
  frequencyGhz: number;
  beamWidthDeg: number;
  operator: 'IMD' | 'NIOT' | 'ISRO SDSC';
  lastScanTime: string;
}

export interface ConvectiveStormCell {
  id: string;
  cellCode: string;
  name: string;
  lat: number;
  lng: number;
  maxDbz: number;
  maxReflectivityDbz?: number;
  vilKgM2?: number;
  echoTopKm?: number;
  cellState: 'INITIATING' | 'RAPID_INTENSIFYING' | 'MATURE_SEVERE' | 'DISSIPATING';
  ciStatus: 'TRIGGERED' | 'PRE_CONVECTIVE' | 'NON_CI';
  cloudTopTempC: number;
  coolingRateK15min: number; // Cloud-top glaciation proxy (< -8 K / 15 min indicates CI)
  hailProbPercent: number;
  meshHailDiameterMm: number; // Maximum Estimated Size of Hail proxy
  downburstGustKts: number; // Downburst / microburst gust front proxy
  rainRateMmH: number; // Convective precipitation rate
  isCloudburst: boolean; // >= 100 mm/h threshold
  motionSpeedKmh: number;
  motionDirectionDeg: number;
  motionBearingText: string;
  targetImpactZone: string;
  arrivalEtaMinutes: number;
  confidencePercent: number;
  dataFreshnessSec: number;
  source: string;
  trajectoryPoints: [number, number][]; // 0-6h extrapolated trajectory
  diameterKm: number;
  vulnerabilityCount: number; // Exposed terminal / urban population
}

export interface ImdAwsStation {
  id: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
  hourlyRainMm: number;
  instantRateMmH: number;
  tempC: number;
  humidityPercent: number;
  pressureHpa: number;
  windSpeedKts: number;
  windGustKts: number;
  isSpikeDetected: boolean;
  lastUpdated: string;
}

export interface AviationImpactProfile {
  icao: string;
  airportName: string;
  runway: string;
  lat: number;
  lng: number;
  stormArrivalCountdownSec: number;
  microburstRisk: 'CRITICAL' | 'ELEVATED' | 'LOW';
  crosswindGustKts: number;
  lowLevelWindShear: boolean;
  sigmetActive: boolean;
  sigmetText: string;
}

// 1. Authoritative Doppler Weather Radar (DWR) Network in North Tamil Nadu
export const CHENNAI_DWR_NETWORK: DwrRadarStation[] = [
  {
    id: 'DWR-CHN-01',
    name: 'Chennai DWR (S-Band)',
    band: 'S-Band',
    location: 'IMD Meenambakkam / Port Centenary Bldg',
    lat: 13.0827,
    lng: 80.2850,
    maxRangeKm: 250,
    status: 'OPERATIONAL',
    frequencyGhz: 2.8,
    beamWidthDeg: 1.0,
    operator: 'IMD',
    lastScanTime: 'Just now (0.5° Elevation PPI)',
  },
  {
    id: 'DWR-PLK-02',
    name: 'Pallikaranai High-Res DWR (X-Band)',
    band: 'X-Band',
    location: 'NIOT Campus, Pallikaranai Marsh',
    lat: 12.9344,
    lng: 80.2078,
    maxRangeKm: 100,
    status: 'OPERATIONAL',
    frequencyGhz: 9.4,
    beamWidthDeg: 0.9,
    operator: 'NIOT',
    lastScanTime: '1 min ago (Urban Canopy Boundary Scan)',
  },
  {
    id: 'DWR-SHAR-03',
    name: 'Sriharikota DWR (S-Band)',
    band: 'S-Band',
    location: 'ISRO SDSC Spaceport, Sriharikota',
    lat: 13.7200,
    lng: 80.2300,
    maxRangeKm: 250,
    status: 'OPERATIONAL',
    frequencyGhz: 2.9,
    beamWidthDeg: 1.0,
    operator: 'ISRO SDSC',
    lastScanTime: '3 min ago (Northern Flank Backup)',
  },
  {
    id: 'DWR-KKL-04',
    name: 'Karaikal DWR (S-Band)',
    band: 'S-Band',
    location: 'Karaikal Port Coastal Station',
    lat: 10.9254,
    lng: 79.8380,
    maxRangeKm: 250,
    status: 'STANDBY',
    frequencyGhz: 2.8,
    beamWidthDeg: 1.0,
    operator: 'IMD',
    lastScanTime: '5 min ago (Southern Feeder Band Watch)',
  }
];

// 2. Active Convective Storm Cells (Real Backtest / Replay & Simulated Extrapolation)
export const INITIAL_CONVECTIVE_CELLS: ConvectiveStormCell[] = [
  {
    id: 'CELL-TN-01',
    cellCode: 'CC-701A',
    name: 'Sriperumbudur–Meenambakkam Cloudburst Core',
    lat: 12.9800,
    lng: 79.9900,
    maxDbz: 62.4, // Extreme convective precipitation / cloudburst
    cellState: 'MATURE_SEVERE',
    ciStatus: 'TRIGGERED',
    cloudTopTempC: -71.2,
    coolingRateK15min: -14.6, // Rapid glaciation detected via INSAT-3DR TIR-1
    hailProbPercent: 88,
    meshHailDiameterMm: 38.0, // Severe hail proxy
    downburstGustKts: 54.0, // 100 km/h severe microburst gust
    rainRateMmH: 124.0, // CLOUDBURST (>100 mm/h)
    isCloudburst: true,
    motionSpeedKmh: 42.0,
    motionDirectionDeg: 82, // Moving East-Northeast directly toward Chennai Airport
    motionBearingText: 'ENE (82°)',
    targetImpactZone: 'Chennai Airport (MAA) & Tambaram Taluk',
    arrivalEtaMinutes: 24,
    confidencePercent: 94,
    dataFreshnessSec: 42,
    source: 'Chennai S-Band DWR + INSAT-3DR Glaciation Channel',
    diameterKm: 18.5,
    vulnerabilityCount: 1420000,
    trajectoryPoints: [
      [12.9800, 79.9900],
      [12.9910, 80.0600],
      [12.9990, 80.1400], // MAA runway line
      [13.0120, 80.2200],
      [13.0240, 80.3000],
    ],
  },
  {
    id: 'CELL-TN-02',
    cellCode: 'CC-702B',
    name: 'Tiruvallur–Avadi Squall Line Cluster',
    lat: 13.1400,
    lng: 80.0100,
    maxDbz: 54.8,
    cellState: 'RAPID_INTENSIFYING',
    ciStatus: 'TRIGGERED',
    cloudTopTempC: -64.8,
    coolingRateK15min: -10.2,
    hailProbPercent: 62,
    meshHailDiameterMm: 22.0,
    downburstGustKts: 44.0,
    rainRateMmH: 78.0,
    isCloudburst: false,
    motionSpeedKmh: 36.0,
    motionDirectionDeg: 96,
    motionBearingText: 'E (96°)',
    targetImpactZone: 'Ambattur Industrial Hub & Central Chennai',
    arrivalEtaMinutes: 48,
    confidencePercent: 89,
    dataFreshnessSec: 68,
    source: 'Pallikaranai X-Band DWR + IMD AWS Rain Spikes',
    diameterKm: 14.0,
    vulnerabilityCount: 980000,
    trajectoryPoints: [
      [13.1400, 80.0100],
      [13.1350, 80.0800],
      [13.1280, 80.1600],
      [13.1200, 80.2400],
    ],
  },
  {
    id: 'CELL-TN-03',
    cellCode: 'CC-703C',
    name: 'Pulicat Lake–Ennore Maritime Convective Feeder',
    lat: 13.3800,
    lng: 80.2600,
    maxDbz: 48.2,
    cellState: 'INITIATING',
    ciStatus: 'PRE_CONVECTIVE',
    cloudTopTempC: -52.4,
    coolingRateK15min: -8.8,
    hailProbPercent: 28,
    meshHailDiameterMm: 12.0,
    downburstGustKts: 32.0,
    rainRateMmH: 46.0,
    isCloudburst: false,
    motionSpeedKmh: 28.0,
    motionDirectionDeg: 190, // Tracking south along coastline
    motionBearingText: 'S (190°)',
    targetImpactZone: 'Ennore Port & North Chennai Coastal Belt',
    arrivalEtaMinutes: 72,
    confidencePercent: 82,
    dataFreshnessSec: 110,
    source: 'Sriharikota S-Band DWR + MOSDAC TIR-1',
    diameterKm: 11.2,
    vulnerabilityCount: 450000,
    trajectoryPoints: [
      [13.3800, 80.2600],
      [13.3100, 80.2650],
      [13.2400, 80.2700],
      [13.1800, 80.2800],
    ],
  },
  {
    id: 'CELL-TN-04',
    cellCode: 'CC-704D',
    name: 'Kanchipuram Southern Flank Cell',
    lat: 12.8200,
    lng: 79.7100,
    maxDbz: 42.0,
    cellState: 'DISSIPATING',
    ciStatus: 'NON_CI',
    cloudTopTempC: -41.0,
    coolingRateK15min: +2.4, // Warming cloud-top (dissipation)
    hailProbPercent: 12,
    meshHailDiameterMm: 0,
    downburstGustKts: 24.0,
    rainRateMmH: 22.0,
    isCloudburst: false,
    motionSpeedKmh: 31.0,
    motionDirectionDeg: 78,
    motionBearingText: 'ENE (78°)',
    targetImpactZone: 'Chengalpattu & GST Road Corridor',
    arrivalEtaMinutes: 110,
    confidencePercent: 78,
    dataFreshnessSec: 145,
    source: 'Chennai S-Band DWR Semi-Lagrangian Advection',
    diameterKm: 9.5,
    vulnerabilityCount: 310000,
    trajectoryPoints: [
      [12.8200, 79.7100],
      [12.8350, 79.7900],
      [12.8500, 79.8800],
    ],
  }
];

// 3. Ground Automatic Weather Stations (AWS) in Chennai & North TN
export const CHENNAI_AWS_STATIONS: ImdAwsStation[] = [
  {
    id: 'AWS-MAA-01',
    name: 'Meenambakkam Airport AWS',
    district: 'Chennai',
    lat: 12.9820,
    lng: 80.1636,
    hourlyRainMm: 38.4,
    instantRateMmH: 86.0,
    tempC: 26.2,
    humidityPercent: 94,
    pressureHpa: 1004.8,
    windSpeedKts: 22.0,
    windGustKts: 48.0,
    isSpikeDetected: true,
    lastUpdated: '10 min ago (aws.imd.gov.in)',
  },
  {
    id: 'AWS-NGB-02',
    name: 'Nungambakkam Regional Met Center',
    district: 'Chennai',
    lat: 13.0670,
    lng: 80.2370,
    hourlyRainMm: 24.6,
    instantRateMmH: 52.0,
    tempC: 27.0,
    humidityPercent: 91,
    pressureHpa: 1006.1,
    windSpeedKts: 16.0,
    windGustKts: 34.0,
    isSpikeDetected: false,
    lastUpdated: '12 min ago (aws.imd.gov.in)',
  },
  {
    id: 'AWS-ENR-03',
    name: 'Ennore Port Maritime AWS',
    district: 'Tiruvallur',
    lat: 13.2500,
    lng: 80.3200,
    hourlyRainMm: 12.2,
    instantRateMmH: 31.0,
    tempC: 28.1,
    humidityPercent: 88,
    pressureHpa: 1007.4,
    windSpeedKts: 18.0,
    windGustKts: 30.0,
    isSpikeDetected: false,
    lastUpdated: '15 min ago (aws.imd.gov.in)',
  },
  {
    id: 'AWS-TBM-04',
    name: 'Tambaram Airforce Base AWS',
    district: 'Chengalpattu',
    lat: 12.9250,
    lng: 80.1200,
    hourlyRainMm: 46.0,
    instantRateMmH: 98.0,
    tempC: 25.4,
    humidityPercent: 96,
    pressureHpa: 1003.9,
    windSpeedKts: 26.0,
    windGustKts: 52.0,
    isSpikeDetected: true,
    lastUpdated: '8 min ago (aws.imd.gov.in)',
  },
  {
    id: 'AWS-SPB-05',
    name: 'Sriperumbudur Industrial AWS',
    district: 'Kanchipuram',
    lat: 12.9660,
    lng: 79.9400,
    hourlyRainMm: 62.0,
    instantRateMmH: 128.0, // Extreme Cloudburst trigger
    tempC: 24.1,
    humidityPercent: 98,
    pressureHpa: 1002.5,
    windSpeedKts: 31.0,
    windGustKts: 58.0,
    isSpikeDetected: true,
    lastUpdated: '5 min ago (aws.imd.gov.in)',
  }
];

// 4. Named Beneficiary: Chennai International Airport (MAA / VOMM) Profile
export const AVIATION_TERMINAL_PROFILE: AviationImpactProfile = {
  icao: 'VOMM',
  airportName: 'Chennai International Airport (MAA)',
  runway: 'Runway 07/25 (Primary 3,658m) & 12/30 (Secondary)',
  lat: 12.9900,
  lng: 80.1693,
  stormArrivalCountdownSec: 1440, // 24 mins countdown
  microburstRisk: 'CRITICAL',
  crosswindGustKts: 52.0,
  lowLevelWindShear: true,
  sigmetActive: true,
  sigmetText: 'WSIN90 VOMM 231400 SIGMET 02 VALID 231400/231800 VOMM CHENNAI FIR SEV TS OBS AT 1400Z WI N1250 E07955 - N1315 E08020 TOP FL450 MOV ENE 22KT INTSF FCST 1600Z WI RUNWAY CORRIDOR',
};

// 5. Historical Backtest Scenarios for SIH Demonstration Replay
export const BACKTEST_SCENARIOS = [
  {
    id: 'DEC_2015_DELUGE',
    title: 'December 1–2, 2015: Historical Chennai Deluge',
    description: 'Catastrophic mesoscale convective cloudburst line dumping 494 mm in 24h over Meenambakkam. pySTEPS optical flow reconstruction.',
    date: '01-12-2015',
    peakRainfallMmH: 148.0,
    peakDbz: 66.0,
    leadTimeHours: 6,
    keyImpact: 'Runway Flooding, Airport Closure, Adyar Basin Surcharge',
  },
  {
    id: 'MAY_2024_SQUALL',
    title: 'May 18, 2024: Pre-Monsoon Severe Squall & Hail',
    description: 'Violent dry-line convective squall with 98 km/h downburst winds, 32 mm hail stones, and rapid cloud-top glaciation.',
    date: '18-05-2024',
    peakRainfallMmH: 84.0,
    peakDbz: 61.2,
    leadTimeHours: 4,
    keyImpact: 'Aviation Go-Arounds, Tree Falls, Power Grid Tripping',
  },
  {
    id: 'LIVE_SYNCHRONOUS',
    title: 'Live Real-Time Mode: MOSDAC + IMD AWS Synchronous',
    description: 'Near-real-time ingestion from MOSDAC INSAT-3DR TIR-1 + IMD AWS station feeds. Gridded 1-3km nowcast.',
    date: 'Current Live Stream',
    peakRainfallMmH: 34.0,
    peakDbz: 46.0,
    leadTimeHours: 2,
    keyImpact: 'Live Operational Surveillance',
  }
];
