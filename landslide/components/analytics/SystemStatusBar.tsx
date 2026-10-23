'use client';

import React from 'react';
import { Satellite, Radio, Navigation, Mountain, ShieldCheck, RefreshCw } from 'lucide-react';

interface SystemStatusBarProps {
  lastSyncTime: string;
  onOpenDataHealth?: () => void;
}

export const SystemStatusBar: React.FC<SystemStatusBarProps> = ({ lastSyncTime, onOpenDataHealth }) => {
  return (
    <footer className="h-6.5 bg-slate-950 border-t border-slate-800/80 px-4 flex items-center justify-between text-[11px] text-slate-400 select-none flex-shrink-0">
      {/* ── Left: Feed & Sensor Health ─────────────────────────────── */}
      <div
        className="flex items-center gap-4 cursor-pointer hover:opacity-90 transition-opacity"
        onClick={onOpenDataHealth}
        title="Click to view full Live Data Health & Ingestion Audit report"
      >
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-slate-300 font-medium">IMD:</span>
          <span className="text-emerald-400">● Live (5m)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-slate-300 font-medium">INSAT-3DR:</span>
          <span className="text-slate-400">● Live</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-slate-300 font-medium">DWR Radar:</span>
          <span className="text-slate-400">● Live (34 stn)</span>
        </div>
        <div className="flex items-center gap-1.5 hidden md:flex">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-slate-300 font-medium">Bhuvan:</span>
          <span className="text-slate-400">● Connected</span>
        </div>
        <div className="flex items-center gap-1.5 hidden lg:flex">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-slate-300 font-medium">DEM:</span>
          <span className="text-slate-400">● Available</span>
        </div>
      </div>

      {/* ── Right: Provenance & Sync ───────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-1 text-slate-400">
          <ShieldCheck size={11} className="text-blue-400" />
          <span>Official Feeds (IMD · ISRO · NASA)</span>
        </div>
        <div className="flex items-center gap-1 font-mono text-[10.5px] text-slate-400">
          <RefreshCw size={10} className="text-slate-500" />
          <span>Sync: 60s (Last: {lastSyncTime})</span>
        </div>
      </div>
    </footer>
  );
};
