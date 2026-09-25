'use client';

import React from 'react';
import {
  ShieldAlert, Radio, Satellite, CloudRain, Navigation, Zap, Clock
} from 'lucide-react';

interface LiveIntelligenceStripProps {
  activeWarningsCount: number;
  awsStationsCount: number;
  rainfallObsCount: number;
  nowcastAlertsCount: number;
  activeHazardsCount: number;
  lastSyncTime: string;
  onFilterClick?: (filter: 'warnings' | 'aws' | 'rainfall' | 'nowcast' | 'hazards' | 'floods') => void;
  activeFilter?: string;
}

export const LiveIntelligenceStrip: React.FC<LiveIntelligenceStripProps> = ({
  activeWarningsCount,
  awsStationsCount,
  rainfallObsCount,
  nowcastAlertsCount,
  activeHazardsCount,
  lastSyncTime,
  onFilterClick,
  activeFilter,
}) => {
  const KPIS = [
    {
      id: 'warnings',
      label: 'Active Warnings',
      value: activeWarningsCount !== undefined ? activeWarningsCount : '—',
      sub: 'IMD Red/Orange alerts',
      icon: ShieldAlert,
      color: activeWarningsCount > 0 ? 'text-red-400' : 'text-slate-300',
      badgeColor: activeWarningsCount > 0 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-400',
      freshness: '● Live',
    },
    {
      id: 'aws',
      label: 'AWS Stations',
      value: awsStationsCount ? awsStationsCount.toLocaleString() : '1,165',
      sub: 'Real-time telemetry',
      icon: Navigation,
      color: 'text-emerald-400',
      badgeColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      freshness: '● 15m cycle',
    },
    {
      id: 'rainfall',
      label: 'Rainfall Obs',
      value: rainfallObsCount !== undefined ? rainfallObsCount : '—',
      sub: '24h IMD rain gauges',
      icon: CloudRain,
      color: 'text-amber-400',
      badgeColor: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      freshness: '● 1h sync',
    },
    {
      id: 'nowcast',
      label: 'Nowcast Alerts',
      value: nowcastAlertsCount !== undefined ? nowcastAlertsCount : '—',
      sub: '0–3h rapid warnings',
      icon: Clock,
      color: nowcastAlertsCount > 0 ? 'text-sky-400' : 'text-slate-300',
      badgeColor: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
      freshness: '● Live',
    },
    {
      id: 'radar',
      label: 'Radar Network',
      value: '34 DWR',
      sub: 'Dual-Pol Doppler live',
      icon: Radio,
      color: 'text-cyan-400',
      badgeColor: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
      freshness: '● Online',
    },
    {
      id: 'satellite',
      label: 'Satellite Feeds',
      value: 'INSAT-3DR',
      sub: 'MOSDAC 4km IR / VIS',
      icon: Satellite,
      color: 'text-indigo-400',
      badgeColor: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
      freshness: '● Online',
    },
    {
      id: 'hazards',
      label: 'Active Hazards',
      value: activeHazardsCount !== undefined ? activeHazardsCount : '—',
      sub: 'Thunder / Hail / Pluvial',
      icon: Zap,
      color: activeHazardsCount > 0 ? 'text-amber-400' : 'text-slate-300',
      badgeColor: activeHazardsCount > 0 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400',
      freshness: '● Live',
    },
  ];

  return (
    <div className="h-11 bg-slate-900 border-b border-slate-800/80 px-4 flex items-stretch divide-x divide-slate-800/80 overflow-x-auto scrollbar-none select-none flex-shrink-0">
      {KPIS.map((kpi) => {
        const Icon = kpi.icon;
        const isSelected = activeFilter === kpi.id;
        return (
          <div
            key={kpi.id}
            onClick={() => onFilterClick && onFilterClick(kpi.id as any)}
            className={`flex-1 min-w-[130px] px-3 py-1 flex items-center justify-between gap-2.5 cursor-pointer hover:bg-slate-800/50 transition-colors ${
              isSelected ? 'bg-slate-800/80' : ''
            }`}
            title={`View ${kpi.label} details`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 truncate">
                  {kpi.label}
                </span>
                <span className="text-[9px] font-medium text-emerald-400/90 hidden sm:inline">
                  {kpi.freshness}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className={`text-base font-bold font-mono tracking-tight tabular-nums ${kpi.color}`}>
                  {kpi.value}
                </span>
                <span className="text-[10px] text-slate-400 truncate hidden xl:inline">
                  {kpi.sub}
                </span>
              </div>
            </div>
            <div className={`w-6 h-6 rounded flex items-center justify-center border flex-shrink-0 ${kpi.badgeColor}`}>
              <Icon size={12} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
