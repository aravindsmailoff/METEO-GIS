'use client';

import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  ShieldAlert, 
  Map, 
  Users, 
  Activity, 
  Bell, 
  Volume2, 
  VolumeX, 
  RefreshCw,
  Layers,
  Filter,
  Globe,
  Sliders,
  Sparkles,
  ExternalLink,
  BarChart3
} from 'lucide-react';

export type DashboardTab = 'command' | 'gis' | 'citizen' | 'telemetry';

interface HeaderProps {
  currentTab: DashboardTab;
  setCurrentTab: (tab: DashboardTab) => void;
  systemMode: 'LIVE' | 'DEMO';
  setSystemMode: (mode: 'LIVE' | 'DEMO') => void;
  onOpenAlertModal: () => void;
  criticalAlertCount: number;
  filterDistrict: string;
  setFilterDistrict: (d: string) => void;
  filterRisk: string;
  setFilterRisk: (r: string) => void;
  selectedState?: string;
  setSelectedState?: (s: string) => void;
  onManualRefresh?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  systemMode,
  setSystemMode,
  onOpenAlertModal,
  criticalAlertCount,
  filterDistrict,
  setFilterDistrict,
  filterRisk,
  setFilterRisk,
  selectedState = 'Meghalaya',
  setSelectedState,
  onManualRefresh,
}) => {
  const [sirenActive, setSirenActive] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }) + ' IST');
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (onManualRefresh) onManualRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const meghalayaDistricts = [
    'All Districts',
    'East Khasi Hills',
    'Ri-Bhoi',
    'South West Khasi Hills',
    'West Khasi Hills',
    'East Jaintia Hills',
    'West Jaintia Hills',
    'West Garo Hills',
    'South Garo Hills',
    'East Garo Hills',
  ];

  return (
    <header className="w-full bg-[#16202c] border-b border-[#283749] px-3 lg:px-5 py-2 sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 shadow-md">
      {/* 1. Left: ISRO Bhuvan Emblem & Dashboard Title */}
      <div className="flex items-center gap-3">
        {/* ISRO Bhuvan Space Emblem Tile */}
        <div className="relative flex items-center justify-center w-9 h-9 rounded bg-gradient-to-br from-[#0079c1] to-[#0A2540] text-white shadow-sm border border-[#0096eb]/40">
          <Globe className="w-5 h-5 text-[#00e5ff]" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#2dd36f] animate-ping" />
        </div>
        
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm lg:text-base font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
              🇮🇳 ISRO <span className="text-[#00e5ff]">{selectedState} Landslide Command</span>
            </h1>
            <span className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] font-mono font-bold bg-[#1e2c3b] text-[#2dd36f] border border-[#2d4157] rounded">
              NER NDEM
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span>ArcGIS Operations Dashboard & Real Demographics Intelligence</span>
            <span className="text-slate-600">•</span>
            <span className="text-[#00e5ff] font-mono text-[10px]">{currentTime}</span>
          </div>
        </div>
      </div>

      {/* 2. Center: ArcGIS Filter Selectors (State, District, Risk) */}
      <div className="hidden xl:flex items-center gap-2 bg-[#121820] p-1 rounded border border-[#283749] text-xs">
        {/* State Selector */}
        <div className="flex items-center gap-1.5 px-2 text-slate-400">
          <Map className="w-3.5 h-3.5 text-[#00e5ff]" />
          <span className="text-[10px] uppercase font-bold tracking-wider">Region:</span>
        </div>
        <select
          value={selectedState}
          onChange={(e) => setSelectedState && setSelectedState(e.target.value)}
          className="bg-[#192330] border border-[#2d3e52] rounded px-2 py-1 text-[#00e5ff] font-semibold text-xs focus:outline-none focus:border-[#0079c1] cursor-pointer"
        >
          <option value="Meghalaya">Meghalaya (Primary Flagship)</option>
          <option value="Sikkim">Sikkim (Himalayan Sector)</option>
          <option value="Assam">Assam (Dima Hasao / Barak)</option>
          <option value="Arunachal Pradesh">Arunachal Pradesh</option>
          <option value="Nagaland">Nagaland (Kohima Pass)</option>
          <option value="Manipur">Manipur</option>
          <option value="Mizoram">Mizoram</option>
          <option value="Tripura">Tripura</option>
          <option value="All NER States">All 8 NER States</option>
        </select>

        <div className="h-4 w-[1px] bg-[#283749]" />

        {/* District Selector */}
        <select
          value={filterDistrict}
          onChange={(e) => setFilterDistrict(e.target.value)}
          className="bg-[#192330] border border-[#2d3e52] rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-[#0079c1] cursor-pointer"
        >
          {meghalayaDistricts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* Severity Selector */}
        <select
          value={filterRisk}
          onChange={(e) => setFilterRisk(e.target.value)}
          className="bg-[#192330] border border-[#2d3e52] rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-[#0079c1] cursor-pointer"
        >
          <option>All Risks</option>
          <option>Critical</option>
          <option>High</option>
          <option>Moderate</option>
        </select>

        {/* Auto Refresh indicator */}
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1 px-2 py-1 bg-[#192330] hover:bg-[#223142] text-slate-300 rounded border border-[#2d3e52] transition-all"
          title="Manual ISRO Bhuvan Sync"
        >
          <RefreshCw className={`w-3 h-3 text-[#00e5ff] ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="text-[10px] font-mono">NRSC Sync</span>
        </button>
      </div>

      {/* 3. Navigation Modules Bar */}
      <nav className="flex items-center gap-1 bg-[#121820] p-1 rounded border border-[#283749]">
        <button
          onClick={() => setCurrentTab('command')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
            currentTab === 'command'
              ? 'bg-[#0079c1] text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-[#1a2432]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Operations Command</span>
        </button>

        <button
          onClick={() => setCurrentTab('gis')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
            currentTab === 'gis'
              ? 'bg-[#0079c1] text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-[#1a2432]'
          }`}
        >
          <Map className="w-3.5 h-3.5" />
          <span>Bhuvan GIS Canvas</span>
        </button>

        <button
          onClick={() => setCurrentTab('citizen')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
            currentTab === 'citizen'
              ? 'bg-[#0079c1] text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-[#1a2432]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Citizen Portal</span>
        </button>

        <button
          onClick={() => setCurrentTab('telemetry')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
            currentTab === 'telemetry'
              ? 'bg-[#0079c1] text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-[#1a2432]'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>ISRO Bhuvan REST API</span>
        </button>
      </nav>

      {/* 4. Right Actions: Mode, Alert Siren & CAP Modal */}
      <div className="flex items-center gap-2">
        {/* LIVE / DEMO toggle */}
        <div className="flex items-center bg-[#121820] p-0.5 rounded border border-[#283749] text-[10px] font-bold">
          <button
            onClick={() => setSystemMode('LIVE')}
            className={`px-2 py-0.5 rounded transition-all ${
              systemMode === 'LIVE' ? 'bg-[#2dd36f] text-black font-black' : 'text-slate-400'
            }`}
          >
            LIVE
          </button>
          <button
            onClick={() => setSystemMode('DEMO')}
            className={`px-2 py-0.5 rounded transition-all ${
              systemMode === 'DEMO' ? 'bg-[#ff9800] text-black font-black' : 'text-slate-400'
            }`}
          >
            DEMO
          </button>
        </div>

        {/* Siren sound toggle */}
        <button
          onClick={() => setSirenActive(!sirenActive)}
          className={`p-1.5 rounded border transition-all ${
            sirenActive
              ? 'bg-red-950 text-[#eb445a] border-red-700 animate-pulse'
              : 'bg-[#121820] text-slate-400 border-[#283749] hover:text-white'
          }`}
          title={sirenActive ? 'Mute Alert Siren' : 'Arm Audio Siren'}
        >
          {sirenActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* OASIS CAP 1.2 Multi-Tier Alert Broadcast button */}
        <button
          onClick={onOpenAlertModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#eb445a] hover:bg-[#d8354c] text-white text-xs font-bold shadow-md transition-all uppercase tracking-wider"
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Issue CAP Alert</span>
          {criticalAlertCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-white text-[#eb445a] text-[10px] flex items-center justify-center font-black">
              {criticalAlertCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
