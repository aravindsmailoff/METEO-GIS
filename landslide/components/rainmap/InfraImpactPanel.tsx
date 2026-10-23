'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Navigation, Home, Zap, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { AceternityCard } from './AceternityCard';

interface InfraItem {
  id: string;
  category: 'bridge' | 'highway' | 'shelter' | 'utility';
  name: string;
  location: string;
  status: 'BLOCKED' | 'CRITICAL' | 'OPERATIONAL' | 'PRECAUTION';
  statusColor: string;
  detail: string;
  affectedPop: string;
}

const INFRA_DATA: InfraItem[] = [
  {
    id: '1',
    category: 'highway',
    name: 'NH-10 Gangtok-Siliguri Highway',
    location: 'Mile 29 near Singtam',
    status: 'BLOCKED',
    statusColor: '#ef4444',
    detail: 'Debris flow & river overflow. Heavy machinery deployed. No vehicular traffic permitted.',
    affectedPop: 'Main Arterial Corridor',
  },
  {
    id: '2',
    category: 'bridge',
    name: 'Indrani Suspension Bridge',
    location: 'Singtam River Confluence',
    status: 'CRITICAL',
    statusColor: '#ef4444',
    detail: 'Water level touching deck girder. Structural survey underway. Foot and vehicle access shut.',
    affectedPop: 'Singtam-Bermiok Link',
  },
  {
    id: '3',
    category: 'highway',
    name: 'NH-717A Alternate Corridor',
    location: 'Ranipool – Pakyong',
    status: 'PRECAUTION',
    statusColor: '#f97316',
    detail: 'Light vehicles permitted with caution. Single-lane bottleneck near Pakyong.',
    affectedPop: 'Airport Bypass Route',
  },
  {
    id: '4',
    category: 'shelter',
    name: 'Singtam Govt. Sr. Secondary Camp',
    location: 'Higher Ridge Road, Singtam',
    status: 'OPERATIONAL',
    statusColor: '#22c55e',
    detail: '340 of 500 beds occupied. Dry rations, clean water, medical doctor on site.',
    affectedPop: 'Capacity: 500 persons',
  },
  {
    id: '5',
    category: 'shelter',
    name: 'Rangpo Community Relief Center',
    location: 'Sub-Divisional Ground, Rangpo',
    status: 'OPERATIONAL',
    statusColor: '#22c55e',
    detail: '190 of 300 beds occupied. Standby ambulance and generator active.',
    affectedPop: 'Capacity: 300 persons',
  },
  {
    id: '6',
    category: 'utility',
    name: 'Dikchu 66kV Substation Grid',
    location: 'Dikchu Lower Bank',
    status: 'CRITICAL',
    statusColor: '#f97316',
    detail: 'Preventative load shedding in low-lying zones to prevent electrocution hazards.',
    affectedPop: '8,400 households',
  },
];

export function InfraImpactPanel() {
  const [filter, setFilter] = useState<'all' | 'highway' | 'bridge' | 'shelter'>('all');

  const filteredItems = filter === 'all'
    ? INFRA_DATA
    : INFRA_DATA.filter((item) => item.category === filter);

  return (
    <div className="flex flex-col gap-4 select-none pb-12">
      {/* Overview Metric Bento */}
      <AceternityCard className="p-4" glowColor="rgba(249, 115, 22, 0.25)">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-amber-400">
            Civil Infrastructure Status
          </span>
          <span className="text-[10px] text-white/50">State Disaster Management</span>
        </div>

        <div className="grid grid-cols-3 gap-2 my-2">
          <div className="apple-bento p-2.5 text-center">
            <span className="text-2xl font-black text-red-400">2</span>
            <span className="text-[10px] text-white/60 block mt-0.5">Roads Cut</span>
          </div>

          <div className="apple-bento p-2.5 text-center">
            <span className="text-2xl font-black text-amber-400">1</span>
            <span className="text-[10px] text-white/60 block mt-0.5">Bridge Shut</span>
          </div>

          <div className="apple-bento p-2.5 text-center">
            <span className="text-2xl font-black text-emerald-400">530</span>
            <span className="text-[10px] text-white/60 block mt-0.5">Sheltered</span>
          </div>
        </div>

        <p className="text-[11px] text-white/70 leading-relaxed mt-1">
          Highways along Teesta valley are restricted to emergency disaster relief convoys. Civilians are advised to avoid riverside transit roads.
        </p>
      </AceternityCard>

      {/* Category Pills */}
      <div className="flex p-1 rounded-2xl bg-white/[0.05] border border-white/10 text-xs font-semibold">
        {(['all', 'highway', 'bridge', 'shelter'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`flex-1 py-1.5 rounded-xl capitalize transition-all ${
              filter === cat
                ? 'bg-white/20 text-white font-bold shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* List of Infrastructure Impacts */}
      <div className="flex flex-col gap-2.5">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="apple-bento p-3.5 flex flex-col gap-2 hover:bg-white/[0.06] transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">{item.name}</h4>
                <p className="text-[11px] text-white/50">{item.location}</p>
              </div>

              <span
                className="text-[9px] font-mono px-2 py-0.5 rounded font-bold shrink-0 border"
                style={{
                  backgroundColor: `${item.statusColor}22`,
                  borderColor: `${item.statusColor}55`,
                  color: item.statusColor,
                }}
              >
                {item.status}
              </span>
            </div>

            <p className="text-xs text-white/80 leading-relaxed">{item.detail}</p>

            <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-white/50">
              <span>{item.affectedPop}</span>
              <span className="text-sky-400/80 font-medium">View on Map →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
