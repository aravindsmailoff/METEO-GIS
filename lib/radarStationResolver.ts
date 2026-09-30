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
 * 16 Operational IMD Doppler Weather Radar (DWR) Stations with verified live volumetric GIF loops.
 * Delhi is the central national default (never falls back to Visakhapatnam).
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

/**
 * Returns the geographically closest or administratively designated Doppler Weather Radar.
 * Prioritizes state/district context and official administrative boundaries before raw Euclidean distance
 * to ensure state radars (e.g. Raipur for Chhattisgarh, Thiruvananthapuram for Kerala) are honored.
 */
export function getNearestRadarStation(
  lat: number,
  lng: number,
  preferOnline: boolean = true,
  stateOrContext?: string
): {
  code: string;
  name: string;
  band: string;
  distKm: number;
  isInRange: boolean;
} {
  const candidates = preferOnline
    ? OPERATIONAL_RADAR_STATIONS.filter(s => s.status === 'ONLINE')
    : OPERATIONAL_RADAR_STATIONS;

  // 1. Context / State override if state or district name is provided:
  if (stateOrContext) {
    const matchedCode = resolveRadarCodeByName(stateOrContext);
    if (matchedCode) {
      const stn = candidates.find(s => s.code === matchedCode);
      if (stn) {
        const d = Math.round(haversineDistKm(lat, lng, stn.lat, stn.lng));
        return {
          code: stn.code,
          name: stn.name,
          band: stn.band,
          distKm: d,
          isInRange: d <= (stn.rangeKm + 100),
        };
      }
    }
  }

  // 2. Geographic State Bounding Box Checks (prevents border distortions and guarantees state alignment):
  // Tamil Nadu territory (Kanyakumari in south 8.0°N to Pulicat/Tiruvallur in north 13.52°N, 76.2°E to 80.4°E):
  if (lat >= 8.0 && lat < 13.52 && lng >= 76.2 && lng <= 80.4) {
    const cni = candidates.find(s => s.code === 'cni');
    if (lat >= 12.4 && cni) {
      const d = Math.round(haversineDistKm(lat, lng, cni.lat, cni.lng));
      return { code: cni.code, name: cni.name, band: cni.band, distKm: d, isInRange: true };
    }
    const kkl = candidates.find(s => s.code === 'kkl') || cni;
    if (kkl) {
      const d = Math.round(haversineDistKm(lat, lng, kkl.lat, kkl.lng));
      return { code: kkl.code, name: kkl.name, band: kkl.band, distKm: d, isInRange: true };
    }
  }

  // Andhra Pradesh territory (Nellore / Sri City in south 13.55°N to Srikakulam in north 19.5°N, 78.5°E to 84.8°E):
  if (lat >= 13.55 && lat <= 19.5 && lng >= 78.5 && lng <= 84.8) {
    const vsk = candidates.find(s => s.code === 'vsk');
    if (vsk) {
      const d = Math.round(haversineDistKm(lat, lng, vsk.lat, vsk.lng));
      return { code: vsk.code, name: vsk.name, band: vsk.band, distKm: d, isInRange: d <= 350 };
    }
  }

  // Chhattisgarh territory (Sukma/Bastar in south 17.6-19.5°N, 80.0-82.2°E; Central/North CG 19.5-24.2°N, 80.0-84.2°E):
  if (
    (lat >= 17.6 && lat <= 19.5 && lng >= 80.0 && lng <= 82.2) ||
    (lat > 19.5 && lat <= 24.2 && lng >= 80.0 && lng <= 84.2)
  ) {
    const rpr = candidates.find(s => s.code === 'rpr');
    if (rpr) {
      const d = Math.round(haversineDistKm(lat, lng, rpr.lat, rpr.lng));
      return {
        code: rpr.code,
        name: rpr.name,
        band: rpr.band,
        distKm: d,
        isInRange: true,
      };
    }
  }

  // Odisha Coastal & Inland territory:
  if (lat >= 19.2 && lat <= 22.5 && lng >= 82.5 && lng <= 87.5) {
    const pdp = candidates.find(s => s.code === 'pdp');
    if (pdp) {
      const d = Math.round(haversineDistKm(lat, lng, pdp.lat, pdp.lng));
      return { code: pdp.code, name: pdp.name, band: pdp.band, distKm: d, isInRange: d <= 350 };
    }
  }

  // Telangana territory:
  if (lat >= 15.8 && lat <= 19.9 && lng >= 77.2 && lng <= 81.3) {
    const hyd = candidates.find(s => s.code === 'hyd');
    if (hyd) {
      const d = Math.round(haversineDistKm(lat, lng, hyd.lat, hyd.lng));
      return { code: hyd.code, name: hyd.name, band: hyd.band, distKm: d, isInRange: d <= 300 };
    }
  }

  // Kerala territory:
  if (lat >= 8.2 && lat <= 12.8 && lng >= 74.8 && lng <= 77.5) {
    const tvm = candidates.find(s => s.code === 'tvm');
    if (tvm) {
      const d = Math.round(haversineDistKm(lat, lng, tvm.lat, tvm.lng));
      return { code: tvm.code, name: tvm.name, band: tvm.band, distKm: d, isInRange: true };
    }
  }

  // Delhi NCR territory:
  if (lat >= 28.2 && lat <= 28.9 && lng >= 76.8 && lng <= 77.5) {
    const del = candidates.find(s => s.code === 'delhi');
    if (del) {
      const d = Math.round(haversineDistKm(lat, lng, del.lat, del.lng));
      return { code: del.code, name: del.name, band: del.band, distKm: d, isInRange: true };
    }
  }

  // 3. Fallback: closest candidate by Haversine distance
  let best = candidates[0]; // Delhi is candidates[0]
  let minDist = 999999;

  for (const stn of candidates) {
    const d = haversineDistKm(lat, lng, stn.lat, stn.lng);
    if (d < minDist) {
      minDist = d;
      best = stn;
    }
  }

  const distKm = Math.round(minDist);
  return {
    code: best.code,
    name: best.name,
    band: best.band,
    distKm,
    isInRange: distKm <= (best.rangeKm + 60),
  };
}

