/**
 * IMD Doppler Weather Radar (DWR) Geographic Resolution Service
 * Computes the nearest operational radar station for any geographic coordinates in India.
 */

export interface RadarStationInfo {
  code: string;
  name: string;
  band: string;
  lat: number;
  lng: number;
  rangeKm: number;
  status: 'ONLINE' | 'CALIBRATION';
}

/**
 * 16 Operational IMD Doppler Weather Radar (DWR) Stations with verified live volumetric streams.
 * Delhi is the central national default.
 */
export const OPERATIONAL_RADAR_STATIONS: RadarStationInfo[] = [
  { code: 'delhi', name: 'Delhi (Mausam Bhawan / Palam)', band: 'C-Band', lat: 28.5833, lng: 77.2167, rangeKm: 250, status: 'ONLINE' },
  { code: 'mum',   name: 'Mumbai (Veravali / Colaba)',    band: 'S-Band', lat: 18.9067, lng: 72.8147, rangeKm: 250, status: 'ONLINE' },
  { code: 'kol',   name: 'Kolkata (Alipore)',             band: 'S-Band', lat: 22.5333, lng: 88.3333, rangeKm: 250, status: 'ONLINE' },
  { code: 'hyd',   name: 'Hyderabad (Begumpet)',          band: 'C-Band', lat: 17.4500, lng: 78.4667, rangeKm: 250, status: 'ONLINE' },
  { code: 'tvm',   name: 'Thiruvananthapuram (Kerala)',   band: 'S-Band', lat: 8.5241,  lng: 76.9366, rangeKm: 250, status: 'ONLINE' },
  { code: 'kkl',   name: 'Karaikal (Tamil Nadu / South)', band: 'S-Band', lat: 10.9254, lng: 79.8380, rangeKm: 250, status: 'ONLINE' },
  { code: 'goa',   name: 'Goa Coastal (Konkan / SW)',     band: 'S-Band', lat: 15.4909, lng: 73.8278, rangeKm: 250, status: 'ONLINE' },
  { code: 'jpr',   name: 'Jaipur (North-West / Desert)',  band: 'C-Band', lat: 26.9124, lng: 75.7873, rangeKm: 250, status: 'ONLINE' },
  { code: 'bhp',   name: 'Bhopal Central (Madhya Pradesh)',band: 'C-Band', lat: 23.2800, lng: 77.3500, rangeKm: 250, status: 'ONLINE' },
  { code: 'ngp',   name: 'Nagpur Central India (Vidarbha)',band: 'S-Band', lat: 21.1458, lng: 79.0882, rangeKm: 250, status: 'ONLINE' },
  { code: 'lkn',   name: 'Lucknow (Central Gangetic)',    band: 'C-Band', lat: 26.8467, lng: 80.9462, rangeKm: 250, status: 'ONLINE' },
  { code: 'rpr',   name: 'Raipur (Central / Bastar)',     band: 'S-Band', lat: 21.2514, lng: 81.6296, rangeKm: 250, status: 'ONLINE' },
  { code: 'pdp',   name: 'Paradip Coastal (Odisha)',      band: 'S-Band', lat: 20.3167, lng: 86.6167, rangeKm: 250, status: 'ONLINE' },
  { code: 'vsk',   name: 'Visakhapatnam (Dolphin Nose)',  band: 'S-Band', lat: 17.6868, lng: 83.2185, rangeKm: 250, status: 'ONLINE' },
  { code: 'cni',   name: 'Chennai (Port Trust / Meenambakkam)', band: 'S-Band', lat: 13.0827, lng: 80.2707, rangeKm: 250, status: 'ONLINE' },
  { code: 'agt',   name: 'Agartala (North-East Sector)',  band: 'S-Band', lat: 23.8800, lng: 91.2400, rangeKm: 250, status: 'ONLINE' },
  { code: 'srn',   name: 'Srinagar (Pir Panjal / J&K)',   band: 'X-Band', lat: 34.0000, lng: 74.7800, rangeKm: 250, status: 'ONLINE' },
];

export function haversineDistKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getNearestRadarStation(
  lat: number,
  lng: number,
  preferOnline: boolean = true,
  state?: string,
  district?: string
): RadarStationInfo {
  // Administrative overrides
  const s = (state || '').toLowerCase();
  const d = (district || '').toLowerCase();

  if (s.includes('chhattisgarh') || d.includes('raipur') || d.includes('bastar') || d.includes('sukma')) {
    const rpr = OPERATIONAL_RADAR_STATIONS.find(x => x.code === 'rpr');
    if (rpr) return rpr;
  }
  if (s.includes('kerala') || d.includes('thiruvananthapuram') || d.includes('palakkad') || d.includes('wayanad')) {
    const tvm = OPERATIONAL_RADAR_STATIONS.find(x => x.code === 'tvm');
    if (tvm) return tvm;
  }
  if (s.includes('delhi') || d.includes('delhi') || s.includes('haryana') || s.includes('punjab')) {
    const del = OPERATIONAL_RADAR_STATIONS.find(x => x.code === 'delhi');
    if (del) return del;
  }
  if (s.includes('tamil nadu') || d.includes('chennai')) {
    const cni = OPERATIONAL_RADAR_STATIONS.find(x => x.code === 'cni') || OPERATIONAL_RADAR_STATIONS.find(x => x.code === 'kkl');
    if (cni) return cni;
  }
  if (s.includes('maharashtra') || d.includes('mumbai') || d.includes('thane')) {
    const mum = OPERATIONAL_RADAR_STATIONS.find(x => x.code === 'mum');
    if (mum) return mum;
  }
  if (s.includes('west bengal') || d.includes('kolkata') || d.includes('hooghly') || d.includes('bankura')) {
    const kol = OPERATIONAL_RADAR_STATIONS.find(x => x.code === 'kol');
    if (kol) return kol;
  }

  // Geodetic search
  let closest: RadarStationInfo = OPERATIONAL_RADAR_STATIONS[0];
  let minDistance = Infinity;

  for (const stn of OPERATIONAL_RADAR_STATIONS) {
    if (preferOnline && stn.status !== 'ONLINE') continue;
    const dist = haversineDistKm(lat, lng, stn.lat, stn.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = stn;
    }
  }

  return closest;
}

export function resolveRadarCodeByName(nameOrCode: string): string {
  const norm = nameOrCode.toLowerCase().trim();
  const direct = OPERATIONAL_RADAR_STATIONS.find(s => s.code.toLowerCase() === norm);
  if (direct) return direct.code;
  const match = OPERATIONAL_RADAR_STATIONS.find(s => s.name.toLowerCase().includes(norm));
  return match ? match.code : 'delhi';
}
