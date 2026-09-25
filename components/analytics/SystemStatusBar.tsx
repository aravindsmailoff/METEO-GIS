'use client';

import React from 'react';
import { Satellite, Radio, Navigation, Mountain, ShieldCheck, RefreshCw } from 'lucide-react';

interface SystemStatusBarProps {
  lastSyncTime: string;
}

export const SystemStatusBar: React.FC<SystemStatusBarProps> = ({ lastSyncTime }) => {
  return (
    <footer className="h-6.5 bg-slate-950 border-t border-slate-800/80 px-4 flex items-center justify-between text-[11px] text-slate-400 select-none flex-shrink-0">
      {/* ── Left: Feed & Sensor Health ─────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-slate-300 font-medium">INSAT-3DR:</span>
          <span className="text-slate-400">Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-slate-300 font-medium">DWR Radar:</span>
          <span className="text-slate-400">34 Active</span>
        </div>
        <div className="flex items-center gap-1.5 hidden md:flex">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-slate-300 font-medium">IMD AWS/ARG:</span>
          <span className="text-slate-400">1,165 Stations</span>
        </div>
        <div className="flex items-center gap-1.5 hidden lg:flex">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-slate-300 font-medium">Bhuvan DEM:</span>
          <span className="text-slate-400">Online</span>
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
