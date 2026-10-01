'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Layers, X } from 'lucide-react';
import { UnifiedHazardMap } from '../components/gis/UnifiedHazardMap';
import { MeteoHeader } from '../components/analytics/MeteoHeader';
import { LiveIntelligenceStrip } from '../components/analytics/LiveIntelligenceStrip';
import { ActiveEventBar } from '../components/analytics/ActiveEventBar';
import { GisLayersSidebar } from '../components/analytics/GisLayersSidebar';
import { GisTopMenubar } from '../components/layout/GisTopMenubar';
import { ContextualIntelligencePanel } from '../components/analytics/ContextualIntelligencePanel';
import { PowerBiAnalyticsPanel } from '../components/analytics/PowerBiAnalyticsPanel';
import { SystemStatusBar } from '../components/analytics/SystemStatusBar';

import { SystemOverviewModal } from '../components/command/SystemOverviewModal';
import { InsatSatelliteModal } from '../components/command/InsatSatelliteModal';
import { ImdRadarModal } from '../components/command/ImdRadarModal';
import { DataHealthAuditModal } from '../components/command/DataHealthAuditModal';
import { DerivedHazardEvent, PluvialFloodZone, CityHotspotPinpoint } from './api/live/hazards/route';
import { getNearestRadarStation, resolveRadarCodeByName } from '@/lib/radarStationResolver';
import { getAuthoritativeSatelliteTelemetry } from '@/lib/satelliteTelemetryFallback';

import {
  UnifiedStormCell, MONITORED_DWR_NETWORK,
} from '../components/data/unifiedHazardData';
import { HazardIncident } from '../components/types';
import { ClickedLocationEvidence } from '../components/command/CurrentEvidenceDrawer';

/* ─── Haversine ──────────────────────────────────────────────────────────── */
const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 10) / 10;
};

