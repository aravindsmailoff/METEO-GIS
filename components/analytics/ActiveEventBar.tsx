'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap, AlertTriangle, Waves, Wind, Compass, ShieldAlert, ArrowRight, CheckCircle2, Clock, ChevronLeft, ChevronRight
} from 'lucide-react';
import { DerivedHazardEvent } from '@/app/api/live/hazards/route';
import { getHazardCountdownDetails } from '@/lib/hazardCountdown';

interface ActiveEventBarProps {
  primaryEvent: DerivedHazardEvent | any | null;
  availableEvents?: (DerivedHazardEvent | any)[];
  onInspectEvent: (event: any) => void;
  selectedState: string;
}

export const ActiveEventBar: React.FC<ActiveEventBarProps> = ({
  primaryEvent,
  availableEvents = [],
  onInspectEvent,
  selectedState,
}) => {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);
  const [activeZoneIndex, setActiveZoneIndex] = useState<number>(0);

  useEffect(() => {
    setIsMounted(true);
    setCurrentTimeMs(Date.now());
    const id = setInterval(() => setCurrentTimeMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Filter available danger zones strictly by selected state
  const activeEventsList = React.useMemo(() => {
    if (selectedState && selectedState !== 'All India') {
      return (availableEvents || []).filter(
        (e) => e.state && (
          e.state.toLowerCase().includes(selectedState.toLowerCase()) ||
          selectedState.toLowerCase().includes(e.state.toLowerCase())
        )
      );
    }
    return availableEvents || [];
  }, [availableEvents, selectedState]);

  // Synchronize activeZoneIndex when primaryEvent changes from map or list click
  useEffect(() => {
    if (primaryEvent && activeEventsList.length > 0) {
      const idx = activeEventsList.findIndex(
        (e) => e.id === primaryEvent.id || (e.district && primaryEvent.district && e.district.toLowerCase() === primaryEvent.district.toLowerCase())
      );
      if (idx !== -1) {
        setActiveZoneIndex(idx);
      }
    }
  }, [primaryEvent, activeEventsList]);

  const currentEvent = activeEventsList.length > 0
    ? activeEventsList[activeZoneIndex % activeEventsList.length]
    : primaryEvent;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeEventsList.length === 0) return;
    const nextIdx = activeZoneIndex > 0 ? activeZoneIndex - 1 : activeEventsList.length - 1;
    setActiveZoneIndex(nextIdx);
    const targetEvent = activeEventsList[nextIdx];
    if (targetEvent) {
      onInspectEvent(targetEvent);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeEventsList.length === 0) return;
    const nextIdx = (activeZoneIndex + 1) % activeEventsList.length;
    setActiveZoneIndex(nextIdx);
    const targetEvent = activeEventsList[nextIdx];
    if (targetEvent) {
      onInspectEvent(targetEvent);
    }
  };

  const displayEvent = currentEvent;
  const isSevere = displayEvent?.isSevere || ['RED', 'ORANGE'].includes(displayEvent?.severity);
  const cd = getHazardCountdownDetails(displayEvent, currentTimeMs);
  const hasActiveWarning = displayEvent && isSevere && displayEvent.category !== 'MONITORING' && displayEvent.severity !== 'GREEN' && cd.isCountdownActive;

  if (!displayEvent || !hasActiveWarning) {
    const locName = displayEvent?.district ? `${displayEvent.district}${displayEvent.state ? ` (${displayEvent.state})` : ''}` : selectedState !== 'All India' ? selectedState : 'National Surveillance Sector';
    return (
      <div className="h-13 border-b px-4 flex items-center justify-between gap-3 text-xs select-none flex-shrink-0 transition-all shadow-md bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-slate-800 text-slate-300">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-black tracking-wider uppercase border border-emerald-500/40 bg-emerald-500/20 text-emerald-300">
            <CheckCircle2 size={14} strokeWidth={2.5} />
            <span>NORMAL</span>
            <span>ALL CLEAR</span>
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-sm text-white tracking-tight truncate flex items-center gap-2">
              <span>{locName}</span>
              <span className="px-1.5 py-0.2 rounded text-[9.5px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-bold uppercase hidden sm:inline">
                No Active Warning
              </span>
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {displayEvent?.district ? `Atmospheric conditions within baseline thresholds for ${displayEvent.district}. No active severe alerts.` : selectedState && selectedState !== 'All India' ? `No severe weather warnings active in ${selectedState}.` : 'Atmospheric conditions within standard baseline across active surveillance sectors.'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-1.5 rounded-xl bg-black/80 border border-slate-700">
          <div className="flex items-center gap-2">
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            <div className="flex flex-col items-start leading-none">
              <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 mb-0.5">
                DOPPLER SURVEILLANCE
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-emerald-300 font-bold tracking-wider">
                  COUNTDOWN INACTIVE
                </span>
                <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase font-mono tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                  NORMAL
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          {availableEvents && availableEvents.length > 0 && (
            <button
              onClick={() => onInspectEvent(availableEvents[0])}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white font-extrabold text-xs shadow-md transition-all active:scale-95"
            >
              <span>INSPECT ACTIVE ALERT ({availableEvents[0].district})</span>
              <ArrowRight size={13} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>
    );
  }
  const isRed = displayEvent.severity === 'RED';
  const isCloudburst = displayEvent.cloudburstStatus === 'CONFIRMED' || displayEvent.category === 'CLOUDBURST' || displayEvent.headline?.toLowerCase().includes('cloudburst');
  const isCyclone = displayEvent.category === 'CYCLONE' || displayEvent.headline?.toLowerCase().includes('cyclon') || displayEvent.summary?.toLowerCase().includes('cyclon');
  const isHail = displayEvent.category === 'HAIL';

  // Hazard Icon
  const HazardIcon = isCloudburst ? Waves : isCyclone ? Wind : isHail ? AlertTriangle : Zap;

  return (
    <div
      className={`h-13 border-b px-4 flex items-center justify-between gap-3 text-xs select-none flex-shrink-0 transition-all shadow-md ${
        isRed
          ? 'bg-gradient-to-r from-red-950 via-slate-950 to-red-950 border-red-500/60 text-red-100 shadow-red-950/30'
          : 'bg-gradient-to-r from-amber-950 via-slate-950 to-amber-950 border-amber-500/60 text-amber-100 shadow-amber-950/30'
      }`}
    >
      {/* ── Left: Hazard Identification, Zone Switcher & Corridor ── */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Danger Zone Multi-Zone Switcher */}
        {activeEventsList.length > 1 && (
          <div className="flex items-center gap-1 bg-black/60 border border-slate-700/80 rounded-lg px-1.5 py-0.5 text-[10px] font-mono flex-shrink-0">
            <button
              onClick={handlePrev}
              className="p-0.5 hover:text-white text-slate-400 hover:bg-slate-800 rounded transition-colors"
              title="Previous Active Danger Zone"
            >
              <ChevronLeft size={13} />
            </button>
            <button
              onClick={handleNext}
              className="text-amber-400 hover:text-amber-300 font-bold px-1 whitespace-nowrap cursor-pointer hover:underline"
              title="Click to cycle next danger zone"
            >
              ZONE {(activeZoneIndex % activeEventsList.length) + 1}/{activeEventsList.length}
            </button>
            <button
              onClick={handleNext}
              className="p-0.5 hover:text-white text-slate-400 hover:bg-slate-800 rounded transition-colors"
              title="Next Active Danger Zone"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        )}

        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-black tracking-wider uppercase border flex-shrink-0 shadow-sm ${
            isRed
              ? 'bg-red-500 text-white border-red-400'
              : 'bg-amber-500 text-slate-950 border-amber-400'
          }`}
        >
          <HazardIcon size={14} strokeWidth={2.5} />
          <span>{displayEvent.category}</span>
          <span>{displayEvent.severity}</span>
        </div>

        <div className="min-w-0">
          <div className="font-extrabold text-sm text-white tracking-tight truncate flex items-center gap-2">
            <span>{displayEvent.district} {displayEvent.state ? `(${displayEvent.state})` : ''}</span>
            <span className="px-1.5 py-0.2 rounded text-[9.5px] bg-red-500/20 border border-red-500/40 text-red-300 font-mono font-bold uppercase hidden sm:inline">
              {cd.hazardBadge}
            </span>
          </div>
          <div className="text-[11px] text-slate-300 truncate">
            {displayEvent.categoryLabels?.join(' · ') || displayEvent.headline || displayEvent.summary}
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
              <span suppressHydrationWarning className="text-xl md:text-2xl font-black font-mono text-white tracking-widest tabular-nums drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]">
                {isMounted ? cd.clockStr : '--:--:--'}
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
        <div className="h-8 w-[1.5px] bg-slate-700/80 hidden lg:block" />
        <div className="text-[10.5px] text-slate-300 hidden lg:block leading-tight font-medium max-w-xs">
          <div className="text-amber-300 font-bold truncate">{cd.hazardBadge}</div>
          <div className="text-slate-400 text-[9.5px] truncate">{cd.operationalWindowLabel}</div>
        </div>
      </div>

      {/* ── Right: Provenance & Inspect Action ─────────────────────── */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="hidden xl:flex flex-col items-end text-[10px] leading-tight text-slate-400">
          <span>Source Feed</span>
          <span className="font-bold text-slate-200">
            {displayEvent.sourceEndpoint || 'IMD Official Bulletin'}
          </span>
        </div>

        <button
          onClick={() => onInspectEvent(displayEvent)}
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