/**
 * Matches a station name, state name, or text query to an authoritative radar station code.
 */
export function resolveRadarCodeByName(nameOrText: string): string {
  const s = (nameOrText || '').toLowerCase();
  // Chhattisgarh (resilient to spelling variations like 'chhatisgarh')
  if (
    s.includes('chhattisgarh') ||
    s.includes('chhatisgarh') ||
    s.includes('cg ') ||
    s.endsWith(' cg') ||
    s === 'cg' ||
    s.includes('raipur') ||
    s.includes('sukma') ||
    s.includes('konta') ||
    s.includes('bastar') ||
    s.includes('dantewada') ||
    s.includes('bilaspur') ||
    s.includes('durg') ||
    s.includes('bhilai') ||
    s.includes('korba') ||
    s.includes('rajnandgaon') ||
    s.includes('jagdalpur')
  ) {
    return 'rpr';
  }

  // Andhra Pradesh & Coastal Sector (Must be checked before 'patna' to prevent 'visakhaPATNAm' substring false-match)
  if (
    s.includes('visakhapatnam') ||
    s.includes('vizag') ||
    s.includes('andhra') ||
    s.includes('machilipatnam') ||
    s.includes('vijayawada') ||
    s.includes('guntur') ||
    s.includes('tirupati') ||
    s.includes('anandapuram') ||
    s.includes('srikakulam') ||
    s.includes('vizianagaram') ||
    s.includes('kakinada')
  ) {
    return 'vsk';
  }

  // Delhi NCR territory
  if (s.includes('delhi') || s.includes('palam') || s.includes('ncr') || s.includes('haryana') || s.includes('punjab') || s.includes('chandigarh')) return 'delhi';
  
  // Western Sector (Mumbai / Pune / Maharashtra)
  if (s.includes('mumbai') || s.includes('colaba') || s.includes('veravali') || s.includes('pune') || s.includes('konkan') || s.includes('maharashtra') || s.includes('thane')) return 'mum';
  
  // Eastern Sector (Kolkata / West Bengal)
  if (s.includes('kolkata') || s.includes('alipore') || s.includes('hooghly') || s.includes('bankura') || s.includes('howrah') || s.includes('west bengal') || s.includes('bengal')) return 'kol';
  
  // Telangana Sector (Hyderabad / Begumpet / Warangal)
  if (s.includes('hyderabad') || s.includes('begumpet') || s.includes('telangana') || s.includes('warangal')) return 'hyd';
  
  // Kerala Sector
  if (s.includes('kerala') || s.includes('palakkad') || s.includes('kochi') || s.includes('ernakulam') || s.includes('idukki') || s.includes('thrissur') || s.includes('thiruvananthapuram') || s.includes('trivandrum') || s.includes('kollam') || s.includes('alappuzha') || s.includes('wayanad') || s.includes('kozhikode')) return 'tvm';
  
  // Tamil Nadu Sector (Chennai / Karaikal)
  if (
    s.includes('chennai') ||
    s.includes('madras') ||
    s.includes('meenambakkam') ||
    s.includes('tiruvallur') ||
    s.includes('kanchipuram') ||
    s.includes('chengalpattu') ||
    s.includes('cni')
  ) {
    return 'cni';
  }
  if (
    s.includes('tamil nadu') ||
    s.includes('karaikal') ||
    s.includes('puducherry') ||
    s.includes('cauvery') ||
    s.includes('nagapattinam') ||
    s.includes('thanjavur') ||
    s.includes('coimbatore') ||
    s.includes('madurai') ||
    s.includes('kkl')
  ) {
    return 'kkl';
  }
  
  // Karnataka / Goa Sector
  if (s.includes('bengaluru') || s.includes('bangalore') || s.includes('karnataka') || s.includes('mysuru') || s.includes('goa') || s.includes('panaji') || s.includes('hubballi')) return 'goa';
  
  // Rajasthan Sector
  if (s.includes('jaipur') || s.includes('rajasthan') || s.includes('jodhpur') || s.includes('udaipur')) return 'jpr';
  
  // Central West (Madhya Pradesh / Gujarat)
  if (s.includes('bhopal') || s.includes('indore') || s.includes('madhya pradesh') || s.includes('gujarat') || s.includes('ahmedabad') || s.includes('surat') || s.includes('rajkot') || s.includes('vadodara') || s.includes('bhuj')) return 'bhp';
  
  // Vidarbha / Central India
  if (s.includes('nagpur') || s.includes('vidarbha') || s.includes('amravati')) return 'ngp';
  
  // Uttar Pradesh & Bihar Sector (Using exact word boundary regex for 'patna' so 'visakhapatnam' is never matched)
  if (
    s.includes('lucknow') ||
    s.includes('uttar pradesh') ||
    s.includes('kanpur') ||
    s.includes('varanasi') ||
    /\bpatna\b/.test(s) ||
    s.includes('bihar') ||
    s.includes('noida')
  ) {
    return 'lkn';
  }
  
  // Odisha Sector
  if (s.includes('odisha') || s.includes('bhubaneswar') || s.includes('cuttack') || s.includes('paradip') || s.includes('puri') || s.includes('rourkela')) return 'pdp';
  
  // North East Sector
  if (s.includes('agartala') || s.includes('tripura') || s.includes('assam') || s.includes('guwahati') || s.includes('silchar') || s.includes('meghalaya') || s.includes('shillong') || s.includes('cherrapunji') || s.includes('sohra') || s.includes('sikkim') || s.includes('gangtok')) return 'agt';
  
  // Northern Himalayan Sector
  if (s.includes('srinagar') || s.includes('kashmir') || s.includes('jammu') || s.includes('ladakh') || s.includes('himachal') || s.includes('shimla') || s.includes('kullu') || s.includes('manali') || s.includes('dharamshala') || s.includes('uttarakhand') || s.includes('dehradun') || s.includes('mukteshwar') || s.includes('nainital')) return 'srn';
  
  return '';
}
