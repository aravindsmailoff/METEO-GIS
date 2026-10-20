import { SelectedLocationEvidence, ValidatedStationObservation } from '../types/meteo';

export interface RiskPredictRequestBody {
  district: string;
  latitude: number;
  longitude: number;
  coordinates: [number, number];
  features: {
    rainfall_1h?: number;
    rainfall_24h?: number;
  };
}

export interface ShapContribution {
  feature: string;
  impact: number;
  percentage: number;
}

export interface VerifiedRiskPrediction {
  landslideProbability: number;
  probabilityPercent: number;
  riskLevel: string;
  recommendedAction: string;
  topTrigger: string;
  district: string;
  featuresEvaluated: Record<string, number>;
  shapBreakdown: ShapContribution[];
}

export type ParsedRiskPredictionResult =
  | { ok: true; data: VerifiedRiskPrediction }
  | { ok: false; error: string };

/**
 * Builds the exact request payload expected by Next.js `/api/risk/predict`
 * (`features.rainfall_1h`, `features.rainfall_24h`) using only observed values.
 */
export function buildRiskPredictRequest(
  evidence: SelectedLocationEvidence | null,
  stations: ValidatedStationObservation[] = []
): { ok: true; body: RiskPredictRequestBody } | { ok: false; error: string } {
  const fallbackStation = stations.find(
    (s) => Number.isFinite(s.latitude) && Number.isFinite(s.longitude)
  );

  const latitude = evidence?.lat ?? fallbackStation?.latitude;
  const longitude = evidence?.lng ?? fallbackStation?.longitude;
  const district = evidence?.district || fallbackStation?.district;

  if (
    typeof latitude !== 'number' ||
    !Number.isFinite(latitude) ||
    typeof longitude !== 'number' ||
    !Number.isFinite(longitude) ||
    !district
  ) {
    return {
      ok: false,
      error:
        'Select a district, warning zone, or weather station on the map first so risk inference uses verified coordinates and rainfall inputs.',
    };
  }

  const r1h = evidence?.rainfall1hMm ?? fallbackStation?.rainfall1hMm;
  const r24h = evidence?.rainfall24hMm ?? fallbackStation?.rainfall24hMm;

  const features: { rainfall_1h?: number; rainfall_24h?: number } = {};
  if (typeof r1h === 'number' && Number.isFinite(r1h) && r1h >= 0) {
    features.rainfall_1h = r1h;
  }
  if (typeof r24h === 'number' && Number.isFinite(r24h) && r24h >= 0) {
    features.rainfall_24h = r24h;
  }

  return {
    ok: true,
    body: {
      district,
      latitude,
      longitude,
      coordinates: [latitude, longitude],
      features,
    },
  };
}

/**
 * Strictly validates `/api/risk/predict` JSON responses.
 * Reads `landslide_probability` and `recommended_action` directly and never fabricates fallback scores.
 */
export function parseRiskPredictResponse(raw: any): ParsedRiskPredictionResult {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Risk prediction service returned an empty or non-JSON response.' };
  }

  const prob = raw.landslide_probability;
  const riskLevel = raw.risk_level;
  const recommendedAction = raw.recommended_action;

  if (typeof prob !== 'number' || !Number.isFinite(prob) || prob < 0 || prob > 1) {
    return {
      ok: false,
      error: 'Risk prediction response did not contain a valid `landslide_probability` score.',
    };
  }

  if (typeof riskLevel !== 'string' || riskLevel.trim().length === 0) {
    return {
      ok: false,
      error: 'Risk prediction response did not contain a valid `risk_level` tier.',
    };
  }

  if (typeof recommendedAction !== 'string' || recommendedAction.trim().length === 0) {
    return {
      ok: false,
      error: 'Risk prediction response did not contain a valid `recommended_action` directive.',
    };
  }

  return {
    ok: true,
    data: {
      landslideProbability: prob,
      probabilityPercent: Number((prob * 100).toFixed(1)),
      riskLevel: riskLevel.trim(),
      recommendedAction: recommendedAction.trim(),
      topTrigger: typeof raw.top_trigger === 'string' ? raw.top_trigger : 'Rainfall Intensity',
      district: typeof raw.district === 'string' ? raw.district : 'Selected Sector',
      featuresEvaluated:
        raw.features_evaluated && typeof raw.features_evaluated === 'object'
          ? raw.features_evaluated
          : {},
      shapBreakdown: Array.isArray(raw.shap_breakdown) ? raw.shap_breakdown : [],
    },
  };
}
