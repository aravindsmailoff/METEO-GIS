import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rainRate = Number(body.rain_rate_mm_h) || 85.0;
    const saturation = Number(body.soil_saturation_pct) || 85.0;

    const multiplier = 1.0 + (rainRate / 45.0) * (saturation / 100.0);
    const baseProbs: Record<string, number> = {
      'North Sikkim': Math.min(0.99, 0.42 * multiplier),
      'East Sikkim': Math.min(0.98, 0.38 * multiplier),
      'Kohima': Math.min(0.95, 0.28 * multiplier),
      'Aizawl': Math.min(0.92, 0.25 * multiplier),
      'Dima Hasao (Assam)': Math.min(0.89, 0.2 * multiplier),
      'Papum Pare (Arunachal)': Math.min(0.85, 0.18 * multiplier),
    };

    const projections = Object.entries(baseProbs).map(([district, prob]) => {
      let threat = 'Low';
      if (prob >= 0.8) threat = 'Critical';
      else if (prob >= 0.6) threat = 'High';
      else if (prob >= 0.35) threat = 'Moderate';

      return {
        district,
        projected_probability: Number(prob.toFixed(3)),
        threat_level: threat,
      };
    });

    return NextResponse.json({
      scenario_parameters: { rain_rate_mm_h: rainRate, soil_saturation_pct: saturation },
      projected_landslide_count: Math.round(multiplier * 4.2),
      projected_isolated_population: Math.round(multiplier * 6200),
      district_risk_projections: projections,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to simulate scenario' }, { status: 500 });
  }
}
