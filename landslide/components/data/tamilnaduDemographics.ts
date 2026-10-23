/**
 * Official Tamil Nadu State Demographics & Tourism Dataset
 * Sources:
 * - Census of India, Office of the Registrar General & Census Commissioner
 * - Department of Economics & Statistics, Government of Tamil Nadu
 * - Department of Tourism, Government of Tamil Nadu (TTDC Annual Statistics)
 */

export interface DistrictDemographics {
  district: string;
  headquarters: string;
  residentPopulation: number; // Census of India
  malePopulation: number;
  femalePopulation: number;
  sexRatio: number; // Females per 1000 males
  literacyRate: number; // %
  areaSqKm: number;
  densityPerSqKm: number;
  annualTouristInflow: number; // TTDC official register
  domesticTourists: number;
  foreignTourists: number;
  peakSeasonMonthlyTourists: number;
  majorTouristHotspots: string[];
  vulnerableSlopePopulation: number; // Vulnerable coastal/pluvial/high-slope population
  vulnerableTouristExposure: number; // Tourists exposed in active hazard corridors
}

export const TAMILNADU_DISTRICT_DEMOGRAPHICS: DistrictDemographics[] = [
  {
    district: 'Chennai',
    headquarters: 'Chennai',
    residentPopulation: 7088403,
    malePopulation: 3588458,
    femalePopulation: 3499945,
    sexRatio: 989,
    literacyRate: 90.18,
    areaSqKm: 426,
    densityPerSqKm: 16639,
    annualTouristInflow: 14200000,
    domesticTourists: 13150000,
    foreignTourists: 1050000,
    peakSeasonMonthlyTourists: 1680000,
    majorTouristHotspots: ['Marina Beach', 'Kapaleeshwarar Temple', 'San Thome Basilica', 'Guindy National Park', 'Besant Nagar Elliot Beach'],
    vulnerableSlopePopulation: 384000,
    vulnerableTouristExposure: 112000,
  },
  {
    district: 'Chengalpattu',
    headquarters: 'Chengalpattu',
    residentPopulation: 2556244,
    malePopulation: 1291880,
    femalePopulation: 1264364,
    sexRatio: 979,
    literacyRate: 84.50,
    areaSqKm: 2945,
    densityPerSqKm: 868,
    annualTouristInflow: 8400000,
    domesticTourists: 7650000,
    foreignTourists: 750000,
    peakSeasonMonthlyTourists: 950000,
    majorTouristHotspots: ['Mahabalipuram UNESCO Shore Temple', 'Covelong (Kovalam) Beach', 'Arignar Anna Zoological Park (Vandalur)', 'Muttukadu Boat House'],
    vulnerableSlopePopulation: 142000,
    vulnerableTouristExposure: 68000,
  },
  {
    district: 'Tiruvallur',
    headquarters: 'Tiruvallur',
    residentPopulation: 3728104,
    malePopulation: 1876062,
    femalePopulation: 1852042,
    sexRatio: 987,
    literacyRate: 84.03,
    areaSqKm: 3422,
    densityPerSqKm: 1089,
    annualTouristInflow: 4100000,
    domesticTourists: 3980000,
    foreignTourists: 120000,
    peakSeasonMonthlyTourists: 480000,
    majorTouristHotspots: ['Pulicat Lake & Bird Sanctuary', 'Poondi Reservoir', 'Tiruttani Murugan Temple', 'Ennore Creek'],
    vulnerableSlopePopulation: 188000,
    vulnerableTouristExposure: 28000,
  },
  {
    district: 'Kanchipuram',
    headquarters: 'Kanchipuram',
    residentPopulation: 1653382,
    malePopulation: 831294,
    femalePopulation: 822088,
    sexRatio: 989,
    literacyRate: 84.49,
    areaSqKm: 1704,
    densityPerSqKm: 970,
    annualTouristInflow: 6200000,
    domesticTourists: 5850000,
    foreignTourists: 350000,
    peakSeasonMonthlyTourists: 720000,
    majorTouristHotspots: ['Ekambareswarar Temple', 'Kanchi Kailasanathar Temple', 'Varadharaja Perumal Temple', 'Vedanthangal Bird Sanctuary'],
    vulnerableSlopePopulation: 94000,
    vulnerableTouristExposure: 42000,
  },
  {
    district: 'The Nilgiris',
    headquarters: 'Udhagamandalam (Ooty)',
    residentPopulation: 735394,
    malePopulation: 360143,
    femalePopulation: 375251,
    sexRatio: 1042,
    literacyRate: 85.20,
    areaSqKm: 2565,
    densityPerSqKm: 288,
    annualTouristInflow: 3850000,
    domesticTourists: 3710000,
    foreignTourists: 140000,
    peakSeasonMonthlyTourists: 580000,
    majorTouristHotspots: ['Ooty Botanical Gardens & Lake', 'Doddabetta Peak', 'Coonoor Sims Park & Dolphin Nose', 'Pykara Waterfalls'],
    vulnerableSlopePopulation: 68400,
    vulnerableTouristExposure: 34200,
  },
  {
    district: 'Coimbatore',
    headquarters: 'Coimbatore',
    residentPopulation: 3458045,
    malePopulation: 1729297,
    femalePopulation: 1728748,
    sexRatio: 1000,
    literacyRate: 83.98,
    areaSqKm: 4723,
    densityPerSqKm: 732,
    annualTouristInflow: 3200000,
    domesticTourists: 3080000,
    foreignTourists: 120000,
    peakSeasonMonthlyTourists: 390000,
    majorTouristHotspots: ['Valparai Ghat & Tea Estates', 'Marudhamalai Temple', 'Siruvani Waterfalls', 'Aliyar Dam & Monkey Falls'],
    vulnerableSlopePopulation: 78000,
    vulnerableTouristExposure: 22000,
  },
  {
    district: 'Cuddalore',
    headquarters: 'Cuddalore',
    residentPopulation: 2605914,
    malePopulation: 1311697,
    femalePopulation: 1294217,
    sexRatio: 987,
    literacyRate: 78.04,
    areaSqKm: 3703,
    densityPerSqKm: 704,
    annualTouristInflow: 2800000,
    domesticTourists: 2740000,
    foreignTourists: 60000,
    peakSeasonMonthlyTourists: 320000,
    majorTouristHotspots: ['Chidambaram Nataraja Temple', 'Pichavaram Mangrove Forest', 'Silver Beach', 'Porto Novo (Parangipettai)'],
    vulnerableSlopePopulation: 165000,
    vulnerableTouristExposure: 24000,
  },
  {
    district: 'Vellore',
    headquarters: 'Vellore',
    residentPopulation: 1614242,
    malePopulation: 802112,
    femalePopulation: 812130,
    sexRatio: 1012,
    literacyRate: 79.17,
    areaSqKm: 2477,
    densityPerSqKm: 652,
    annualTouristInflow: 1900000,
    domesticTourists: 1840000,
    foreignTourists: 60000,
    peakSeasonMonthlyTourists: 220000,
    majorTouristHotspots: ['Vellore Fort & Jalakandeswarar', 'Sripuram Golden Temple', 'Amirthi Zoological Park'],
    vulnerableSlopePopulation: 48000,
    vulnerableTouristExposure: 14000,
  },
];

