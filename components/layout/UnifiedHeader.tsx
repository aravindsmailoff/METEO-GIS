'use client';

import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Map as MapIcon, 
  Radio, 
  CloudLightning, 
  AlertTriangle, 
  Activity, 
  RefreshCw, 
  Volume2, 
  VolumeX,
  ShieldAlert, 
  Server, 
  Cpu,
  Eye,
  Satellite,
  CloudRain,
  Zap,
  Download
} from 'lucide-react';

interface UnifiedHeaderProps {
  systemMode: 'LIVE' | 'DEMO' | 'BACKTEST';
  setSystemMode: (m: 'LIVE' | 'DEMO' | 'BACKTEST') => void;
  onOpenAlertModal: () => void;
  criticalAlertCount: number;
  selectedState: string;
  setSelectedState: (s: string) => void;
  filterDistrict: string;
  setFilterDistrict: (d: string) => void;
  onManualRefresh: () => void;
  onToggleDataHealth: () => void;
  onOpenFusionArchitectureModal?: () => void;
  onOpenSatelliteViewer?: () => void;
  onOpenRadarViewer?: () => void;
  onOpenSystemOverview?: () => void;
  liveRainCount?: number;
  liveNowcastCount?: number;
  liveWarningsCount?: number;
  liveEventsCount?: number;
  isLeftQueueOpen?: boolean;
  onToggleLeftQueue?: () => void;
}

