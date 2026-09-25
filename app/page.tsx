'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { UnifiedHazardMap } from '../components/gis/UnifiedHazardMap';
import { MeteoHeader } from '../components/analytics/MeteoHeader';
import { LiveIntelligenceStrip } from '../components/analytics/LiveIntelligenceStrip';
import { ActiveEventBar } from '../components/analytics/ActiveEventBar';
import { GisLayersSidebar } from '../components/analytics/GisLayersSidebar';
import { ContextualIntelligencePanel } from '../components/analytics/ContextualIntelligencePanel';
import { SystemStatusBar } from '../components/analytics/SystemStatusBar';

import { SystemOverviewModal } from '../components/command/SystemOverviewModal';
import { InsatSatelliteModal } from '../components/command/InsatSatelliteModal';
import { ImdRadarModal } from '../components/command/ImdRadarModal';
import { DerivedHazardEvent, PluvialFloodZone } from './api/live/hazards/route';

import {
  UNIFIED_STORM_CELLS, UnifiedStormCell, MONITORED_DWR_NETWORK,
} from '../components/data/unifiedHazardData';
import { INITIAL_INCIDENTS, DEPLOYED_UNITS, RELIEF_SHELTERS } from '../components/data/mockData';
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
  { name: 'Hooghly', sub: 'West Bengal', lat: 22.9030, lng: 88.3968 },
  { name: 'Bankura', sub: 'West Bengal', lat: 23.2324, lng: 87.0715 },
  { name: 'Sukma', sub: 'Chhattisgarh', lat: 18.7915, lng: 81.6667 },
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
  { name: 'Himachal Pradesh', icon: '⛰️', lat: 31.1048, lng: 77.1734, zoom: 8 },
  { name: 'Uttarakhand', icon: '🏔️', lat: 30.0668, lng: 79.0193, zoom: 8 },
  { name: 'Assam', icon: '🌊', lat: 26.2006, lng: 92.9376, zoom: 7 },
  { name: 'Meghalaya', icon: '🌧️', lat: 25.4670, lng: 91.3662, zoom: 8 },
  { name: 'Kerala', icon: '🌴', lat: 10.8505, lng: 76.2711, zoom: 8 },
  { name: 'Maharashtra', icon: '🏙️', lat: 19.7515, lng: 75.7139, zoom: 7 },
  { name: 'Tamil Nadu', icon: '🏛️', lat: 11.1271, lng: 78.6569, zoom: 7 },
  { name: 'West Bengal', icon: '🌾', lat: 22.9868, lng: 87.8550, zoom: 7 },
  { name: 'Sikkim', icon: '🏔️', lat: 27.5330, lng: 88.5122, zoom: 9 },
  { name: 'Jammu & Kashmir', icon: '❄️', lat: 33.7782, lng: 76.5762, zoom: 7 },
];

