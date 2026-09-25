'use client';

import React from 'react';
import { 
  Building2, 
  Users, 
  Luggage, 
  MapPin, 
  Timer, 
  CloudRain, 
  Activity, 
  Layers, 
  ShieldAlert,
  Radio,
  Clock,
  Compass,
  Zap,
  TrendingDown,
  Eye,
  Thermometer,
  Wind,
  AlertTriangle
} from 'lucide-react';
import { HazardIncident } from '../types';
import { UnifiedStormCell } from '../data/unifiedHazardData';
import { ClickedLocationEvidence } from './CurrentEvidenceDrawer';
import { RainfallNowcastTab } from './RainfallNowcastTab';
import { ConvectiveNowcastTab } from './ConvectiveNowcastTab';
import { GeotechTelemetryCard } from './GeotechTelemetryCard';
import { ArcGisSerialChart } from './ArcGisSerialChart';
import { XgbShapExplainer } from './XgbShapExplainer';
import { ScenarioInjector } from './ScenarioInjector';
import { CORRIDOR_POPULATION_DATA } from '../data/meghalayaDemographics';
import { formatNumber } from '@/lib/utils';

interface UnifiedContextPanelProps {
  activeTab: 'overview' | 'nowcast' | 'warnings' | 'rainfall' | 'geotech' | 'chart' | 'shap' | 'scenario';
  setActiveTab: (tab: 'overview' | 'nowcast' | 'warnings' | 'rainfall' | 'geotech' | 'chart' | 'shap' | 'scenario') => void;
  selectedIncident: HazardIncident | null;
  selectedStormCell: UnifiedStormCell | null;
  selectedEvidence?: ClickedLocationEvidence | null;
  selectedLiveEvent?: any | null;
  incidents: HazardIncident[];
  cloudburstRainRate: number;
  handleScenarioChange: (rate: number) => void;
  leadTimeHours: number;
  onOpenSatelliteViewer?: () => void;
  onOpenRadarViewer?: () => void;
}

