'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Waves, AlertTriangle, ShieldCheck, ArrowRight, Gauge, Clock, ChevronRight } from 'lucide-react';
import { AceternityCard } from './AceternityCard';

interface DamItem {
  id: string;
  name: string;
  river: string;
  fillPct: number;
  inflow: number; // m3/s
  outflow: number; // m3/s
  capacityMax: number; // MCM
  currentStorage: number;
  gatesTotal: number;
  gatesOpen: number;
  status: 'DANGER' | 'WARNING' | 'WATCH';
  statusColor: string;
  downstreamAlert: boolean;
  timeline: { area: string; time: string; distance: string; status: string }[];
}

const DAMS: DamItem[] = [
  {
    id: 'teesta5',
    name: 'Teesta-V Dam',
    river: 'Teesta River (NHPC)',
    fillPct: 91.4,
    inflow: 3842,
    outflow: 2100,
    capacityMax: 50.25,
    currentStorage: 45.92,
    gatesTotal: 4,
    gatesOpen: 3,
    status: 'DANGER',
    statusColor: '#ef4444',
    downstreamAlert: true,
    timeline: [
      { area: 'Singtam Bazaar', time: '1.5 hrs', distance: '18 km', status: 'Inundation Imminent' },
      { area: 'Rangpo Bridge', time: '3.0 hrs', distance: '34 km', status: 'High Water Surge' },
      { area: 'Melli Bazaar', time: '5.5 hrs', distance: '56 km', status: 'Level 2 Evacuation' },
      { area: 'Jorethang Confluence', time: '8.0 hrs', distance: '78 km', status: 'Precautionary Watch' },
    ],
  },
  {
    id: 'rathong',
    name: 'Rathong-Chu HEP',
    river: 'Rathong-Chu River',
    fillPct: 74.0,
    inflow: 1240,
    outflow: 850,
    capacityMax: 22.1,
    currentStorage: 16.35,
    gatesTotal: 3,
    gatesOpen: 1,
    status: 'WARNING',
    statusColor: '#f97316',
    downstreamAlert: false,
    timeline: [
      { area: 'Yuksom Lowlands', time: '2.0 hrs', distance: '12 km', status: 'Riverbank Warning' },
      { area: 'Tashiding Confluence', time: '4.5 hrs', distance: '28 km', status: 'Monitoring Inflow' },
    ],
  },
  {
    id: 'dikchu',
    name: 'Dikchu Hydro Dam',
    river: 'Dikchu River Basin',
    fillPct: 58.2,
    inflow: 980,
    outflow: 720,
    capacityMax: 18.0,
    currentStorage: 10.48,
    gatesTotal: 2,
    gatesOpen: 0,
    status: 'WATCH',
    statusColor: '#eab308',
    downstreamAlert: false,
    timeline: [
      { area: 'Dikchu Settlement', time: '1.0 hrs', distance: '8 km', status: 'Normal Regulated' },
      { area: 'Singtam Confluence', time: '2.5 hrs', distance: '22 km', status: 'Clear Flow' },
    ],
  },
];

export function DamStatusPanel() {
  const [selectedDamId, setSelectedDamId] = useState('teesta5');
  const currentDam = DAMS.find((d) => d.id === selectedDamId) || DAMS[0];

  return (
    <div className="flex flex-col gap-4 select-none pb-12">
      {/* Dam Tabs */}
      <div className="flex gap-1.5 p-1 rounded-2xl bg-white/[0.05] border border-white/10 text-xs">
        {DAMS.map((dam) => (
          <button
            key={dam.id}
            onClick={() => setSelectedDamId(dam.id)}
            className={`flex-1 py-2 px-2.5 rounded-xl font-semibold transition-all flex flex-col items-center gap-0.5 ${
              selectedDamId === dam.id
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span className="truncate w-full text-center text-xs">{dam.name}</span>
            <span
              className="text-[9px] font-mono font-bold"
              style={{ color: dam.statusColor }}
            >
              {dam.fillPct}% FULL
            </span>
          </button>
        ))}
      </div>

      {/* Main Dam 3D Glass Card */}
      <AceternityCard className="p-4" glowColor={`${currentDam.statusColor}33`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{currentDam.name}</h3>
            <p className="text-xs text-white/60">{currentDam.river}</p>
          </div>

          <div
            className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider font-mono border"
            style={{
              backgroundColor: `${currentDam.statusColor}22`,
              borderColor: `${currentDam.statusColor}55`,
              color: currentDam.statusColor,
            }}
          >
            {currentDam.status}
          </div>
        </div>

        {/* Animated Liquid Reservoir Meter */}
        <div className="relative w-full h-24 rounded-2xl overflow-hidden bg-white/[0.04] border border-white/10 p-3 flex flex-col justify-between mb-4">
          {/* Liquid Fill Level */}
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${currentDam.fillPct}%` }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-0 left-0 right-0 opacity-40 rounded-b-2xl pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${currentDam.statusColor} 0%, rgba(3, 105, 161, 0.8) 100%)`,
            }}
          />

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-white/70">Reservoir Storage</span>
            <span className="text-xs font-mono font-bold text-white">
              {currentDam.currentStorage} / {currentDam.capacityMax} MCM
            </span>
          </div>

          <div className="relative z-10 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {currentDam.fillPct}%
              </span>
              <span className="text-xs font-semibold text-white/50">Capacity</span>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono font-bold text-amber-300">
                {currentDam.gatesOpen} of {currentDam.gatesTotal} Gates Open
              </span>
            </div>
          </div>
        </div>

        {/* Inflow vs Outflow Bento */}
        <div className="grid grid-cols-2 gap-2">
          <div className="apple-bento p-3">
            <span className="text-[10px] text-white/50 uppercase tracking-wider block mb-0.5">
              Live Inflow
            </span>
            <div className="text-xl font-bold text-white flex items-center gap-1">
              <span>{currentDam.inflow.toLocaleString()}</span>
              <span className="text-xs font-medium text-white/50">m³/s</span>
            </div>
            <span className="text-[10px] text-red-400 font-medium">Critical high surge</span>
          </div>

          <div className="apple-bento p-3">
            <span className="text-[10px] text-white/50 uppercase tracking-wider block mb-0.5">
              Controlled Spillway
            </span>
            <div className="text-xl font-bold text-sky-400 flex items-center gap-1">
              <span>{currentDam.outflow.toLocaleString()}</span>
              <span className="text-xs font-medium text-white/50">m³/s</span>
            </div>
            <span className="text-[10px] text-sky-300/80 font-medium">Radial discharge active</span>
          </div>
        </div>
      </AceternityCard>

      {/* Downstream Inundation Impact Timeline */}
      <div className="apple-bento p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Discharge Flood Arrival Timeline
            </h4>
          </div>
          <span className="text-[10px] text-white/40 font-mono">Distance / ETA</span>
        </div>

        <div className="flex flex-col gap-2.5 pt-1">
          {currentDam.timeline.map((step, idx) => (
            <div
              key={step.area}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono font-bold text-white">
                  {idx + 1}
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-white">{step.area}</h5>
                  <p className="text-[10px] text-white/50">{step.status}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-amber-300 font-mono">{step.time}</div>
                <div className="text-[10px] text-white/40">{step.distance}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