export default function MeteoGISDashboard() {
  /* Data state */
  const [incidents, setIncidents] = useState<HazardIncident[]>(INITIAL_INCIDENTS);
  const [stormCells] = useState<UnifiedStormCell[]>(UNIFIED_STORM_CELLS);
  const [selectedIncident, setSelectedIncident] = useState<HazardIncident | null>(null);
  const [selectedStormCell, setSelectedStormCell] = useState<UnifiedStormCell | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<ClickedLocationEvidence | null>(null);
  const [selectedLiveEvent, setSelectedLiveEvent] = useState<any | null>(null);
  const [mapFocusCoords, setMapFocusCoords] = useState<[number, number] | null>(null);

  /* Live KPI counts */
  const [statWarnings, setStatWarnings] = useState<number>(0);
  const [statStations, setStatStations] = useState<number>(1165);
  const [statRainPoints, setStatRainPoints] = useState<number>(245);
  const [statNowcasts, setStatNowcasts] = useState<number>(14);
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
  const [selectedState, setSelectedState] = useState<string>('All India');

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

  /* Modals and search */
  const [isSystemOpen, setIsSystemOpen] = useState<boolean>(false);
  const [isSatelliteOpen, setIsSatelliteOpen] = useState<boolean>(false);
  const [isRadarOpen, setIsRadarOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<typeof LOCATIONS>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

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
  const refreshData = useCallback(() => {
    const stateParam = selectedState && selectedState !== 'All India' ? `?state=${encodeURIComponent(selectedState)}` : '';

    fetch('/api/live/warnings')
      .then((r) => r.json())
      .then((d) => {
        if (d.activeAlertsCount !== undefined) setStatWarnings(d.activeAlertsCount);
        else if (d.totalDistricts) setStatWarnings(d.totalDistricts);
      })
      .catch(() => {});

    fetch(`/api/live/hazards${stateParam}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.status === 'OK') {
          setHazardData({
            events: d.events || [],
            pluvialFloodZones: d.pluvialFloodZones || [],
            counts: d.counts || { totalEvents: 0, severeEventsCount: 0, displayedCount: 0, thunderstorms: 0, hailstorms: 0, cloudbursts: 0 },
            userSegmentation: d.userSegmentation || { touristsInRedZones: 0, fieldOfficersInRedZones: 0, citizensInRedZones: 0, totalPersonsAtRisk: 0 },
          });
          if (d.counts?.severeEventsCount !== undefined) {
            setStatWarnings(d.counts.severeEventsCount);
          }
        }
      })
      .catch(() => {});

    fetch('/api/live/stations')
      .then((r) => r.json())
      .then((d) => {
        if (d.stations?.length) setStatStations(d.stations.length);
        else if (d.totalStations) setStatStations(d.totalStations);
      })
      .catch(() => {});

    fetch('/api/live/rainfall')
      .then((r) => r.json())
      .then((d) => {
        if (d.rainfallPoints?.length) setStatRainPoints(d.rainfallPoints.length);
      })
      .catch(() => {});

    fetch('/api/live/nowcast')
      .then((r) => r.json())
      .then((d) => {
        if (d.nowcasts?.length) setStatNowcasts(d.nowcasts.length);
      })
      .catch(() => {});

    fetch('/api/incidents')
      .then((r) => r.json())
      .then((d) => {
        if (d.incidents?.length) setIncidents(d.incidents);
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
    const id = setInterval(refreshData, 60000);
    return () => clearInterval(id);
  }, [refreshData]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    refreshData();
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
      fetch(`/api/live/stations?lat=${lat}&lng=${lng}&max_distance_km=150`)
        .then((r) => r.json())
        .then((stnData) => {
          const nearest = stnData.nearestStation || stnData.nearestStationAnyDistance;
          const radarNear = MONITORED_DWR_NETWORK.reduce(
            (a, b) => haversineKm(lat, lng, a.lat, a.lng) < haversineKm(lat, lng, b.lat, b.lng) ? a : b,
            MONITORED_DWR_NETWORK[0]
          );
          const radarDist = haversineKm(lat, lng, radarNear.lat, radarNear.lng);

          setSelectedEvidence({
            lat,
            lng,
            locationName: name,
            district,
            state,
            elevationM: 28,
            relativeElevationM: 0,
            slopeDeg: 1.2,
            isLowLying: false,
            drainageContext: `${district || state} Basin Drainage`,
            stationTelemetry: nearest ? {
              stationId: nearest.id,
              stationName: nearest.stationName,
              district: nearest.district,
              state: nearest.state,
              distanceKm: stnData.distanceKm || haversineKm(lat, lng, nearest.latitude, nearest.longitude),
              temperatureC: nearest.temperatureC,
              humidityPercent: nearest.humidityPercent,
              windSpeedKmh: nearest.windSpeedKmh,
              windDirectionDeg: nearest.windDirectionDeg,
              pressureHpa: nearest.pressureHpa,
              rainfall1hMm: nearest.rainfall1hMm,
              rainfall24hMm: nearest.rainfall24hMm,
              observationTimestampIST: nearest.observationTimestampIST || 'Live',
              dataAgeMinutes: nearest.dataAgeMinutes || 15,
              freshnessStatus: (nearest.status || 'LIVE') as any,
              isAvailable: true,
            } : undefined,
            rainGauge: {
              value: nearest?.rainfall1hMm ?? null,
              unit: 'mm',
              source: source || 'IMD AWS Network',
              timestamp: nearest?.observationTimestampIST || 'Live',
              dataType: 'OBSERVED_GAUGE',
              isAvailable: Boolean(nearest),
            },
            radarObservation: {
              value: 0,
              unit: 'mm/h',
              source: `IMD DWR (${radarNear.name})`,
              timestamp: 'Live',
              dataType: 'RADAR_DERIVED',
              isAvailable: radarDist <= 250,
              reflectivityDbz: radarDist <= 250 ? 18 : undefined,
              radarStation: `${radarNear.name} (${Math.round(radarDist)} km)`,
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
        })
        .catch(() => {});
    },
    []
  );

  const handleSearchSelect = (loc: typeof LOCATIONS[0]) => {
    setSearchQuery(loc.name);
    setShowSearchResults(false);
    setMapFocusCoords([loc.lat, loc.lng]);
    if (loc.sub && loc.sub !== 'State') setSelectedState(loc.sub);
    else if (loc.sub === 'State') setSelectedState(loc.name);
    loadEvidence(loc.lat, loc.lng, loc.name, '', loc.sub);
  };

  const handleSelectState = (s: typeof QUICK_STATES[0]) => {
    setSelectedState(s.name);
    setMapFocusCoords([s.lat, s.lng]);
    setSelectedEvidence(null);
    setSelectedIncident(null);
    setSelectedLiveEvent(null);
  };

  /* Primary severe alert for the Active Event Bar */
  const primarySevereAlert =
    (hazardData.events || []).find((e) => e.severity === 'RED' || e.cloudburstStatus === 'CONFIRMED') ||
    (hazardData.events || []).find((e) => e.isSevere) ||
    null;

  /* Dynamic Active Event: Prioritizes user selection (clicked cyclone track, cloudburst pin, hazard event, or incident) */
  const activeEvent = useMemo(() => {
    if (selectedLiveEvent) {
      return {
        id: selectedLiveEvent.id || 'live-event',
        category: selectedLiveEvent.category || (selectedLiveEvent.headline?.toLowerCase().includes('cyclon') ? 'CYCLONE' : 'SEVERE_WEATHER'),
        severity: selectedLiveEvent.severity || 'RED',
        district: selectedLiveEvent.district || selectedLiveEvent.location || selectedState,
        state: selectedLiveEvent.state || selectedState,
        headline: selectedLiveEvent.headline || selectedLiveEvent.title || 'Severe Hazard Alert',
        summary: selectedLiveEvent.evidence || selectedLiveEvent.summary || selectedLiveEvent.description || 'Active meteorological surveillance event',
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
        onOpenRadar={() => setIsRadarOpen(true)}
        onOpenSystemInfo={() => setIsSystemOpen(true)}
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

      {/* ── 3. ACTIVE EVENT / HAZARD INTELLIGENCE BAR (36px) ─────────── */}
      <ActiveEventBar
        primaryEvent={activeEvent}
        selectedState={selectedState}
        onInspectEvent={(event) => {
          if (event.latitude && event.longitude) {
            setMapFocusCoords([event.latitude, event.longitude]);
            loadEvidence(event.latitude, event.longitude, event.district, event.district, event.state, event.summary);
          }
        }}
      />

      {/* ── 4. MAIN WORKSPACE: SIDEBAR + GIS MAP + CONTEXT PANEL ─────── */}
      <div className="flex-1 min-h-0 flex flex-row overflow-hidden relative">
        {/* Left Sidebar: Layers & Territory */}
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
          pluvialZonesCount={hazardData.pluvialFloodZones?.length}
        />

        {/* Center: Preserved GIS Map Canvas */}
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
            onSelectHazardEvent={(h) => {
              setSelectedHazardEvent(h);
              setSelectedLiveEvent(h);
              if (h.state && h.state !== 'India' && h.state !== 'Monitored Sector') {
                setSelectedState(h.state);
              }
              if (h.latitude && h.longitude) {
                setMapFocusCoords([h.latitude, h.longitude]);
              }
            }}
            onSelectPluvialZone={(z) => {
              setSelectedPluvialZone(z);
              if (z.state && z.state !== 'India') {
                setSelectedState(z.state);
              }
              setMapFocusCoords([z.latitude, z.longitude]);
            }}
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
            }}
            onSelectStormCell={setSelectedStormCell}
            onSelectEvidence={(ev) => {
              setSelectedEvidence(ev);
              if (ev.state && ev.state !== 'India' && ev.state !== 'Monitored Sector') {
                setSelectedState(ev.state);
              }
              setMapFocusCoords([ev.lat, ev.lng]);
            }}
            onSelectLiveEvent={(ev) => {
              setSelectedLiveEvent(ev);
              if (ev.state && ev.state !== 'India' && ev.state !== 'Monitored Sector') {
                setSelectedState(ev.state);
              }
            }}
            selectedEvidence={selectedEvidence}
            deployedUnits={DEPLOYED_UNITS}
            reliefShelters={RELIEF_SHELTERS}
            leadTimeHours={0}
            setLeadTimeHours={() => {}}
            isPlaying={false}
            setIsPlaying={() => {}}
            heightClass="h-full"
            focusCoords={mapFocusCoords}
            onOpenSatelliteViewer={() => setIsSatelliteOpen(true)}
            onOpenRadarViewer={() => setIsRadarOpen(true)}
          />
        </main>

        {/* Right: Contextual Intelligence Panel */}
        <ContextualIntelligencePanel
          selectedEvidence={selectedEvidence}
          selectedState={selectedState}
          onResetTerritory={() => {
            setSelectedState('All India');
            setMapFocusCoords([22.9734, 78.6569]);
            setSelectedEvidence(null);
            setSelectedIncident(null);
            setSelectedLiveEvent(null);
            setSelectedHazardEvent(null);
          }}
          onClearSelection={() => {
            setSelectedEvidence(null);
            setSelectedIncident(null);
            setSelectedLiveEvent(null);
            setSelectedHazardEvent(null);
          }}
          primaryEvent={activeEvent}
          pluvialZones={hazardData.pluvialFloodZones || []}
          counts={hazardData.counts}
          onSelectPluvialZone={(z) => {
            setSelectedPluvialZone(z);
            setMapFocusCoords([z.latitude, z.longitude]);
            loadEvidence(z.latitude, z.longitude, z.zoneName, z.district, z.state, `${z.zoneName} (${z.pluvialFloodRisk} Risk)`, z.drainageContext, 'Bhuvan / NRSC DEM Local Minima');
          }}
          selectedPluvialZone={selectedPluvialZone}
        />
      </div>

      {/* ── 5. BOTTOM SYSTEM STATUS BAR (26px) ──────────────────────── */}
      <SystemStatusBar lastSyncTime={lastRefresh} />

      {/* ── Modals ──────────────────────────────────────────────────── */}
      <SystemOverviewModal isOpen={isSystemOpen} onClose={() => setIsSystemOpen(false)} />
      <InsatSatelliteModal isOpen={isSatelliteOpen} onClose={() => setIsSatelliteOpen(false)} />
      <ImdRadarModal isOpen={isRadarOpen} onClose={() => setIsRadarOpen(false)} />
    </div>
  );
}
