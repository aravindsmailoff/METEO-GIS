'use client';

import React from 'react';
import {
  Zap, AlertTriangle, Waves, Wind, Compass, ShieldAlert, ArrowRight, CheckCircle2, Clock
} from 'lucide-react';
import { DerivedHazardEvent } from '@/app/api/live/hazards/route';

import { getHazardCountdownDetails } from '@/lib/hazardCountdown';

interface ActiveEventBarProps {
  primaryEvent: DerivedHazardEvent | any | null;
  onInspectEvent: (event: any) => void;
  selectedState: string;
}

export const ActiveEventBar: React.FC<ActiveEventBarProps> = ({
  primaryEvent,
  onInspectEvent,
  selectedState,
}) => {
  const [currentTimeMs, setCurrentTimeMs] = React.useState<number>(Date.now());

  React.useEffect(() => {
    const id = setInterval(() => setCurrentTimeMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!primaryEvent) {
    return (
      <div className="h-9 bg-slate-950/90 border-b border-slate-800/80 px-4 flex items-center justify-between text-xs text-slate-400 select-none flex-shrink-0">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={13} className="text-emerald-400" />
          <span className="font-medium text-slate-300">
            Normal Synoptic Status ({selectedState})
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">
            No active Red/Orange convective threats approaching tracked corridors. 1,165 AWS telemetry active.
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>IMD Nowcast & Radar Monitoring Active</span>
        </div>
      </div>
    );
  }

  const isRed = primaryEvent.severity === 'RED';
  const isOrange = primaryEvent.severity === 'ORANGE';
  const isCloudburst = primaryEvent.cloudburstStatus === 'CONFIRMED' || primaryEvent.category === 'CLOUDBURST';
  const isHail = primaryEvent.category === 'HAIL';

  // Hazard Icon
  const HazardIcon = isCloudburst ? Waves : isHail ? AlertTriangle : Zap;

  // Dynamic Category-Specific Countdown Engine (Cyclone vs Cloudburst vs Thunderstorm vs Hail)
  const cd = getHazardCountdownDetails(primaryEvent, currentTimeMs);


  return (
    <div
      className={`h-13 border-b px-4 flex items-center justify-between gap-4 text-xs select-none flex-shrink-0 transition-all shadow-md ${
        isRed
          ? 'bg-gradient-to-r from-red-950 via-slate-950 to-red-950 border-red-500/60 text-red-100 shadow-red-950/30'
          : 'bg-gradient-to-r from-amber-950 via-slate-950 to-amber-950 border-amber-500/60 text-amber-100 shadow-amber-950/30'
      }`}
    >
      {/* ── Left: Hazard Identification & Corridor ────────────────── */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-black tracking-wider uppercase border flex-shrink-0 shadow-sm ${
            isRed
              ? 'bg-red-500 text-white border-red-400'
              : 'bg-amber-500 text-slate-950 border-amber-400'
          }`}
        >
          <HazardIcon size={14} strokeWidth={2.5} />
          <span>{primaryEvent.category}</span>
          <span>{primaryEvent.severity}</span>
        </div>

        <div className="min-w-0">
          <div className="font-extrabold text-sm text-white tracking-tight truncate">
            {primaryEvent.district} ({primaryEvent.state})
          </div>
          <div className="text-[11px] text-slate-300 truncate">
            {primaryEvent.categoryLabels?.join(' · ') || primaryEvent.summary}
          </div>
        </div>
      </div>

      {/* ── Center: PROMINENT LARGE COUNTDOWN TIMER (HERO MISSION CLOCK) ── */}
      <div className={`flex items-center gap-3 px-4 py-1.5 rounded-xl bg-black/95 border-2 shadow-[0_0_24px_rgba(245,158,11,0.45)] ${
        cd.colorScheme === 'red' ? 'border-red-500/90 shadow-red-950/60' : cd.colorScheme === 'purple' ? 'border-purple-500/90 shadow-purple-950/60' : 'border-amber-400/90'
      }`}>
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3.5 w-3.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              cd.colorScheme === 'red' ? 'bg-red-400' : 'bg-amber-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
              cd.colorScheme === 'red' ? 'bg-red-500' : 'bg-amber-500'
            }`}></span>
          </span>
          <div className="flex flex-col items-start leading-none">
            <span className={`text-[9px] uppercase font-black tracking-widest mb-1 ${
              cd.colorScheme === 'red' ? 'text-red-400' : cd.colorScheme === 'purple' ? 'text-purple-300' : 'text-amber-400'
            }`}>
              {cd.hazardTitle}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xl md:text-2xl font-black font-mono text-white tracking-widest tabular-nums drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]">
                {cd.clockStr}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase font-mono tracking-wider border ${
                cd.colorScheme === 'red'
                  ? 'bg-red-500/20 text-red-300 border-red-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                REMAINING
              </span>
            </div>
          </div>
        </div>
        <div className="h-8 w-[1.5px] bg-slate-700/80 hidden sm:block" />
        <div className="text-[10.5px] text-slate-300 hidden sm:block leading-tight font-medium max-w-xs">
          <div className="text-amber-300 font-bold truncate">{cd.hazardBadge}</div>
          <div className="text-slate-400 text-[9.5px] truncate">{cd.operationalWindowLabel}</div>
        </div>
      </div>

      {/* ── Right: Provenance & Inspect Action ─────────────────────── */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="hidden xl:flex flex-col items-end text-[10px] leading-tight text-slate-400">
          <span>Source Feed</span>
          <span className="font-bold text-slate-200">
            {primaryEvent.sourceEndpoint || 'IMD Official Bulletin'}
          </span>
        </div>

        <button
          onClick={() => onInspectEvent(primaryEvent)}
          className={`h-9 px-3.5 rounded-lg text-xs font-black tracking-wide flex items-center gap-1.5 border shadow-md transition-all ${
            isRed
              ? 'bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-red-950/50'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300 shadow-amber-950/50'
          }`}
        >
          <span>INSPECT ZONE</span>
          <ArrowRight size={13} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
