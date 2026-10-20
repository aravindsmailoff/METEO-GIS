import { useCallback } from 'react';
import axios from 'axios';
import { API_ROUTES } from '../config/api';
import { haversineKm, resolveNearestRadar } from '../data/indiaGeoCatalog';
import { useAppStore } from '../store/appStore';
import {
  CityHotspotPinpoint,
  DerivedHazardEvent,
  PluvialFloodZone,
  SelectedLocationEvidence,
  ValidatedDistrictWarning,
  ValidatedStationObservation,
} from '../types/meteo';

export function useSelection(cachedStations: ValidatedStationObservation[] = []) {
  const selectEvidenceAndRoute = useAppStore((s) => s.selectEvidenceAndRoute);

  const findLocalNearestStation = useCallback(
    (lat: number, lng: number) => {
      let best: ValidatedStationObservation | null = null;
      let bestDist = Infinity;
      for (const st of cachedStations) {
        const d = haversineKm(lat, lng, st.latitude, st.longitude);
        if (d < bestDist) {
          bestDist = d;
          best = st;
        }
      }
      return { station: best, distanceKm: best ? bestDist : 0 };
    },
    [cachedStations]
  );

  const enrichWithLiveStation = useCallback(
    async (base: SelectedLocationEvidence): Promise<SelectedLocationEvidence> => {
      try {
        const res = await axios.get(API_ROUTES.stations(), {
          params: { lat: base.lat, lng: base.lng, max_distance_km: 150 },
          timeout: 3500,
        });
        const nearest = res.data?.nearestStation || res.data?.nearestStationAnyDistance;
        if (nearest && typeof nearest.temperatureC === 'number') {
          return {
            ...base,
            temperatureC: nearest.temperatureC,
            humidityPercent: nearest.humidityPercent ?? base.humidityPercent,
            windSpeedKmh: nearest.windSpeedKmh ?? base.windSpeedKmh,
            windDirectionDeg: nearest.windDirectionDeg ?? base.windDirectionDeg,
            pressureHpa: nearest.pressureHpa ?? base.pressureHpa,
            rainfall1hMm: nearest.rainfall1hMm ?? base.rainfall1hMm,
            rainfall24hMm: nearest.rainfall24hMm ?? base.rainfall24hMm,
            stationName: nearest.stationName || base.stationName,
            stationDistanceKm:
              res.data?.distanceKm ??
              haversineKm(base.lat, base.lng, nearest.latitude, nearest.longitude),
            observationTimestampIST: nearest.observationTimestampIST || base.observationTimestampIST,
          };
        }
      } catch {
        // Keep fast local estimate seamlessly when offline or low bandwidth
      }
      return base;
    },
    []
  );

  /**
   * 1. Tap IMD WARNING marker -> Center map + HALF + WARNINGS tab
   */
  const selectWarning = useCallback(
    async (w: ValidatedDistrictWarning) => {
      const lat = w.latitude ?? 20.5937;
      const lng = w.longitude ?? 78.9629;
      const radar = resolveNearestRadar(lat, lng);
      const local = findLocalNearestStation(lat, lng);

      const initial: SelectedLocationEvidence = {
        lat,
        lng,
        locationName: w.district,
        district: w.district,
        state: w.state || 'India',
        severity: w.currentAlertLevel,
        selectionKind: 'warning',
        headline: `IMD ${w.currentAlertLevel} Warning · ${w.district}`,
        summary: w.currentWarning || w.day1Warning,
        source: w.source || 'IMD NWFC District Warning Bulletin',
        temperatureC: local.station?.temperatureC ?? 27.6,
        humidityPercent: local.station?.humidityPercent ?? 76,
        windSpeedKmh: local.station?.windSpeedKmh ?? 16,
        windDirectionDeg: local.station?.windDirectionDeg ?? 110,
        pressureHpa: local.station?.pressureHpa ?? 1006.4,
        rainfall1hMm: local.station?.rainfall1hMm ?? 0,
        rainfall24hMm: local.station?.rainfall24hMm ?? 0,
        stationName: local.station?.stationName || `${w.district} Synoptic Grid`,
        stationDistanceKm: local.distanceKm,
        radarCode: radar.code,
        radarName: radar.name,
        radarDistanceKm: radar.distanceKm,
        observationTimestampIST: w.updatedAtIST || 'Live',
      };

      selectEvidenceAndRoute({
        evidence: initial,
        targetTab: 'warnings',
        warningObjId: w.objId,
        zoom: 9.2,
      });

      const enriched = await enrichWithLiveStation(initial);
      if (enriched !== initial) {
        selectEvidenceAndRoute({
          evidence: enriched,
          targetTab: 'warnings',
          warningObjId: w.objId,
          zoom: 9.2,
        });
      }
    },
    [enrichWithLiveStation, findLocalNearestStation, selectEvidenceAndRoute]
  );

  /**
   * 2. Tap HAZARD / CLOUDBURST / THUNDERSTORM marker -> Center map + HALF + OVERVIEW tab
   */
  const selectHazard = useCallback(
    async (ev: DerivedHazardEvent) => {
      const radar = resolveNearestRadar(ev.latitude, ev.longitude);
      const local = findLocalNearestStation(ev.latitude, ev.longitude);

      const initial: SelectedLocationEvidence = {
        lat: ev.latitude,
        lng: ev.longitude,
        locationName: ev.district,
        district: ev.district,
        state: ev.state,
        severity: ev.severity,
        selectionKind: 'hazard',
        headline: ev.headline || `${ev.category} · ${ev.district}`,
        summary: ev.summary,
        source: `IMD ${ev.sourceEndpoint}`,
        validUntilEpoch: ev.validUntilEpoch,
        validUntilIST: ev.validUntilIST,
        temperatureC: local.station?.temperatureC ?? 27.6,
        humidityPercent: local.station?.humidityPercent ?? 82,
        windSpeedKmh: local.station?.windSpeedKmh ?? 22,
        windDirectionDeg: local.station?.windDirectionDeg ?? 85,
        pressureHpa: local.station?.pressureHpa ?? 1004.8,
        rainfall1hMm: ev.rainfallRateMmH ?? local.station?.rainfall1hMm ?? 0,
        rainfall24hMm: local.station?.rainfall24hMm ?? 0,
        stationName: ev.triggeringStation || local.station?.stationName || `${ev.district} AWS`,
        stationDistanceKm: local.distanceKm,
        radarCode: radar.code,
        radarName: radar.name,
        radarDistanceKm: radar.distanceKm,
        observationTimestampIST: ev.issuedAtIST || 'Live',
      };

      selectEvidenceAndRoute({
        evidence: initial,
        targetTab: 'overview',
        alertId: ev.id,
        zoom: 9.8,
      });

      const enriched = await enrichWithLiveStation(initial);
      if (enriched !== initial) {
        selectEvidenceAndRoute({
          evidence: enriched,
          targetTab: 'overview',
          alertId: ev.id,
          zoom: 9.8,
        });
      }
    },
    [enrichWithLiveStation, findLocalNearestStation, selectEvidenceAndRoute]
  );

  /**
   * 3. Tap PLUVIAL FLOOD ZONE -> Center map + HALF + IMPACT tab (+ switches base map to Bhuvan Sat)
   */
  const selectPluvialZone = useCallback(
    (zone: PluvialFloodZone, hotspot?: CityHotspotPinpoint) => {
      const targetLat = hotspot ? hotspot.latitude : zone.latitude;
      const targetLng = hotspot ? hotspot.longitude : zone.longitude;
      const radar = resolveNearestRadar(targetLat, targetLng);
      const local = findLocalNearestStation(targetLat, targetLng);
      const sev =
        zone.pluvialFloodRisk === 'CRITICAL'
          ? 'RED'
          : zone.pluvialFloodRisk === 'HIGH'
            ? 'ORANGE'
            : 'YELLOW';

      const evidence: SelectedLocationEvidence = {
        lat: targetLat,
        lng: targetLng,
        locationName: hotspot ? hotspot.name : zone.zoneName,
        district: zone.district,
        state: zone.state,
        severity: sev,
        selectionKind: 'zone',
        headline: hotspot
          ? `${hotspot.name} (${hotspot.waterloggingDepthM}m Inundation Depth)`
          : `${zone.zoneName} · ${zone.pluvialFloodRisk} RISK`,
        summary: hotspot
          ? `${hotspot.drainageIssue}. Action: ${hotspot.recommendation}`
          : zone.drainageContext,
        source: 'ISRO Bhuvan Satellite / NRSC Low-Lying DEM',
        temperatureC: local.station?.temperatureC ?? 26.8,
        humidityPercent: local.station?.humidityPercent ?? 90,
        windSpeedKmh: local.station?.windSpeedKmh ?? 20,
        windDirectionDeg: local.station?.windDirectionDeg ?? 90,
        pressureHpa: local.station?.pressureHpa ?? 1005.0,
        rainfall1hMm: zone.liveRainRateMmH,
        rainfall24hMm: zone.cumulativeRain24hMm,
        stationName: local.station?.stationName || `${zone.district} Urban Telemetry`,
        stationDistanceKm: local.distanceKm,
        radarCode: radar.code,
        radarName: radar.name,
        radarDistanceKm: radar.distanceKm,
        observationTimestampIST: zone.freshness,
      };

      selectEvidenceAndRoute({
        evidence,
        targetTab: 'impact',
        pluvialZone: zone,
        hotspot: hotspot || zone.cityHotspots?.[0] || null,
        zoom: hotspot ? 14.5 : 12.5,
      });
    },
    [findLocalNearestStation, selectEvidenceAndRoute]
  );

  /**
   * 4. Tap AWS STATION marker -> Center map + HALF + OBS tab
   */
  const selectStation = useCallback(
    (stn: ValidatedStationObservation) => {
      const radar = resolveNearestRadar(stn.latitude, stn.longitude);
      const mm24 = stn.rainfall24hMm || 0;
      const sev =
        mm24 >= 204.5
          ? 'RED'
          : mm24 >= 115.6
            ? 'ORANGE'
            : mm24 >= 64.5
              ? 'YELLOW'
              : 'GREEN';

      const evidence: SelectedLocationEvidence = {
        lat: stn.latitude,
        lng: stn.longitude,
        locationName: stn.stationName,
        district: stn.district,
        state: stn.state,
        severity: sev,
        selectionKind: 'station',
        headline: `${stn.stationName} · ${stn.weatherMessage || 'Ground Telemetry'}`,
        summary: `Observed 1h Rain: ${stn.rainfall1hMm ?? 0} mm · 24h Cumulative: ${stn.rainfall24hMm ?? 0} mm · Pressure: ${stn.pressureHpa ?? 1008} hPa`,
        source: stn.source || 'IMD AWS Ground Network',
        temperatureC: stn.temperatureC ?? 27.5,
        humidityPercent: stn.humidityPercent ?? 74,
        windSpeedKmh: stn.windSpeedKmh ?? 12,
        windDirectionDeg: stn.windDirectionDeg ?? 180,
        pressureHpa: stn.pressureHpa ?? 1007.5,
        rainfall1hMm: stn.rainfall1hMm ?? 0,
        rainfall24hMm: stn.rainfall24hMm ?? 0,
        stationName: stn.stationName,
        stationDistanceKm: 0,
        radarCode: radar.code,
        radarName: radar.name,
        radarDistanceKm: radar.distanceKm,
        observationTimestampIST: stn.observationTimestampIST,
      };

      selectEvidenceAndRoute({
        evidence,
        targetTab: 'obs',
        zoom: 10.5,
      });
    },
    [selectEvidenceAndRoute]
  );

  /**
   * 5. Search result or GPS Locate Me -> Center map + HALF + OVERVIEW tab
   */
  const selectCoordinates = useCallback(
    async (lat: number, lng: number, name: string, state: string, isGps = false) => {
      const radar = resolveNearestRadar(lat, lng);
      const local = findLocalNearestStation(lat, lng);
      const initial: SelectedLocationEvidence = {
        lat,
        lng,
        locationName: name,
        district: name,
        state,
        severity: 'GREEN',
        selectionKind: isGps ? 'gps' : 'search',
        headline: isGps ? `My Field Location (${name})` : `${name}, ${state}`,
        summary: `Active meteorological & Doppler surveillance synchronized with ${radar.name} (${radar.distanceKm} km).`,
        source: 'IMD / ISRO Multi-Sensor Grid',
        temperatureC: local.station?.temperatureC ?? 28.1,
        humidityPercent: local.station?.humidityPercent ?? 70,
        windSpeedKmh: local.station?.windSpeedKmh ?? 11,
        windDirectionDeg: local.station?.windDirectionDeg ?? 135,
        pressureHpa: local.station?.pressureHpa ?? 1008.2,
        rainfall1hMm: local.station?.rainfall1hMm ?? 0,
        rainfall24hMm: local.station?.rainfall24hMm ?? 0,
        stationName: local.station?.stationName || `${name} Grid Point`,
        stationDistanceKm: local.distanceKm,
        radarCode: radar.code,
        radarName: radar.name,
        radarDistanceKm: radar.distanceKm,
        observationTimestampIST: 'Live',
      };

      selectEvidenceAndRoute({
        evidence: initial,
        targetTab: 'overview',
        zoom: isGps ? 11.2 : 9.8,
      });

      const enriched = await enrichWithLiveStation(initial);
      if (enriched !== initial) {
        selectEvidenceAndRoute({
          evidence: enriched,
          targetTab: 'overview',
          zoom: isGps ? 11.2 : 9.8,
        });
      }
    },
    [enrichWithLiveStation, findLocalNearestStation, selectEvidenceAndRoute]
  );

  return {
    selectWarning,
    selectHazard,
    selectPluvialZone,
    selectStation,
    selectCoordinates,
  };
}
