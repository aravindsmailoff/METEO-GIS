'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Layers, MapPin, ShieldAlert, CloudRain, Navigation, Radio,
  Waves, Check, ChevronDown, Compass, Globe, Sparkles, RotateCcw,
  Eye, EyeOff, Satellite, Maximize2, Filter
} from 'lucide-react';
import { QUICK_STATES } from '@/app/page';

export interface GisTopMenubarProps {
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
  pluvialZones?: any[];
  selectedPluvialZone?: any;
  onSelectPluvialZone?: (zone: any) => void;
  onResetView?: () => void;
  onOpenSatellite?: () => void;
  onOpenRadar?: () => void;
  currentRadarStation?: string;
  isLayersMenuOpen?: boolean;
  onToggleLayersMenu?: () => void;
}

export const METEO_MAPS = [
  { id: 'nasa_clouds', label: 'NASA Live Clouds (Default)', icon: '☁️', sub: 'MODIS/VIIRS Seamless Clouds' },
  { id: 'bhuvan_sat', label: 'ISRO Bhuvan Satellite', icon: '🛰️', sub: 'NRSC High-Res Satellite Mosaic' },
  { id: 'bhuvan_2d', label: 'ISRO Bhuvan 2D Base', icon: '🗺️', sub: 'Official National Base Map (india3)' },
  { id: 'bhuvan_topo', label: 'ISRO Bhuvan Topo Relief', icon: '⛰️', sub: 'NRSC Terrain & Elevation (india_hi)' },
  { id: 'bhuvan_infra', label: 'ISRO Bhuvan Infrastructure', icon: '🏗️', sub: 'High Detail Roads & Facilities' },
  { id: 'bhuvan_flood', label: 'Flood Hazard Map', icon: '🌊', sub: 'Inundation Risk & Corridors' },
  { id: 'bhuvan_drainage', label: 'River & Drainage', icon: '💧', sub: 'CWC & NRSC River Network' },
  { id: 'bhuvan_admin', label: 'District Boundaries', icon: '📍', sub: 'Administrative Warning Zones' },
  { id: 'nasa_precip', label: 'NASA Rain Radar', icon: '🌧️', sub: 'NASA GPM 30-min Global Rain' },
] as const;