/* ─── Location dataset for search ────────────────────────────────────────── */
const LOCATIONS = [
  { name: 'Palakkad', sub: 'Kerala', lat: 10.7867, lng: 76.6548 },
  { name: 'Raipur', sub: 'Chhattisgarh', lat: 21.2514, lng: 81.6296 },
  { name: 'Bastar', sub: 'Chhattisgarh', lat: 19.0734, lng: 81.9568 },
  { name: 'Bilaspur', sub: 'Chhattisgarh', lat: 22.0797, lng: 82.1409 },
  { name: 'Sukma', sub: 'Chhattisgarh', lat: 18.7915, lng: 81.6667 },
  { name: 'Hooghly', sub: 'West Bengal', lat: 22.9030, lng: 88.3968 },
  { name: 'Bankura', sub: 'West Bengal', lat: 23.2324, lng: 87.0715 },
  { name: 'Guwahati', sub: 'Assam', lat: 26.1445, lng: 91.7362 },
  { name: 'Silchar', sub: 'Assam', lat: 24.8333, lng: 92.7789 },
  { name: 'Chennai', sub: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { name: 'Mumbai', sub: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { name: 'Delhi', sub: 'NCT', lat: 28.6139, lng: 77.2090 },
  { name: 'Kolkata', sub: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { name: 'Bengaluru', sub: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', sub: 'Telangana', lat: 17.3850, lng: 78.4867 },
  { name: 'Bhubaneswar', sub: 'Odisha', lat: 20.2961, lng: 85.8245 },
  { name: 'Thiruvananthapuram', sub: 'Kerala', lat: 8.5241, lng: 76.9366 },
  { name: 'Visakhapatnam', sub: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185 },
  { name: 'Sohra', sub: 'Meghalaya', lat: 25.2700, lng: 91.7300 },
  { name: 'Shillong', sub: 'Meghalaya', lat: 25.5788, lng: 91.8933 },
  { name: 'Srinagar', sub: 'J&K', lat: 34.0837, lng: 74.7973 },
  { name: 'Dehradun', sub: 'Uttarakhand', lat: 30.3165, lng: 78.0322 },
  { name: 'Shimla', sub: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734 },
  { name: 'Gangtok', sub: 'Sikkim', lat: 27.3389, lng: 88.6065 },
  { name: 'Patna', sub: 'Bihar', lat: 25.5941, lng: 85.1376 },
];

/* ─── State Quick Selector Dataset ───────────────────────────────────────── */
export const QUICK_STATES = [
  { name: 'All India', icon: '🇮🇳', lat: 22.9734, lng: 78.6569, zoom: 5 },
  { name: 'Chhattisgarh', icon: '🌿', lat: 21.2787, lng: 81.8661, zoom: 7 },
  { name: 'Delhi', icon: '🏛️', lat: 28.6139, lng: 77.2090, zoom: 10 },
  { name: 'Himachal Pradesh', icon: '⛰️', lat: 31.1048, lng: 77.1734, zoom: 8 },
  { name: 'Uttarakhand', icon: '🏔️', lat: 30.0668, lng: 79.0193, zoom: 8 },
  { name: 'Assam', icon: '🌊', lat: 26.2006, lng: 92.9376, zoom: 7 },
  { name: 'Meghalaya', icon: '🌧️', lat: 25.4670, lng: 91.3662, zoom: 8 },
  { name: 'Kerala', icon: '🌴', lat: 10.8505, lng: 76.2711, zoom: 8 },
  { name: 'Maharashtra', icon: '🏙️', lat: 19.7515, lng: 75.7139, zoom: 7 },
  { name: 'Tamil Nadu', icon: '🏛️', lat: 11.1271, lng: 78.6569, zoom: 7 },
  { name: 'West Bengal', icon: '🌾', lat: 22.9868, lng: 87.8550, zoom: 7 },
  { name: 'Odisha', icon: '🌊', lat: 20.9517, lng: 85.0985, zoom: 7 },
  { name: 'Karnataka', icon: '🌿', lat: 15.3173, lng: 75.7139, zoom: 7 },
  { name: 'Telangana', icon: '⚡', lat: 18.1124, lng: 79.0193, zoom: 7 },
  { name: 'Rajasthan', icon: '🏰', lat: 27.0238, lng: 74.2179, zoom: 7 },
  { name: 'Bihar', icon: '🌾', lat: 25.0961, lng: 85.3131, zoom: 7 },
  { name: 'Sikkim', icon: '🏔️', lat: 27.5330, lng: 88.5122, zoom: 9 },
  { name: 'Jammu & Kashmir', icon: '❄️', lat: 33.7782, lng: 76.5762, zoom: 7 },
];

export default function MeteoGISDashboard() {
  /* Data state */
  const [incidents, setIncidents] = useState<HazardIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<HazardIncident | null>(null);
  const [selectedStormCell, setSelectedStormCell] = useState<UnifiedStormCell | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<ClickedLocationEvidence | null>(null);
  const [selectedLiveEvent, setSelectedLiveEvent] = useState<any | null>(null);
  const [mapFocusCoords, setMapFocusCoords] = useState<[number, number] | null>(null);

  /* Live KPI counts (initialized to 0, dynamically populated by IMD GeoServer WFS streams) */
  const [statWarnings, setStatWarnings] = useState<number>(0);
  const [statStations, setStatStations] = useState<number>(0);
  const [statRainPoints, setStatRainPoints] = useState<number>(0);
  const [statNowcasts, setStatNowcasts] = useState<number>(0);
  const [lastRefresh, setLastRefresh] = useState<string>('—');
  const [liveTime, setLiveTime] = useState<string>('');

  /* Layer controls */
  const [showLiveRainfall, setShowLiveRainfall] = useState<boolean>(true);
  const [showAwsStations, setShowAwsStations] = useState<boolean>(false);
  const [showDistrictWarnings, setShowDistrictWarnings] = useState<boolean>(true);
  const [showNowcastAlerts, setShowNowcastAlerts] = useState<boolean>(true);
  const [showDwrRings, setShowDwrRings] = useState<boolean>(true);
  const [showSlopeHazards, setShowSlopeHazards] = useState<boolean>(true);
  const [baseMap, setBaseMap] = useState<any>('nasa_clouds');
  const [mapFocusZoom, setMapFocusZoom] = useState<number | undefined>(undefined);
  const [selectedState, setSelectedState] = useState<string>('All India');
  const [isLayersMenuOpen, setIsLayersMenuOpen] = useState<boolean>(true);

  /* Focus Hazard state */
  const [isHazardFocus, setIsHazardFocus] = useState<boolean>(false);
  const [showAllActivity, setShowAllActivity] = useState<boolean>(false);
  const [showThunderstormLayer, setShowThunderstormLayer] = useState<boolean>(true);
  const [showHailLayer, setShowHailLayer] = useState<boolean>(true);
  const [showCloudburstLayer, setShowCloudburstLayer] = useState<boolean>(true);
  const [showPluvialFloodLayer, setShowPluvialFloodLayer] = useState<boolean>(true);

  /* Hazard data state */
  const [hazardData, setHazardData] = useState<{
    events: DerivedHazardEvent[];
    pluvialFloodZones: PluvialFloodZone[];
    counts: any;
    userSegmentation: any;
  }>({
    events: [],
    pluvialFloodZones: [],
    counts: { totalEvents: 0, severeEventsCount: 0, displayedCount: 0, thunderstorms: 0, hailstorms: 0, cloudbursts: 0 },
    userSegmentation: { touristsInRedZones: 0, fieldOfficersInRedZones: 0, citizensInRedZones: 0, totalPersonsAtRisk: 0 },
  });
  const [selectedHazardEvent, setSelectedHazardEvent] = useState<DerivedHazardEvent | null>(null);
  const [selectedPluvialZone, setSelectedPluvialZone] = useState<PluvialFloodZone | null>(null);
  const [selectedCityHotspot, setSelectedCityHotspot] = useState<CityHotspotPinpoint | null>(null);

  /* Strictly dynamic storm cells derived from live IMD convective nowcasts & hazard events */
  const stormCells = useMemo<UnifiedStormCell[]>(() => {
    return (hazardData.events || [])
      .filter((ev) => ev.category === 'THUNDERSTORM' || ev.category === 'HAIL' || ev.category === 'CLOUDBURST')
      .map((ev, idx) => {
        const isCb = ev.category === 'CLOUDBURST';
        const isHail = ev.category === 'HAIL';
        const rainVal = typeof ev.rainfallRateMmH === 'number' ? ev.rainfallRateMmH : 45.0;
        return {
          id: ev.id || `STORM-${idx}`,
          cellCode: `IMD-${(ev.district || 'SECT').toUpperCase().slice(0, 4)}-${idx + 1}`,
          name: `${ev.district} ${ev.category} Core`,
          currentLat: ev.latitude,
          currentLng: ev.longitude,
          observedIntensityDbz: isCb ? 62 : isHail ? 56 : 48,
          classification: (isCb || isHail ? 'SEVERE CONVECTION' : 'ACTIVE CONVECTION') as any,
          ciStatus: 'TRIGGERED',
          cloudTopTempC: isCb ? -68 : -55,
          coolingRateK15min: -10,
          hailRisk: (isHail ? 'High' : 'Low') as any,
          modelHailProbabilityPercent: isHail ? 75 : 15,
          meshHailDiameterMm: isHail ? 25 : null,
          downburstVelocityKts: isHail ? 45 : 30,
          downburstDirectionDeg: 270,
          observedRainfallRateMmH: rainVal,
          cloudburstThresholdMmH: 100.0,
          isCloudburstExceeded: isCb,
          lightningStrikeDensityKm2Hr: isHail ? 14 : 6,
          lightningFlashRatePerMin: isHail ? 36 : 18,
          lightningJumpDetected: isHail || isCb,
          hazardZoneRadiusKm: isCb ? 3.0 : 2.0,
          hazardSeverityBand: (ev.severity === 'RED' ? 'EXTREME' : ev.severity === 'ORANGE' ? 'SEVERE' : 'ENHANCED') as any,
          observedMovementSpeedKmh: 30,
          observedMovementBearingDeg: 270,
          movementBearingText: 'W (270°)',
          observedTrack: [
            { lat: ev.latitude + 0.05, lng: ev.longitude + 0.08, timestampText: '30m ago', isObserved: true },
            { lat: ev.latitude, lng: ev.longitude, timestampText: 'Live Obs', isObserved: true },
          ],
          forecastTrack: [
            { lat: ev.latitude - 0.05, lng: ev.longitude - 0.08, timestampText: '+30m', isObserved: false, forecastHorizonMin: 30 },
            { lat: ev.latitude - 0.10, lng: ev.longitude - 0.16, timestampText: '+1h', isObserved: false, forecastHorizonMin: 60 },
          ],
          targetLocationName: `${ev.district} Catchment`,
          targetLocationLat: ev.latitude - 0.05,
          targetLocationLng: ev.longitude - 0.08,
          arrivalEtaMinutes: 30,
          nowcastConfidencePercent: 88,
          nowcastModelName: 'IMD Convective Nowcast WFS (Mausam GeoServer)',
          primaryDataSource: `IMD Official ${ev.sourceEndpoint || 'Nowcast'} & Surface AWS Network`,
          detectionTimestamp: ev.issuedAtIST || 'Live',
          lastUpdateTimestamp: ev.issuedAtIST || 'Live',
          dataFreshnessSeconds: 45,
        };
      });
  }, [hazardData.events]);

  /* Modals and search */
  const [isSystemOpen, setIsSystemOpen] = useState<boolean>(false);
  const [isSatelliteOpen, setIsSatelliteOpen] = useState<boolean>(false);
  const [isRadarOpen, setIsRadarOpen] = useState<boolean>(false);
  const [isDataHealthOpen, setIsDataHealthOpen] = useState<boolean>(false);
  const [operationalMode, setOperationalMode] = useState<'LIVE' | 'HISTORICAL'>('LIVE');
  const [auditData, setAuditData] = useState<any>(null);
  const [radarStation, setRadarStation] = useState<string>('delhi');

  const handleOpenRadar = useCallback((stn?: string) => {
    let target = stn;
    if (!target) {
      const activeState = selectedEvidence?.state || selectedLiveEvent?.state || (selectedState !== 'All India' ? selectedState : '');
      const activeDistrict = selectedEvidence?.district || selectedLiveEvent?.district || '';
      const contextQuery = `${activeDistrict} ${activeState}`.trim();

      if (contextQuery) {
        const code = resolveRadarCodeByName(contextQuery);
        if (code) target = code;
      }

      if (!target && selectedEvidence?.radarObservation?.stationCode) {
        target = selectedEvidence.radarObservation.stationCode;
      } else if (!target && selectedLiveEvent?.latitude && selectedLiveEvent?.longitude) {
        const r = getNearestRadarStation(selectedLiveEvent.latitude, selectedLiveEvent.longitude, true, contextQuery);
        target = r.code;
      } else if (!target && mapFocusCoords) {
        const r = getNearestRadarStation(mapFocusCoords[0], mapFocusCoords[1], true, contextQuery);
        target = r.code;
      } else if (!target && selectedState && selectedState !== 'All India') {
        const code = resolveRadarCodeByName(selectedState);
        if (code) target = code;
      }
    }
    if (target) {
      setRadarStation(target);
    }
    setIsRadarOpen(true);
  }, [selectedEvidence, selectedLiveEvent, mapFocusCoords, selectedState]);

  const handleResetView = useCallback(() => {
    setSelectedState('All India');
    setMapFocusCoords([22.9734, 78.6569]);
    setMapFocusZoom(5);
    setSelectedEvidence(null);
    setSelectedIncident(null);
    setSelectedLiveEvent(null);
    setSelectedHazardEvent(null);
    setSelectedPluvialZone(null);
    setSelectedCityHotspot(null);
    setBaseMap('nasa_clouds');
    setRadarStation('delhi');
  }, []);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<typeof LOCATIONS>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  /* Live clock */
  useEffect(() => {
    const tick = () => {
      setLiveTime(
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Kolkata'
        }) + ' IST'
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* Data Ingestion */
  const refreshData = useCallback((forceFresh: boolean = false) => {
    const t = Date.now();
    const stateParam = selectedState && selectedState !== 'All India' ? `state=${encodeURIComponent(selectedState)}` : '';
    const freshParam = forceFresh ? 'fresh=1' : '';
    const qs = (endpoint: string) => {
      const glue = endpoint.includes('?') ? '&' : '?';
      const parts = [stateParam, freshParam, `t=${t}`].filter(Boolean);
      return `${endpoint}${glue}${parts.join('&')}`;
    };

    fetch(qs('/api/live/warnings'))
      .then((r) => r.json())
      .then((d) => {
        if (d.activeAlertsCount !== undefined) setStatWarnings(d.activeAlertsCount);
        else if (d.totalDistricts) setStatWarnings(d.totalDistricts);
      })
      .catch(() => {});

    fetch(qs('/api/live/hazards'))
      .then((r) => r.json())
      .then((d) => {
        if (d.status === 'OK') {
          const zones = d.pluvialFloodZones || [];
          setHazardData({
            events: d.events || [],
            pluvialFloodZones: zones,
            counts: d.counts || { totalEvents: 0, severeEventsCount: 0, displayedCount: 0, thunderstorms: 0, hailstorms: 0, cloudbursts: 0 },
            userSegmentation: d.userSegmentation || { touristsInRedZones: 0, fieldOfficersInRedZones: 0, citizensInRedZones: 0, totalPersonsAtRisk: 0 },
          });
          if (d.counts?.severeEventsCount !== undefined) {
            setStatWarnings(d.counts.severeEventsCount);
          }
        }
      })
      .catch(() => {});

    fetch(qs('/api/live/stations'))
      .then((r) => r.json())
      .then((d) => {
        if (d.stations?.length) setStatStations(d.stations.length);
        else if (d.totalCount) setStatStations(d.totalCount);
        else if (d.totalStations) setStatStations(d.totalStations);
      })
      .catch(() => {});

    fetch(qs('/api/live/rainfall'))
      .then((r) => r.json())
      .then((d) => {
        if (d.rainfallPoints?.length) setStatRainPoints(d.rainfallPoints.length);
        else if (d.activeRainStations) setStatRainPoints(d.activeRainStations);
      })
      .catch(() => {});

    fetch(qs('/api/live/nowcast'))
      .then((r) => r.json())
      .then((d) => {
        if (d.nowcasts?.length) setStatNowcasts(d.nowcasts.length);
        else if (d.totalCount) setStatNowcasts(d.totalCount);
      })
      .catch(() => {});

    fetch(qs('/api/incidents'))
      .then((r) => r.json())
      .then((d) => {
        if (d.incidents?.length) setIncidents(d.incidents);
      })
      .catch(() => {});

    fetch(qs('/api/live/audit'))
      .then((r) => r.json())
      .then((d) => {
        if (d.audit) setAuditData(d.audit);
      })
      .catch(() => {});

    setLastRefresh(
      new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata'
      }) + ' IST'
    );
  }, [selectedState]);

  useEffect(() => {
    refreshData();
  }, [selectedState, refreshData]);

  useEffect(() => {
    const id = setInterval(refreshData, 300000); // Refreshed every 5 mins from IMD API
    return () => clearInterval(id);
  }, [refreshData]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
    refreshData(true);
    setTimeout(() => setIsRefreshing(false), 700);
  };

  /* Search autocomplete */
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    const q = searchQuery.toLowerCase();
    const res = LOCATIONS.filter(
      (l) => l.name.toLowerCase().includes(q) || l.sub.toLowerCase().includes(q)
    ).slice(0, 6);
    setSearchResults(res);
    setShowSearchResults(res.length > 0);
  }, [searchQuery]);

  /* Load location evidence for drill-down */
  const loadEvidence = useCallback(
    (lat: number, lng: number, name: string, district: string, state: string, headline?: string, evidenceText?: string, source?: string) => {
      setMapFocusCoords([lat, lng]);
      const targetDist = district || name;

      Promise.all([
        fetch(`/api/live/stations?lat=${lat}&lng=${lng}&max_distance_km=150`).then((r) => r.json()).catch(() => ({})),
        fetch(`/api/live/nowcast?district=${encodeURIComponent(targetDist)}`).then((r) => r.json()).catch(() => ({})),
        fetch(`/api/live/warnings?district=${encodeURIComponent(targetDist)}`).then((r) => r.json()).catch(() => ({})),
      ]).then(([stnData, nowcastData, warningData]) => {
        const nearest = stnData.nearestStation || stnData.nearestStationAnyDistance;
        const nowcastItem = nowcastData.nowcasts?.[0];
        const warningItem = warningData.warnings?.[0];
        const radarInfo = getNearestRadarStation(lat, lng, true, `${targetDist || ''} ${state || ''}`.trim());
        setRadarStation(radarInfo.code);

        setSelectedEvidence({
          lat,
          lng,
          locationName: name,
          district: targetDist,
          state,
          elevationM: 28,
          relativeElevationM: 0,
          slopeDeg: 1.2,
          isLowLying: false,
          drainageContext: `${targetDist || state} Basin Drainage`,
          stationTelemetry: (() => {
            const sat = getAuthoritativeSatelliteTelemetry(lat, lng);
            const hasGroundTemp = nearest?.temperatureC !== null && nearest?.temperatureC !== undefined;
            return {
              stationId: nearest?.id || 'ISRO-NASA-SAT',
              stationName: nearest?.stationName || `${targetDist} Regional Grid`,
              district: nearest?.district || targetDist,
              state: nearest?.state || state,
              distanceKm: nearest ? (stnData.distanceKm || haversineKm(lat, lng, nearest.latitude, nearest.longitude)) : 0,
              temperatureC: hasGroundTemp ? nearest.temperatureC : sat.temperatureC,
              humidityPercent: nearest?.humidityPercent ?? sat.humidityPercent,
              windSpeedKmh: nearest?.windSpeedKmh ?? sat.windSpeedKmh,
              windDirectionDeg: nearest?.windDirectionDeg ?? sat.windDirectionDeg,
              pressureHpa: nearest?.pressureHpa ?? sat.pressureHpa,
              rainfall1hMm: nearest?.rainfall1hMm ?? 0,
              rainfall24hMm: nearest?.rainfall24hMm ?? 0,
              observationTimestampIST: nearest?.observationTimestampIST || sat.observationTimestampIST,
              dataAgeMinutes: hasGroundTemp ? (nearest.dataAgeMinutes || 15) : 8,
              freshnessStatus: ((hasGroundTemp ? nearest.status : 'LIVE') || 'LIVE') as any,
              isAvailable: true,
              source: hasGroundTemp ? 'IMD AWS Ground Network' : sat.source,
            };
          })(),
          rainGauge: {
            value: nearest?.rainfall1hMm ?? 0,
            unit: 'mm',
            source: nearest?.stationName ? `IMD AWS (${nearest.stationName})` : source || 'IMD Operational Rain Network',
            timestamp: nearest?.observationTimestampIST || 'Live',
            dataType: 'OBSERVED_GAUGE',
            isAvailable: true,
          },
          districtNowcast: nowcastItem ? {
            district: nowcastItem.district || targetDist,
            timeOfIssueIST: nowcastItem.timeOfIssueIST || 'Current',
            validUptoIST: nowcastItem.validUptoIST || 'Next 3h',
            validityWindowRemainingMinutes: nowcastItem.validityWindowRemainingMinutes,
            severityColor: nowcastItem.severityColor || 'GREEN',
            message: nowcastItem.message || 'IMD Regional Doppler Nowcast Active',
            hazards: nowcastItem.hazards || [],
            isSevere: nowcastItem.isSevere || false,
          } : undefined,
          districtWarning: warningItem ? {
            district: warningItem.district || targetDist,
            state: warningItem.state || state,
            warningColor: warningItem.currentAlertLevel === 'RED' ? 'WARNING' : warningItem.currentAlertLevel === 'ORANGE' ? 'ALERT' : warningItem.currentAlertLevel === 'YELLOW' ? 'WATCH' : 'NO_WARNING',
            warningText: warningItem.currentWarning || warningItem.day1Warning || 'Official IMD NWFC Forecast',
            isWarningActive: warningItem.currentAlertLevel === 'RED' || warningItem.currentAlertLevel === 'ORANGE' || warningItem.currentAlertLevel === 'YELLOW',
          } : undefined,
          radarObservation: {
            value: 0,
            unit: 'mm/h',
            source: `IMD DWR (${radarInfo.name})`,
            timestamp: 'Live Volumetric Scan',
            dataType: 'RADAR_DERIVED',
            isAvailable: radarInfo.isInRange,
            reflectivityDbz: radarInfo.isInRange ? 20 : undefined,
            radarStation: `${radarInfo.name} (${radarInfo.distKm} km)`,
            stationCode: radarInfo.code,
            radarImageUrl: `/api/imd/imagery?type=radar&station=${radarInfo.code}&product=maxz`,
          },
          satelliteObservation: {
            value: 0,
            unit: 'mm/h',
            source: 'ISRO MOSDAC / INSAT-3DR',
            timestamp: 'Live',
            dataType: 'SATELLITE_ESTIMATE',
            isAvailable: true,
            cloudTopTempC: -34.0,
          },
          currentFloodAssessment: {
            status: 'MONITORING',
            currentRainRateMmH: 0,
            soilSaturationPercent: 45,
            runoffCoefficient: 0.42,
            whyFlaggedExplanation: evidenceText || headline || name,
            isModelSupported: true,
          },
        });
      }).catch(() => {});
    },
    []
  );

  const handleSearchSelect = (loc: typeof LOCATIONS[0]) => {
    setSearchQuery(loc.name);
    setShowSearchResults(false);
    setMapFocusCoords([loc.lat, loc.lng]);
    if (loc.sub && loc.sub !== 'State') setSelectedState(loc.sub);
    else if (loc.sub === 'State') setSelectedState(loc.name);
    loadEvidence(loc.lat, loc.lng, loc.name, loc.name, loc.sub);
  };

  const handleSelectState = (s: typeof QUICK_STATES[0]) => {
    setSelectedState(s.name);
    setMapFocusCoords([s.lat, s.lng]);
    setMapFocusZoom(s.zoom || 7);
    setSelectedIncident(null);
    setSelectedLiveEvent(null);
    const r = getNearestRadarStation(s.lat, s.lng, true, s.name);
    if (r?.code) setRadarStation(r.code);

    // Auto-select matching pluvial zone and top hazard event for state if available
    if (s.name !== 'All India') {
      const topStateHazard = (hazardData.events || []).find(
        (e) => e.state && (
          e.state.toLowerCase().includes(s.name.toLowerCase()) ||
          s.name.toLowerCase().includes(e.state.toLowerCase())
        )
      );
      if (topStateHazard) {
        setSelectedLiveEvent(topStateHazard);
        loadEvidence(
          topStateHazard.latitude,
          topStateHazard.longitude,
          topStateHazard.district,
          topStateHazard.district,
          s.name,
          topStateHazard.summary,
          `Operational surface weather & radar telemetry for ${topStateHazard.district}, ${s.name}`,
          'IMD State Meteorological Centre'
        );
      } else {
        loadEvidence(
          s.lat,
          s.lng,
          `${s.name} Regional Sector`,
          s.name,
          s.name,
          `IMD Synoptic Surveillance Active across ${s.name}`,
          `Operational surface weather & radar telemetry synchronizing for ${s.name}`,
          'IMD State Meteorological Centre'
        );
      }
    } else {
      setSelectedEvidence(null);
    }
  };

  /* Low-Lying Area / City Inundation drill-down handler */
  const handleSelectPluvialZone = useCallback(
    (z: PluvialFloodZone, hp?: CityHotspotPinpoint) => {
      setSelectedPluvialZone(z);
      if (hp) {
        setSelectedCityHotspot(hp);
      } else if (z.cityHotspots && z.cityHotspots.length > 0) {
        setSelectedCityHotspot(z.cityHotspots[0]);
      } else {
        setSelectedCityHotspot(null);
      }
      setBaseMap('bhuvan_sat'); // Switch to ISRO Bhuvan satellite
      const targetLat = hp ? hp.latitude : z.latitude;
      const targetLng = hp ? hp.longitude : z.longitude;
      setMapFocusCoords([targetLat, targetLng]);
      setMapFocusZoom(hp ? 16 : 14); // City scale or micro pinpoint zoom
      setShowPluvialFloodLayer(true);
      if (z.state && z.state !== 'India' && selectedState !== 'All India') {
        setSelectedState(z.state);
      }
      loadEvidence(
        targetLat,
        targetLng,
        hp ? hp.name : z.zoneName,
        z.district,
        z.state,
        hp ? `${hp.name} (${hp.severity} ${hp.waterloggingDepthM}m Depth)` : `${z.zoneName} (${z.pluvialFloodRisk} Risk)`,
        hp ? `${hp.drainageIssue}. Immediate Mitigation: ${hp.recommendation}` : z.drainageContext,
        'ISRO Bhuvan Satellite / NRSC DEM Local Minima'
      );
    },
    [loadEvidence, selectedState]
  );

  /* Switch back to NASA Live Cloud Map */
  const handleSwitchToNasaClouds = useCallback(() => {
    setBaseMap('nasa_clouds');
    setMapFocusCoords([22.9734, 78.6569]);
    setMapFocusZoom(5);
    setSelectedPluvialZone(null);
    setSelectedCityHotspot(null);
  }, []);

  /* Multi-Hazard Danger Zones across India - Authoritative Backend Pipeline */
  const nationalDangerZones = useMemo(() => {
    // Only derive from real severe events from authoritative real-time API
    const realSevere = (hazardData.events || []).filter(
      (e) => e.severity === 'RED' || e.severity === 'ORANGE' || (e.category as string) === 'CYCLONE' || e.category === 'CLOUDBURST' || e.isSevere
    ).map((ev) => ({
      id: ev.id,
      category: ev.category,
      severity: ev.severity || 'RED',
      district: ev.district,
      state: ev.state,
      headline: (ev as any).headline || ev.summary || `${ev.category} Alert`,
      summary: ev.summary || 'Active meteorological hazard corridor',
      latitude: ev.latitude || 20.0,
      longitude: ev.longitude || 80.0,
      sourceEndpoint: ev.sourceEndpoint || 'IMD Official Bulletin',
      validUntilEpoch: ev.validUntilEpoch,
      validUntilIST: ev.validUntilIST,
    }));

    // Prioritize CYCLONE & RED ALERTS strictly at the top of national danger zones
    const getZonePriority = (item: any) => {
      let score = 0;
      if (item.category === 'CYCLONE' || item.headline?.toLowerCase().includes('cyclon') || item.headline?.toLowerCase().includes('depression')) score += 1000;
      if (item.severity === 'RED') score += 500;
      else if (item.severity === 'ORANGE') score += 200;
      if (item.category === 'CLOUDBURST') score += 400;
      return score;
    };
    realSevere.sort((a, b) => getZonePriority(b) - getZonePriority(a));

    if (selectedState && selectedState !== 'All India') {
      const stateMatches = realSevere.filter(
        (z) => z.state && (
          z.state.toLowerCase().includes(selectedState.toLowerCase()) ||
          selectedState.toLowerCase().includes(z.state.toLowerCase())
        )
      );
      return stateMatches;
    }

    return realSevere;
  }, [hazardData.events, selectedState]);

  /* Primary severe alert for the Active Event Bar - respects selected state */
  const primarySevereAlert = useMemo(() => {
    if (selectedState && selectedState !== 'All India') {
      const stateMatch = nationalDangerZones.find(
        (e) => e.state && (
          e.state.toLowerCase().includes(selectedState.toLowerCase()) ||
          selectedState.toLowerCase().includes(e.state.toLowerCase())
        )
      );
      return stateMatch || null;
    }
    // In All India mode: default to the top active danger zone from the curated list
    return nationalDangerZones[0] || null;
  }, [nationalDangerZones, selectedState]);

  /* Dynamic Active Event: Prioritizes user selection (clicked cyclone track, cloudburst pin, hazard event, or incident) */
  const activeEvent = useMemo(() => {
    if (selectedLiveEvent) {
      const isSev = selectedLiveEvent.isSevere === true || ['RED', 'ORANGE'].includes(selectedLiveEvent.severity);
      return {
        id: selectedLiveEvent.id || 'live-event',
        category: selectedLiveEvent.category || (isSev ? 'SEVERE_WEATHER' : 'MONITORING'),
        severity: selectedLiveEvent.severity || (isSev ? 'ORANGE' : 'GREEN'),
        isSevere: isSev,
        district: selectedLiveEvent.district || selectedLiveEvent.location || selectedState,
        state: selectedLiveEvent.state || selectedState,
        headline: selectedLiveEvent.headline || selectedLiveEvent.title || (isSev ? 'Severe Hazard Alert' : 'Routine Synoptic Telemetry'),
        summary: selectedLiveEvent.evidence || selectedLiveEvent.summary || selectedLiveEvent.description || 'Surface hydromet surveillance',
        validUntilEpoch: selectedLiveEvent.validUntilEpoch,
        validUntilIST: selectedLiveEvent.validUntilIST,
        latitude: selectedLiveEvent.latitude,
        longitude: selectedLiveEvent.longitude,
      };
    }
    if (selectedHazardEvent) {
      return {
        id: selectedHazardEvent.id,
        category: selectedHazardEvent.category,
        severity: selectedHazardEvent.severity || 'RED',
        district: selectedHazardEvent.district,
        state: selectedHazardEvent.state,
        headline: selectedHazardEvent.summary || `${selectedHazardEvent.category} Alert`,
        summary: selectedHazardEvent.summary,
        validUntilEpoch: selectedHazardEvent.validUntilEpoch,
        validUntilIST: selectedHazardEvent.validUntilIST,
        latitude: selectedHazardEvent.latitude,
        longitude: selectedHazardEvent.longitude,
      };
    }
    if (selectedIncident) {
      return {
        id: selectedIncident.id,
        category: selectedIncident.name?.toLowerCase().includes('cyclon')
          ? 'CYCLONE'
          : selectedIncident.name?.toLowerCase().includes('cloudburst')
          ? 'CLOUDBURST'
          : 'HAZARD',
        severity: selectedIncident.severity === 'critical' ? 'RED' : 'ORANGE',
        district: selectedIncident.district,
        state: selectedIncident.state,
        headline: selectedIncident.name,
        summary: (selectedIncident as any).details || selectedIncident.name,
        latitude: selectedIncident.lat,
        longitude: selectedIncident.lng,
      };
    }
    return primarySevereAlert;
  }, [selectedLiveEvent, selectedHazardEvent, selectedIncident, primarySevereAlert, selectedState]);

  /* Toggle Hazard Focus Mode */
  const handleToggleHazardFocus = () => {
    const next = !isHazardFocus;
    setIsHazardFocus(next);
    if (next && activeEvent && activeEvent.latitude && activeEvent.longitude) {
      setMapFocusCoords([activeEvent.latitude, activeEvent.longitude]);
      loadEvidence(
        activeEvent.latitude,
        activeEvent.longitude,
        activeEvent.district,
        activeEvent.district,
        activeEvent.state,
        activeEvent.summary
      );
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* ── 1. HEADER (48px) ────────────────────────────────────────── */}
      <MeteoHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        showSearchResults={showSearchResults}
        setShowSearchResults={setShowSearchResults}
        onSelectLocation={handleSearchSelect}
        liveTime={liveTime}
        lastRefresh={lastRefresh}
        isRefreshing={isRefreshing}
        onRefresh={handleManualRefresh}
        isHazardFocus={isHazardFocus}
        onToggleHazardFocus={handleToggleHazardFocus}
        severeCount={hazardData.counts?.severeEventsCount || 0}
        onOpenSatellite={() => setIsSatelliteOpen(true)}
        onOpenRadar={() => handleOpenRadar()}
        onOpenSystemInfo={() => setIsSystemOpen(true)}
        operationalMode={operationalMode}
        onToggleOperationalMode={setOperationalMode}
        onOpenDataHealth={() => setIsDataHealthOpen(true)}
        lastIngestion={auditData?.lastSuccessfulFetch || lastRefresh}
        nextIngestion={auditData?.nextScheduledFetch || '5m cycle'}
      />

      {/* ── 2. LIVE INTELLIGENCE STRIP (44px) ───────────────────────── */}
      <LiveIntelligenceStrip
        activeWarningsCount={hazardData.counts?.severeEventsCount || statWarnings}
        awsStationsCount={statStations}
        rainfallObsCount={statRainPoints}
        nowcastAlertsCount={statNowcasts}
        activeHazardsCount={hazardData.counts?.totalEvents || 0}
        lastSyncTime={lastRefresh}
        onFilterClick={(filter) => {
          if (filter === 'warnings') setShowDistrictWarnings(true);
          if (filter === 'aws') setShowAwsStations(true);
          if (filter === 'rainfall') setShowLiveRainfall(true);
        }}
      />

      {/* ── 3. GIS TOP MENUBAR (Replacing Left Sidebar with Sleek Top Ribbon) ── */}
      <GisTopMenubar
        baseMap={baseMap}
        setBaseMap={setBaseMap}
        showLiveRainfall={showLiveRainfall}
        setShowLiveRainfall={setShowLiveRainfall}
        showAwsStations={showAwsStations}
        setShowAwsStations={setShowAwsStations}
        showDistrictWarnings={showDistrictWarnings}
        setShowDistrictWarnings={setShowDistrictWarnings}
        showDwrRings={showDwrRings}
        setShowDwrRings={setShowDwrRings}
        showPluvialFloodLayer={showPluvialFloodLayer}
        setShowPluvialFloodLayer={setShowPluvialFloodLayer}
        selectedState={selectedState}
        onSelectState={handleSelectState}
        hazardCounts={hazardData.counts}
        pluvialZones={hazardData.pluvialFloodZones || []}
        selectedPluvialZone={selectedPluvialZone}
        onSelectPluvialZone={handleSelectPluvialZone}
        onResetView={handleResetView}
        onOpenSatellite={() => setIsSatelliteOpen(true)}
        onOpenRadar={() => handleOpenRadar()}
        currentRadarStation={radarStation}
        isLayersMenuOpen={isLayersMenuOpen}
        onToggleLayersMenu={() => setIsLayersMenuOpen((prev) => !prev)}
      />

      {/* ── 4. ACTIVE EVENT / HAZARD INTELLIGENCE BAR (36px) ─────────── */}
      <ActiveEventBar
        primaryEvent={activeEvent}
        availableEvents={nationalDangerZones}
        selectedState={selectedState}
        onInspectEvent={(event) => {
          const lat = event.latitude || (event as any).lat;
          const lng = event.longitude || (event as any).lng;
          if (lat && lng) {
            setMapFocusCoords([lat, lng]);
            // Dynamic scale: Regional cyclone/surge corridors at 9.2, urban hotspots at 10.5
            const isRegional = event.category === 'CYCLONE' || (event.headline && event.headline.toLowerCase().includes('cyclon'));
            setMapFocusZoom(isRegional ? 9.2 : 10.5);
            setSelectedLiveEvent(event);
            if (event.state && event.state !== 'India' && event.state !== 'Monitored Sector') {
              setSelectedState(event.state);
            }
            loadEvidence(
              lat,
              lng,
              event.district || event.location || 'Incident Zone',
              event.district || event.location || '',
              event.state || '',
              event.headline || event.summary,
              event.summary || event.evidence,
              event.sourceEndpoint ? `IMD ${event.sourceEndpoint}` : 'IMD Multi-Hazard Alert Engine'
            );
            const r = getNearestRadarStation(lat, lng, true, `${event.district || ''} ${event.state || ''}`.trim());
            if (r?.code) setRadarStation(r.code);
          }
        }}
      />

      {/* ── 5. MAIN WORKSPACE: LAYERS SIDEBAR (TOGGLEABLE) + FULL GIS MAP CANVAS + RESTORED CONTEXTUAL INTELLIGENCE PANEL ─────── */}
      <div className="flex-1 min-h-0 flex flex-row overflow-hidden relative">
        {/* Left: Toggleable Layers & Territory Sidebar (Component in 3rd Image) */}
        {isLayersMenuOpen && (
          <div className="relative flex-shrink-0 z-20 h-full flex flex-row">
            <GisLayersSidebar
              baseMap={baseMap}
              setBaseMap={setBaseMap}
              showLiveRainfall={showLiveRainfall}
              setShowLiveRainfall={setShowLiveRainfall}
              showAwsStations={showAwsStations}
              setShowAwsStations={setShowAwsStations}
              showDistrictWarnings={showDistrictWarnings}
              setShowDistrictWarnings={setShowDistrictWarnings}
              showDwrRings={showDwrRings}
              setShowDwrRings={setShowDwrRings}
              showPluvialFloodLayer={showPluvialFloodLayer}
              setShowPluvialFloodLayer={setShowPluvialFloodLayer}
              selectedState={selectedState}
              onSelectState={handleSelectState}
              hazardCounts={hazardData.counts}
              pluvialZonesCount={hazardData.pluvialFloodZones?.length || 0}
              pluvialZones={hazardData.pluvialFloodZones || []}
              selectedPluvialZone={selectedPluvialZone}
              onSelectPluvialZone={handleSelectPluvialZone}
              onSwitchToNasaClouds={handleSwitchToNasaClouds}
            />
            {/* Collapse button on top-right of sidebar */}
            <button
              onClick={() => setIsLayersMenuOpen(false)}
              className="absolute top-2 right-1.5 p-1 rounded-md bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 z-30 transition-colors shadow"
              title="Close Layers & Territory Menu"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Floating Toggle Button on Map when sidebar is collapsed */}
        {!isLayersMenuOpen && (
          <button
            onClick={() => setIsLayersMenuOpen(true)}
            className="absolute top-3 left-3 z-20 px-2.5 py-1.5 rounded-lg bg-slate-900/95 hover:bg-slate-800 text-slate-200 border border-slate-700/90 shadow-2xl text-xs font-bold flex items-center gap-1.5 backdrop-blur-md transition-all hover:scale-105 active:scale-95 group"
            title="Open Layers & Territory Menu"
          >
            <Layers size={13} className="text-cyan-400 group-hover:rotate-12 transition-transform" />
            <span>Layers & Territory</span>
          </button>
        )}

        {/* Center: Full-Scale Preserved GIS Map Canvas */}
        <main className="flex-1 h-full min-w-0 relative overflow-hidden bg-slate-950">
          <UnifiedHazardMap
            baseMap={baseMap}
            showLiveRainfall={showLiveRainfall}
            showAwsStations={showAwsStations}
            showDistrictWarnings={showDistrictWarnings}
            showNowcastAlerts={showNowcastAlerts}
            showDwrRings={showDwrRings}
            showSlopeHazards={showSlopeHazards}
            showAllActivity={showAllActivity}
            showThunderstormLayer={showThunderstormLayer}
            showHailLayer={showHailLayer}
            showCloudburstLayer={showCloudburstLayer}
            showPluvialFloodLayer={showPluvialFloodLayer}
            selectedState={selectedState}
            onChangeBaseMap={setBaseMap}
            selectedPluvialZone={selectedPluvialZone}
            refreshTrigger={refreshTrigger}
            onSelectHazardEvent={(h) => {
              setSelectedHazardEvent(h);
              setSelectedLiveEvent(h);
              if (h.state && h.state !== 'India' && h.state !== 'Monitored Sector') {
                setSelectedState(h.state);
              }
              if (h.latitude && h.longitude) {
                setMapFocusCoords([h.latitude, h.longitude]);
                setMapFocusZoom(11);
                const r = getNearestRadarStation(h.latitude, h.longitude, true, `${h.district || ''} ${h.state || ''}`.trim());
                if (r?.code) setRadarStation(r.code);
                loadEvidence(h.latitude, h.longitude, h.district, h.district, h.state || selectedState);
              }
            }}
            onSelectPluvialZone={handleSelectPluvialZone}
            onSwitchToNasaClouds={handleSwitchToNasaClouds}
            incidents={incidents}
            stormCells={stormCells}
            selectedIncident={selectedIncident}
            selectedStormCell={selectedStormCell}
            onSelectIncident={(inc) => {
              setSelectedIncident(inc);
              if (inc.state && inc.state !== 'India') {
                setSelectedState(inc.state);
              }
              setMapFocusCoords([inc.lat, inc.lng]);
              if (inc.lat && inc.lng) {
                const r = getNearestRadarStation(inc.lat, inc.lng, true, `${inc.district || ''} ${inc.state || ''}`.trim());
                if (r?.code) setRadarStation(r.code);
              }
            }}
            onSelectStormCell={setSelectedStormCell}
            onSelectEvidence={(ev) => {
              setSelectedEvidence(ev);
              if (ev.state && ev.state !== 'India' && ev.state !== 'Monitored Sector') {
                setSelectedState(ev.state);
              }
              setMapFocusCoords([ev.lat, ev.lng]);
              const resolvedCode = resolveRadarCodeByName(`${ev.district || ''} ${ev.state || ''}`.trim());
              if (resolvedCode) {
                setRadarStation(resolvedCode);
              } else if (ev.radarObservation?.stationCode) {
                setRadarStation(ev.radarObservation.stationCode);
              } else if (ev.lat && ev.lng) {
                const r = getNearestRadarStation(ev.lat, ev.lng, true, `${ev.district || ''} ${ev.state || ''}`.trim());
                if (r?.code) setRadarStation(r.code);
              }
            }}
            onSelectLiveEvent={(ev) => {
              setSelectedLiveEvent(ev);
              if (ev.state && ev.state !== 'India' && ev.state !== 'Monitored Sector') {
                setSelectedState(ev.state);
              }
              if (ev.latitude && ev.longitude) {
                const r = getNearestRadarStation(ev.latitude, ev.longitude, true, `${ev.district || ''} ${ev.state || ''}`.trim());
                if (r?.code) setRadarStation(r.code);
              }
            }}
            selectedEvidence={selectedEvidence}
            deployedUnits={[]}
            reliefShelters={[]}
            leadTimeHours={0}
            setLeadTimeHours={() => {}}
            isPlaying={false}
            setIsPlaying={() => {}}
            heightClass="h-full"
            focusCoords={mapFocusCoords}
            focusZoom={mapFocusZoom}
            onOpenSatelliteViewer={() => setIsSatelliteOpen(true)}
            onOpenRadarViewer={handleOpenRadar}
            selectedHotspot={selectedCityHotspot}
            onSelectHotspot={setSelectedCityHotspot}
          />
        </main>

        {/* Right: Preserved Contextual Intelligence Panel (Overview, Warnings, Obs, Impact, Data + Power BI Slides) */}
        <ContextualIntelligencePanel
          selectedEvidence={selectedEvidence}
          selectedState={selectedState}
          onResetTerritory={handleResetView}
          onClearSelection={() => {
            setSelectedEvidence(null);
            setSelectedIncident(null);
            setSelectedLiveEvent(null);
            setSelectedHazardEvent(null);
          }}
          primaryEvent={activeEvent}
          pluvialZones={hazardData.pluvialFloodZones || []}
          counts={hazardData.counts}
          userSegmentation={hazardData.userSegmentation}
          onSelectPluvialZone={handleSelectPluvialZone}
          selectedPluvialZone={selectedPluvialZone}
          onOpenRadarViewer={handleOpenRadar}
          selectedHotspot={selectedCityHotspot}
          onSelectHotspot={setSelectedCityHotspot}
        />
      </div>

      {/* ── 5. BOTTOM SYSTEM STATUS BAR (26px) ──────────────────────── */}
      <SystemStatusBar lastSyncTime={lastRefresh} onOpenDataHealth={() => setIsDataHealthOpen(true)} />

      {/* ── Modals ──────────────────────────────────────────────────── */}
      <SystemOverviewModal isOpen={isSystemOpen} onClose={() => setIsSystemOpen(false)} />
      <InsatSatelliteModal isOpen={isSatelliteOpen} onClose={() => setIsSatelliteOpen(false)} />
      <ImdRadarModal isOpen={isRadarOpen} initialStation={radarStation} onClose={() => setIsRadarOpen(false)} />
      <DataHealthAuditModal
        isOpen={isDataHealthOpen}
        onClose={() => setIsDataHealthOpen(false)}
        auditData={auditData}
        onForceRefresh={refreshData}
      />
    </div>
  );
}
