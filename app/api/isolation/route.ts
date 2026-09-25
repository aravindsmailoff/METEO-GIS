import { NextResponse } from 'next/server';

const VILLAGE_ISOLATION_DATA = [
  {
    id: 'VIL-MEGH-01',
    name: 'Nongriat (Double Decker Root Bridge Hamlet)',
    district: 'East Khasi Hills',
    state: 'Meghalaya',
    population: 1150,
    elevation_m: 640,
    coordinates: [25.250, 91.670],
    blocked_road: 'Tyrna–Nongriat 3,500 Steps Gorge Stairway',
    isolation_probability: 0.92,
    status: 'CRITICAL_ISOLATION',
    food_supplies_hrs: 28,
    medical_staff: false,
    recommended_bypass: 'Wahkhen–Nongblai Ridge Ropeway (Drone / Emergency Foot Trail Only)',
    bypass_distance_km: 8.4,
    nearest_shelter: 'Cherrapunji Multi-Purpose Disaster Refuge',
    last_contact: '6 min ago via Satellite VHF',
  },
  {
    id: 'VIL-MEGH-02',
    name: 'Tyrna Deep Gorge Settlement',
    district: 'East Khasi Hills',
    state: 'Meghalaya',
    population: 890,
    elevation_m: 780,
    coordinates: [25.240, 91.690],
    blocked_road: 'Sohra–Tyrna Valley Access Road',
    isolation_probability: 0.85,
    status: 'CRITICAL_ISOLATION',
    food_supplies_hrs: 34,
    medical_staff: false,
    recommended_bypass: 'Mawkdok–Sohra Upper Ridge Trail',
    bypass_distance_km: 12.1,
    nearest_shelter: 'Cherrapunji Multi-Purpose Disaster Refuge',
    last_contact: '14 min ago',
  },
  {
    id: 'VIL-MEGH-03',
    name: 'Umkrem Border Hamlet',
    district: 'South West Khasi Hills',
    state: 'Meghalaya',
    population: 1420,
    elevation_m: 420,
    coordinates: [25.180, 91.520],
    blocked_road: 'Mawsynram–Balat Border Arterial Road',
    isolation_probability: 0.78,
    status: 'HIGH_RISK',
    food_supplies_hrs: 48,
    medical_staff: true,
    recommended_bypass: 'Mawkyrwat–Rangthong Secondary Road',
    bypass_distance_km: 26.5,
    nearest_shelter: 'Mawkyrwat Community Health Centre',
    last_contact: '22 min ago',
  },
  {
    id: 'VIL-MEGH-04',
    name: 'Wahkhen Cliff Village (Whistling Village Gorge)',
    district: 'East Khasi Hills',
    state: 'Meghalaya',
    population: 1680,
    elevation_m: 910,
    coordinates: [25.320, 91.850],
    blocked_road: 'Pynursla–Wahkhen Access Spur',
    isolation_probability: 0.72,
    status: 'HIGH_RISK',
    food_supplies_hrs: 56,
    medical_staff: true,
    recommended_bypass: 'Pomshutia–Mawlynnong Escarpment Route',
    bypass_distance_km: 15.8,
    nearest_shelter: 'Pynursla Secondary School Shelter',
    last_contact: '18 min ago',
  },
  {
    id: 'VIL-MEGH-05',
    name: 'Siju Rongdong Gorge Settlement',
    district: 'South Garo Hills',
    state: 'Meghalaya',
    population: 940,
    elevation_m: 310,
    coordinates: [25.350, 90.710],
    blocked_road: 'Baghmara–Siju Road along Simsang River',
    isolation_probability: 0.64,
    status: 'MODERATE_RISK',
    food_supplies_hrs: 72,
    medical_staff: true,
    recommended_bypass: 'Nongalbibra–Simsang Riverine Boat Path',
    bypass_distance_km: 19.4,
    nearest_shelter: 'Baghmara District Refuge Base',
    last_contact: '35 min ago',
  },
];

function analyticsFromVillages(villages: typeof VILLAGE_ISOLATION_DATA, source: string) {
  const dynamicVillages = villages.map((v, idx) => ({
    ...v,
    last_contact: `${(idx * 7 + 4)} min ago via Satellite VHF`
  }));

  const criticalCount = dynamicVillages.filter((v) => v.isolation_probability >= 0.75).length;
  const highCount = dynamicVillages.filter((v) => v.isolation_probability >= 0.5 && v.isolation_probability < 0.75).length;
  const totalPopulation = dynamicVillages
    .filter((v) => v.isolation_probability >= 0.5)
    .reduce((a, b) => a + b.population, 0);

  return {
    cutoff_hamlets_total: dynamicVillages.length,
    critical_isolation_count: criticalCount,
    high_risk_count: highCount,
    total_population_at_risk: totalPopulation,
    villages: dynamicVillages,
    source,
  };
}

/**
 * Serves village isolation analytics from the FastAPI backend (PostGIS-backed)
 * when it is reachable, falling back to the static dataset otherwise.
 * Configure BACKEND_URL (default http://localhost:8000) in .env.local.
 */
export async function GET() {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const res = await fetch(`${backendUrl}/api/v1/isolation/villages`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.villages) && data.villages.length > 0) {
        return NextResponse.json({ ...data, source: data.source || 'postgis' });
      }
    }
  } catch {
    // Backend not running or timed out — fall through to static data.
  } finally {
    clearTimeout(timeout);
  }

  return NextResponse.json(analyticsFromVillages(VILLAGE_ISOLATION_DATA, 'static_fallback'));
}
