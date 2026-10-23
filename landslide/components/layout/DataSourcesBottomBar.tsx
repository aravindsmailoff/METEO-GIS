'use client';

import React, { useEffect, useState } from 'react';
import {
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Eye,
  Clock,
  ExternalLink,
  ShieldCheck,
  FileText
} from 'lucide-react';

interface DataSourceStatus {
  id: string;
  name: string;
  shortName: string;
  status: 'LIVE' | 'NEAR-REAL-TIME' | 'DELAYED' | 'UNAVAILABLE';
  dataAgeMinutes: number;
  recordsCount?: number;
}

interface DataSourcesBottomBarProps {
  onOpenDataHealth: () => void;
  onOpenSystemOverview: () => void;
  isRadarAvailable?: boolean;
  selectedRadarName?: string;
}

export const DataSourcesBottomBar: React.FC<DataSourcesBottomBarProps> = ({
  onOpenDataHealth,
  onOpenSystemOverview,
  isRadarAvailable = true,
  selectedRadarName,
}) => {
  const [sources, setSources] = useState<DataSourceStatus[]>([
    { id: 'IMD_AWS', name: 'IMD AWS Ground Network', shortName: 'IMD AWS (1,165 Stns)', status: 'LIVE', dataAgeMinutes: 15, recordsCount: 1165 },
    { id: 'IMD_NOWCAST', name: 'IMD 0-3h District Nowcast', shortName: 'IMD NOWCAST (755 Dist)', status: 'LIVE', dataAgeMinutes: 30, recordsCount: 755 },
    { id: 'IMD_WARNINGS', name: 'IMD 1-5 Day Warnings', shortName: 'IMD WARNINGS (754 Dist)', status: 'LIVE', dataAgeMinutes: 45, recordsCount: 754 },
    { id: 'INSAT_3DR', name: 'ISRO MOSDAC INSAT-3DR', shortName: 'INSAT-3DR MOSDAC', status: 'LIVE', dataAgeMinutes: 15 },
    { id: 'IMD_RADAR', name: 'IMD Doppler Weather Radar', shortName: 'DWR RADAR', status: isRadarAvailable ? 'LIVE' : 'UNAVAILABLE', dataAgeMinutes: 10 },
    { id: 'NASA_GPM', name: 'NASA GPM / IMERG Precipitation', shortName: 'NASA GPM / IMERG', status: 'NEAR-REAL-TIME', dataAgeMinutes: 180 },
  ]);

  const [lastCheckTime, setLastCheckTime] = useState<string>('Live');

  useEffect(() => {
    const fetchStatus = () => {
      fetch('/api/system/data-status')
        .then((res) => res.json())
        .then((data) => {
          if (data.sources && Array.isArray(data.sources)) {
            const mapped: DataSourceStatus[] = data.sources.map((s: any) => {
              let short = s.name;
              if (s.id === 'IMD_AWS_NETWORK') short = `IMD AWS (${s.recordsCount || 1165} Stns)`;
              else if (s.id === 'IMD_DISTRICT_NOWCAST') short = `IMD NOWCAST (${s.recordsCount || 755} Dist)`;
              else if (s.id === 'IMD_DISTRICT_WARNINGS') short = `IMD WARNINGS (${s.recordsCount || 754} Dist)`;
              else if (s.id === 'INSAT_3DR_MOSDAC') short = 'INSAT-3DR MOSDAC';
              else if (s.id === 'IMD_DWR_RADAR_NETWORK') short = isRadarAvailable ? 'DWR RADAR' : 'DWR RADAR (Out of Range)';
              else if (s.id === 'NASA_GPM_IMERG') short = 'NASA GPM / IMERG';

              let statusVal: 'LIVE' | 'NEAR-REAL-TIME' | 'DELAYED' | 'UNAVAILABLE' = 'LIVE';
              if (s.id === 'IMD_DWR_RADAR_NETWORK' && !isRadarAvailable) {
                statusVal = 'UNAVAILABLE';
              } else if (s.status === 'CONNECTED' && s.dataAgeMinutes <= 90) {
                statusVal = 'LIVE';
              } else if (s.status === 'NEAR-REAL-TIME' || (s.dataAgeMinutes > 90 && s.dataAgeMinutes <= 240)) {
                statusVal = 'NEAR-REAL-TIME';
              } else if (s.status === 'DELAYED' || s.dataAgeMinutes > 240) {
                statusVal = 'DELAYED';
              } else if (s.status === 'UNAVAILABLE') {
                statusVal = 'UNAVAILABLE';
              }

              return {
                id: s.id,
                name: s.name,
                shortName: short,
                status: statusVal,
                dataAgeMinutes: s.dataAgeMinutes,
                recordsCount: s.recordsCount,
              };
            });
            setSources(mapped);
            setLastCheckTime(new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }) + ' IST');
          }
        })
        .catch(() => { });
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [isRadarAvailable]);

  return (
    <div className="w-full bg-[#080d16] border-t border-[#1b2738] px-3 lg:px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs z-30 shrink-0 select-none">

      {/* Left: Section Header & Status Pills */}
      <div className="flex items-center gap-2 lg:gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-300 text-[11px]">
          <Server className="w-3.5 h-3.5 text-cyan-400" />
          <span>DATA SOURCES:</span>
        </div>

        <div className="flex items-center gap-1.5 lg:gap-2 flex-wrap font-mono text-[11px]">
          {sources.map((src) => {
            const isLive = src.status === 'LIVE';
            const isNrt = src.status === 'NEAR-REAL-TIME';
            const isDelayed = src.status === 'DELAYED';
            const isUnavail = src.status === 'UNAVAILABLE';

            return (
              <div
                key={src.id}
                className={`px-2 py-0.5 rounded border flex items-center gap-1.5 transition-all ${isLive
                    ? 'bg-emerald-950/70 border-emerald-700/80 text-emerald-200'
                    : isNrt
                      ? 'bg-cyan-950/70 border-cyan-700/80 text-cyan-200'
                      : isDelayed
                        ? 'bg-amber-950/70 border-amber-700/80 text-amber-200'
                        : 'bg-rose-950/70 border-rose-800 text-rose-200'
                  }`}
                title={`${src.name} — Status: ${src.status}, Age: ${src.dataAgeMinutes} min`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' :
                    isNrt ? 'bg-cyan-400' :
                      isDelayed ? 'bg-amber-400' : 'bg-rose-400'
                  }`} />
                <span className="font-semibold">{src.shortName}</span>
                <span className="text-[9px] font-bold opacity-80">
                  {isLive ? '● LIVE' : isNrt ? '● NRT' : isDelayed ? '● DELAYED' : '● UNAVAIL'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Quick Proposal & Health Modals Buttons */}
      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={onOpenSystemOverview}
          className="px-2.5 py-1 rounded bg-[#101b2a] hover:bg-[#17273c] border border-cyan-600 text-cyan-200 hover:text-white font-mono text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-sm"
          title="Open System Architecture & Smart India Hackathon Proposal"
        >
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span>System Overview & Architecture</span>
        </button>

        <button
          onClick={onOpenDataHealth}
          className="px-2.5 py-1 rounded bg-[#141e2b] hover:bg-[#1a2738] border border-[#23354c] text-slate-300 hover:text-white font-mono text-[11px] transition-all flex items-center gap-1"
          title="Inspect Detailed Latency and Endpoint Health"
        >
          <Activity className="w-3 h-3 text-emerald-400" />
          <span className="hidden sm:inline">Health Matrix</span>
        </button>
      </div>

    </div>
  );
};
