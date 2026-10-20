import { createGeoCirclePolygon, MONITORED_DWR_NETWORK } from '../../data/indiaGeoCatalog';

export function buildDwrRingsGeoJson() {
  return {
    type: 'FeatureCollection' as const,
    features: MONITORED_DWR_NETWORK.map((stn) => ({
      type: 'Feature' as const,
      id: `dwr:${stn.code}`,
      properties: {
        code: stn.code,
        name: stn.name,
        band: stn.band,
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [createGeoCirclePolygon(stn.lng, stn.lat, stn.rangeKm, 36)],
      },
    })),
  };
}

export function buildDwrCentersGeoJson() {
  return {
    type: 'FeatureCollection' as const,
    features: MONITORED_DWR_NETWORK.map((stn) => ({
      type: 'Feature' as const,
      id: `dwr-center:${stn.code}`,
      properties: {
        code: stn.code,
        name: stn.name,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [stn.lng, stn.lat] as [number, number],
      },
    })),
  };
}
