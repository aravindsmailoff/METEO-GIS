import { createGeoCirclePolygon } from '../../data/indiaGeoCatalog';
import { PluvialFloodZone } from '../../types/meteo';

export function buildPluvialZonesGeoJson(zones: PluvialFloodZone[]) {
  return {
    type: 'FeatureCollection' as const,
    features: zones.map((z) => ({
      type: 'Feature' as const,
      id: `zone:${z.id}`,
      properties: {
        kind: 'zone',
        refId: z.id,
        zoneName: z.zoneName,
        risk: z.pluvialFloodRisk,
        fillColor:
          z.pluvialFloodRisk === 'CRITICAL'
            ? '#ef4444'
            : z.pluvialFloodRisk === 'HIGH'
              ? '#f97316'
              : '#eab308',
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [z.polygon || createGeoCirclePolygon(z.longitude, z.latitude, 4.0, 24)],
      },
    })),
  };
}
