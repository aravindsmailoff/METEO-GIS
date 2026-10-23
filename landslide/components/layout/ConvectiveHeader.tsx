'use client';

import React, { useState, useEffect } from 'react';
import { 
  CloudLightning, 
  Radio, 
  Globe, 
  Plane, 
  Calendar, 
  RefreshCw, 
  ShieldAlert, 
  AlertTriangle,
  Zap
} from 'lucide-react';

interface ConvectiveHeaderProps {
  currentScenarioId: string;
  onSelectScenario: (id: string) => void;
  leadTimeHours: number;
}

export const ConvectiveHeader: React.FC<ConvectiveHeaderProps> = ({
  currentScenarioId,
  onSelectScenario,
  leadTimeHours,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }) + ' IST');
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const isLive = currentScenarioId === 'LIVE_SYNCHRONOUS';

  return (
    <header className="w-full bg-[#111722] border-b border-[#1f2b3c] px-3 lg:px-4 py-2 sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 shadow-md">
      
      {/* 1. Left: MoES / NCMRWF Logo & PS 26084 Title */}
      <div className="flex items-center gap-3">
        {/* Radar Pulse Badge */}
        <div className="relative flex items-center justify-center w-9 h-9 rounded bg-gradient-to-br from-purple-700 via-indigo-900 to-slate-900 text-white shadow-sm border border-purple-500/40">
          <CloudLightning className="w-5 h-5 text-amber-300" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm lg:text-base font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
              🇮🇳 MoES / NCMRWF • <span className="text-cyan-300">Convective-Scale Nowcasting (0–6 hr)</span>
            </h1>
            <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-[#182333] text-purple-300 border border-purple-800/60 rounded">
              SIH 2026 PS 26084
            </span>
          </div>

          <div className="text-[10.5px] text-slate-400 flex items-center gap-2">
            <span>Chennai & North TN DWR Belt • 🇮🇳 ISRO Bhuvan & MOSDAC Synced</span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-400 font-mono text-[10px]">{currentTime}</span>
          </div>
        </div>
      </div>

      {/* 2. Center: Mode Switcher (Live vs Backtest Replay) */}
      <div className="flex items-center gap-1.5 bg-[#0d141e] p-1 rounded-lg border border-[#1f2b3c] text-xs">
        <button
          onClick={() => onSelectScenario('LIVE_SYNCHRONOUS')}
          className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1.5 ${
            isLive
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>LIVE SYNCHRONOUS</span>
        </button>

        <button
          onClick={() => onSelectScenario('DEC_2015_DELUGE')}
          className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1.5 ${
            !isLive
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>BACKTEST REPLAY (Dec 2015 Deluge)</span>
        </button>
      </div>

      {/* 3. Right: DWR Radar Network Triangulation Badges & Beneficiary */}
      <div className="hidden xl:flex items-center gap-2.5 text-[10px] font-mono">
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#141e2b] border border-[#23354c] text-cyan-300">
          <Radio className="w-3 h-3 text-cyan-400" />
          <span>Chennai S-Band: ONLINE</span>
        </div>

        <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#141e2b] border border-[#23354c] text-purple-300">
          <Radio className="w-3 h-3 text-purple-400" />
          <span>NIOT X-Band: ONLINE</span>
        </div>

        <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#141e2b] border border-[#23354c] text-amber-300">
          <Plane className="w-3 h-3 text-amber-400" />
          <span>MWO Chennai: TERMINAL SYNCED</span>
        </div>
      </div>

    </header>
  );
};
