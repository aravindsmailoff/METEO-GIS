'use client';

import React from 'react';
import { Activity, Gauge, Thermometer, Wind, Droplets, Layers, Zap } from 'lucide-react';
import { ConvectiveStormCell } from '../data/convectiveData';

interface AtmosphericSoundingCardProps {
  selectedCell: ConvectiveStormCell | null;
}

export const AtmosphericSoundingCard: React.FC<AtmosphericSoundingCardProps> = ({ selectedCell }) => {
  const soundingData = {
    cape: 2840,
    cin: 12,
    liftedIndex: -6.4,
    kIndex: 39,
    pwMm: 64.0,
    freezingLevelM: 4620,
    bulkWindShearKts: 38.0,
    surfaceLclM: 650,
  };

  return (
    <div className="flex flex-col gap-2.5 p-3 text-xs bg-[#111722] rounded-lg border border-[#1f2b3c] shadow-lg">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1f2b3c]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Mesoscale Atmospheric Sounding (Meenambakkam 1200 UTC)
            </h3>
            <span className="text-[10px] text-slate-400">
              IMD Radiosonde / High-Res NWP Thermodynamic Profile
            </span>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono text-[9px] font-bold">
          EXTREME INSTABILITY
        </span>
      </div>

      {/* Primary Thermodynamic Instability Indices */}
      <div className="grid grid-cols-2 gap-2">
        
        {/* CAPE */}
        <div className="bg-[#141d2a] p-2.5 rounded-lg border border-[#23354c] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] font-bold uppercase text-slate-300">
              CAPE (Buoyant Energy)
            </span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-black font-mono text-amber-300">
              {soundingData.cape}
            </span>
            <span className="text-[10px] text-slate-400 ml-1">J/kg</span>
          </div>
          <span className="text-[8.5px] font-bold text-amber-400">
            Threshold: &gt; 2,000 J/kg (Violent Updrafts)
          </span>
        </div>

        {/* CIN */}
        <div className="bg-[#141d2a] p-2.5 rounded-lg border border-[#23354c] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] font-bold uppercase text-slate-300">
              CIN (Convective Cap)
            </span>
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-black font-mono text-emerald-300">
              {soundingData.cin}
            </span>
            <span className="text-[10px] text-slate-400 ml-1">J/kg</span>
          </div>
          <span className="text-[8.5px] font-bold text-emerald-400">
            Cap Breached (Free Explosive Convection)
          </span>
        </div>

      </div>

      {/* Secondary Sounding Parameters Grid */}
      <div className="grid grid-cols-3 gap-1.5 text-[10px]">
        
        <div className="bg-[#0f1622] p-2 rounded border border-[#1e2a3b]">
          <span className="text-slate-400 text-[8.5px] block uppercase">Lifted Index</span>
          <strong className="text-rose-400 font-mono text-base">{soundingData.liftedIndex}</strong>
          <span className="text-[8px] text-slate-500 block">Severe Threat &lt; -5</span>
        </div>

        <div className="bg-[#0f1622] p-2 rounded border border-[#1e2a3b]">
          <span className="text-slate-400 text-[8.5px] block uppercase">Precip Water</span>
          <strong className="text-cyan-300 font-mono text-base">{soundingData.pwMm} mm</strong>
          <span className="text-[8px] text-slate-500 block">Extreme Tropical Moisture</span>
        </div>

        <div className="bg-[#0f1622] p-2 rounded border border-[#1e2a3b]">
          <span className="text-slate-400 text-[8.5px] block uppercase">0–6km Shear</span>
          <strong className="text-purple-300 font-mono text-base">{soundingData.bulkWindShearKts} kts</strong>
          <span className="text-[8px] text-slate-500 block">Organized Multicell/Squall</span>
        </div>

        <div className="bg-[#0f1622] p-2 rounded border border-[#1e2a3b]">
          <span className="text-slate-400 text-[8.5px] block uppercase">Freezing Level</span>
          <strong className="text-white font-mono text-base">{soundingData.freezingLevelM}m</strong>
          <span className="text-[8px] text-slate-500 block">MESH Hail Growth Zone</span>
        </div>

        <div className="bg-[#0f1622] p-2 rounded border border-[#1e2a3b]">
          <span className="text-slate-400 text-[8.5px] block uppercase">K-Index</span>
          <strong className="text-amber-300 font-mono text-base">{soundingData.kIndex}</strong>
          <span className="text-[8px] text-slate-500 block">High TS Likelihood</span>
        </div>

        <div className="bg-[#0f1622] p-2 rounded border border-[#1e2a3b]">
          <span className="text-slate-400 text-[8.5px] block uppercase">Cloud Base (LCL)</span>
          <strong className="text-cyan-300 font-mono text-base">{soundingData.surfaceLclM}m</strong>
          <span className="text-[8px] text-slate-500 block">Low LCL (High Inflow)</span>
        </div>

      </div>

    </div>
  );
};