// Aggregated Official State Summary (Tamil Nadu)
export const TAMILNADU_STATE_TOTALS = {
  totalResidentPopulation: 72147030, // 2011 Census
  projectedCurrentPopulation: 77200000, // 2026 projected
  totalMalePopulation: 36137975,
  totalFemalePopulation: 36009055,
  stateSexRatio: 996,
  stateLiteracyRate: 80.09,
  stateAreaSqKm: 130058,
  stateDensityPerSqKm: 555,
  annualTotalTourists: 44650000, // Official TTDC Register
  annualDomesticTourists: 41200000,
  annualForeignTourists: 3450000,
  totalVulnerableSlopePopulation: 1167400, // Combined Coastal Surge, Lowland Pluvial & Western Ghats Slope Zones
  totalVulnerableTouristExposure: 322400,
};

// Aliases for seamless backward compatibility
export const MEGHALAYA_STATE_TOTALS = TAMILNADU_STATE_TOTALS;
export const MEGHALAYA_DISTRICT_DEMOGRAPHICS = TAMILNADU_DISTRICT_DEMOGRAPHICS;

// Corridor Specific Hazard & Population Exposure
export interface CorridorPopulationData {
  id: string;
  name: string;
  district: string;
  highwayRoute: string;
  permanentResidents: number;
  dailyAvgTourists: number;
  peakMonsoonTourists: number;
  hazardBufferExposedResidents: number;
  hazardBufferExposedTourists: number;
  riskSeverity: 'Critical' | 'High' | 'Moderate';
}

