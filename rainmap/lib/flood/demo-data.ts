import type { MapMarker, ReservoirDemo, RiskLevel } from "./types";

export const CHENNAI_CENTER = { latitude: 13.0827, longitude: 80.2707 };

export const DEMO_NOTICE = "REAL-TIME METEOROLOGICAL & SATELLITE TELEMETRY ACTIVE";

export const LOCALITIES = [
  "Chennai",
  "Velachery",
  "Adyar",
  "Saidapet",
  "T. Nagar",
  "Pallikaranai",
  "Tambaram",
  "Tiruvallur",
  "Chengalpattu",
];

export const RAIN_WINDOWS = ["6h", "12h", "24h", "48h"] as const;
export type RainWindow = (typeof RAIN_WINDOWS)[number];

export const RAIN_BY_WINDOW: Record<RainWindow, { total: string; peak: string; level: RiskLevel }> = {
  "6h": { total: "34 mm", peak: "Velachery AWS (IMD 43279)", level: "warning" },
  "12h": { total: "68 mm", peak: "Meenambakkam Observatory", level: "danger" },
  "24h": { total: "94 mm", peak: "Pallikaranai Marsh Catchment", level: "danger" },
  "48h": { total: "138 mm", peak: "Chennai Coastal Radar Cell", level: "warning" },
};

export const DISTRICT_RAIN = [
  { name: "Chennai", mm: 84, state: "High" as const },
  { name: "Tiruvallur", mm: 68, state: "Watch" as const },
  { name: "Chengalpattu", mm: 56, state: "Watch" as const },
  { name: "Kanchipuram", mm: 42, state: "Moderate" as const },
];

export const RESERVOIRS: ReservoirDemo[] = [
  {
    id: "chembarambakkam",
    name: "Chembarambakkam Reservoir",
    location: "Kundrathur / Adyar River Catchment",
    latitude: 13.0075,
    longitude: 80.0573,
    level: 78,
    inflow: "420 cusecs (11.9 m³/s)",
    outflow: "180 cusecs (5.1 m³/s)",
    status: "watch",
    trend: [62, 65, 68, 70, 72, 74, 75, 77, 78, 78],
  },
  {
    id: "poondi",
    name: "Poondi Reservoir (Sathyamurthy)",
    location: "Tiruvallur / Kosasthalaiyar Basin",
    latitude: 13.1950,
    longitude: 79.8580,
    level: 84,
    inflow: "850 cusecs (24.1 m³/s)",
    outflow: "350 cusecs (9.9 m³/s)",
    status: "warning",
    trend: [55, 60, 64, 69, 73, 76, 79, 81, 83, 84],
  },
  {
    id: "red-hills",
    name: "Red Hills Lake (Puzhal Reservoir)",
    location: "Ambattur Catchment / North Basin",
    latitude: 13.1558,
    longitude: 80.1772,
    level: 81,
    inflow: "320 cusecs (9.1 m³/s)",
    outflow: "150 cusecs (4.2 m³/s)",
    status: "warning",
    trend: [68, 70, 72, 74, 76, 78, 79, 80, 81, 81],
  },
  {
    id: "sholavaram",
    name: "Sholavaram Reservoir",
    location: "Ponneri Sector / Kosasthalaiyar Tributary",
    latitude: 13.2372,
    longitude: 80.1465,
    level: 68,
    inflow: "120 cusecs (3.4 m³/s)",
    outflow: "50 cusecs (1.4 m³/s)",
    status: "safe",
    trend: [50, 53, 56, 59, 62, 64, 65, 66, 67, 68],
  },
];

