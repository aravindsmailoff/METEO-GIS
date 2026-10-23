import { DerivedHazardEvent, ValidatedDistrictWarning } from '../../types/meteo';

export function buildHazardMarkersGeoJson(
  hazards: DerivedHazardEvent[],
  warnings: ValidatedDistrictWarning[],
  showDistrictWarnings: boolean,
  focusSevereOnly: boolean
) {
  const features: any[] = [];

  for (const ev of hazards) {
    if (focusSevereOnly && !ev.isSevere) continue;
    const color =
      ev.severity === 'RED'
        ? '#ef4444'
        : ev.severity === 'ORANGE'
          ? '#f97316'
          : ev.severity === 'YELLOW'
            ? '#eab308'
            : '#10b981';
    features.push({
      type: 'Feature',
      id: `hazard:${ev.id}`,
      properties: {
        kind: 'hazard',
        refId: ev.id,
        title: ev.district,
        severity: ev.severity,
        color,
        radius: ev.severity === 'RED' ? 11 : 9,
      },
      geometry: {
        type: 'Point',
        coordinates: [ev.longitude, ev.latitude],
      },
    });
  }

  if (showDistrictWarnings) {
    for (const w of warnings) {
      if (w.latitude == null || w.longitude == null) continue;
      if (focusSevereOnly && w.currentAlertLevel !== 'RED' && w.currentAlertLevel !== 'ORANGE') {
        continue;
      }
      const color =
        w.currentAlertLevel === 'RED'
          ? '#dc2626'
          : w.currentAlertLevel === 'ORANGE'
            ? '#ea580c'
            : w.currentAlertLevel === 'YELLOW'
              ? '#ca8a04'
              : '#059669';
      features.push({
        type: 'Feature',
        id: `warning:${w.objId}`,
        properties: {
          kind: 'warning',
          refId: w.objId,
          title: w.district,
          severity: w.currentAlertLevel,
          color,
          radius: 7,
        },
        geometry: {
          type: 'Point',
          coordinates: [w.longitude, w.latitude],
        },
      });
    }
  }

  return {
    type: 'FeatureCollection' as const,
    features,
  };
}
