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
  // ─── ODISHA (Bay of Bengal Cyclone Landfall & Deluge Corridor) ───
  'koraput': { lat: 18.8135, lng: 82.7123, state: 'Odisha' },
  'nabarangapur': { lat: 19.2314, lng: 82.5484, state: 'Odisha' },
  'nabarangpur': { lat: 19.2314, lng: 82.5484, state: 'Odisha' },
  'kalahandi': { lat: 19.9137, lng: 83.1649, state: 'Odisha' },
  'malkangiri': { lat: 18.3436, lng: 81.8974, state: 'Odisha' },
  'rayagada': { lat: 19.1717, lng: 83.4163, state: 'Odisha' },
  'gajapati': { lat: 18.8093, lng: 84.1488, state: 'Odisha', isCoastal: true },
  'gajapathi': { lat: 18.8093, lng: 84.1488, state: 'Odisha', isCoastal: true },
  'ganjam': { lat: 19.3800, lng: 85.0500, state: 'Odisha', isCoastal: true },
  'puri': { lat: 19.8135, lng: 85.8312, state: 'Odisha', isCoastal: true },
  'jagatsinghpur': { lat: 20.2588, lng: 86.1714, state: 'Odisha', isCoastal: true },
  'kendrapara': { lat: 20.5015, lng: 86.4229, state: 'Odisha', isCoastal: true },
  'bhadrak': { lat: 21.0574, lng: 86.4959, state: 'Odisha', isCoastal: true },
  'balasore': { lat: 21.4934, lng: 86.9135, state: 'Odisha', isCoastal: true },
  'baleshwar': { lat: 21.4934, lng: 86.9135, state: 'Odisha', isCoastal: true },
  'cuttack': { lat: 20.4625, lng: 85.8830, state: 'Odisha' },
  'khordha': { lat: 20.1809, lng: 85.6200, state: 'Odisha' },
  'bhubaneswar': { lat: 20.2961, lng: 85.8245, state: 'Odisha' },
  'mayurbhanj': { lat: 21.9284, lng: 86.7369, state: 'Odisha' },
  'kendujhar': { lat: 21.6289, lng: 85.5817, state: 'Odisha' },
  'keonjhar': { lat: 21.6289, lng: 85.5817, state: 'Odisha' },
  'sambalpur': { lat: 21.4669, lng: 83.9812, state: 'Odisha' },
  'bargarh': { lat: 21.3333, lng: 83.6167, state: 'Odisha' },
  'balangir': { lat: 20.7109, lng: 83.4862, state: 'Odisha' },
  'bolangir': { lat: 20.7109, lng: 83.4862, state: 'Odisha' },
  'nuapada': { lat: 20.8354, lng: 82.5298, state: 'Odisha' },
  'kandhamal': { lat: 20.1384, lng: 84.1488, state: 'Odisha' },
  'angul': { lat: 20.8400, lng: 85.1000, state: 'Odisha' },
  'dhenkanal': { lat: 20.6667, lng: 85.6000, state: 'Odisha' },
  'jajpur': { lat: 20.8500, lng: 86.3333, state: 'Odisha' },
  'nayagarh': { lat: 20.1256, lng: 85.1064, state: 'Odisha' },
  'subarnapur': { lat: 20.8384, lng: 83.9168, state: 'Odisha' },
  'sonepur': { lat: 20.8384, lng: 83.9168, state: 'Odisha' },
  'deogarh': { lat: 21.5333, lng: 84.7333, state: 'Odisha' },
  'jharsuguda': { lat: 21.8500, lng: 84.0167, state: 'Odisha' },
  'sundargarh': { lat: 22.1200, lng: 84.0300, state: 'Odisha' },

  // ─── CHHATTISGARH (Bastar & Sabari Cyclonic Depression Basin) ───
  'sukma': { lat: 18.3909, lng: 81.6569, state: 'Chhattisgarh' },
  'bastar': { lat: 19.0925, lng: 81.9610, state: 'Chhattisgarh' },
  'dantewada': { lat: 18.8946, lng: 81.3508, state: 'Chhattisgarh' },
  'dantewara': { lat: 18.8946, lng: 81.3508, state: 'Chhattisgarh' },
  'narayanpur': { lat: 19.7153, lng: 81.2522, state: 'Chhattisgarh' },
  'bijapur': { lat: 18.7964, lng: 80.8169, state: 'Chhattisgarh' },
  'kanker': { lat: 20.2719, lng: 81.4931, state: 'Chhattisgarh' },
  'kondagaon': { lat: 19.6000, lng: 81.6700, state: 'Chhattisgarh' },
  'raipur': { lat: 21.2514, lng: 81.6296, state: 'Chhattisgarh' },
  'durg': { lat: 21.1900, lng: 81.2800, state: 'Chhattisgarh' },
  'bilaspur': { lat: 22.0797, lng: 82.1409, state: 'Chhattisgarh' },
  'korba': { lat: 22.3595, lng: 82.7501, state: 'Chhattisgarh' },
  'raigarh': { lat: 21.8974, lng: 83.3950, state: 'Chhattisgarh' },
  'rajnandgaon': { lat: 21.1000, lng: 81.0300, state: 'Chhattisgarh' },
  'mahasamund': { lat: 21.1100, lng: 82.1000, state: 'Chhattisgarh' },
  'dhamtari': { lat: 20.7100, lng: 81.5500, state: 'Chhattisgarh' },
  'gariaband': { lat: 20.9500, lng: 82.0800, state: 'Chhattisgarh' },
  'balod': { lat: 20.7300, lng: 81.2000, state: 'Chhattisgarh' },
  'bemetara': { lat: 21.7000, lng: 81.5300, state: 'Chhattisgarh' },
  'kabirdham': { lat: 22.0200, lng: 81.2500, state: 'Chhattisgarh' },
  'kawardha': { lat: 22.0200, lng: 81.2500, state: 'Chhattisgarh' },
  'jashpur': { lat: 22.8800, lng: 84.1400, state: 'Chhattisgarh' },
  'surguja': { lat: 23.1200, lng: 83.2000, state: 'Chhattisgarh' },
  'surajpur': { lat: 23.1500, lng: 82.8700, state: 'Chhattisgarh' },
  'balrampur': { lat: 23.6100, lng: 83.6200, state: 'Chhattisgarh' },
  'korea': { lat: 23.2500, lng: 82.5500, state: 'Chhattisgarh' },

  // ─── ANDHRA PRADESH (Coastal Bay of Bengal Cyclone Belt) ───
  'alluri sitharama raju': { lat: 17.8950, lng: 82.3417, state: 'Andhra Pradesh', isCoastal: true },
  'srikakulam': { lat: 18.2949, lng: 83.8938, state: 'Andhra Pradesh', isCoastal: true },
  'vizianagaram': { lat: 18.1067, lng: 83.3956, state: 'Andhra Pradesh', isCoastal: true },
  'visakhapatnam': { lat: 17.6868, lng: 83.2185, state: 'Andhra Pradesh', isCoastal: true },
  'vishakhapatnam': { lat: 17.6868, lng: 83.2185, state: 'Andhra Pradesh', isCoastal: true },
  'anakapalli': { lat: 17.6896, lng: 83.0035, state: 'Andhra Pradesh', isCoastal: true },
  'kakinada': { lat: 16.9891, lng: 82.2475, state: 'Andhra Pradesh', isCoastal: true },
  'konaseema': { lat: 16.5746, lng: 82.0003, state: 'Andhra Pradesh', isCoastal: true },
  'dr. b.r. ambedkar konaseema': { lat: 16.5746, lng: 82.0003, state: 'Andhra Pradesh', isCoastal: true },
  'east godavari': { lat: 17.0005, lng: 81.8040, state: 'Andhra Pradesh', isCoastal: true },
  'west godavari': { lat: 16.7107, lng: 81.0952, state: 'Andhra Pradesh', isCoastal: true },
  'eluru': { lat: 16.7107, lng: 81.0952, state: 'Andhra Pradesh' },
  'krishna': { lat: 16.1983, lng: 81.1258, state: 'Andhra Pradesh', isCoastal: true },
  'ntr': { lat: 16.5062, lng: 80.6480, state: 'Andhra Pradesh' },
  'guntur': { lat: 16.3067, lng: 80.4365, state: 'Andhra Pradesh', isCoastal: true },
  'bapatla': { lat: 15.9042, lng: 80.4678, state: 'Andhra Pradesh', isCoastal: true },
  'palnadu': { lat: 16.2300, lng: 80.0500, state: 'Andhra Pradesh' },
  'prakasam': { lat: 15.5057, lng: 80.0499, state: 'Andhra Pradesh', isCoastal: true },
  'ongole': { lat: 15.5057, lng: 80.0499, state: 'Andhra Pradesh', isCoastal: true },
  'spsr nellore': { lat: 14.4426, lng: 79.9865, state: 'Andhra Pradesh', isCoastal: true },
  'nellore': { lat: 14.4426, lng: 79.9865, state: 'Andhra Pradesh', isCoastal: true },
  'tirupati': { lat: 13.6288, lng: 79.4192, state: 'Andhra Pradesh', isCoastal: true },
  'chittoor': { lat: 13.2172, lng: 79.1003, state: 'Andhra Pradesh' },
  'kadapa': { lat: 14.4673, lng: 78.8242, state: 'Andhra Pradesh' },
  'ysr': { lat: 14.4673, lng: 78.8242, state: 'Andhra Pradesh' },
  'annamayya': { lat: 14.0000, lng: 78.7500, state: 'Andhra Pradesh' },
  'kurnool': { lat: 15.8281, lng: 78.0373, state: 'Andhra Pradesh' },
  'nandyal': { lat: 15.4800, lng: 78.4800, state: 'Andhra Pradesh' },
  'anantapur': { lat: 14.6819, lng: 77.6006, state: 'Andhra Pradesh' },
  'sri sathya sai': { lat: 14.1600, lng: 77.8100, state: 'Andhra Pradesh' },
  'parvathipuram manyam': { lat: 18.7800, lng: 83.4300, state: 'Andhra Pradesh' },

  // ─── WEST BENGAL (Ganga-Brahmaputra Delta & Bay of Bengal Coast) ───
  'south 24 parganas': { lat: 22.1352, lng: 88.5400, state: 'West Bengal', isCoastal: true },
  'north 24 parganas': { lat: 22.7185, lng: 88.4778, state: 'West Bengal', isCoastal: true },
  'east medinipur': { lat: 21.6266, lng: 87.5074, state: 'West Bengal', isCoastal: true },
  'purba medinipur': { lat: 21.6266, lng: 87.5074, state: 'West Bengal', isCoastal: true },
  'paschim medinipur': { lat: 22.4200, lng: 87.3200, state: 'West Bengal' },
  'west medinipur': { lat: 22.4200, lng: 87.3200, state: 'West Bengal' },
  'howrah': { lat: 22.5958, lng: 88.2636, state: 'West Bengal' },
  'hooghly': { lat: 22.9030, lng: 88.3968, state: 'West Bengal' },
  'kolkata': { lat: 22.5726, lng: 88.3639, state: 'West Bengal' },
  'nadia': { lat: 23.4700, lng: 88.5500, state: 'West Bengal' },
  'murshidabad': { lat: 24.1800, lng: 88.2700, state: 'West Bengal' },
  'malda': { lat: 25.0000, lng: 88.1400, state: 'West Bengal' },
  'jalpaiguri': { lat: 26.5172, lng: 88.7328, state: 'West Bengal' },
  'alipurduar': { lat: 26.4900, lng: 89.5200, state: 'West Bengal' },
  'cooch behar': { lat: 26.3200, lng: 89.4500, state: 'West Bengal' },
  'darjeeling': { lat: 27.0410, lng: 88.2663, state: 'West Bengal' },
  'kalimpong': { lat: 27.0667, lng: 88.4667, state: 'West Bengal' },
  'bankura': { lat: 23.2324, lng: 87.0715, state: 'West Bengal' },
  'purulia': { lat: 23.3300, lng: 86.3600, state: 'West Bengal' },
  'jhargram': { lat: 22.4500, lng: 86.9800, state: 'West Bengal' },
  'birbhum': { lat: 23.8400, lng: 87.6100, state: 'West Bengal' },
  'purba bardhaman': { lat: 23.2400, lng: 87.8600, state: 'West Bengal' },
  'paschim bardhaman': { lat: 23.6800, lng: 86.9800, state: 'West Bengal' },

  // ─── TAMIL NADU (Coromandel Coast Cyclone Belt) ───
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

  // ─── GUJARAT (Arabian Sea Cyclone & Rann of Kutch Belt) ───
  'kutch': { lat: 23.7337, lng: 69.8597, state: 'Gujarat', isCoastal: true },
  'kachchh': { lat: 23.7337, lng: 69.8597, state: 'Gujarat', isCoastal: true },
  'jamnagar': { lat: 22.4707, lng: 70.0577, state: 'Gujarat', isCoastal: true },
  'devbhumi dwarka': { lat: 22.2400, lng: 68.9600, state: 'Gujarat', isCoastal: true },
  'dwarka': { lat: 22.2400, lng: 68.9600, state: 'Gujarat', isCoastal: true },
  'porbandar': { lat: 21.6417, lng: 69.6293, state: 'Gujarat', isCoastal: true },
  'junagadh': { lat: 21.5222, lng: 70.4579, state: 'Gujarat', isCoastal: true },
  'gir somnath': { lat: 20.9018, lng: 70.3664, state: 'Gujarat', isCoastal: true },
  'amreli': { lat: 21.6032, lng: 71.2221, state: 'Gujarat', isCoastal: true },
  'bhavnagar': { lat: 21.7645, lng: 72.1519, state: 'Gujarat', isCoastal: true },
  'botad': { lat: 22.1700, lng: 71.6700, state: 'Gujarat' },
  'ahmedabad': { lat: 23.0225, lng: 72.5714, state: 'Gujarat', isCoastal: true },
  'anand': { lat: 22.5600, lng: 72.9500, state: 'Gujarat', isCoastal: true },
  'vadodara': { lat: 22.3072, lng: 73.1812, state: 'Gujarat' },
  'bharuch': { lat: 21.7051, lng: 72.9959, state: 'Gujarat', isCoastal: true },
  'surat': { lat: 21.1702, lng: 72.8311, state: 'Gujarat', isCoastal: true },
  'navsari': { lat: 20.9500, lng: 72.9200, state: 'Gujarat', isCoastal: true },
  'valsad': { lat: 20.5992, lng: 72.9342, state: 'Gujarat', isCoastal: true },
  'morbi': { lat: 22.8200, lng: 70.8300, state: 'Gujarat', isCoastal: true },
  'rajkot': { lat: 22.3039, lng: 70.8022, state: 'Gujarat' },
  'surendranagar': { lat: 22.7200, lng: 71.6300, state: 'Gujarat' },

  // ─── MAHARASHTRA (Konkan Coastal & Western Ghats Belt) ───
  'mumbai': { lat: 19.0760, lng: 72.8777, state: 'Maharashtra', isCoastal: true },
  'mumbai suburban': { lat: 19.1300, lng: 72.8800, state: 'Maharashtra', isCoastal: true },
  'thane': { lat: 19.2183, lng: 72.9781, state: 'Maharashtra', isCoastal: true },
  'palghar': { lat: 19.6967, lng: 72.7699, state: 'Maharashtra', isCoastal: true },
  'raigad': { lat: 18.5158, lng: 73.1812, state: 'Maharashtra', isCoastal: true },
  'ratnagiri': { lat: 16.9902, lng: 73.3120, state: 'Maharashtra', isCoastal: true },
  'sindhudurg': { lat: 16.1158, lng: 73.6934, state: 'Maharashtra', isCoastal: true },
  'pune': { lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
  'satara': { lat: 17.6805, lng: 74.0183, state: 'Maharashtra' },
  'kolhapur': { lat: 16.7050, lng: 74.2433, state: 'Maharashtra' },
  'nashik': { lat: 19.9975, lng: 73.7898, state: 'Maharashtra' },

  // ─── KERALA & GOA (Malabar Coastal & Arabian Sea Belt) ───
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

  // ─── KARNATAKA (Coastal & Ghats) ───
  'uttara kannada': { lat: 14.7954, lng: 74.6869, state: 'Karnataka', isCoastal: true },
  'udupi': { lat: 13.3409, lng: 74.7421, state: 'Karnataka', isCoastal: true },
  'dakshina kannada': { lat: 12.9141, lng: 74.8560, state: 'Karnataka', isCoastal: true },
  'mangaluru': { lat: 12.9141, lng: 74.8560, state: 'Karnataka', isCoastal: true },
  'kodagu': { lat: 12.3375, lng: 75.8069, state: 'Karnataka' },
  'chikkamagaluru': { lat: 13.3161, lng: 75.7720, state: 'Karnataka' },
  'shivamogga': { lat: 13.9299, lng: 75.5681, state: 'Karnataka' },
  'hassan': { lat: 13.0033, lng: 76.1004, state: 'Karnataka' },
  'bengaluru urban': { lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  'bengaluru': { lat: 12.9716, lng: 77.5946, state: 'Karnataka' },

  // ─── NORTHEAST & HIMALAYAN (Monsoon & Cloudburst Belts) ───
  'east khasi hills': { lat: 25.5788, lng: 91.8933, state: 'Meghalaya' },
  'shillong': { lat: 25.5788, lng: 91.8933, state: 'Meghalaya' },
  'sohra': { lat: 25.2700, lng: 91.7300, state: 'Meghalaya' },
  'cherrapunjee': { lat: 25.2700, lng: 91.7300, state: 'Meghalaya' },
  'west khasi hills': { lat: 25.5300, lng: 91.2600, state: 'Meghalaya' },
  'kamrup metropolitan': { lat: 26.1445, lng: 91.7362, state: 'Assam' },
  'guwahati': { lat: 26.1445, lng: 91.7362, state: 'Assam' },
  'cachar': { lat: 24.8333, lng: 92.7789, state: 'Assam' },
  'silchar': { lat: 24.8333, lng: 92.7789, state: 'Assam' },
  'east sikkim': { lat: 27.3389, lng: 88.6065, state: 'Sikkim' },
  'singtam': { lat: 27.2360, lng: 88.4960, state: 'Sikkim' },
  'gangtok': { lat: 27.3389, lng: 88.6065, state: 'Sikkim' },
  'dehradun': { lat: 30.3165, lng: 78.0322, state: 'Uttarakhand' },
  'haridwar': { lat: 29.9457, lng: 78.1642, state: 'Uttarakhand' },
  'nainital': { lat: 29.3803, lng: 79.4636, state: 'Uttarakhand' },
  'rudraprayag': { lat: 30.2844, lng: 78.9811, state: 'Uttarakhand' },
  'chamoli': { lat: 30.4227, lng: 79.3275, state: 'Uttarakhand' },
  'uttarkashi': { lat: 30.7268, lng: 78.4354, state: 'Uttarakhand' },
  'tehri garhwal': { lat: 30.3800, lng: 78.4800, state: 'Uttarakhand' },
  'tehri': { lat: 30.3800, lng: 78.4800, state: 'Uttarakhand' },
  'pauri garhwal': { lat: 30.1500, lng: 78.7800, state: 'Uttarakhand' },
  'pauri': { lat: 30.1500, lng: 78.7800, state: 'Uttarakhand' },
  'bageshwar': { lat: 29.8400, lng: 79.7700, state: 'Uttarakhand' },
  'almora': { lat: 29.5972, lng: 79.6591, state: 'Uttarakhand' },
  'champawat': { lat: 29.3300, lng: 80.1000, state: 'Uttarakhand' },
  'pithoragarh': { lat: 29.5800, lng: 80.2200, state: 'Uttarakhand' },
  'udham singh nagar': { lat: 28.9800, lng: 79.5200, state: 'Uttarakhand' },
  'shimla': { lat: 31.1048, lng: 77.1734, state: 'Himachal Pradesh' },
  'mandi': { lat: 31.7087, lng: 76.9320, state: 'Himachal Pradesh' },
  'kullu': { lat: 31.9579, lng: 77.1095, state: 'Himachal Pradesh' },
  'kangra': { lat: 32.0998, lng: 76.2691, state: 'Himachal Pradesh' },
  'sirmaur': { lat: 30.5500, lng: 77.3000, state: 'Himachal Pradesh' },
  'sirmour': { lat: 30.5500, lng: 77.3000, state: 'Himachal Pradesh' },
  'solan': { lat: 30.9045, lng: 77.0967, state: 'Himachal Pradesh' },
  'chamba': { lat: 32.5534, lng: 76.1258, state: 'Himachal Pradesh' },
  'hamirpur hp': { lat: 31.6800, lng: 76.5200, state: 'Himachal Pradesh' },
  'una': { lat: 31.4685, lng: 76.2708, state: 'Himachal Pradesh' },
  'kinnaur': { lat: 31.6500, lng: 78.4700, state: 'Himachal Pradesh' },
  'lahaul and spiti': { lat: 32.5700, lng: 77.0000, state: 'Himachal Pradesh' },
  'bilaspur hp': { lat: 31.3400, lng: 76.7500, state: 'Himachal Pradesh' },
  'srinagar': { lat: 34.0837, lng: 74.7973, state: 'Jammu & Kashmir' },
  'delhi': { lat: 28.6139, lng: 77.2090, state: 'NCT of Delhi' },
  'vijayapura': { lat: 16.8302, lng: 75.7100, state: 'Karnataka' },
  'bijapur karnataka': { lat: 16.8302, lng: 75.7100, state: 'Karnataka' },
};

/**
 * Resolve district name to normalized GeoPoint
 */
export function resolveDistrictGeo(distName: string, stateHint?: string): DistrictGeoPoint | null {
  if (!distName) return null;
  const clean = distName.toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  const normalizedState = (stateHint || '').toLowerCase().trim();

  // If stateHint is Karnataka and district is Bijapur, prioritize Karnataka coordinates
  if ((clean === 'bijapur' || clean === 'vijayapura') && (normalizedState.includes('karn') || normalizedState.includes('kar'))) {
    return { lat: 16.8302, lng: 75.7100, state: 'Karnataka' };
  }

  // Exact match with matching state if stateHint is provided
  if (INDIAN_DISTRICT_COORDINATES[clean]) {
    const candidate = INDIAN_DISTRICT_COORDINATES[clean];
    if (!normalizedState || candidate.state.toLowerCase().includes(normalizedState) || normalizedState.includes(candidate.state.toLowerCase())) {
      return candidate;
    }
  }

  // Search across dictionary where state matches
  if (normalizedState) {
    for (const [key, val] of Object.entries(INDIAN_DISTRICT_COORDINATES)) {
      if (val.state.toLowerCase().includes(normalizedState) || normalizedState.includes(val.state.toLowerCase())) {
        if (clean === key || key.includes(clean) || clean.includes(key)) {
          return val;
        }
      }
    }
  }

  // Exact match fallback
  if (INDIAN_DISTRICT_COORDINATES[clean]) {
    return INDIAN_DISTRICT_COORDINATES[clean];
  }

  // Without spaces or punctuation
  const stripped = clean.replace(/[^a-z0-9]/g, '');
  for (const [key, val] of Object.entries(INDIAN_DISTRICT_COORDINATES)) {
    if (key.replace(/[^a-z0-9]/g, '') === stripped) {
      return val;
    }
  }

  // Substring match
  for (const [key, val] of Object.entries(INDIAN_DISTRICT_COORDINATES)) {
    if (clean.includes(key) || key.includes(clean)) {
      if (!stateHint || val.state.toLowerCase().includes(stateHint.toLowerCase()) || stateHint.toLowerCase().includes(val.state.toLowerCase())) {
        return val;
      }
    }
  }

  // State-level centroid fallback if district name is not found but state is known
  if (normalizedState) {
    const STATE_CENTROIDS: Record<string, { lat: number; lng: number; state: string }> = {
      'uttarakhand': { lat: 30.0668, lng: 79.0193, state: 'Uttarakhand' },
      'himachal': { lat: 31.1048, lng: 77.1734, state: 'Himachal Pradesh' },
      'karnataka': { lat: 15.3173, lng: 75.7139, state: 'Karnataka' },
      'telangana': { lat: 18.1124, lng: 79.0193, state: 'Telangana' },
      'andhra': { lat: 15.9129, lng: 79.7400, state: 'Andhra Pradesh' },
      'tamil': { lat: 11.1271, lng: 78.6569, state: 'Tamil Nadu' },
      'kerala': { lat: 10.8505, lng: 76.2711, state: 'Kerala' },
      'maharashtra': { lat: 19.7515, lng: 75.7139, state: 'Maharashtra' },
      'madhya': { lat: 22.9734, lng: 78.6569, state: 'Madhya Pradesh' },
      'gujarat': { lat: 22.2587, lng: 71.1924, state: 'Gujarat' },
      'rajasthan': { lat: 27.0238, lng: 74.2179, state: 'Rajasthan' },
      'uttar pradesh': { lat: 26.8467, lng: 80.9462, state: 'Uttar Pradesh' },
      'bihar': { lat: 25.0961, lng: 85.3131, state: 'Bihar' },
      'west bengal': { lat: 22.9868, lng: 87.8550, state: 'West Bengal' },
      'assam': { lat: 26.2006, lng: 92.9376, state: 'Assam' },
      'meghalaya': { lat: 25.4670, lng: 91.3662, state: 'Meghalaya' },
      'odisha': { lat: 20.9517, lng: 85.0985, state: 'Odisha' },
      'chhattisgarh': { lat: 21.2787, lng: 81.8661, state: 'Chhattisgarh' },
      'jammu': { lat: 33.7782, lng: 76.5762, state: 'Jammu & Kashmir' },
      'ladakh': { lat: 34.1526, lng: 77.5771, state: 'Ladakh' },
      'punjab': { lat: 31.1471, lng: 75.3412, state: 'Punjab' },
      'haryana': { lat: 29.0588, lng: 76.0856, state: 'Haryana' },
      'delhi': { lat: 28.6139, lng: 77.2090, state: 'NCT of Delhi' },
      'sikkim': { lat: 27.5330, lng: 88.5122, state: 'Sikkim' },
      'tripura': { lat: 23.9408, lng: 91.9882, state: 'Tripura' },
      'mizoram': { lat: 23.1645, lng: 92.9376, state: 'Mizoram' },
      'manipur': { lat: 24.6637, lng: 93.9063, state: 'Manipur' },
      'nagaland': { lat: 26.1584, lng: 94.5624, state: 'Nagaland' },
      'arunachal': { lat: 28.2180, lng: 94.7278, state: 'Arunachal Pradesh' },
      'goa': { lat: 15.2993, lng: 74.1240, state: 'Goa' },
      'jharkhand': { lat: 23.6102, lng: 85.2799, state: 'Jharkhand' },
    };
    for (const [sKey, sVal] of Object.entries(STATE_CENTROIDS)) {
      if (normalizedState.includes(sKey) || sKey.includes(normalizedState)) {
        return sVal;
      }
    }
  }

  return null;
}

/**
 * Find the geographically closest Indian district and state for any (lat, lng) coordinate
 */
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

  return closest || { district: 'Monitored Sector', state: 'India', distanceKm: 0 };
}