export const UnifiedHeader: React.FC<UnifiedHeaderProps> = ({
  systemMode,
  setSystemMode,
  onOpenAlertModal,
  criticalAlertCount,
  selectedState,
  setSelectedState,
  filterDistrict,
  setFilterDistrict,
  onManualRefresh,
  onToggleDataHealth,
  onOpenFusionArchitectureModal,
  onOpenSatelliteViewer,
  onOpenRadarViewer,
  onOpenSystemOverview,
  liveRainCount = 245,
  liveNowcastCount = 14,
  liveWarningsCount = 754,
  liveEventsCount = 687,
  isLeftQueueOpen = false,
  onToggleLeftQueue,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [sirenActive, setSirenActive] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }) + ' IST');
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onManualRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const INDIAN_STATES_DISTRICTS: Record<string, string[]> = {
    'All India': ['All Districts'],
    'Tamil Nadu': [
      'All Districts',
      'Chennai',
      'Chengalpattu',
      'Tiruvallur',
      'Kanchipuram',
      'Cuddalore',
      'The Nilgiris',
      'Coimbatore',
      'Vellore',
      'Madurai',
      'Tirunelveli',
      'Salem',
    ],
    'Andhra Pradesh': [
      'All Districts',
      'Visakhapatnam',
      'Anakapalli',
      'Alluri Sitharama Raju',
      'East Godavari',
      'Krishna',
      'Guntur',
      'Nellore',
      'Tirupati',
    ],
    'Odisha': [
      'All Districts',
      'Puri',
      'Khurda (Bhubaneswar)',
      'Ganjam',
      'Balasore',
      'Bhadrak',
      'Cuttack',
      'Jagatsinghpur',
      'Kendrapada',
    ],
    'West Bengal': [
      'All Districts',
      'Kolkata',
      'South 24 Parganas',
      'North 24 Parganas',
      'Howrah',
      'Purba Medinipur',
      'Darjeeling',
      'Kalimpong',
      'Jalpaiguri',
    ],
    'Maharashtra': [
      'All Districts',
      'Mumbai City',
      'Mumbai Suburban',
      'Thane',
      'Raigad',
      'Ratnagiri',
      'Sindhudurg',
      'Pune',
      'Nagpur',
    ],
    'Kerala': [
      'All Districts',
      'Wayanad',
      'Idukki',
      'Ernakulam (Kochi)',
      'Thiruvananthapuram',
      'Kozhikode',
      'Kottayam',
      'Alappuzha',
    ],
    'Karnataka': [
      'All Districts',
      'Bengaluru Urban',
      'Dakshina Kannada (Mangaluru)',
      'Udupi',
      'Uttara Kannada',
      'Kodagu',
      'Shimoga',
      'Chikkamagaluru',
    ],
    'Gujarat': [
      'All Districts',
      'Ahmedabad',
      'Surat',
      'Vadodara',
      'Rajkot',
      'Bhavnagar',
      'Jamnagar',
      'Junagadh',
      'Kutch',
      'Valsad',
    ],
    'Meghalaya': [
      'All Districts',
      'East Khasi Hills (Shillong)',
      'West Khasi Hills',
      'Ri Bhoi',
      'West Jaintia Hills',
      'East Jaintia Hills',
      'West Garo Hills',
      'South Garo Hills',
    ],
    'Sikkim': [
      'All Districts',
      'Gangtok',
      'Pakyong',
      'Namchi',
      'Gyalshing',
      'Mangan',
      'Soreng',
    ],
    'Uttarakhand': [
      'All Districts',
      'Dehradun',
      'Haridwar',
      'Nainital',
      'Chamoli',
      'Rudraprayag',
      'Uttarkashi',
      'Pithoragarh',
      'Tehri Garhwal',
      'Pauri Garhwal',
    ],
    'Himachal Pradesh': [
      'All Districts',
      'Shimla',
      'Kullu',
      'Mandi',
      'Kangra (Dharamshala)',
      'Solan',
      'Chamba',
      'Kinnaur',
      'Lahaul and Spiti',
    ],
    'Delhi': [
      'All Districts',
      'New Delhi',
      'Central Delhi',
      'South Delhi',
      'North Delhi',
      'East Delhi',
      'Gurugram',
      'Noida',
    ],
  };

  const activeDistricts = INDIAN_STATES_DISTRICTS[selectedState] || ['All Districts'];

  return (
    <header className="w-full bg-[#070d17]/95 backdrop-blur-md border-b border-[#1b283d] px-3 lg:px-4 py-2 sticky top-0 z-50 flex items-center justify-between gap-3 shadow-lg select-none">
      
      {/* 1. Left: Official Emblem & High-Tech Title */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#0284c7] via-[#0369a1] to-[#082f49] text-white shadow-md border border-cyan-400/40">
          <Globe className="w-4 h-4 text-cyan-200" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <h1 className="text-xs lg:text-sm font-black text-white tracking-wide uppercase flex items-center gap-1">
              <span>🇮🇳 IMD • ISRO • NCMRWF</span>
              <span className="hidden xl:inline text-cyan-400 font-bold">| PS 26084 CONVECTIVE NOWCASTING (0–6h)</span>
            </h1>
            <span className="px-1.5 py-0.2 rounded bg-emerald-950/80 border border-emerald-500/80 text-emerald-300 font-mono text-[9.5px] font-bold">
              LIVE
            </span>
          </div>

          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
            <span className="text-cyan-300 font-semibold">{currentTime}</span>
            <span>•</span>
            <span className="hidden sm:inline text-slate-300 font-medium">MoES PS 26084 • 1–3 km Multi-Source Fusion</span>
          </div>
        </div>
      </div>

      {/* 2. Center: State/District Selectors + Interactive Weather HUD Badges */}
      <div className="hidden md:flex items-center gap-2">
        {/* Geography Filters */}
        <div className="flex items-center bg-[#0d1624] border border-[#1f2f45] rounded-lg p-0.5 shadow-inner">
          <select
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setFilterDistrict('All Districts');
            }}
            className="bg-transparent text-cyan-300 font-bold text-xs px-2 py-1 rounded focus:outline-none cursor-pointer hover:bg-[#142136] transition-colors"
          >
            {Object.keys(INDIAN_STATES_DISTRICTS).map((st) => (
              <option key={st} value={st} className="bg-[#0b121e] text-white">{st}</option>
            ))}
          </select>

          <span className="text-slate-600 px-0.5">/</span>

          <select
            value={filterDistrict}
            onChange={(e) => setFilterDistrict(e.target.value)}
            className="bg-transparent text-slate-200 text-xs px-2 py-1 rounded focus:outline-none cursor-pointer hover:bg-[#142136] transition-colors max-w-[130px] truncate"
          >
            {activeDistricts.map((d) => (
              <option key={d} value={d} className="bg-[#0b121e] text-white">{d}</option>
            ))}
          </select>
        </div>

        {/* Live Weather HUD Chips */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <div className="px-2 py-1 rounded-md bg-[#0c1829] border border-cyan-800/60 text-cyan-200 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[11px] font-bold">Rain: {liveRainCount}</span>
          </div>

          <div className="px-2 py-1 rounded-md bg-[#191329] border border-purple-800/60 text-purple-200 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span className="text-[11px] font-bold">Nowcast: {liveNowcastCount}</span>
          </div>

          <div className="px-2 py-1 rounded-md bg-[#241710] border border-amber-800/60 text-amber-200 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-[11px] font-bold">Warnings: {liveWarningsCount}</span>
          </div>

          {onToggleLeftQueue && (
            <button
              onClick={onToggleLeftQueue}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold flex items-center gap-1.5 border transition-all ${
                isLeftQueueOpen
                  ? 'bg-rose-950/80 border-rose-600 text-rose-200 shadow-md ring-1 ring-rose-500/40'
                  : 'bg-[#121c2e] hover:bg-[#18263e] border-[#223652] text-slate-300 hover:text-white'
              }`}
              title="Toggle Live Authoritative Events Feed"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Events ({liveEventsCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Right: Satellite, Radar, SIH PPTX, Architecture Proposal & Emergency Broadcast */}
      <div className="flex items-center gap-1.5 shrink-0">
        
        {/* INSAT-3DR Satellite Viewer Modal */}
        {onOpenSatelliteViewer && (
          <button
            onClick={onOpenSatelliteViewer}
            className="px-2.5 py-1 rounded-lg bg-[#111c2e] hover:bg-[#182842] border border-purple-500/50 hover:border-purple-400 text-purple-200 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm"
            title="Inspect Official INSAT-3DR Geostationary Rapid Scan Imagery"
          >
            <Satellite className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">INSAT-3DR</span>
          </button>
        )}

        {/* DWR Doppler Radar Viewer Modal */}
        {onOpenRadarViewer && (
          <button
            onClick={onOpenRadarViewer}
            className="px-2.5 py-1 rounded-lg bg-[#111c2e] hover:bg-[#182842] border border-cyan-500/50 hover:border-cyan-400 text-cyan-200 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm"
            title="Inspect Live IMD Doppler Weather Radar Volumetric Scans"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">DWR Radar</span>
          </button>
        )}

        {/* System Overview & Architecture Proposal Modal */}
        {onOpenSystemOverview && (
          <button
            onClick={onOpenSystemOverview}
            className="px-2.5 py-1 rounded-lg bg-[#0e1d2e] hover:bg-[#152a42] border border-cyan-500/70 text-cyan-200 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm"
            title="Inspect Platform System Overview & Technical Architecture Proposal"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Proposal</span>
          </button>
        )}

        {/* Direct SIH 2025 PPTX Download */}
        <a
          href="/SIH_2025_PS26084_Convective_Nowcasting_Proposal.pptx"
          download="SIH_2025_PS26084_Convective_Nowcasting_Proposal.pptx"
          className="px-2.5 py-1 rounded-lg bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/80 text-emerald-200 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm group"
          title="Download Official SIH 2025 PS 26084 Idea Submission Presentation (.pptx)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping group-hover:scale-125" />
          <span className="font-extrabold tracking-wide">PS 26084 PPTX</span>
        </a>

        {/* Data Source Health Drawer */}
        <button
          onClick={onToggleDataHealth}
          className="p-1.5 rounded-lg bg-[#0f1726] hover:bg-[#162236] border border-[#20324d] text-cyan-300 hover:text-white transition-all shadow-sm"
          title="Inspect Meteorological Feed Latencies & Reliability"
        >
          <Server className="w-3.5 h-3.5" />
        </button>

        {/* Manual Refresh */}
        <button
          onClick={handleRefresh}
          className="p-1.5 rounded-lg bg-[#0f1726] hover:bg-[#162236] border border-[#20324d] text-slate-300 hover:text-white transition-all shadow-sm"
          title="Refresh All Real-Time Telemetry Feeds"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
        </button>

        {/* Siren Alert Toggle */}
        <button
          onClick={() => setSirenActive(!sirenActive)}
          className={`p-1.5 rounded-lg border transition-all ${
            sirenActive 
              ? 'bg-rose-950 text-rose-300 border-rose-600 animate-pulse' 
              : 'bg-[#0f1726] text-slate-400 border-[#20324d] hover:text-slate-200'
          }`}
          title={sirenActive ? 'Mute Audio Alarm' : 'Arm Audio Siren for Extreme Hazards'}
        >
          {sirenActive ? <Volume2 className="w-3.5 h-3.5 text-rose-400" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        {/* CAP Alert Broadcast Trigger */}
        <button
          onClick={onOpenAlertModal}
          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          title="Generate Common Alerting Protocol (CAP) Message"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">CAP</span>
        </button>

      </div>

    </header>
  );
};