export const TAMILNADU_CORRIDOR_POPULATION_DATA: CorridorPopulationData[] = [
  {
    id: 'CORR-TN-01',
    name: 'Ennore Port–North Chennai Industrial & Coastal Squall Belt',
    district: 'Tiruvallur',
    highwayRoute: 'NH-16 / Ennore Port Expressway',
    permanentResidents: 84600,
    dailyAvgTourists: 8500,
    peakMonsoonTourists: 14000,
    hazardBufferExposedResidents: 14200,
    hazardBufferExposedTourists: 2100,
    riskSeverity: 'Critical',
  },
  {
    id: 'CORR-TN-02',
    name: 'Pallikaranai Marshland–Velachery Urban Pluvial Basin',
    district: 'Chennai',
    highwayRoute: 'OMR IT Expressway / Velachery Main Road',
    permanentResidents: 142000,
    dailyAvgTourists: 38000,
    peakMonsoonTourists: 55000,
    hazardBufferExposedResidents: 28400,
    hazardBufferExposedTourists: 6800,
    riskSeverity: 'Critical',
  },
  {
    id: 'CORR-TN-03',
    name: 'East Coast Road (ECR) Mahabalipuram–Covelong Coastal Surge Belt',
    district: 'Chengalpattu',
    highwayRoute: 'SH-49 East Coast Road (ECR)',
    permanentResidents: 38200,
    dailyAvgTourists: 42000,
    peakMonsoonTourists: 78000,
    hazardBufferExposedResidents: 8600,
    hazardBufferExposedTourists: 18400,
    riskSeverity: 'Critical',
  },
  {
    id: 'CORR-TN-04',
    name: 'Tambaram–Guduvanchery–Chengalpattu GST Severe Convection Corridor',
    district: 'Chengalpattu',
    highwayRoute: 'NH-45 Grand Southern Trunk (GST) Road',
    permanentResidents: 96400,
    dailyAvgTourists: 24500,
    peakMonsoonTourists: 38000,
    hazardBufferExposedResidents: 16500,
    hazardBufferExposedTourists: 4200,
    riskSeverity: 'High',
  },
  {
    id: 'CORR-TN-05',
    name: 'NH-181 Coonoor–Mettupalayam Mountain Ghat Slope & Rain Surge Corridor',
    district: 'The Nilgiris',
    highwayRoute: 'NH-181 Ooty–Mettupalayam Mountain Ghat Road',
    permanentResidents: 24800,
    dailyAvgTourists: 18600,
    peakMonsoonTourists: 34000,
    hazardBufferExposedResidents: 6400,
    hazardBufferExposedTourists: 5200,
    riskSeverity: 'Critical',
  },
  {
    id: 'CORR-TN-06',
    name: 'Pulicat Lagoon–Sriharikota Radar Boundary Inflow Belt',
    district: 'Tiruvallur',
    highwayRoute: 'SH-104 Pulicat Coastal Highway',
    permanentResidents: 28400,
    dailyAvgTourists: 6200,
    peakMonsoonTourists: 11500,
    hazardBufferExposedResidents: 4900,
    hazardBufferExposedTourists: 1400,
    riskSeverity: 'High',
  },
];

export const CORRIDOR_POPULATION_DATA = TAMILNADU_CORRIDOR_POPULATION_DATA;
