'use client';

import React, { useState } from 'react';
import {
  Layers, MapPin, ShieldAlert, CloudRain, Navigation, Radio, Waves, Check
} from 'lucide-react';
import { QUICK_STATES } from '@/app/page';

interface GisLayersSidebarProps {
  baseMap: string;
  setBaseMap: (id: any) => void;
  showLiveRainfall: boolean;
  setShowLiveRainfall: (v: boolean) => void;
  showAwsStations: boolean;
  setShowAwsStations: (v: boolean) => void;
  showDistrictWarnings: boolean;
  setShowDistrictWarnings: (v: boolean) => void;
  showDwrRings: boolean;
  setShowDwrRings: (v: boolean) => void;
  showPluvialFloodLayer: boolean;
  setShowPluvialFloodLayer: (v: boolean) => void;
  selectedState: string;
  onSelectState: (state: typeof QUICK_STATES[0]) => void;
  hazardCounts?: {
    severeEventsCount: number;
    thunderstorms: number;
    hailstorms: number;
    cloudbursts: number;
  };
  pluvialZonesCount?: number;
  pluvialZones?: any[];
  selectedPluvialZone?: any;
  onSelectPluvialZone?: (zone: any) => void;
  onSwitchToNasaClouds?: () => void;
}

const METEO_MAPS = [
  { id: 'nasa_clouds', label: '☁️ NASA Live Clouds (Default)', sub: 'MODIS/VIIRS Seamless Clouds' },
  { id: 'bhuvan_sat', label: '🛰️ ISRO Bhuvan Satellite', sub: 'NRSC High-Res Satellite Mosaic' },
  { id: 'bhuvan_2d', label: '🗺️ ISRO Bhuvan 2D Base', sub: 'Official National Base Map (india3)' },
  { id: 'bhuvan_topo', label: '⛰️ ISRO Bhuvan Topo Relief', sub: 'NRSC Terrain & Elevation (india_hi)' },
  { id: 'bhuvan_infra', label: '🏗️ ISRO Bhuvan Infrastructure', sub: 'High Detail Roads & Facilities' },
  { id: 'bhuvan_flood', label: '🌊 Flood Hazard Map', sub: 'Inundation Risk & Corridors' },
  { id: 'bhuvan_drainage', label: '💧 River & Drainage', sub: 'CWC & NRSC River Network' },
  { id: 'bhuvan_admin', label: '📍 District Boundaries', sub: 'Administrative Warning Zones' },
  { id: 'nasa_precip', label: '🌧️ NASA Rain Radar', sub: 'NASA GPM 30-min Global Rain' },
] as const;