export const GisTopMenubar: React.FC<GisTopMenubarProps> = ({
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
  pluvialZones = [],
  selectedPluvialZone,
  onSelectPluvialZone,
  onResetView,
  onOpenSatellite,
  onOpenRadar,
  currentRadarStation = 'VSK',
  isLayersMenuOpen = false,
  onToggleLayersMenu,
}) => {
  const [openDropdown, setOpenDropdown] = useState<'maps' | 'layers' | 'territory' | 'cities' | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const activeMapObj = METEO_MAPS.find((m) => m.id === baseMap) || METEO_MAPS[0];

  // Count active overlays
  const activeOverlayCount = [
    showDistrictWarnings,
    showLiveRainfall,
    showAwsStations,
    showDwrRings,
    showPluvialFloodLayer
  ].filter(Boolean).length;

  return (
    <div
      ref={containerRef}
      className="h-10 bg-slate-950/95 border-b border-slate-800/90 px-3 flex items-center justify-between gap-2 z-30 select-none backdrop-blur-sm relative"
    >
      {/* ── Left: Dropdown Menus Ribbon ────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {/* 0. Toggleable Menu for Layers & Territory (Component in 3rd Image) */}
        {onToggleLayersMenu && (
          <button
            onClick={onToggleLayersMenu}
            className={`h-7 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              isLayersMenuOpen
                ? 'bg-blue-600/30 text-blue-300 border-blue-500 shadow-sm'
                : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white'
            }`}
            title="Toggle Layers & Territory Sidebar Menu"
          >
            <Layers size={13} className={isLayersMenuOpen ? 'text-blue-400' : 'text-slate-400'} />
            <span className="font-bold hidden sm:inline">Layers & Territory</span>
            <span className={`w-1.5 h-1.5 rounded-full ${isLayersMenuOpen ? 'bg-blue-400' : 'bg-slate-500'}`} />
          </button>
        )}

        {/* 1. Base Maps Menu */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'maps' ? null : 'maps')}
            className={`h-7 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              openDropdown === 'maps'
                ? 'bg-blue-600/25 text-blue-300 border-blue-500 shadow-sm'
                : 'bg-slate-900/90 text-slate-200 border-slate-700/80 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>{activeMapObj.icon}</span>
            <span className="font-medium text-slate-300 hidden sm:inline">Map:</span>
            <span className="font-bold text-white truncate max-w-[130px]">{activeMapObj.label.replace(/ \(Default\)/, '')}</span>
            <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${openDropdown === 'maps' ? 'rotate-180' : ''}`} />
          </button>

          {openDropdown === 'maps' && (
            <div className="absolute top-full left-0 mt-1 w-72 bg-slate-900/95 border border-slate-700 rounded-lg shadow-2xl p-1.5 z-50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 border-b border-slate-800 flex items-center justify-between">
                <span>Meteorological & Base Maps</span>
                <span className="text-[9px] text-blue-400 font-mono">ISRO · NASA</span>
              </div>
              <div className="space-y-0.5 mt-1 max-h-80 overflow-y-auto pr-0.5">
                {METEO_MAPS.map((m) => {
                  const isActive = baseMap === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        setBaseMap(m.id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full px-2 py-1.5 rounded-md flex items-center justify-between text-left transition-all ${
                        isActive
                          ? 'bg-blue-600/20 border border-blue-500/50 text-white font-semibold'
                          : 'hover:bg-slate-800/80 text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <span className="text-sm flex-shrink-0">{m.icon}</span>
                        <div className="min-w-0">
                          <div className="text-xs truncate">{m.label}</div>
                          <div className="text-[10px] text-slate-400 truncate">{m.sub}</div>
                        </div>
                      </div>
                      {isActive && <Check size={13} className="text-blue-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. Overlays & Layers Menu */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'layers' ? null : 'layers')}
            className={`h-7 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              openDropdown === 'layers'
                ? 'bg-blue-600/25 text-blue-300 border-blue-500 shadow-sm'
                : 'bg-slate-900/90 text-slate-200 border-slate-700/80 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Layers size={13} className="text-cyan-400" />
            <span className="font-medium text-slate-300">Overlays</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {activeOverlayCount} Active
            </span>
            <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${openDropdown === 'layers' ? 'rotate-180' : ''}`} />
          </button>

          {openDropdown === 'layers' && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-slate-900/95 border border-slate-700 rounded-lg shadow-2xl p-2 z-50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 pb-1.5 border-b border-slate-800 flex items-center justify-between">
                <span>Operational Overlays</span>
                <span className="text-[9px] text-cyan-400 font-mono">Live GIS Feeds</span>
              </div>
              <div className="space-y-1.5 mt-2 text-xs">
                {/* District Warnings */}
                <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-800 cursor-pointer">
                  <div className="flex items-center gap-2 text-slate-200">
                    <ShieldAlert size={13} className="text-red-400" />
                    <span>IMD Warnings</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showDistrictWarnings}
                    onChange={(e) => setShowDistrictWarnings(e.target.checked)}
                    className="accent-blue-500 rounded cursor-pointer w-3.5 h-3.5"
                  />
                </label>

                {/* Live Rainfall */}
                <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-800 cursor-pointer">
                  <div className="flex items-center gap-2 text-slate-200">
                    <CloudRain size={13} className="text-amber-400" />
                    <span>Rainfall Gauges</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showLiveRainfall}
                    onChange={(e) => setShowLiveRainfall(e.target.checked)}
                    className="accent-blue-500 rounded cursor-pointer w-3.5 h-3.5"
                  />
                </label>

                {/* AWS Stations */}
                <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-800 cursor-pointer">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Navigation size={13} className="text-emerald-400" />
                    <span>AWS Stations</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showAwsStations}
                    onChange={(e) => setShowAwsStations(e.target.checked)}
                    className="accent-blue-500 rounded cursor-pointer w-3.5 h-3.5"
                  />
                </label>

                {/* Doppler Radar Rings */}
                <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-800 cursor-pointer">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Radio size={13} className="text-cyan-400" />
                    <span>DWR Coverage Rings</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showDwrRings}
                    onChange={(e) => setShowDwrRings(e.target.checked)}
                    className="accent-blue-500 rounded cursor-pointer w-3.5 h-3.5"
                  />
                </label>

                {/* Pluvial Floods */}
                <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-800 cursor-pointer">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Waves size={13} className="text-sky-400" />
                    <span>Low-Lying DEM Inundation</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showPluvialFloodLayer}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setShowPluvialFloodLayer(isChecked);
                      if (isChecked) {
                        setBaseMap('bhuvan_sat');
                      }
                    }}
                    className="accent-blue-500 rounded cursor-pointer w-3.5 h-3.5"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* 3. Territory Selector Menu */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'territory' ? null : 'territory')}
            className={`h-7 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              openDropdown === 'territory'
                ? 'bg-blue-600/25 text-blue-300 border-blue-500 shadow-sm'
                : 'bg-slate-900/90 text-slate-200 border-slate-700/80 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Compass size={13} className="text-amber-400" />
            <span className="font-medium text-slate-300 hidden sm:inline">Territory:</span>
            <span className="font-bold text-amber-300 truncate max-w-[120px]">{selectedState}</span>
            <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${openDropdown === 'territory' ? 'rotate-180' : ''}`} />
          </button>

          {openDropdown === 'territory' && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-slate-900/95 border border-slate-700 rounded-lg shadow-2xl p-1.5 z-50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 border-b border-slate-800 flex items-center justify-between">
                <span>Select Surveillance Territory</span>
                <span className="text-[9px] text-amber-400 font-mono">11 Sectors</span>
              </div>
              <div className="space-y-0.5 mt-1 max-h-72 overflow-y-auto pr-0.5">
                {QUICK_STATES.map((s) => {
                  const isActive = selectedState === s.name;
                  return (
                    <button
                      key={s.name}
                      onClick={() => {
                        onSelectState(s);
                        setOpenDropdown(null);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-md flex items-center justify-between text-left text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600/20 border border-blue-500/50 text-blue-300 font-bold'
                          : 'hover:bg-slate-800/80 text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span>{s.icon}</span>
                        <span className="truncate">{s.name}</span>
                      </div>
                      {isActive && <Check size={13} className="text-blue-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 4. Low-Lying Cities Dropdown */}
        {pluvialZones.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'cities' ? null : 'cities')}
              className={`h-7 px-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                openDropdown === 'cities'
                  ? 'bg-cyan-600/25 text-cyan-300 border-cyan-500 shadow-sm'
                  : 'bg-slate-900/90 text-slate-200 border-slate-700/80 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Waves size={13} className="text-cyan-400" />
              <span className="hidden md:inline font-medium text-slate-300">City Basins:</span>
              <span className="font-bold text-cyan-300">{pluvialZones.length} Areas</span>
              <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${openDropdown === 'cities' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'cities' && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-slate-900/95 border border-slate-700 rounded-lg shadow-2xl p-1.5 z-50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 border-b border-slate-800 flex items-center justify-between">
                  <span>Low-Lying Inundation Basins</span>
                  <span className="text-[9px] text-cyan-400 font-mono">Bhuvan DEM Sinks</span>
                </div>
                <div className="space-y-1 mt-1 max-h-72 overflow-y-auto pr-0.5">
                  {pluvialZones.map((z: any) => {
                    const isSelected = selectedPluvialZone?.id === z.id;
                    const isCrit = z.pluvialFloodRisk === 'CRITICAL';
                    return (
                      <button
                        key={z.id}
                        onClick={() => {
                          if (onSelectPluvialZone) onSelectPluvialZone(z);
                          setOpenDropdown(null);
                        }}
                        className={`w-full px-2 py-1.5 rounded-md flex flex-col text-left transition-all ${
                          isSelected
                            ? 'bg-cyan-500/20 border border-cyan-400/70 text-white shadow-sm'
                            : 'hover:bg-slate-800/80 text-slate-300 border border-slate-800/60 bg-slate-900/40'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[11px] font-semibold truncate text-cyan-200">
                            📍 {z.zoneName.replace(/ Basin| Low-Lying| Footprint| Zone/g, '')}
                          </span>
                          <span
                            className={`text-[8.5px] font-black px-1.5 py-0.2 rounded ${
                              isCrit
                                ? 'bg-red-500/25 text-red-300 border border-red-500/50'
                                : 'bg-amber-500/25 text-amber-300 border border-amber-500/50'
                            }`}
                          >
                            {z.pluvialFloodRisk}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[9.5px] text-slate-400 mt-0.5">
                          <span className="truncate">{z.district} ({z.state})</span>
                          <span className="text-blue-300 font-mono">{z.liveRainRateMmH} mm/h</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Right: Quick Context Actions ───────────────────────── */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Quick DWR Radar Launch button with dynamic station code */}
        {onOpenRadar && (
          <button
            onClick={onOpenRadar}
            className="h-7 px-2 rounded-md bg-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            title={`Open Live Doppler Weather Radar for ${currentRadarStation.toUpperCase()}`}
          >
            <Radio size={12} className="text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">DWR Radar:</span>
            <span className="font-mono uppercase font-black text-cyan-200">{currentRadarStation.toUpperCase()}</span>
          </button>
        )}

        {/* Quick Satellite viewer button */}
        {onOpenSatellite && (
          <button
            onClick={onOpenSatellite}
            className="h-7 px-2 rounded-md bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-all"
            title="INSAT-3DR Rapid Satellite Stream"
          >
            <Satellite size={12} className="text-blue-400" />
            <span className="hidden md:inline">INSAT-3DR</span>
          </button>
        )}

        {/* Reset View Button */}
        {onResetView && (
          <button
            onClick={onResetView}
            className="h-7 px-2 rounded-md bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-all"
            title="Reset Map to All India"
          >
            <RotateCcw size={11} className="text-slate-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
