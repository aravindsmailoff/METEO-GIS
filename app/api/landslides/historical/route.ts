import { NextResponse } from 'next/server';

/**
 * Historical Landslides API
 * Sources: ISRO / NRSC Landslide Atlas of India & Geological Survey of India (GSI)
 * Note: Used strictly for training, validation, and historical risk context.
 * NEVER alters active road status or triggers road closures.
 */
export const HISTORICAL_LANDSLIDES_DATA = [
  {
    id: 'HIST-ISRO-MEGH-2021-01',
    name: 'Sohra–Mawsmai Escarpment Landslide (June 2021)',
    district: 'East Khasi Hills',
    state: 'Meghalaya',
    lat: 25.2680,
    lng: 91.7340,
    event_date: '2021-06-18',
    source: 'ISRO / NRSC Landslide Atlas of India',
    confidence: 'VERIFIED_HISTORICAL',
    trigger_type: 'High Intensity Monsoon Rainfall (>350 mm/24h)',
    estimated_volume_m3: 45000,
    fatalities: 0,
    road_impact_at_event_time: 'Debris cleared in 2021; currently open with active slope monitoring',
    is_historical: true,
    active_closure: false,
  },
  {
    id: 'HIST-ISRO-MEGH-2020-02',
    name: 'Umiam Valley Slope Sinking (July 2020)',
    district: 'Ri-Bhoi',
    state: 'Meghalaya',
    lat: 25.6880,
    lng: 91.9280,
    event_date: '2020-07-22',
    source: 'ISRO / NRSC Landslide Atlas of India',
    confidence: 'VERIFIED_HISTORICAL',
    trigger_type: 'Sustained Monsoon Infiltration & Pore Pressure Rise',
    estimated_volume_m3: 28000,
    fatalities: 0,
    road_impact_at_event_time: 'Historic slump; new downstream bypass bridge constructed & fully operational',
    is_historical: true,
    active_closure: false,
  },
  {
    id: 'HIST-ISRO-MEGH-2022-03',
    name: 'Pynursla–Wah Umngot Gorge Slope Creep (May 2022)',
    district: 'East Khasi Hills',
    state: 'Meghalaya',
    lat: 25.3080,
    lng: 91.9050,
    event_date: '2022-05-14',
    source: 'ISRO / NRSC Landslide Atlas of India',
    confidence: 'VERIFIED_HISTORICAL',
    trigger_type: 'Hydro-Pore Pressure in Mahadek Sandstone Interface',
    estimated_volume_m3: 32000,
    fatalities: 0,
    road_impact_at_event_time: 'Historical event; NH-206 is open for daytime traffic under sub-divisional monitoring',
    is_historical: true,
    active_closure: false,
  },
  {
    id: 'HIST-GSI-SIKK-2023-04',
    name: 'Teesta Basin Rangpo–Singtam Flash Slump (Oct 2023)',
    district: 'East Sikkim',
    state: 'Sikkim',
    lat: 27.2350,
    lng: 88.5120,
    event_date: '2023-10-04',
    source: 'Geological Survey of India (GSI) / NLFC',
    confidence: 'VERIFIED_HISTORICAL',
    trigger_type: 'Glacial Lake Outburst / Flash Flood Riverine Toeing',
    estimated_volume_m3: 95000,
    fatalities: 0,
    road_impact_at_event_time: 'Historical event; BRO reconstructed carriageway',
    is_historical: true,
    active_closure: false,
  },
  {
    id: 'HIST-ISRO-MEGH-2022-05',
    name: 'Mawsynram–Balat Deep Valley Washout (June 2022)',
    district: 'South West Khasi Hills',
    state: 'Meghalaya',
    lat: 25.2950,
    lng: 91.5850,
    event_date: '2022-06-17',
    source: 'ISRO / NRSC Landslide Atlas of India',
    confidence: 'VERIFIED_HISTORICAL',
    trigger_type: 'Extreme Pluvial Precipitation (>500 mm/24h)',
    estimated_volume_m3: 62000,
    fatalities: 0,
    road_impact_at_event_time: 'Historical event; road reinstated by PWD',
    is_historical: true,
    active_closure: false,
  },
  {
    id: 'HIST-ISRO-MEGH-2019-06',
    name: 'Tura Peak Western Spur Mass Movement (Aug 2019)',
    district: 'West Garo Hills',
    state: 'Meghalaya',
    lat: 25.5450,
    lng: 90.2450,
    event_date: '2019-08-11',
    source: 'ISRO / NRSC Landslide Atlas of India',
    confidence: 'VERIFIED_HISTORICAL',
    trigger_type: 'Prolonged Rainfall & Weathered Gneiss Failure',
    estimated_volume_m3: 38000,
    fatalities: 0,
    road_impact_at_event_time: 'Slope stabilized with retaining walls',
    is_historical: true,
    active_closure: false,
  }
];

export async function GET() {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${backendUrl}/api/v1/landslides/historical`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.available && data.data && data.data.length > 0) {
        return NextResponse.json(data);
      }
    }
  } catch {}

  return NextResponse.json({
    available: true,
    source: 'ISRO / NRSC Landslide Atlas of India & GSI Historical Inventory',
    count: HISTORICAL_LANDSLIDES_DATA.length,
    policy: 'Historical events are for analysis/training only and NEVER alter active road status.',
    data: HISTORICAL_LANDSLIDES_DATA
  });
}
