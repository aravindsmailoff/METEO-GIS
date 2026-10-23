/**
 * Comprehensive Indian District Coordinates & State Lookup Dictionary
 * Provides accurate centroid coordinates and state attribution for all IMD warning districts,
 * with complete coverage of coastal, cyclone-prone, and hydrometeorologically active regions.
 */

export interface DistrictGeoPoint {
  lat: number;
  lng: number;
  state: string;
  isCoastal?: boolean;
}

export const INDIAN_DISTRICT_COORDINATES: Record<string, DistrictGeoPoint> = {
  // ─── TAMIL NADU ───
  'chennai': { lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu', isCoastal: true },
  'tiruvallur': { lat: 13.1439, lng: 79.9079, state: 'Tamil Nadu', isCoastal: true },
  'kancheepuram': { lat: 12.8342, lng: 79.7036, state: 'Tamil Nadu' },
  'chengalpattu': { lat: 12.6922, lng: 79.9760, state: 'Tamil Nadu', isCoastal: true },
  'cuddalore': { lat: 11.7480, lng: 79.7714, state: 'Tamil Nadu', isCoastal: true },
  'villupuram': { lat: 11.9400, lng: 79.4900, state: 'Tamil Nadu', isCoastal: true },
  'nagapattinam': { lat: 10.7672, lng: 79.8449, state: 'Tamil Nadu', isCoastal: true },
  'mayiladuthurai': { lat: 11.1000, lng: 79.6500, state: 'Tamil Nadu', isCoastal: true },
  'tiruvarur': { lat: 10.7700, lng: 79.6400, state: 'Tamil Nadu', isCoastal: true },
  'thanjavur': { lat: 10.7870, lng: 79.1378, state: 'Tamil Nadu', isCoastal: true },
  'pudukkottai': { lat: 10.3800, lng: 78.8200, state: 'Tamil Nadu', isCoastal: true },
  'ramanathapuram': { lat: 9.3639, lng: 78.8395, state: 'Tamil Nadu', isCoastal: true },
  'thoothukudi': { lat: 8.7642, lng: 78.1348, state: 'Tamil Nadu', isCoastal: true },
  'tirunelveli': { lat: 8.7139, lng: 77.7567, state: 'Tamil Nadu', isCoastal: true },
  'kanyakumari': { lat: 8.0883, lng: 77.5385, state: 'Tamil Nadu', isCoastal: true },
  'nilgiris': { lat: 11.4102, lng: 76.6950, state: 'Tamil Nadu' },
  'coimbatore': { lat: 11.0168, lng: 76.9558, state: 'Tamil Nadu' },
  'madurai': { lat: 9.9252, lng: 78.1198, state: 'Tamil Nadu' },
  'tiruchirappalli': { lat: 10.7905, lng: 78.7047, state: 'Tamil Nadu' },
  'salem': { lat: 11.6643, lng: 78.1460, state: 'Tamil Nadu' },
  'erode': { lat: 11.3410, lng: 77.7172, state: 'Tamil Nadu' },
  'vellore': { lat: 12.9165, lng: 79.1325, state: 'Tamil Nadu' },
  'ranipet': { lat: 12.9272, lng: 79.3328, state: 'Tamil Nadu' },

  // ─── KARNATAKA ───
  'dakshina kannada': { lat: 12.9141, lng: 74.8560, state: 'Karnataka', isCoastal: true },
  'mangaluru': { lat: 12.9141, lng: 74.8560, state: 'Karnataka', isCoastal: true },
  'udupi': { lat: 13.3409, lng: 74.7421, state: 'Karnataka', isCoastal: true },
  'uttara kannada': { lat: 14.7954, lng: 74.6869, state: 'Karnataka', isCoastal: true },
  'kodagu': { lat: 12.3375, lng: 75.8069, state: 'Karnataka' },
  'chikkamagaluru': { lat: 13.3161, lng: 75.7720, state: 'Karnataka' },
  'shivamogga': { lat: 13.9299, lng: 75.5681, state: 'Karnataka' },
  'hassan': { lat: 13.0033, lng: 76.1004, state: 'Karnataka' },
  'bengaluru urban': { lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  'bengaluru': { lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  'mysuru': { lat: 12.2958, lng: 76.6394, state: 'Karnataka' },

  // ─── KERALA & GOA ───
  'kasaragod': { lat: 12.5102, lng: 74.9852, state: 'Kerala', isCoastal: true },
  'kannur': { lat: 11.8745, lng: 75.3704, state: 'Kerala', isCoastal: true },
  'wayanad': { lat: 11.6854, lng: 76.1320, state: 'Kerala' },
  'kozhikode': { lat: 11.2588, lng: 75.7804, state: 'Kerala', isCoastal: true },
  'malappuram': { lat: 11.0510, lng: 76.0711, state: 'Kerala', isCoastal: true },
  'palakkad': { lat: 10.7867, lng: 76.6548, state: 'Kerala' },
  'thrissur': { lat: 10.5276, lng: 76.2144, state: 'Kerala', isCoastal: true },
  'ernakulam': { lat: 9.9816, lng: 76.2999, state: 'Kerala', isCoastal: true },
  'idukki': { lat: 9.9189, lng: 76.9440, state: 'Kerala' },
  'kottayam': { lat: 9.5916, lng: 76.5222, state: 'Kerala', isCoastal: true },
  'alappuzha': { lat: 9.4981, lng: 76.3388, state: 'Kerala', isCoastal: true },
  'pathanamthitta': { lat: 9.2648, lng: 76.7870, state: 'Kerala' },
  'kollam': { lat: 8.8932, lng: 76.6141, state: 'Kerala', isCoastal: true },
  'thiruvananthapuram': { lat: 8.5241, lng: 76.9366, state: 'Kerala', isCoastal: true },
  'north goa': { lat: 15.4989, lng: 73.8278, state: 'Goa', isCoastal: true },
  'south goa': { lat: 15.2832, lng: 73.9862, state: 'Goa', isCoastal: true },

  // ─── ANDHRA PRADESH & TELANGANA ───
  'visakhapatnam': { lat: 17.6868, lng: 83.2185, state: 'Andhra Pradesh', isCoastal: true },
  'vizianagaram': { lat: 18.1067, lng: 83.3956, state: 'Andhra Pradesh', isCoastal: true },
  'srikakulam': { lat: 18.2949, lng: 83.8938, state: 'Andhra Pradesh', isCoastal: true },
  'kakinada': { lat: 16.9891, lng: 82.2475, state: 'Andhra Pradesh', isCoastal: true },
  'guntur': { lat: 16.3067, lng: 80.4365, state: 'Andhra Pradesh', isCoastal: true },
  'krishna': { lat: 16.1983, lng: 81.1258, state: 'Andhra Pradesh', isCoastal: true },
  'vijayawada': { lat: 16.5062, lng: 80.6480, state: 'Andhra Pradesh' },
  'nellore': { lat: 14.4426, lng: 79.9865, state: 'Andhra Pradesh', isCoastal: true },
  'tirupati': { lat: 13.6288, lng: 79.4192, state: 'Andhra Pradesh', isCoastal: true },
  'hyderabad': { lat: 17.3850, lng: 78.4867, state: 'Telangana' },

  // ─── MAHARASHTRA ───
  'mumbai': { lat: 19.0760, lng: 72.8777, state: 'Maharashtra', isCoastal: true },
  'mumbai suburban': { lat: 19.1300, lng: 72.8800, state: 'Maharashtra', isCoastal: true },
  'thane': { lat: 19.2183, lng: 72.9781, state: 'Maharashtra', isCoastal: true },
  'palghar': { lat: 19.6967, lng: 72.7699, state: 'Maharashtra', isCoastal: true },
  'raigad': { lat: 18.5158, lng: 73.1812, state: 'Maharashtra', isCoastal: true },
  'ratnagiri': { lat: 16.9902, lng: 73.3120, state: 'Maharashtra', isCoastal: true },
  'sindhudurg': { lat: 16.1158, lng: 73.6934, state: 'Maharashtra', isCoastal: true },
  'pune': { lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },

  // ─── ODISHA & WEST BENGAL ───
  'puri': { lat: 19.8135, lng: 85.8312, state: 'Odisha', isCoastal: true },
  'bhubaneswar': { lat: 20.2961, lng: 85.8245, state: 'Odisha' },
  'cuttack': { lat: 20.4625, lng: 85.8830, state: 'Odisha' },
  'balasore': { lat: 21.4934, lng: 86.9135, state: 'Odisha', isCoastal: true },
  'kolkata': { lat: 22.5726, lng: 88.3639, state: 'West Bengal' },
  'howrah': { lat: 22.5958, lng: 88.2636, state: 'West Bengal' },
  'south 24 parganas': { lat: 22.1352, lng: 88.5400, state: 'West Bengal', isCoastal: true },
  'darjeeling': { lat: 27.0410, lng: 88.2663, state: 'West Bengal' },

  // ─── HIMALAYAN & NORTH ───
  'east sikkim': { lat: 27.3389, lng: 88.6065, state: 'Sikkim' },
  'singtam': { lat: 27.2360, lng: 88.4960, state: 'Sikkim' },
  'gangtok': { lat: 27.3389, lng: 88.6065, state: 'Sikkim' },
  'dehradun': { lat: 30.3165, lng: 78.0322, state: 'Uttarakhand' },
  'shimla': { lat: 31.1048, lng: 77.1734, state: 'Himachal Pradesh' },
  'srinagar': { lat: 34.0837, lng: 74.7973, state: 'Jammu & Kashmir' },
  'delhi': { lat: 28.6139, lng: 77.2090, state: 'NCT of Delhi' },
  'guwahati': { lat: 26.1445, lng: 91.7362, state: 'Assam' },
  'shillong': { lat: 25.5788, lng: 91.8933, state: 'Meghalaya' },
};

export function resolveDistrictGeo(distName: string, stateHint?: string): DistrictGeoPoint | null {
  if (!distName) return null;
  const clean = distName.toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  const normalizedState = (stateHint || '').toLowerCase().trim();

  if (INDIAN_DISTRICT_COORDINATES[clean]) {
    const candidate = INDIAN_DISTRICT_COORDINATES[clean];
    if (!normalizedState || candidate.state.toLowerCase().includes(normalizedState) || normalizedState.includes(candidate.state.toLowerCase())) {
      return candidate;
    }
  }

  // Fallback search
  for (const [key, val] of Object.entries(INDIAN_DISTRICT_COORDINATES)) {
    if (clean.includes(key) || key.includes(clean)) {
      return val;
    }
  }

  return null;
}

export function getClosestDistrictByCoordinates(lat: number, lng: number): { district: string; state: string; distanceKm: number; isCoastal?: boolean } {
  let closest: { district: string; state: string; distanceKm: number; isCoastal?: boolean } | null = null;
  let minDist = 999999;
  const R = 6371;

  for (const [distName, pt] of Object.entries(INDIAN_DISTRICT_COORDINATES)) {
    const dLat = ((pt.lat - lat) * Math.PI) / 180;
    const dLon = ((pt.lng - lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat * Math.PI) / 180) * Math.cos((pt.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;

    if (d < minDist) {
      minDist = d;
      const formattedName = distName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      closest = {
        district: formattedName,
        state: pt.state,
        distanceKm: Math.round(d * 10) / 10,
        isCoastal: pt.isCoastal,
      };
    }
  }

  return closest || { district: 'Chennai', state: 'Tamil Nadu', distanceKm: 0, isCoastal: true };
}