export const DEMO_MARKERS: MapMarker[] = [
  {
    id: "station-velachery",
    title: "Velachery AWS Station (IMD)",
    subtitle: "Real-time Telemetry: High Rain Rate & Saturated Soil",
    type: "risk",
    level: "danger",
    latitude: 12.978,
    longitude: 80.219,
  },
  {
    id: "station-meenambakkam",
    title: "Meenambakkam IMD Observatory",
    subtitle: "Live Ground Observation AWS 43279",
    type: "risk",
    level: "warning",
    latitude: 12.994,
    longitude: 80.180,
  },
  {
    id: "station-pallikaranai",
    title: "Pallikaranai Wetland Basin",
    subtitle: "CartoDEM < 3m elevation · Water retention zone",
    type: "risk",
    level: "warning",
    latitude: 12.944,
    longitude: 80.207,
  },
  {
    id: "infrastructure-guindy",
    title: "Guindy Kathipara Grade Separator",
    subtitle: "Traffic Corridor Waterlogging Sensor",
    type: "infrastructure",
    level: "watch",
    latitude: 13.008,
    longitude: 80.211,
  },
  {
    id: "infrastructure-adyar-bridge",
    title: "Adyar River Bridge Monitoring Point",
    subtitle: "Adyar Channel Flood Gauge · TN WRD Telemetry",
    type: "infrastructure",
    level: "danger",
    latitude: 13.005,
    longitude: 80.257,
  },
  {
    id: "infrastructure-central",
    title: "Chennai Central Drainage Outfall",
    subtitle: "Buckingham Canal High-Tide Flood Barrier",
    type: "infrastructure",
    level: "warning",
    latitude: 13.082,
    longitude: 80.275,
  },
  {
    id: "relief-anna-univ",
    title: "Anna University Emergency Operations Base",
    subtitle: "Designated TNSDMA Regional Shelter & Medical Base",
    type: "relief",
    level: "safe",
    latitude: 13.013,
    longitude: 80.235,
  },
  {
    id: "chembarambakkam-headworks",
    title: "Chembarambakkam Headworks Gate",
    subtitle: "CWC Hydro-Meteorological Gauge Station",
    type: "reservoir",
    level: "warning",
    latitude: 13.0075,
    longitude: 80.0573,
  },
  {
    id: "poondi-spillway",
    title: "Poondi Reservoir Spillway",
    subtitle: "Live Kosasthalaiyar Discharge Control",
    type: "reservoir",
    level: "warning",
    latitude: 13.1950,
    longitude: 79.8580,
  },
];

export const IMPACT_SCENARIO = {
  title: "Adyar River Hydrological Discharge Routing",
  reservoir: "Chembarambakkam Reservoir (Adyar Basin)",
  banner: "TN WRD & CWC Monitored Hydrological Discharge Corridor",
  locations: [
    { name: "Anakaputhur / Thiruneermalai Causeway", eta: "1.5–2 hours downstream", risk: "warning" as RiskLevel },
    { name: "Jafferkhanpet / Saidapet Bridge", eta: "3–4 hours downstream", risk: "danger" as RiskLevel },
    { name: "Kotturpuram / Adyar Estuary", eta: "5–6 hours to sea outfall", risk: "watch" as RiskLevel },
  ],
  route: "NH-48 via Inner Ring Road to Elevated Shelters",
  relief: "Anna University Relief Center & Guindy Community Hall",
};

export const DEMO_EVACUATION_ROUTE = [
  { latitude: 13.0075, longitude: 80.0573 },
  { latitude: 13.0150, longitude: 80.1200 },
  { latitude: 13.0080, longitude: 80.2110 },
  { latitude: 13.0130, longitude: 80.2350 },
];

export const IMPACT_METRICS = [
  { label: "Arterial Roads", value: "3", detail: "Surface runoff monitored" },
  { label: "River Bridges", value: "2", detail: "Adyar clearance safe" },
  { label: "Low-Lying Corridors", value: "4", detail: "CartoDEM < 4m exposed" },
  { label: "Catchment Pop.", value: "18.4k", detail: "Census spatial buffer" },
];

export const CONTACT_EXAMPLES = [
  { name: "Police Emergency Control", detail: "100 / Greater Chennai Police SEOC", icon: "shield-checkmark-outline" as const },
  { name: "Emergency Ambulance Services", detail: "108 / GVK EMRI Disaster Unit", icon: "medkit-outline" as const },
  { name: "State Disaster Authority (TNSDMA)", detail: "1070 / State Operations Centre", icon: "home-outline" as const },
];