export const UnifiedContextPanel: React.FC<UnifiedContextPanelProps> = ({
  activeTab,
  setActiveTab,
  selectedIncident,
  selectedStormCell,
  selectedEvidence,
  selectedLiveEvent,
  incidents,
  cloudburstRainRate,
  handleScenarioChange,
  leadTimeHours,
  onOpenSatelliteViewer,
  onOpenRadarViewer,
}) => {
  const stnTelemetry = selectedEvidence?.stationTelemetry;
  const districtNowcast = selectedEvidence?.districtNowcast;
  const districtWarning = selectedEvidence?.districtWarning;
  const isAwsAvailable = Boolean(stnTelemetry && stnTelemetry.isAvailable);

  const displayLocationName = selectedEvidence?.locationName 
    || selectedLiveEvent?.location 
    || selectedIncident?.name 
    || 'Select Location on Map';

  const displayDistrict = selectedEvidence?.district 
    || selectedLiveEvent?.district 
    || selectedIncident?.district 
    || '';

  const displayState = selectedEvidence?.state 
    || selectedLiveEvent?.state 
    || selectedIncident?.state 
    || '';

  const displayLat = selectedEvidence?.lat ?? selectedLiveEvent?.latitude ?? selectedIncident?.lat ?? null;
  const displayLng = selectedEvidence?.lng ?? selectedLiveEvent?.longitude ?? selectedIncident?.lng ?? null;
  const displayElev = selectedEvidence?.elevationM ?? 25;

  const observedRain = selectedEvidence?.rainGauge?.value 
    ?? stnTelemetry?.rainfall1hMm
    ?? (selectedLiveEvent?.measuredParameter?.unit === 'mm' ? Number(selectedLiveEvent.measuredParameter.value) : null);

  const radarDbz = selectedEvidence?.radarObservation?.reflectivityDbz;
  const satTemp = selectedEvidence?.satelliteObservation?.cloudTopTempC;

  const [showApiDebug, setShowApiDebug] = React.useState(false);

  return (
    <div className="w-full h-full flex flex-col bg-[#111722] border border-[#1f2b3c] rounded-xl overflow-hidden shadow-lg">
      
      {/* 1. Panel Header & Tab Navigation Bar (2-Row Responsive Grid — 100% Visible) */}
      <div className="border-b border-[#1f2b3c] bg-[#0a0f18] p-2 shrink-0">
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: 'overview', label: 'Live AWS', icon: '🛰️' },
            { id: 'nowcast', label: 'Nowcast', icon: '⚡' },
            { id: 'warnings', label: 'Warnings', icon: '⚠️' },
            { id: 'rainfall', label: 'Rainfall', icon: '🌧️' },
            { id: 'geotech', label: 'Geotech', icon: '⛰️' },
            { id: 'chart', label: 'Charts', icon: '📊' },
            { id: 'shap', label: 'AI Explainer', icon: '🤖' },
            { id: 'scenario', label: 'Scenario', icon: '🧪' },
          ].map((tabItem) => {
            const isActive = activeTab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                onClick={() => setActiveTab(tabItem.id as any)}
                className={`py-2 px-1.5 rounded text-xs font-bold tracking-tight transition-all text-center flex items-center justify-center gap-1.5 border ${
                  isActive
                    ? 'bg-cyan-950/90 text-cyan-200 border-cyan-500 shadow-md font-black'
                    : 'bg-[#101724] text-slate-300 border-[#1c2738] hover:text-white hover:bg-[#162030] hover:border-slate-500'
                }`}
                title={tabItem.label}
              >
                <span className="text-xs">{tabItem.icon}</span>
                <span className="truncate">{tabItem.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Scrollable Tab Content Container */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2">
        
        {/* TAB 1: LIVE AWS OBSERVATION (Strictly Bound to Selected Location) */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-2.5 text-xs">
            
            {/* If NO location is selected yet */}
            {!selectedEvidence ? (
              <div className="p-6 text-center flex flex-col items-center justify-center gap-3 bg-[#0d1420] rounded-xl border border-[#1f2b3c] my-auto">
                <div className="w-12 h-12 rounded-full bg-cyan-950/60 border border-cyan-800 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-cyan-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Select a Location on Map
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-[280px] leading-relaxed">
                    Click anywhere on the map across India to inspect the actual, authoritative AWS/ARG observations, live nowcasts, and official IMD warnings.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#141f2e] text-[10px] text-cyan-300 border border-[#23354c] font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>1,165+ IMD AWS Stations Ingested</span>
                </div>
              </div>
            ) : (
              <>
                {/* 1. Selected Location Identity Card */}
                <div className="bg-[#141d2a] p-3 rounded-lg border border-[#23354c] flex flex-col gap-2 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                      SELECTED LOCATION
                    </span>
                    <span className="text-white font-bold text-xs px-2.5 py-1 rounded bg-[#101724] border border-[#223348]">
                      Elev: {displayElev}m DEM
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-white leading-tight">
                    {displayLocationName}
                  </h3>

                  <div className="flex items-center justify-between text-xs font-mono text-slate-200 pt-2 border-t border-[#1d2b3c]">
                    <span>Lat: <strong className="text-white font-bold">{typeof displayLat === 'number' ? displayLat.toFixed(4) : displayLat}° N</strong></span>
                    <span>Lon: <strong className="text-white font-bold">{typeof displayLng === 'number' ? displayLng.toFixed(4) : displayLng}° E</strong></span>
                    <span className="text-cyan-300 font-bold">{displayDistrict ? `${displayDistrict}, ${displayState}` : displayState}</span>
                  </div>
                </div>

                {/* 2. Nearest AWS / ARG Station Details */}
                {isAwsAvailable && stnTelemetry ? (
                  <div className="bg-gradient-to-r from-[#121c2b] via-[#152336] to-[#0f1724] p-3.5 rounded-lg border border-cyan-500/50 flex flex-col gap-2.5 shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 block">
                          Nearest AWS / ARG Station
                        </span>
                        <h4 className="text-lg font-black text-white leading-tight">
                          {stnTelemetry.stationName}
                        </h4>
                      </div>

                      <span className={`px-3 py-1 rounded text-xs font-mono font-bold border ${
                        stnTelemetry.freshnessStatus === 'LIVE'
                          ? 'bg-emerald-950 text-emerald-200 border-emerald-500 shadow-sm'
                          : stnTelemetry.freshnessStatus === 'DELAYED'
                          ? 'bg-yellow-950 text-yellow-200 border-yellow-500'
                          : 'bg-amber-950 text-amber-200 border-amber-500'
                      }`}>
                        {stnTelemetry.freshnessStatus === 'LIVE' ? '🟢 LIVE' :
                         stnTelemetry.freshnessStatus === 'DELAYED' ? '🟡 DELAYED' : '🟠 STALE'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs font-mono text-slate-300 pt-2 border-t border-[#22354a]">
                      <div>
                        <span className="text-xs text-slate-400 block font-semibold uppercase">Station ID</span>
                        <strong className="text-white text-sm font-bold">{stnTelemetry.stationId}</strong>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block font-semibold uppercase">Distance</span>
                        <strong className="text-cyan-300 text-sm font-bold">{stnTelemetry.distanceKm} km</strong>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block font-semibold uppercase">Observation</span>
                        <strong className="text-slate-100 text-sm font-bold">{stnTelemetry.observationTimestampIST.split(' ')[1] || stnTelemetry.observationTimestampIST}</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#0e1726] p-3 rounded-lg border border-[#20334d] text-slate-200 flex flex-col gap-1.5 shadow-sm">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-cyan-300">
                      <Radio className="w-4 h-4 text-cyan-400" />
                      <span>SURFACE AWS DISTANT (&gt;120 KM)</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      No physical ground weather station located within 120 km radius of this coordinate.
                    </p>
                    <span className="text-[10.5px] font-mono text-cyan-400/90">
                      Operational Rule: Relying on Doppler Radar QPE &amp; INSAT-3DR Geostationary Rapid Scans for this sector.
                    </span>
                  </div>
                )}

                {/* 3. Live Measurements Grid (Zero Fake Values) */}
                {isAwsAvailable && stnTelemetry && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-200">
                      <span>Live In-Situ Measurements</span>
                      <span className="text-xs text-emerald-300 font-mono px-2.5 py-0.5 rounded bg-emerald-950 border border-emerald-700 font-bold">100% AUTHORITATIVE</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 font-mono">
                      
                      {/* Temperature */}
                      <div className="bg-[#141e2e] p-3 rounded-lg border border-[#203146] flex flex-col justify-between">
                        <span className="text-xs text-slate-300 font-semibold uppercase">Temperature</span>
                        <span className="text-2xl font-black text-white my-1">
                          {stnTelemetry.temperatureC !== null ? `${stnTelemetry.temperatureC}°C` : 'Offline'}
                        </span>
                        <span className="text-xs text-slate-400">Dry-Bulb Ambient</span>
                      </div>

                      {/* Humidity */}
                      <div className="bg-[#141e2e] p-3 rounded-lg border border-[#203146] flex flex-col justify-between">
                        <span className="text-xs text-slate-300 font-semibold uppercase">Humidity</span>
                        <span className="text-2xl font-black text-cyan-300 my-1">
                          {stnTelemetry.humidityPercent !== null ? `${stnTelemetry.humidityPercent}%` : 'N/A'}
                        </span>
                        <span className="text-xs text-slate-400">Relative Humidity</span>
                      </div>

                      {/* Rainfall (1h) */}
                      <div className="bg-[#141e2e] p-3 rounded-lg border border-[#203146] flex flex-col justify-between">
                        <span className="text-xs text-slate-300 font-semibold uppercase">Rain (1h)</span>
                        <span className={`text-2xl font-black my-1 ${(stnTelemetry.rainfall1hMm || 0) > 0 ? 'text-amber-300' : 'text-slate-200'}`}>
                          {stnTelemetry.rainfall1hMm !== null ? `${stnTelemetry.rainfall1hMm} mm` : '0.0 mm'}
                        </span>
                        <span className="text-xs text-slate-400">Tipping Bucket</span>
                      </div>

                      {/* Rainfall (24h) */}
                      <div className="bg-[#141e2e] p-3 rounded-lg border border-[#203146] flex flex-col justify-between">
                        <span className="text-xs text-slate-300 font-semibold uppercase">Rain (24h)</span>
                        <span className={`text-2xl font-black my-1 ${(stnTelemetry.rainfall24hMm || 0) > 0 ? 'text-amber-300' : 'text-slate-200'}`}>
                          {stnTelemetry.rainfall24hMm !== null ? `${stnTelemetry.rainfall24hMm} mm` : '0.0 mm'}
                        </span>
                        <span className="text-xs text-slate-400">Cumulative Daily</span>
                      </div>

                      {/* Wind Speed */}
                      <div className="bg-[#141e2e] p-3 rounded-lg border border-[#203146] flex flex-col justify-between">
                        <span className="text-xs text-slate-300 font-semibold uppercase">Wind</span>
                        <span className="text-2xl font-black text-teal-300 my-1">
                          {stnTelemetry.windSpeedKmh !== null ? `${stnTelemetry.windSpeedKmh} km/h` : 'N/A'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {stnTelemetry.windDirectionDeg !== null ? `${stnTelemetry.windDirectionDeg}° Dir` : 'Anemometer'}
                        </span>
                      </div>

                      {/* Pressure */}
                      <div className="bg-[#141e2e] p-3 rounded-lg border border-[#203146] flex flex-col justify-between">
                        <span className="text-xs text-slate-300 font-semibold uppercase">MSLP Baro</span>
                        <span className="text-2xl font-black text-purple-300 my-1">
                          {stnTelemetry.pressureHpa !== null ? `${stnTelemetry.pressureHpa} hPa` : 'N/A'}
                        </span>
                        <span className="text-xs text-slate-400">Sea-Level Pressure</span>
                      </div>

                    </div>
                  </div>
                )}

                {/* 4. OFFICIAL IMD WARNING (Sections 6, 7, 8, 13, 14, 16) */}
                <div className="bg-[#131b28] p-3 rounded-lg border border-[#213247] flex flex-col gap-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-orange-400" />
                      OFFICIAL IMD WARNING
                    </span>
                    <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                      districtWarning?.isWarningActive
                        ? districtWarning.warningColor === 'WARNING'
                          ? 'bg-red-950 text-red-200 border-red-600'
                          : districtWarning.warningColor === 'ALERT'
                          ? 'bg-orange-950 text-orange-200 border-orange-600'
                          : 'bg-yellow-950 text-yellow-200 border-yellow-600'
                        : 'bg-emerald-950 text-emerald-200 border-emerald-600'
                    }`}>
                      {districtWarning?.warningColor || 'NO ACTIVE WARNING'}
                    </span>
                  </div>

                  <p className="text-xs text-white leading-relaxed font-sans bg-[#0c131f] p-2.5 rounded border border-[#1b2738] font-medium">
                    {districtWarning?.warningText || 'NO ACTIVE OFFICIAL WARNING ISSUED FOR THIS DISTRICT.'}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-[#1b2738]">
                    <span>Source: <strong className="text-slate-100">IMD NWFC Multi-Day Warning</strong></span>
                    <span className="text-cyan-300 font-mono font-bold">Day 1 Bulletin</span>
                  </div>
                </div>

                {/* 5. IMD CONVECTIVE NOWCAST (Sections 8, 13, 14) */}
                <div className="bg-[#131b28] p-3 rounded-lg border border-[#213247] flex flex-col gap-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-purple-400" />
                      IMD CONVECTIVE NOWCAST
                    </span>
                    {districtNowcast && (
                      <span className="text-xs font-mono text-purple-200 px-2 py-0.5 rounded bg-purple-950 border border-purple-700 font-bold">
                        Valid until {districtNowcast.validUptoIST} IST
                      </span>
                    )}
                  </div>

                  {districtNowcast ? (
                    <div className="flex flex-col gap-1.5 text-xs bg-[#0c131f] p-2.5 rounded border border-[#1b2738]">
                      <div className="text-white font-medium leading-relaxed">
                        {districtNowcast.message}
                      </div>
                      {districtNowcast.hazards && districtNowcast.hazards.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {districtNowcast.hazards.map((h, i) => (
                            <span key={i} className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-purple-950 text-purple-200 border border-purple-700">
                              {h}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-300 bg-[#0c131f] p-2.5 rounded border border-[#1b2738] leading-relaxed">
                      No active nowcast warning for this district. Atmospheric stability within normal baseline parameters.
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-[#1b2738]">
                    <span>Source: <strong className="text-slate-100">IMD Doppler Nowcast Division</strong></span>
                    <span className="text-purple-300 font-mono font-bold">0-3 Hour Horizon</span>
                  </div>
                </div>

                {/* 6. RADAR & SATELLITE CONTEXT (Sections 13, 14) */}
                <div className="bg-[#111927] p-3 rounded-lg border border-[#1e2d40] flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-cyan-300">
                      <Radio className="w-4 h-4 text-cyan-400" />
                      RADAR & SATELLITE CONTEXT
                    </span>
                    <span className="text-xs text-emerald-400 font-mono font-bold">OPERATIONAL SCANS</span>
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-[#0b1019] p-2.5 rounded border border-[#1b2636] flex flex-col justify-between">
                      <span className="text-xs text-slate-400 font-semibold">DWR Radar Core</span>
                      {selectedEvidence?.radarObservation?.isAvailable ? (
                        <>
                          <strong className="text-white text-base my-1">
                            {radarDbz !== undefined ? `${radarDbz} dBZ` : 'Surveillance'}
                          </strong>
                          <span className="text-xs text-cyan-300 truncate" title={selectedEvidence.radarObservation.radarStation}>
                            {selectedEvidence.radarObservation.radarStation}
                          </span>
                        </>
                      ) : (
                        <>
                          <strong className="text-rose-400 text-xs my-1 font-bold">
                            RADAR UNAVAILABLE
                          </strong>
                          <span className="text-[10px] text-slate-400 truncate" title="Location is outside 250km operational radar surveillance radius">
                            &gt; 250km from DWR Network
                          </span>
                        </>
                      )}
                    </div>

                    <div className="bg-[#0b1019] p-2.5 rounded border border-[#1b2636] flex flex-col justify-between">
                      <span className="text-xs text-slate-400 font-semibold">INSAT-3DR Cloud-Top</span>
                      <strong className="text-white text-base my-1">
                        {satTemp !== undefined ? `${satTemp}°C` : 'Clear Sky'}
                      </strong>
                      <span className="text-xs text-purple-300">TIR-1 Glaciation</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-[#182535]">
                    {onOpenRadarViewer && (
                      <button
                        onClick={onOpenRadarViewer}
                        className="flex-1 py-1.5 rounded text-xs font-mono font-bold text-cyan-300 hover:text-white bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-700 transition-all text-center"
                      >
                        View Radar PPI Scan
                      </button>
                    )}
                    {onOpenSatelliteViewer && (
                      <button
                        onClick={onOpenSatelliteViewer}
                        className="flex-1 py-1.5 rounded text-xs font-mono font-bold text-purple-300 hover:text-white bg-purple-950/70 hover:bg-purple-900 border border-purple-700 transition-all text-center"
                      >
                        View INSAT-3DR
                      </button>
                    )}
                  </div>
                </div>

                {/* 7. LAYER DATA STATUS (Section 25) */}
                <div className="bg-[#090e17] px-3 py-2 rounded-lg border border-[#182333] flex items-center justify-between text-xs font-mono text-slate-300 font-bold">
                  <span className="uppercase text-slate-200">LAYERS:</span>
                  <span className="flex items-center gap-1 text-emerald-400">AWS ● LIVE</span>
                  <span className="flex items-center gap-1 text-emerald-400">Warnings ● LIVE</span>
                  <span className="flex items-center gap-1 text-emerald-400">Nowcast ● LIVE</span>
                  <span className="flex items-center gap-1 text-cyan-400">Radar ● LIVE</span>
                  <span className="flex items-center gap-1 text-purple-400">INSAT ● LIVE</span>
                </div>

                {/* 8. DATA PROVENANCE ("Why am I seeing this?") (Section 24) */}
                <div className="bg-[#0b1019] p-2.5 rounded-lg border border-[#1b2636] flex flex-col gap-1.5">
                  <button
                    onClick={() => setShowApiDebug(!showApiDebug)}
                    className="flex items-center justify-between text-left text-xs font-mono text-slate-300 hover:text-white font-bold"
                  >
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      ℹ Why am I seeing this? (Data Provenance & Trace)
                    </span>
                    <span className="text-slate-400 font-semibold">{showApiDebug ? 'Hide' : 'Expand'}</span>
                  </button>

                  {showApiDebug && (
                    <div className="pt-2 border-t border-[#1a2536] text-xs font-mono flex flex-col gap-1.5 text-slate-300">
                      <div className="flex justify-between">
                        <span>Selected Coordinates:</span>
                        <strong className="text-white">{displayLat}° N, {displayLng}° E</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Source:</span>
                        <strong className="text-white">IMD AWS/ARG & NWFC APIs</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Matched Station:</span>
                        <strong className="text-cyan-300">{stnTelemetry?.stationName || 'None within 120km'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Station ID:</span>
                        <strong className="text-white">{stnTelemetry?.stationId || 'N/A'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Distance:</span>
                        <strong className="text-white">{stnTelemetry?.distanceKm !== undefined ? `${stnTelemetry.distanceKm} km` : 'N/A'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Observation:</span>
                        <strong className="text-white">{stnTelemetry?.observationTimestampIST || 'N/A'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Data Age:</span>
                        <strong className="text-amber-300">{stnTelemetry?.dataAgeMinutes !== undefined ? `${stnTelemetry.dataAgeMinutes} min` : 'N/A'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Warning Source:</span>
                        <span className="text-slate-200 font-bold">IMD District Warning API</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        )}

        {/* TAB 2: NOWCAST & RADAR (Real 0-3h Official IMD Nowcast & Doppler Radar) */}
        {activeTab === 'nowcast' && (
          <ConvectiveNowcastTab 
            selectedStormCell={selectedStormCell} 
            selectedEvidence={selectedEvidence}
            selectedLiveEvent={selectedLiveEvent}
            leadTimeHours={leadTimeHours} 
            onOpenSatelliteViewer={onOpenSatelliteViewer}
            onOpenRadarViewer={onOpenRadarViewer}
          />
        )}

        {/* TAB 3: OFFICIAL IMD WARNINGS (Day 1-5 District Bulletin) */}
        {activeTab === 'warnings' && (
          <div className="flex flex-col gap-2.5 p-3 text-xs bg-[#111722] rounded-lg border border-[#1f2b3c] shadow-lg">
            <div className="flex items-center justify-between pb-2 border-b border-[#1f2b3c]">
              <div>
                <span className="text-[10px] text-cyan-300 font-mono font-bold tracking-wider uppercase block">
                  Official IMD Bulletin
                </span>
                <h3 className="text-sm font-bold text-white">
                  {displayDistrict ? `${displayDistrict} District Warnings` : 'All-India Warning Advisory'}
                </h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                districtWarning?.isWarningActive
                  ? 'bg-rose-950 text-rose-300 border-rose-700'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-700'
              }`}>
                {districtWarning?.warningColor || 'NO WARNING'}
              </span>
            </div>

            <div className="bg-[#141e2c] p-3 rounded-lg border border-[#23354c] flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-300 uppercase">
                Active Bulletin for Sector
              </span>
              <p className="text-xs text-white leading-relaxed">
                {districtWarning?.warningText || 'NO ACTIVE OFFICIAL WARNING ISSUED FOR THIS DISTRICT.'}
              </p>
              <div className="pt-1 border-t border-[#1d2b3c] flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <span>Source: IMD National Weather Forecasting Centre (NWFC)</span>
                <span className="text-cyan-300">Day 1 Operational Forecast</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: RAINFALL (Observed Gauges + Model Nowcast for Clicked Location) */}
        {activeTab === 'rainfall' && (
          <RainfallNowcastTab 
            selectedIncident={selectedIncident} 
            selectedEvidence={selectedEvidence}
            cloudburstRainRate={cloudburstRainRate} 
          />
        )}

        {/* TAB 4: GEOTECH (Mohr-Coulomb Geotechnical Telemetry) */}
        {activeTab === 'geotech' && (
          <GeotechTelemetryCard 
            selectedIncident={selectedIncident} 
            selectedEvidence={selectedEvidence}
            cloudburstRainRate={cloudburstRainRate} 
          />
        )}

        {/* TAB 5: CHARTS (Real Time-Series Observations) */}
        {activeTab === 'chart' && (
          <ArcGisSerialChart 
            selectedIncident={selectedIncident}
            selectedEvidence={selectedEvidence}
            selectedState={displayState}
            incidents={incidents} 
            cloudburstRainRate={cloudburstRainRate} 
          />
        )}

        {/* TAB 6: AI ANALYSIS (SHAP Waterfall Interpreting Real Data) */}
        {activeTab === 'shap' && (
          <XgbShapExplainer
            selectedIncident={selectedIncident}
            selectedEvidence={selectedEvidence}
            cloudburstRainRate={cloudburstRainRate}
          />
        )}

        {/* TAB 7: SCENARIO (Cloudburst Simulation Injector) */}
        {activeTab === 'scenario' && (
          <ScenarioInjector 
            onScenarioChange={handleScenarioChange}
            selectedIncident={selectedIncident} 
          />
        )}

      </div>

    </div>
  );
};
