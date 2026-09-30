'use client';

import React, { useRef, useEffect } from 'react';
import {
  Globe, Search, RefreshCw, X, MapPin, Satellite, Radio, Info, Zap
} from 'lucide-react';

interface MeteoHeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: Array<{ name: string; sub: string; lat: number; lng: number }>;
  showSearchResults: boolean;
  setShowSearchResults: (show: boolean) => void;
  onSelectLocation: (loc: { name: string; sub: string; lat: number; lng: number }) => void;
  liveTime: string;
  lastRefresh: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  isHazardFocus: boolean;
  onToggleHazardFocus: () => void;
  severeCount: number;
  onOpenSatellite: () => void;
  onOpenRadar: () => void;
  onOpenSystemInfo: () => void;
  operationalMode?: 'LIVE' | 'HISTORICAL';
  onToggleOperationalMode?: (mode: 'LIVE' | 'HISTORICAL') => void;
  onOpenDataHealth?: () => void;
  nextIngestion?: string;
  lastIngestion?: string;
}

export const MeteoHeader: React.FC<MeteoHeaderProps> = ({
  searchQuery,
  setSearchQuery,
  searchResults,
  showSearchResults,
  setShowSearchResults,
  onSelectLocation,
  liveTime,
  lastRefresh,
  isRefreshing,
  onRefresh,
  isHazardFocus,
  onToggleHazardFocus,
  severeCount,
  onOpenSatellite,
  onOpenRadar,
  onOpenSystemInfo,
  operationalMode = 'LIVE',
  onToggleOperationalMode,
  onOpenDataHealth,
  nextIngestion = '5m cycle',
  lastIngestion = 'Current',
}) => {
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [setShowSearchResults]);

  return (
    <header className="h-12 bg-slate-950 border-b border-slate-800/80 px-4 flex items-center justify-between gap-4 flex-shrink-0 z-30 select-none">
      {/* ── Left: Identity ────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
          <Globe size={15} className="text-white" strokeWidth={2.2} />
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-white">MeteoGIS</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30 px-1.5 py-0.2 rounded">
              Ops Deck
            </span>
          </div>
          <div className="text-[10.5px] text-slate-400 font-medium">
            Live Meteorological Intelligence · India
          </div>
        </div>
      </div>

      {/* ── Center: Search ────────────────────────────────────────── */}
      <div className="flex-1 max-w-md relative" ref={searchRef}>
        <div className="relative flex items-center">
          <Search size={13} className="absolute left-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            className="w-full h-8 pl-8 pr-8 bg-slate-900/90 border border-slate-700/80 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all font-sans"
            placeholder="Search city, district, state or AWS station…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSearchResults(false);
              }}
              className="absolute right-2.5 text-slate-400 hover:text-slate-200"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-md shadow-xl overflow-hidden z-50 py-1">
            {searchResults.map((loc) => (
              <div
                key={`${loc.lat}-${loc.lng}`}
                onClick={() => onSelectLocation(loc)}
                className="px-3 py-1.5 flex items-center gap-2.5 hover:bg-slate-800/80 cursor-pointer text-xs transition-colors"
              >
                <div className="w-5 h-5 rounded bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0">
                  <MapPin size={11} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-200 truncate">{loc.name}</div>
                  <div className="text-[10px] text-slate-400">{loc.sub}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Right: Live Status, Clocks & Tools ─────────────────────── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Mode Switcher: LIVE vs HISTORICAL (Section 27 & 28) */}
        {onToggleOperationalMode && (
          <div className="flex items-center rounded-md bg-slate-900 border border-slate-800 p-0.5 text-[10.5px] font-bold">
            <button
              onClick={() => onToggleOperationalMode('LIVE')}
              className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 ${
                operationalMode === 'LIVE'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Live Operational Mode: Current IMD Telemetry Only"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${operationalMode === 'LIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>LIVE</span>
            </button>
            <button
              onClick={() => onToggleOperationalMode('HISTORICAL')}
              className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 ${
                operationalMode === 'HISTORICAL'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Historical Mode: Explicit Past Incident Archives (Isolated from Live Deck)"
            >
              <span>HISTORICAL</span>
            </button>
          </div>
        )}

        {/* Data Health Audit Panel Trigger (Section 23 & 24) */}
        {onOpenDataHealth && (
          <button
            onClick={onOpenDataHealth}
            className="h-7 px-2 rounded-md bg-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 text-slate-300 hover:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="Open Live Data Health & Ingestion Audit Panel"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden md:inline">DATA HEALTH</span>
          </button>
        )}

        {/* Focus Hazard Button */}
        <button
          onClick={onToggleHazardFocus}
          className={`h-7 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all border ${
            isHazardFocus
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20'
              : 'bg-slate-900 text-slate-300 border-slate-700/80 hover:bg-slate-800'
          }`}
          title="Filter map to primary active hazard and affected perimeter"
        >
          <Zap size={12} className={isHazardFocus ? 'text-amber-400' : 'text-slate-400'} />
          <span>Focus Hazards</span>
          {severeCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full leading-tight">
              {severeCount}
            </span>
          )}
        </button>

        {/* Satellite Modal Quick Launch */}
        <button
          onClick={onOpenSatellite}
          className="h-7 px-2 rounded-md bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium flex items-center gap-1 transition-all"
          title="Open INSAT-3DR Geostationary Viewer"
        >
          <Satellite size={12} className="text-blue-400" />
          <span className="hidden lg:inline">INSAT-3DR</span>
        </button>

        {/* Radar Modal Quick Launch */}
        <button
          onClick={onOpenRadar}
          className="h-7 px-2 rounded-md bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium flex items-center gap-1 transition-all"
          title="Open IMD Doppler Weather Radar (DWR)"
        >
          <Radio size={12} className="text-cyan-400" />
          <span className="hidden lg:inline">DWR Radar</span>
        </button>

        {/* System Overview */}
        <button
          onClick={onOpenSystemInfo}
          className="w-7 h-7 rounded-md bg-slate-900 border border-slate-700/80 text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-all"
          title="System Architecture & Metadata"
        >
          <Info size={13} />
        </button>

        {/* Manual Refresh */}
        <button
          onClick={onRefresh}
          className="w-7 h-7 rounded-md bg-slate-900 border border-slate-700/80 text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-all"
          title={`Data refreshed: ${lastRefresh}`}
        >
          <RefreshCw size={12} className={`transition-transform duration-500 ${isRefreshing ? 'rotate-180 text-blue-400' : ''}`} />
        </button>

        {/* Live Clock & Ingestion Cycle */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 cursor-pointer"
            onClick={onOpenDataHealth}
            title={`Last Ingestion: ${lastIngestion} · Next Check: ${nextIngestion}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold tracking-wide">
              {operationalMode === 'LIVE' ? 'LIVE' : 'HISTORICAL'}
            </span>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-300 tabular-nums">
            {liveTime || '—'}
          </span>
        </div>
      </div>
    </header>
  );
};
