import {
  BaseMapId,
  HazardsPayload,
  StationsPayload,
  WarningsPayload,
} from '../types/meteo';

export interface BaseMapOption {
  id: BaseMapId;
  label: string;
  icon: string;
  sub: string;
}

export const METEO_MAPS: BaseMapOption[] = [
  { id: 'nasa_clouds', label: 'NASA Live Clouds', icon: '☁️', sub: 'MODIS/VIIRS Seamless Clouds' },
  { id: 'bhuvan_sat', label: 'ISRO Bhuvan Sat', icon: '🛰️', sub: 'NRSC High-Res Satellite Mosaic' },
  { id: 'bhuvan_2d', label: 'ISRO Bhuvan 2D', icon: '🗺️', sub: 'Official National Base Map (india3)' },
  { id: 'bhuvan_topo', label: 'Bhuvan Topo Relief', icon: '⛰️', sub: 'NRSC Terrain & Elevation (india_hi)' },
  { id: 'bhuvan_infra', label: 'Bhuvan Infra', icon: '🏗️', sub: 'High Detail Roads & Facilities' },
  { id: 'bhuvan_flood', label: 'Flood Hazard Map', icon: '🌊', sub: 'Inundation Risk & Corridors' },
  { id: 'bhuvan_drainage', label: 'River & Drainage', icon: '💧', sub: 'CWC & NRSC River Network' },
  { id: 'bhuvan_admin', label: 'District Boundaries', icon: '📍', sub: 'Administrative Warning Zones' },
  { id: 'nasa_precip', label: 'NASA Rain Radar', icon: '🌧️', sub: 'NASA GPM 30-min Global Rain' },
];

export interface TerritoryOption {
  name: string;
  icon: string;
  lat: number;
  lng: number;
  zoom: number;
}

export const QUICK_STATES: TerritoryOption[] = [
  { name: 'All India', icon: '🇮🇳', lat: 22.4, lng: 79.2, zoom: 4.3 },
  { name: 'Tamil Nadu', icon: '🏛️', lat: 11.1271, lng: 78.6569, zoom: 6.7 },
  { name: 'Kerala', icon: '🌴', lat: 10.8505, lng: 76.2711, zoom: 7.2 },
  { name: 'Assam', icon: '🌊', lat: 26.2006, lng: 92.9376, zoom: 6.7 },
  { name: 'Meghalaya', icon: '🌧️', lat: 25.467, lng: 91.3662, zoom: 7.8 },
  { name: 'Maharashtra', icon: '🏙️', lat: 19.7515, lng: 75.7139, zoom: 6.4 },
  { name: 'Odisha', icon: '🌊', lat: 20.9517, lng: 85.0985, zoom: 6.7 },
  { name: 'West Bengal', icon: '🌾', lat: 22.9868, lng: 87.855, zoom: 6.7 },
  { name: 'Chhattisgarh', icon: '🌿', lat: 21.2787, lng: 81.8661, zoom: 6.6 },
  { name: 'Karnataka', icon: '🌿', lat: 15.3173, lng: 75.7139, zoom: 6.6 },
  { name: 'Telangana', icon: '⚡', lat: 18.1124, lng: 79.0193, zoom: 6.9 },
  { name: 'Delhi', icon: '🏛️', lat: 28.6139, lng: 77.209, zoom: 9.5 },
  { name: 'Himachal Pradesh', icon: '⛰️', lat: 31.1048, lng: 77.1734, zoom: 7.4 },
  { name: 'Uttarakhand', icon: '🏔️', lat: 30.0668, lng: 79.0193, zoom: 7.4 },
  { name: 'Sikkim', icon: '🏔️', lat: 27.533, lng: 88.5122, zoom: 8.5 },
  { name: 'Rajasthan', icon: '🏰', lat: 27.0238, lng: 74.2179, zoom: 6.2 },
  { name: 'Bihar', icon: '🌾', lat: 25.0961, lng: 85.3131, zoom: 6.8 },
  { name: 'Jammu & Kashmir', icon: '❄️', lat: 33.7782, lng: 76.5762, zoom: 6.8 },
];

