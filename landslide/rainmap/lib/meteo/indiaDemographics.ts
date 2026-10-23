/**
 * Comprehensive Census of India & State Demographics Dataset
 */

export interface StateDemographics {
  state: string;
  residentPopulation: number;
  annualTourists: number;
  densityPerSqKm: number;
  literacyRate: number;
  sexRatio: number;
  vulnerablePopulation: number;
  districts?: Record<string, { residentPopulation: number; annualTouristInflow?: number; vulnerableSlopePopulation?: number; densityPerSqKm?: number }>;
}

export const ALL_INDIA_TOTALS: StateDemographics = {
  state: 'All India',
  residentPopulation: 1428627663,
  annualTourists: 1790000000,
  densityPerSqKm: 435,
  literacyRate: 77.7,
  sexRatio: 943,
  vulnerablePopulation: 42800000,
};

export const STATE_DEMOGRAPHICS_REGISTRY: Record<string, StateDemographics> = {
  'All India': ALL_INDIA_TOTALS,
  'Tamil Nadu': {
    state: 'Tamil Nadu',
    residentPopulation: 72147030,
    annualTourists: 142000000,
    densityPerSqKm: 555,
    literacyRate: 80.09,
    sexRatio: 996,
    vulnerablePopulation: 1840000,
    districts: {
      'Chennai': { residentPopulation: 8653521, annualTouristInflow: 28400000, vulnerableSlopePopulation: 420000, densityPerSqKm: 26500 },
      'Kanchipuram': { residentPopulation: 2690897, annualTouristInflow: 8500000, vulnerableSlopePopulation: 120000, densityPerSqKm: 610 },
      'Tiruvallur': { residentPopulation: 3728104, annualTouristInflow: 4200000, vulnerableSlopePopulation: 165000, densityPerSqKm: 1040 },
      'Nilgiris': { residentPopulation: 735394, annualTouristInflow: 12400000, vulnerableSlopePopulation: 285000, densityPerSqKm: 288 },
      'Coimbatore': { residentPopulation: 3458045, annualTouristInflow: 9200000, vulnerableSlopePopulation: 140000, densityPerSqKm: 732 },
    }
  },
  'Chhattisgarh': {
    state: 'Chhattisgarh',
    residentPopulation: 29436231,
    annualTourists: 21000000,
    densityPerSqKm: 217,
    literacyRate: 70.28,
    sexRatio: 991,
    vulnerablePopulation: 980000,
    districts: {
      'Raipur': { residentPopulation: 2160876, annualTouristInflow: 4100000, vulnerableSlopePopulation: 84000, densityPerSqKm: 430 },
      'Bastar': { residentPopulation: 1413199, annualTouristInflow: 1800000, vulnerableSlopePopulation: 162000, densityPerSqKm: 140 },
      'Sukma': { residentPopulation: 250159, annualTouristInflow: 180000, vulnerableSlopePopulation: 48000, densityPerSqKm: 45 },
      'Bilaspur': { residentPopulation: 1961922, annualTouristInflow: 2100000, vulnerableSlopePopulation: 95000, densityPerSqKm: 322 },
    }
  },
  'Kerala': {
    state: 'Kerala',
    residentPopulation: 35699443,
    annualTourists: 19200000,
    densityPerSqKm: 860,
    literacyRate: 94.0,
    sexRatio: 1084,
    vulnerablePopulation: 1480000,
    districts: {
      'Palakkad': { residentPopulation: 2809934, annualTouristInflow: 3100000, vulnerableSlopePopulation: 210000, densityPerSqKm: 627 },
      'Wayanad': { residentPopulation: 817420, annualTouristInflow: 4800000, vulnerableSlopePopulation: 320000, densityPerSqKm: 384 },
      'Thiruvananthapuram': { residentPopulation: 3301427, annualTouristInflow: 5400000, vulnerableSlopePopulation: 110000, densityPerSqKm: 1508 },
    }
  },
  'Maharashtra': {
    state: 'Maharashtra',
    residentPopulation: 123144223,
    annualTourists: 149000000,
    densityPerSqKm: 365,
    literacyRate: 82.34,
    sexRatio: 929,
    vulnerablePopulation: 3600000,
    districts: {
      'Mumbai': { residentPopulation: 12442373, annualTouristInflow: 38000000, vulnerableSlopePopulation: 950000, densityPerSqKm: 20500 },
      'Thane': { residentPopulation: 11060148, annualTouristInflow: 12000000, vulnerableSlopePopulation: 480000, densityPerSqKm: 1157 },
    }
  },
  'Delhi': {
    state: 'Delhi',
    residentPopulation: 19814000,
    annualTourists: 36000000,
    densityPerSqKm: 11320,
    literacyRate: 86.21,
    sexRatio: 868,
    vulnerablePopulation: 580000,
  },
  'Assam': {
    state: 'Assam',
    residentPopulation: 35607039,
    annualTourists: 6800000,
    densityPerSqKm: 398,
    literacyRate: 72.19,
    sexRatio: 958,
    vulnerablePopulation: 2400000,
  },
  'Meghalaya': {
    state: 'Meghalaya',
    residentPopulation: 3366710,
    annualTourists: 1450000,
    densityPerSqKm: 132,
    literacyRate: 74.43,
    sexRatio: 989,
    vulnerablePopulation: 490000,
  },
  'Himachal Pradesh': {
    state: 'Himachal Pradesh',
    residentPopulation: 7451955,
    annualTourists: 16800000,
    densityPerSqKm: 123,
    literacyRate: 82.8,
    sexRatio: 972,
    vulnerablePopulation: 1250000,
  },
  'Uttarakhand': {
    state: 'Uttarakhand',
    residentPopulation: 11256000,
    annualTourists: 38000000,
    densityPerSqKm: 189,
    literacyRate: 78.82,
    sexRatio: 963,
    vulnerablePopulation: 1890000,
  },
  'Sikkim': {
    state: 'Sikkim',
    residentPopulation: 690251,
    annualTourists: 1540000,
    densityPerSqKm: 86,
    literacyRate: 81.42,
    sexRatio: 890,
    vulnerablePopulation: 215000,
  }
};

export function getDemographicsForSelection(stateName?: string, districtName?: string) {
  if (!stateName || stateName === 'All India') {
    return ALL_INDIA_TOTALS;
  }
  const stateRecord = STATE_DEMOGRAPHICS_REGISTRY[stateName];
  if (!stateRecord) return ALL_INDIA_TOTALS;

  if (districtName && stateRecord.districts && stateRecord.districts[districtName]) {
    const dist = stateRecord.districts[districtName];
    return {
      state: `${districtName}, ${stateName}`,
      residentPopulation: dist.residentPopulation || stateRecord.residentPopulation,
      annualTourists: dist.annualTouristInflow || Math.round(stateRecord.annualTourists / 10),
      densityPerSqKm: dist.densityPerSqKm || stateRecord.densityPerSqKm,
      literacyRate: stateRecord.literacyRate,
      sexRatio: stateRecord.sexRatio,
      vulnerablePopulation: dist.vulnerableSlopePopulation || Math.round(stateRecord.vulnerablePopulation / 10),
    };
  }

  return stateRecord;
}
