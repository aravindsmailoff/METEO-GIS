import { RainfallObservationPoint, ValidatedStationObservation } from '../../types/meteo';

export function buildStationsGeoJson(
  stations: ValidatedStationObservation[],
  rainfallPoints: RainfallObservationPoint[],
  showAwsStations: boolean,
  showLiveRainfall: boolean
) {
  const features: any[] = [];

  if (showLiveRainfall) {
    for (const r of rainfallPoints) {
      const color =
        r.category === 'EXTREMELY_HEAVY'
          ? '#ef4444'
          : r.category === 'VERY_HEAVY'
            ? '#f97316'
            : r.category === 'HEAVY'
              ? '#eab308'
              : r.category === 'MODERATE'
                ? '#38bdf8'
                : '#10b981';
      features.push({
        type: 'Feature',
        id: `rain:${r.id}`,
        properties: {
          kind: 'rain',
          refId: r.id,
          stationName: r.stationName,
          rainfall24hMm: r.rainfall24hMm,
          color,
        },
        geometry: {
          type: 'Point',
          coordinates: [r.longitude, r.latitude],
        },
      });
    }
  }

  if (showAwsStations) {
    for (const s of stations) {
      features.push({
        type: 'Feature',
        id: `station:${s.id}`,
        properties: {
          kind: 'station',
          refId: s.id,
          stationName: s.stationName,
          color: '#22d3ee',
        },
        geometry: {
          type: 'Point',
          coordinates: [s.longitude, s.latitude],
        },
      });
    }
  }

  return {
    type: 'FeatureCollection' as const,
    features,
  };
}