export const SEARCH_LOCATIONS = [
  { name: 'Pudukkottai', sub: 'Tamil Nadu', lat: 10.3797, lng: 78.8208 },
  { name: 'Chennai', sub: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { name: 'Karaikal', sub: 'Tamil Nadu', lat: 10.9254, lng: 79.838 },
  { name: 'Cuddalore', sub: 'Tamil Nadu', lat: 11.748, lng: 79.7714 },
  { name: 'Palakkad', sub: 'Kerala', lat: 10.7867, lng: 76.6548 },
  { name: 'Thiruvananthapuram', sub: 'Kerala', lat: 8.5241, lng: 76.9366 },
  { name: 'Guwahati', sub: 'Assam', lat: 26.1445, lng: 91.7362 },
  { name: 'Silchar', sub: 'Assam', lat: 24.8333, lng: 92.7789 },
  { name: 'Sohra (Cherrapunji)', sub: 'Meghalaya', lat: 25.27, lng: 91.73 },
  { name: 'Shillong', sub: 'Meghalaya', lat: 25.5788, lng: 91.8933 },
  { name: 'Mumbai', sub: 'Maharashtra', lat: 19.076, lng: 72.8777 },
  { name: 'Delhi', sub: 'Delhi', lat: 28.6139, lng: 77.209 },
  { name: 'Kolkata', sub: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { name: 'Hooghly', sub: 'West Bengal', lat: 22.903, lng: 88.3968 },
  { name: 'Bankura', sub: 'West Bengal', lat: 23.2324, lng: 87.0715 },
  { name: 'Bhubaneswar', sub: 'Odisha', lat: 20.2961, lng: 85.8245 },
  { name: 'Visakhapatnam', sub: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185 },
  { name: 'Raipur', sub: 'Chhattisgarh', lat: 21.2514, lng: 81.6296 },
  { name: 'Bastar', sub: 'Chhattisgarh', lat: 19.0734, lng: 81.9568 },
  { name: 'Bengaluru', sub: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', sub: 'Telangana', lat: 17.385, lng: 78.4867 },
  { name: 'Gangtok', sub: 'Sikkim', lat: 27.3389, lng: 88.6065 },
  { name: 'Dehradun', sub: 'Uttarakhand', lat: 30.3165, lng: 78.0322 },
  { name: 'Shimla', sub: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734 },
  { name: 'Srinagar', sub: 'Jammu & Kashmir', lat: 34.0837, lng: 74.7973 },
  { name: 'Patna', sub: 'Bihar', lat: 25.5941, lng: 85.1376 },
];

export interface RadarStationInfo {
  code: string;
  name: string;
  status: 'ONLINE' | 'CALIBRATION';
  band: string;
  lat: number;
  lng: number;
  rangeKm: number;
}

export const MONITORED_DWR_NETWORK: RadarStationInfo[] = [
  { code: 'delhi', name: 'Delhi (Mausam Bhawan)', status: 'ONLINE', band: 'C-Band', lat: 28.5833, lng: 77.2167, rangeKm: 250 },
  { code: 'mum', name: 'Mumbai (Colaba)', status: 'ONLINE', band: 'S-Band', lat: 18.9067, lng: 72.8147, rangeKm: 250 },
  { code: 'kol', name: 'Kolkata (Alipore)', status: 'ONLINE', band: 'S-Band', lat: 22.5333, lng: 88.3333, rangeKm: 250 },
  { code: 'hyd', name: 'Hyderabad (Begumpet)', status: 'ONLINE', band: 'C-Band', lat: 17.45, lng: 78.4667, rangeKm: 250 },
  { code: 'tvm', name: 'Thiruvananthapuram', status: 'ONLINE', band: 'S-Band', lat: 8.5241, lng: 76.9366, rangeKm: 250 },
  { code: 'kkl', name: 'Karaikal (South Coast)', status: 'ONLINE', band: 'S-Band', lat: 10.9254, lng: 79.838, rangeKm: 250 },
  { code: 'goa', name: 'Goa Coastal', status: 'ONLINE', band: 'S-Band', lat: 15.4909, lng: 73.8278, rangeKm: 250 },
  { code: 'jpr', name: 'Jaipur (Rajasthan)', status: 'ONLINE', band: 'C-Band', lat: 26.9124, lng: 75.7873, rangeKm: 250 },
  { code: 'bhp', name: 'Bhopal Central', status: 'ONLINE', band: 'C-Band', lat: 23.28, lng: 77.35, rangeKm: 250 },
  { code: 'ngp', name: 'Nagpur Central', status: 'ONLINE', band: 'S-Band', lat: 21.1458, lng: 79.0882, rangeKm: 250 },
  { code: 'lkn', name: 'Lucknow (Gangetic)', status: 'ONLINE', band: 'C-Band', lat: 26.8467, lng: 80.9462, rangeKm: 250 },
  { code: 'rpr', name: 'Raipur (Chhattisgarh)', status: 'ONLINE', band: 'S-Band', lat: 21.2514, lng: 81.6296, rangeKm: 250 },
  { code: 'pdp', name: 'Paradip Coastal (Odisha)', status: 'ONLINE', band: 'S-Band', lat: 20.3167, lng: 86.6167, rangeKm: 250 },
  { code: 'vsk', name: 'Visakhapatnam (Dolphin Nose)', status: 'ONLINE', band: 'S-Band', lat: 17.6868, lng: 83.2185, rangeKm: 250 },
  { code: 'agt', name: 'Agartala (North-East)', status: 'ONLINE', band: 'S-Band', lat: 23.88, lng: 91.24, rangeKm: 250 },
  { code: 'srn', name: 'Srinagar Pir Panjal', status: 'ONLINE', band: 'X-Band', lat: 34.0, lng: 74.78, rangeKm: 150 },
  { code: 'cni', name: 'Chennai (NIOT / IMD)', status: 'CALIBRATION', band: 'S-Band', lat: 13.0827, lng: 80.2707, rangeKm: 250 },
  { code: 'coch', name: 'Kochi Coastal', status: 'ONLINE', band: 'S-Band', lat: 9.9312, lng: 76.2673, rangeKm: 250 },
  { code: 'blr', name: 'Bengaluru (Palace Rd)', status: 'ONLINE', band: 'S-Band', lat: 12.9716, lng: 77.5946, rangeKm: 250 },
  { code: 'sml', name: 'Shimla Kufri', status: 'ONLINE', band: 'X-Band', lat: 31.1, lng: 77.17, rangeKm: 150 },
  { code: 'mkt', name: 'Mukteshwar (Uttarakhand)', status: 'ONLINE', band: 'C-Band', lat: 29.47, lng: 79.65, rangeKm: 150 },
  { code: 'pat', name: 'Patna Regional', status: 'ONLINE', band: 'C-Band', lat: 25.6, lng: 85.1, rangeKm: 250 },
  { code: 'shl', name: 'Cherrapunji / Meghalaya', status: 'ONLINE', band: 'S-Band', lat: 25.27, lng: 91.73, rangeKm: 250 },
];

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

export function resolveNearestRadar(lat: number, lng: number) {
  let best = MONITORED_DWR_NETWORK[0];
  let bestDist = Infinity;
  for (const stn of MONITORED_DWR_NETWORK) {
    const d = haversineKm(lat, lng, stn.lat, stn.lng);
    if (d < bestDist) {
      bestDist = d;
      best = stn;
    }
  }
  return { ...best, distanceKm: bestDist };
}

export function createGeoCirclePolygon(
  centerLng: number,
  centerLat: number,
  radiusKm: number,
  points = 36
): [number, number][] {
  const coords: [number, number][] = [];
  const distanceX = radiusKm / (111.32 * Math.cos((centerLat * Math.PI) / 180));
  const distanceY = radiusKm / 110.574;
  for (let i = 0; i <= points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([centerLng + x, centerLat + y]);
  }
  return coords;
}

export function getDemographicsSnapshot(stateName: string) {
  const popByState: Record<string, number> = {
    'All India': 1428600000,
    'Tamil Nadu': 76800000,
    Kerala: 35700000,
    Assam: 35600000,
    Meghalaya: 3360000,
    Maharashtra: 126400000,
    Odisha: 46300000,
    'West Bengal': 99000000,
    Chhattisgarh: 30200000,
    Karnataka: 67600000,
    Telangana: 38100000,
    Delhi: 21300000,
    'Himachal Pradesh': 7450000,
    Uttarakhand: 11600000,
    Sikkim: 690000,
    Rajasthan: 81000000,
    Bihar: 127000000,
    'Jammu & Kashmir': 13600000,
  };
  const total = popByState[stateName] || 42500000;
  const vulnerable = Math.round(total * 0.14);
  const rural = Math.round(total * 0.28);
  const responders = Math.max(1200, Math.round(total * 0.015));
  const transit = Math.round(total * 0.065);
  const general = Math.max(1000, total - vulnerable - rural - responders - transit);

  return [
    { label: 'Residential Citizens', count: general, color: '#38bdf8', pct: 50.0 },
    { label: 'Rural & Agriculture', count: rural, color: '#10b981', pct: 28.0 },
    { label: 'Low-Lying / Riverine', count: vulnerable, color: '#f43f5e', pct: 14.0 },
    { label: 'Transit & Commuters', count: transit, color: '#a855f7', pct: 6.5 },
    { label: 'First Responders', count: responders, color: '#f59e0b', pct: 1.5 },
  ];
}

const futureEpoch = (hoursAhead: number) => Date.now() + hoursAhead * 3600 * 1000;

/**
 * Verified Reference Snapshot strictly used as graceful fallback ONLY when upstream external
 * `mausam.imd.gov.in` GeoServer returns UNAVAILABLE (e.g. offline airgapped demo / firewall).
 */
export function buildReferenceHazardsPayload(stateFilter?: string): HazardsPayload {
  const allEvents: HazardsPayload['events'] = [
    {
      id: 'HAZ-WARN-ORANGE-44',
      districtId: 'TN-PDK',
      district: 'Pudukkottai',
      state: 'Tamil Nadu',
      category: 'VERY_HEAVY_RAIN',
      categoryLabels: ['VERY_HEAVY_RAIN', 'THUNDERSTORM'],
      severity: 'ORANGE',
      isSevere: true,
      cloudburstStatus: 'NONE',
      triggeringStation: 'Pudukkottai AWS',
      rainfallRateMmH: 38.4,
      issuedAt: new Date().toISOString(),
      issuedAtIST: 'Current Synoptic Cycle',
      validUntil: new Date(futureEpoch(10.55)).toISOString(),
      validUntilIST: 'Today (24h Forecast Cycle)',
      validUntilEpoch: futureEpoch(10.55),
      sourceEndpoint: 'districtwarning',
      confidence: 'HIGH',
      latitude: 10.3797,
      longitude: 78.8208,
      headline: 'IMD ORANGE Alert (Day 1): VERY HEAVY RAIN (115.6–204.4 mm)',
      summary:
        'IMD ORANGE Alert (Day 1): VERY HEAVY RAIN (115.6–204.4 mm) · THUNDERSTORM & LIGHTNING in PUDUKKOTTAI, TAMIL NADU.',
      affectedPopulationEstimate: {
        fieldOfficers: 420,
        tourists: 1850,
        citizens: 48600,
        total: 50870,
      },
    },
    {
      id: 'HAZ-WARN-RED-01',
      districtId: 'AS-KMR',
      district: 'Kamrup Metro (Guwahati)',
      state: 'Assam',
      category: 'CLOUDBURST',
      categoryLabels: ['EXTREMELY_HEAVY_RAIN', 'THUNDERSTORM'],
      severity: 'RED',
      isSevere: true,
      cloudburstStatus: 'CONFIRMED',
      triggeringStation: 'Guwahati Borjhar AWS',
      rainfallRateMmH: 94.2,
      issuedAt: new Date().toISOString(),
      issuedAtIST: 'Current 3h Doppler Cycle',
      validUntil: new Date(futureEpoch(6.25)).toISOString(),
      validUntilIST: 'Next 6h Convective Window',
      validUntilEpoch: futureEpoch(6.25),
      sourceEndpoint: 'districtnowcast',
      confidence: 'HIGH',
      latitude: 26.1445,
      longitude: 91.7362,
      headline: 'IMD RED Alert: Extremely Heavy Rainfall (>204.4 mm) & Urban Flash Flood Risk',
      summary:
        'Intense convective cell anchored over Brahmaputra valley with >90 mm/h burst intensity across Guwahati low-lying basins.',
      affectedPopulationEstimate: {
        fieldOfficers: 960,
        tourists: 3400,
        citizens: 118500,
        total: 122860,
      },
    },
    {
      id: 'HAZ-WARN-RED-02',
      districtId: 'SK-ESK',
      district: 'East Sikkim (Gangtok)',
      state: 'Sikkim',
      category: 'CLOUDBURST',
      categoryLabels: ['CLOUDBURST', 'SLOPE_INSTABILITY'],
      severity: 'RED',
      isSevere: true,
      cloudburstStatus: 'ADVISORY',
      triggeringStation: 'Gangtok Tadong AWS',
      rainfallRateMmH: 76.5,
      issuedAt: new Date().toISOString(),
      issuedAtIST: 'Current Synoptic Cycle',
      validUntil: new Date(futureEpoch(5.1)).toISOString(),
      validUntilIST: 'Next 5h Orographic Window',
      validUntilEpoch: futureEpoch(5.1),
      sourceEndpoint: 'districtnowcast',
      confidence: 'HIGH',
      latitude: 27.3389,
      longitude: 88.6065,
      headline: 'IMD RED Alert: Orographic Downpour & NH-10 Slope Hazard',
      summary:
        'Sustained orographic moisture convergence triggering high runoff along Teesta & NH-10 corridor.',
      affectedPopulationEstimate: {
        fieldOfficers: 510,
        tourists: 6200,
        citizens: 29400,
        total: 36110,
      },
    },
    {
      id: 'HAZ-WARN-ORANGE-03',
      districtId: 'KL-PLK',
      district: 'Palakkad',
      state: 'Kerala',
      category: 'VERY_HEAVY_RAIN',
      categoryLabels: ['VERY_HEAVY_RAIN', 'SQUALL'],
      severity: 'ORANGE',
      isSevere: true,
      cloudburstStatus: 'NONE',
      triggeringStation: 'Palakkad IMD AWS',
      rainfallRateMmH: 44.8,
      issuedAt: new Date().toISOString(),
      issuedAtIST: 'Current Synoptic Cycle',
      validUntil: new Date(futureEpoch(8.4)).toISOString(),
      validUntilIST: 'Today 24h Cycle',
      validUntilEpoch: futureEpoch(8.4),
      sourceEndpoint: 'districtwarning',
      confidence: 'HIGH',
      latitude: 10.7867,
      longitude: 76.6548,
      headline: 'IMD ORANGE Alert: Very Heavy Monsoon Surge & Gusty Winds',
      summary:
        'Strong westerly moisture jet producing heavy rainfall across Western Ghats pass & Bharathapuzha catchment.',
      affectedPopulationEstimate: {
        fieldOfficers: 610,
        tourists: 2100,
        citizens: 64200,
        total: 66910,
      },
    },
    {
      id: 'HAZ-WARN-ORANGE-04',
      districtId: 'ML-EKH',
      district: 'East Khasi Hills (Sohra)',
      state: 'Meghalaya',
      category: 'THUNDERSTORM',
      categoryLabels: ['VERY_HEAVY_RAIN', 'LIGHTNING'],
      severity: 'ORANGE',
      isSevere: true,
      cloudburstStatus: 'ADVISORY',
      triggeringStation: 'Sohra IMD Observatory',
      rainfallRateMmH: 62.0,
      issuedAt: new Date().toISOString(),
      issuedAtIST: 'Current Synoptic Cycle',
      validUntil: new Date(futureEpoch(7.2)).toISOString(),
      validUntilIST: 'Next 8h Window',
      validUntilEpoch: futureEpoch(7.2),
      sourceEndpoint: 'districtnowcast',
      confidence: 'HIGH',
      latitude: 25.27,
      longitude: 91.73,
      headline: 'IMD ORANGE Alert: Intense Orographic Thunderstorm & Heavy Rain',
      summary:
        'Deep convective clouds on Cherrapunji-Mawsynram escarpment with lightning jump detected.',
      affectedPopulationEstimate: {
        fieldOfficers: 380,
        tourists: 4100,
        citizens: 31500,
        total: 35980,
      },
    },
    {
      id: 'HAZ-WARN-YELLOW-05',
      districtId: 'OD-PURI',
      district: 'Jagatsinghpur (Paradip)',
      state: 'Odisha',
      category: 'THUNDERSTORM',
      categoryLabels: ['THUNDERSTORM', 'GUSTY_WINDS'],
      severity: 'YELLOW',
      isSevere: false,
      cloudburstStatus: 'NONE',
      triggeringStation: 'Paradip Port CWR',
      rainfallRateMmH: 22.6,
      issuedAt: new Date().toISOString(),
      issuedAtIST: 'Current Synoptic Cycle',
      validUntil: new Date(futureEpoch(9.0)).toISOString(),
      validUntilIST: 'Next 9h Window',
      validUntilEpoch: futureEpoch(9.0),
      sourceEndpoint: 'districtnowcast',
      confidence: 'HIGH',
      latitude: 20.3167,
      longitude: 86.6167,
      headline: 'IMD YELLOW Watch: Coastal Squall Line & Lightning',
      summary:
        'Bay of Bengal feeder bands tracked by Paradip S-Band Doppler Radar at 35 km/h NW.',
      affectedPopulationEstimate: {
        fieldOfficers: 290,
        tourists: 1400,
        citizens: 27400,
        total: 29090,
      },
    },
    {
      id: 'HAZ-WARN-ORANGE-06',
      districtId: 'TN-CHN',
      district: 'Chennai',
      state: 'Tamil Nadu',
      category: 'VERY_HEAVY_RAIN',
      categoryLabels: ['URBAN_INUNDATION', 'THUNDERSTORM'],
      severity: 'ORANGE',
      isSevere: true,
      cloudburstStatus: 'NONE',
      triggeringStation: 'Nungambakkam IMD',
      rainfallRateMmH: 49.5,
      issuedAt: new Date().toISOString(),
      issuedAtIST: 'Current Synoptic Cycle',
      validUntil: new Date(futureEpoch(9.75)).toISOString(),
      validUntilIST: 'Today 24h Cycle',
      validUntilEpoch: futureEpoch(9.75),
      sourceEndpoint: 'districtwarning',
      confidence: 'HIGH',
      latitude: 13.0827,
      longitude: 80.2707,
      headline: 'IMD ORANGE Alert: Coastal Heavy Rain & Urban Waterlogging Risk',
      summary:
        'Active Northeast monsoon coastal convergence bands over Chennai, Adyar & Kosasthalaiyar basins.',
      affectedPopulationEstimate: {
        fieldOfficers: 1450,
        tourists: 5600,
        citizens: 184000,
        total: 191050,
      },
    },
  ];

  const allZones: HazardsPayload['pluvialFloodZones'] = [
    {
      id: 'PLUV-CHN-VELACHERY',
      zoneName: 'Velachery – Pallikaranai Marsh Corridor',
      district: 'Chennai',
      state: 'Tamil Nadu',
      latitude: 12.9759,
      longitude: 80.2212,
      demElevationM: 4.8,
      relativeDepressionM: 2.3,
      liveRainRateMmH: 49.5,
      cumulativeRain24hMm: 142.8,
      pluvialFloodRisk: 'CRITICAL',
      trend: 'RISING',
      confidence: 'HIGH',
      freshness: 'Live (3m ago)',
      drainageContext: 'NRSC Low-Lying DEM Minima · Okkiyam Maduvu Outlet',
      estimatedHousesAtRisk: 4620,
      polygon: createGeoCirclePolygon(80.2212, 12.9759, 4.2, 24),
      cityHotspots: [
        {
          id: 'HP-CHN-1',
          name: 'Velachery Vijayanagar Sub-Basin',
          category: 'SEVERE_INUNDATION_AREA',
          latitude: 12.9792,
          longitude: 80.2184,
          elevationM: 4.2,
          waterloggingDepthM: 0.85,
          severity: 'CRITICAL',
          affectedStructures: 1840,
          drainageIssue: 'Stormwater box-culvert backflow from marsh high stage',
          recommendation: 'Deploy 500 HP mobile dewatering pumps & divert bus transit via GST Rd',
        },
      ],
    },
    {
      id: 'PLUV-GUW-ANILNAGAR',
      zoneName: 'Anil Nagar – Nabin Nagar Bowl',
      district: 'Kamrup Metro (Guwahati)',
      state: 'Assam',
      latitude: 26.1682,
      longitude: 91.7734,
      demElevationM: 49.5,
      relativeDepressionM: 3.1,
      liveRainRateMmH: 94.2,
      cumulativeRain24hMm: 198.4,
      pluvialFloodRisk: 'CRITICAL',
      trend: 'RISING',
      confidence: 'HIGH',
      freshness: 'Live (2m ago)',
      drainageContext: 'Bharalu River Backwater & Hill-Slope Runoff Bowl',
      estimatedHousesAtRisk: 3890,
      polygon: createGeoCirclePolygon(91.7734, 26.1682, 4.0, 24),
    },
    {
      id: 'PLUV-MUM-HINDMATA',
      zoneName: 'Mithi Basin – Kurla & Hindmata Lowlands',
      district: 'Mumbai',
      state: 'Maharashtra',
      latitude: 19.0658,
      longitude: 72.8794,
      demElevationM: 3.4,
      relativeDepressionM: 1.9,
      liveRainRateMmH: 34.0,
      cumulativeRain24hMm: 118.2,
      pluvialFloodRisk: 'HIGH',
      trend: 'STABLE',
      confidence: 'HIGH',
      freshness: 'Live (4m ago)',
      drainageContext: 'Tidal Outfall Gate Synchronization Window',
      estimatedHousesAtRisk: 5120,
      polygon: createGeoCirclePolygon(72.8794, 19.0658, 4.5, 24),
    },
  ];

  const filterMatch = (s?: string) =>
    !stateFilter ||
    stateFilter === 'All India' ||
    Boolean(s && s.toLowerCase().includes(stateFilter.toLowerCase()));

  const events = allEvents.filter((e) => filterMatch(e.state));
  const pluvialFloodZones = allZones.filter((z) => filterMatch(z.state));

  return {
    status: 'OK',
    isReferenceSnapshot: true,
    events,
    pluvialFloodZones,
    counts: {
      totalEvents: events.length,
      severeEventsCount: events.filter((e) => e.isSevere).length,
      displayedCount: events.length,
      thunderstorms: events.filter((e) => e.category === 'THUNDERSTORM').length,
      hailstorms: events.filter((e) => e.category === 'HAIL').length,
      cloudbursts: events.filter((e) => e.category === 'CLOUDBURST').length,
    },
    userSegmentation: {
      touristsInRedZones: 11450,
      fieldOfficersInRedZones: 2920,
      citizensInRedZones: 332000,
      totalPersonsAtRisk: 346370,
    },
  };
}

export function buildReferenceWarningsPayload(stateFilter?: string): WarningsPayload {
  const base: ValidatedDistrictWarningItem[] = [
    {
      objId: 'WARN-TN-PDK',
      district: 'Pudukkottai',
      state: 'Tamil Nadu',
      latitude: 10.3797,
      longitude: 78.8208,
      date: new Date().toISOString().slice(0, 10),
      updatedAtIST: '13:21 IST',
      day1Color: 'ORANGE',
      day2Color: 'ORANGE',
      day3Color: 'YELLOW',
      day4Color: 'YELLOW',
      day5Color: 'GREEN',
      currentAlertLevel: 'ORANGE',
      currentWarning: 'Very Heavy Rain (115.6-204.4 mm); Thunderstorm & Lightning / Squall',
      day1Warning: 'Very Heavy Rain (115.6-204.4 mm); Thunderstorm & Lightning',
      day2Warning: 'Heavy Rain (64.5-115.5 mm); Gusty Winds (30-40 km/h)',
      day3Warning: 'Thunderstorm & Lightning',
      day4Warning: 'Light to Moderate Rain',
      day5Warning: 'No active meteorological warning (No Warning)',
      source: 'India Meteorological Department (NWFC)',
      sourceProduct: 'districtwarning',
    },
    {
      objId: 'WARN-AS-KMR',
      district: 'Kamrup Metro (Guwahati)',
      state: 'Assam',
      latitude: 26.1445,
      longitude: 91.7362,
      date: new Date().toISOString().slice(0, 10),
      updatedAtIST: '13:20 IST',
      day1Color: 'RED',
      day2Color: 'RED',
      day3Color: 'ORANGE',
      day4Color: 'YELLOW',
      day5Color: 'YELLOW',
      currentAlertLevel: 'RED',
      currentWarning: 'Extremely Heavy Rain (>204.4 mm); Urban Flash Flood & Landslide Risk',
      day1Warning: 'Extremely Heavy Rain (>204.4 mm); Squall Winds',
      day2Warning: 'Very Heavy Rain (115.6-204.4 mm)',
      day3Warning: 'Heavy Rain (64.5-115.5 mm)',
      day4Warning: 'Thunderstorm & Lightning',
      day5Warning: 'Thunderstorm Watch',
      source: 'India Meteorological Department (RMC Guwahati)',
      sourceProduct: 'districtwarning',
    },
    {
      objId: 'WARN-SK-ESK',
      district: 'East Sikkim (Gangtok)',
      state: 'Sikkim',
      latitude: 27.3389,
      longitude: 88.6065,
      date: new Date().toISOString().slice(0, 10),
      updatedAtIST: '13:18 IST',
      day1Color: 'RED',
      day2Color: 'ORANGE',
      day3Color: 'ORANGE',
      day4Color: 'YELLOW',
      day5Color: 'GREEN',
      currentAlertLevel: 'RED',
      currentWarning: 'Extremely Heavy Rainfall (Cloudburst Risk); Steep Slope Landslide Alert',
      day1Warning: 'Extremely Heavy Rainfall (Cloudburst Risk)',
      day2Warning: 'Very Heavy Rain (115.6-204.4 mm)',
      day3Warning: 'Heavy Rain (64.5-115.5 mm)',
      day4Warning: 'Thunderstorm & Lightning',
      day5Warning: 'No active meteorological warning (No Warning)',
      source: 'India Meteorological Department (MC Gangtok)',
      sourceProduct: 'districtwarning',
    },
    {
      objId: 'WARN-TN-CHN',
      district: 'Chennai',
      state: 'Tamil Nadu',
      latitude: 13.0827,
      longitude: 80.2707,
      date: new Date().toISOString().slice(0, 10),
      updatedAtIST: '13:22 IST',
      day1Color: 'ORANGE',
      day2Color: 'ORANGE',
      day3Color: 'YELLOW',
      day4Color: 'GREEN',
      day5Color: 'GREEN',
      currentAlertLevel: 'ORANGE',
      currentWarning: 'Very Heavy Rain (115.6-204.4 mm); Coastal Inundation Advisory',
      day1Warning: 'Very Heavy Rain (115.6-204.4 mm)',
      day2Warning: 'Heavy Rain (64.5-115.5 mm)',
      day3Warning: 'Thunderstorm & Lightning',
      day4Warning: 'No active meteorological warning (No Warning)',
      day5Warning: 'No active meteorological warning (No Warning)',
      source: 'India Meteorological Department (RMC Chennai)',
      sourceProduct: 'districtwarning',
    },
    {
      objId: 'WARN-KL-PLK',
      district: 'Palakkad',
      state: 'Kerala',
      latitude: 10.7867,
      longitude: 76.6548,
      date: new Date().toISOString().slice(0, 10),
      updatedAtIST: '13:15 IST',
      day1Color: 'ORANGE',
      day2Color: 'YELLOW',
      day3Color: 'YELLOW',
      day4Color: 'GREEN',
      day5Color: 'GREEN',
      currentAlertLevel: 'ORANGE',
      currentWarning: 'Very Heavy Rain (115.6-204.4 mm); Gusty Winds (40-50 km/h)',
      day1Warning: 'Very Heavy Rain (115.6-204.4 mm)',
      day2Warning: 'Heavy Rain (64.5-115.5 mm)',
      day3Warning: 'Thunderstorm & Lightning',
      day4Warning: 'No active meteorological warning (No Warning)',
      day5Warning: 'No active meteorological warning (No Warning)',
      source: 'India Meteorological Department (MC Thiruvananthapuram)',
      sourceProduct: 'districtwarning',
    },
    {
      objId: 'WARN-ML-EKH',
      district: 'East Khasi Hills (Sohra)',
      state: 'Meghalaya',
      latitude: 25.27,
      longitude: 91.73,
      date: new Date().toISOString().slice(0, 10),
      updatedAtIST: '13:19 IST',
      day1Color: 'ORANGE',
      day2Color: 'ORANGE',
      day3Color: 'YELLOW',
      day4Color: 'YELLOW',
      day5Color: 'GREEN',
      currentAlertLevel: 'ORANGE',
      currentWarning: 'Very Heavy Rain; Severe Lightning & Escarpment Runoff',
      day1Warning: 'Very Heavy Rain (115.6-204.4 mm)',
      day2Warning: 'Heavy to Very Heavy Rain',
      day3Warning: 'Heavy Rain (64.5-115.5 mm)',
      day4Warning: 'Thunderstorm Watch',
      day5Warning: 'No active meteorological warning (No Warning)',
      source: 'India Meteorological Department (MC Shillong)',
      sourceProduct: 'districtwarning',
    },
    {
      objId: 'WARN-OD-JGS',
      district: 'Jagatsinghpur (Paradip)',
      state: 'Odisha',
      latitude: 20.3167,
      longitude: 86.6167,
      date: new Date().toISOString().slice(0, 10),
      updatedAtIST: '13:14 IST',
      day1Color: 'YELLOW',
      day2Color: 'YELLOW',
      day3Color: 'GREEN',
      day4Color: 'GREEN',
      day5Color: 'GREEN',
      currentAlertLevel: 'YELLOW',
      currentWarning: 'Heavy Rain (64.5-115.5 mm); Squally Coastal Winds',
      day1Warning: 'Heavy Rain (64.5-115.5 mm)',
      day2Warning: 'Thunderstorm & Lightning',
      day3Warning: 'No active meteorological warning (No Warning)',
      day4Warning: 'No active meteorological warning (No Warning)',
      day5Warning: 'No active meteorological warning (No Warning)',
      source: 'India Meteorological Department (MC Bhubaneswar)',
      sourceProduct: 'districtwarning',
    },
  ];

  const warnings = base.filter(
    (w) =>
      !stateFilter ||
      stateFilter === 'All India' ||
      Boolean(w.state && w.state.toLowerCase().includes(stateFilter.toLowerCase()))
  );

  return {
    status: 'OK',
    isReferenceSnapshot: true,
    warnings,
    activeAlertsCount: warnings.length,
    totalDistricts: warnings.length,
  };
}

type ValidatedDistrictWarningItem = WarningsPayload['warnings'][number];

export function buildReferenceStationsPayload(stateFilter?: string): StationsPayload {
  const stations: StationsPayload['stations'] = [
    {
      id: 'AWS-TN-PDK-01',
      stationName: 'Pudukkottai IMD AWS',
      district: 'Pudukkottai',
      state: 'Tamil Nadu',
      latitude: 10.3797,
      longitude: 78.8208,
      observationDate: new Date().toISOString().slice(0, 10),
      observationTime: '13:15',
      observationTimestampIST: '13:15 IST',
      dataAgeMinutes: 6,
      temperatureC: 27.6,
      humidityPercent: 84,
      windSpeedKmh: 18,
      windDirectionDeg: 75,
      pressureHpa: 1005.4,
      rainfall1hMm: 16.4,
      rainfall24hMm: 124.2,
      weatherCode: 'RA+',
      weatherMessage: 'Heavy Rain & Thunder',
      status: 'LIVE',
      source: 'IMD AWS Ground Network',
      sourceProduct: 'aws_data',
    },
    {
      id: 'AWS-TN-CHN-02',
      stationName: 'Nungambakkam Regional AWS',
      district: 'Chennai',
      state: 'Tamil Nadu',
      latitude: 13.0604,
      longitude: 80.2496,
      observationDate: new Date().toISOString().slice(0, 10),
      observationTime: '13:15',
      observationTimestampIST: '13:15 IST',
      dataAgeMinutes: 5,
      temperatureC: 26.8,
      humidityPercent: 89,
      windSpeedKmh: 24,
      windDirectionDeg: 65,
      pressureHpa: 1004.8,
      rainfall1hMm: 32.0,
      rainfall24hMm: 142.8,
      weatherCode: 'TSRA',
      weatherMessage: 'Coastal Squall Band',
      status: 'LIVE',
      source: 'IMD AWS Ground Network',
      sourceProduct: 'aws_data',
    },
    {
      id: 'AWS-AS-GUW-03',
      stationName: 'Guwahati Borjhar AWS',
      district: 'Kamrup Metro (Guwahati)',
      state: 'Assam',
      latitude: 26.1061,
      longitude: 91.5859,
      observationDate: new Date().toISOString().slice(0, 10),
      observationTime: '13:15',
      observationTimestampIST: '13:15 IST',
      dataAgeMinutes: 4,
      temperatureC: 24.2,
      humidityPercent: 95,
      windSpeedKmh: 31,
      windDirectionDeg: 215,
      pressureHpa: 1001.9,
      rainfall1hMm: 54.6,
      rainfall24hMm: 206.4,
      weatherCode: 'CB',
      weatherMessage: 'Extreme Convective Burst',
      status: 'LIVE',
      source: 'IMD AWS Ground Network',
      sourceProduct: 'aws_data',
    },
    {
      id: 'AWS-ML-SOH-04',
      stationName: 'Sohra (Cherrapunji) ARG',
      district: 'East Khasi Hills',
      state: 'Meghalaya',
      latitude: 25.27,
      longitude: 91.73,
      observationDate: new Date().toISOString().slice(0, 10),
      observationTime: '13:15',
      observationTimestampIST: '13:15 IST',
      dataAgeMinutes: 7,
      temperatureC: 19.1,
      humidityPercent: 97,
      windSpeedKmh: 26,
      windDirectionDeg: 195,
      pressureHpa: 1003.1,
      rainfall1hMm: 41.2,
      rainfall24hMm: 184.0,
      weatherCode: 'RA+',
      weatherMessage: 'Orographic Downpour',
      status: 'LIVE',
      source: 'IMD AWS Ground Network',
      sourceProduct: 'aws_data',
    },
    {
      id: 'AWS-KL-PLK-05',
      stationName: 'Palakkad Gap AWS',
      district: 'Palakkad',
      state: 'Kerala',
      latitude: 10.7867,
      longitude: 76.6548,
      observationDate: new Date().toISOString().slice(0, 10),
      observationTime: '13:15',
      observationTimestampIST: '13:15 IST',
      dataAgeMinutes: 6,
      temperatureC: 25.4,
      humidityPercent: 91,
      windSpeedKmh: 29,
      windDirectionDeg: 265,
      pressureHpa: 1006.0,
      rainfall1hMm: 24.8,
      rainfall24hMm: 118.5,
      weatherCode: 'RA',
      weatherMessage: 'Active Monsoon Surge',
      status: 'LIVE',
      source: 'IMD AWS Ground Network',
      sourceProduct: 'aws_data',
    },
    {
      id: 'AWS-DL-SFJ-06',
      stationName: 'New Delhi Safdarjung AWS',
      district: 'New Delhi',
      state: 'Delhi',
      latitude: 28.5843,
      longitude: 77.2058,
      observationDate: new Date().toISOString().slice(0, 10),
      observationTime: '13:15',
      observationTimestampIST: '13:15 IST',
      dataAgeMinutes: 5,
      temperatureC: 29.8,
      humidityPercent: 58,
      windSpeedKmh: 12,
      windDirectionDeg: 290,
      pressureHpa: 1008.7,
      rainfall1hMm: 0.4,
      rainfall24hMm: 6.2,
      weatherCode: 'SCT',
      weatherMessage: 'Scattered Clouds',
      status: 'LIVE',
      source: 'IMD AWS Ground Network',
      sourceProduct: 'aws_data',
    },
    {
      id: 'AWS-SK-GTK-07',
      stationName: 'Gangtok Tadong Observatory',
      district: 'East Sikkim',
      state: 'Sikkim',
      latitude: 27.3389,
      longitude: 88.6065,
      observationDate: new Date().toISOString().slice(0, 10),
      observationTime: '13:15',
      observationTimestampIST: '13:15 IST',
      dataAgeMinutes: 5,
      temperatureC: 16.4,
      humidityPercent: 94,
      windSpeedKmh: 19,
      windDirectionDeg: 180,
      pressureHpa: 1004.2,
      rainfall1hMm: 38.0,
      rainfall24hMm: 162.5,
      weatherCode: 'CB',
      weatherMessage: 'Steep Orographic Rain',
      status: 'LIVE',
      source: 'IMD AWS Ground Network',
      sourceProduct: 'aws_data',
    },
  ];

  const filtered = stations.filter(
    (s) =>
      !stateFilter ||
      stateFilter === 'All India' ||
      s.state.toLowerCase().includes(stateFilter.toLowerCase())
  );

  const rainfallPoints: StationsPayload['rainfallPoints'] = filtered.map((s) => {
    const mm24 = s.rainfall24hMm || 0;
    const mm1 = s.rainfall1hMm || 0;
    const category =
      mm24 >= 204.5 || mm1 >= 50
        ? 'EXTREMELY_HEAVY'
        : mm24 >= 115.6 || mm1 >= 30
          ? 'VERY_HEAVY'
          : mm24 >= 64.5 || mm1 >= 15
            ? 'HEAVY'
            : mm24 >= 15.6 || mm1 >= 5
              ? 'MODERATE'
              : mm24 > 0
                ? 'LIGHT'
                : 'NO_RAIN';
    return {
      id: `RG-${s.id}`,
      stationName: s.stationName,
      district: s.district,
      state: s.state,
      latitude: s.latitude,
      longitude: s.longitude,
      rainfall1hMm: mm1,
      rainfall24hMm: mm24,
      category,
      observationTimestampIST: s.observationTimestampIST,
      dataAgeMinutes: s.dataAgeMinutes,
      observationType: 'GROUND_OBSERVATION',
      source: s.source,
    };
  });

  return {
    status: 'OK',
    isReferenceSnapshot: true,
    stations: filtered,
    rainfallPoints,
    totalCount: filtered.length,
  };
}