export const GisLayersSidebar: React.FC<GisLayersSidebarProps> = ({
  baseMap,
  setBaseMap,
  showLiveRainfall,
  setShowLiveRainfall,
  showAwsStations,
  setShowAwsStations,
  showDistrictWarnings,
  setShowDistrictWarnings,
  showDwrRings,
  setShowDwrRings,
  showPluvialFloodLayer,
  setShowPluvialFloodLayer,
  selectedState,
  onSelectState,
  hazardCounts,
  pluvialZonesCount,
  pluvialZones = [],
  selectedPluvialZone,
  onSelectPluvialZone,
  onSwitchToNasaClouds,
}) => {
  const [activeTab, setActiveTab] = useState<'layers' | 'territory'>('layers');

  return (
    <aside className="w-56 bg-slate-950 border-r border-slate-800/80 flex flex-col h-full flex-shrink-0 select-none overflow-hidden">
      {/* ── Tabs: Layers vs Territory ─────────────────────────────── */}
      <div className="flex border-b border-slate-800/80 flex-shrink-0 bg-slate-900/50">
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-2 text-xs font-bold tracking-wider uppercase transition-colors ${
            activeTab === 'layers'
              ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-900'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Layers
        </button>
        <button
          onClick={() => setActiveTab('territory')}
          className={`flex-1 py-2 text-xs font-bold tracking-wider uppercase transition-colors ${
            activeTab === 'territory'
              ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-900'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Territory
        </button>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        {activeTab === 'layers' ? (
          <>
            {/* Meteorological & Hydrologic Maps */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1.5 mb-1.5">
                Meteorological Maps
              </div>
              <div className="space-y-0.5">
                {METEO_MAPS.map((m) => {
                  const isActive = baseMap === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setBaseMap(m.id)}
                      className={`w-full px-2 py-1.5 rounded-md flex items-center justify-between text-left transition-all ${
                        isActive
                          ? 'bg-blue-600/20 border border-blue-500/50 text-white'
                          : 'hover:bg-slate-900 text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="min-w-0 pr-1">
                        <div className="text-xs font-semibold truncate">{m.label}</div>
                        <div className="text-[10px] text-slate-400 truncate">{m.sub}</div>
                      </div>
                      {isActive && <Check size={12} className="text-blue-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Operational Overlays */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1.5 mb-1.5">
                Operational Overlays
              </div>
              <div className="space-y-1">
                {/* District Warnings */}
                <label className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-slate-900 cursor-pointer">
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <ShieldAlert size={12} className="text-red-400" />
                    <span>IMD Warnings</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showDistrictWarnings}
                    onChange={(e) => setShowDistrictWarnings(e.target.checked)}
                    className="accent-blue-500 rounded cursor-pointer"
                  />
                </label>

                {/* Live Rainfall */}
                <label className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-slate-900 cursor-pointer">
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <CloudRain size={12} className="text-amber-400" />
                    <span>Rainfall Gauges</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showLiveRainfall}
                    onChange={(e) => setShowLiveRainfall(e.target.checked)}
                    className="accent-blue-500 rounded cursor-pointer"
                  />
                </label>

                {/* AWS Stations */}
                <label className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-slate-900 cursor-pointer">
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <Navigation size={12} className="text-emerald-400" />
                    <span>AWS Stations</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showAwsStations}
                    onChange={(e) => setShowAwsStations(e.target.checked)}
                    className="accent-blue-500 rounded cursor-pointer"
                  />
                </label>

                {/* Doppler Radar */}
                <label className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-slate-900 cursor-pointer">
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <Radio size={12} className="text-cyan-400" />
                    <span>DWR Coverage</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showDwrRings}
                    onChange={(e) => setShowDwrRings(e.target.checked)}
                    className="accent-blue-500 rounded cursor-pointer"
                  />
                </label>

                {/* Pluvial Floods */}
                <label className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-slate-900 cursor-pointer">
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <Waves size={12} className="text-cyan-400" />
                    <span>Low-Lying DEM</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showPluvialFloodLayer}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setShowPluvialFloodLayer(isChecked);
                      if (isChecked) {
                        setBaseMap('bhuvan_sat');
                        if (pluvialZones.length > 0 && onSelectPluvialZone) {
                          onSelectPluvialZone(selectedPluvialZone || pluvialZones[0]);
                        }
                      }
                    }}
                    className="accent-blue-500 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* ── Low-Lying City Inundation Basins (City-Wise Map Switch) ── */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1.5 mb-1">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Waves size={12} />
                  <span>Low-Lying City Areas</span>
                </span>
                <span className="bg-cyan-950 text-cyan-300 text-[9px] px-1.5 py-0.5 rounded font-mono border border-cyan-800/40">
                  {pluvialZones.length} Cities
                </span>
              </div>
              <div className="text-[10px] text-slate-400 px-1.5 mb-2 leading-tight">
                Click any city to switch to <span className="text-emerald-400 font-semibold">ISRO Bhuvan Satellite</span> and pinpoint affected neighborhoods.
              </div>

              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {pluvialZones.map((z: any) => {
                  const isSelected = selectedPluvialZone?.id === z.id;
                  const isCrit = z.pluvialFloodRisk === 'CRITICAL';
                  const hotspotCount = z.cityHotspots?.length || 0;
                  return (
                    <button
                      key={z.id}
                      onClick={() => {
                        if (onSelectPluvialZone) onSelectPluvialZone(z);
                      }}
                      className={`w-full px-2 py-1.5 rounded-md flex flex-col text-left transition-all ${
                        isSelected
                          ? 'bg-cyan-500/20 border border-cyan-400/70 text-white shadow-sm ring-1 ring-cyan-400/40'
                          : 'hover:bg-slate-900 text-slate-300 border border-slate-800/50 bg-slate-900/40'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] font-semibold truncate text-cyan-200">
                          📍 {z.zoneName.replace(/ Basin| Low-Lying| Footprint| Zone/g, '')}
                        </span>
                        <span
                          className={`text-[8px] font-black px-1.5 py-0.2 rounded ${
                            isCrit
                              ? 'bg-red-500/25 text-red-300 border border-red-500/50'
                              : 'bg-amber-500/25 text-amber-300 border border-amber-500/50'
                          }`}
                        >
                          {z.pluvialFloodRisk}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1">
                        <span className="truncate">{z.district} ({z.state})</span>
                        <span className="text-emerald-300 font-medium flex-shrink-0 ml-1">
                          {hotspotCount} Pinpoints
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          /* Territory Selector */
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1.5 mb-2">
              Territory Drill-Down
            </div>
            <div className="space-y-1">
              {QUICK_STATES.map((s) => {
                const isActive = selectedState === s.name;
                return (
                  <button
                    key={s.name}
                    onClick={() => onSelectState(s)}
                    className={`w-full px-2.5 py-1.5 rounded-md flex items-center justify-between text-left text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600/20 border border-blue-500/50 text-blue-300 font-bold'
                        : 'hover:bg-slate-900 text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span>{s.icon}</span>
                      <span className="truncate">{s.name}</span>
                    </div>
                    {isActive && hazardCounts && hazardCounts.severeEventsCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                        {hazardCounts.severeEventsCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
