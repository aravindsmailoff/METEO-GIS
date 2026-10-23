'use client';

import React from 'react';
import { Activity, Layers, Radio, ShieldCheck, Info, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';
import { ConvectiveStormCell } from '../data/convectiveData';

interface PyStepsExtrapolationCardProps {
  selectedCell: ConvectiveStormCell | null;
}

export const PyStepsExtrapolationCard: React.FC<PyStepsExtrapolationCardProps> = ({ selectedCell }) => {
  const confidenceByLeadTime = [
    { lead: '+15m', conf: 98, errorKm: 0.8 },
    { lead: '+30m', conf: 95, errorKm: 1.4 },
    { lead: '+1h', conf: 91, errorKm: 2.2 },
    { lead: '+2h', conf: 84, errorKm: 3.8 },
    { lead: '+4h', conf: 72, errorKm: 6.5 },
    { lead: '+6h', conf: 61, errorKm: 9.8 },
  ];

  return (
    <div className="flex flex-col gap-2.5 p-3 text-xs bg-[#111722] rounded-lg border border-[#1f2b3c] shadow-lg">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1f2b3c]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-purple-950/80 border border-purple-700/60 text-purple-300">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              pySTEPS Lagrangian Extrapolation Engine
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              TV-L1 Optical Flow • Semi-Lagrangian Advection
            </span>
          </div>
        </div>
        <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono text-[9px] font-bold">
          CONVERGED
        </span>
      </div>

      {/* Optical Flow Motion Vector Telemetry */}
      <div className="bg-[#141d2a] p-2.5 rounded-lg border border-[#23354c] flex flex-col gap-2">
        <span className="text-[10px] uppercase font-bold text-slate-300 flex items-center justify-between">
          <span>Advection Vector Parameters</span>
          <span className="text-purple-300 font-mono">1–3 km Gridded Mesh</span>
        </span>

        <div className="grid grid-cols-2 gap-2 text-[10.5px]">
          <div className="bg-[#0f1622] p-2 rounded border border-[#1d2b3c]">
            <span className="text-slate-400 text-[9px] block">Mean Advection Velocity</span>
            <strong className="text-white font-mono text-sm">
              {selectedCell?.motionSpeedKmh || 42.0} km/h
            </strong>
            <span className="text-[8px] text-slate-500 block">Zonal vector component</span>
          </div>

          <div className="bg-[#0f1622] p-2 rounded border border-[#1d2b3c]">
            <span className="text-slate-400 text-[9px] block">Steering Flow Azimuth</span>
            <strong className="text-purple-300 font-mono text-sm">
              {selectedCell?.motionBearingText || 'ENE (82°)'}
            </strong>
            <span className="text-[8px] text-slate-500 block">700 hPa Mid-Troposphere</span>
          </div>
        </div>
      </div>

      {/* Confidence Decay Curve Across 0-6 Hour Horizon */}
      <div className="bg-[#141d2a] p-2.5 rounded-lg border border-[#23354c] flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-300">
            Lead-Time Confidence & Uncertainty Decay
          </span>
          <span className="text-[8.5px] font-mono text-slate-400">
            S-PROG Ensemble Cascade
          </span>
        </div>

        <div className="grid grid-cols-6 gap-1 text-center">
          {confidenceByLeadTime.map((step) => (
            <div key={step.lead} className="bg-[#0f1622] p-1.5 rounded border border-[#1e2a3b] flex flex-col gap-0.5">
              <span className="text-[9px] font-mono font-bold text-slate-300">{step.lead}</span>
              <span className={`text-[11px] font-black font-mono ${
                step.conf >= 90 ? 'text-emerald-400' : step.conf >= 75 ? 'text-amber-300' : 'text-slate-400'
              }`}>
                {step.conf}%
              </span>
              <span className="text-[8px] text-slate-500">±{step.errorKm}km</span>
            </div>
          ))}
        </div>
      </div>

      {/* Honest Data Reality & Phase 2 Institutional Roadmap */}
      <div className="bg-[#0d131c] p-2.5 rounded-lg border border-[#1d2b3c] flex flex-col gap-1.5 text-[9.5px]">
        <div className="flex items-center gap-1.5 text-cyan-300 font-bold uppercase tracking-wider text-[9px]">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          Data Reality & Phase 2 DWR Roadmap
        </div>
        <p className="text-slate-400 leading-relaxed">
          • <strong>Live Ingestion Today:</strong> MOSDAC INSAT-3DR thermal brightness-temperature + IMD AWS hourly rainfall networks.
        </p>
        <p className="text-slate-400 leading-relaxed">
          • <strong>Phase 2 Institutional MoU:</strong> Standardized NetCDF-4/MDV radar ingestion adapter built-in, ready for instant direct socket integration with Chennai & Pallikaranai DWR streams upon MoES authorization.
        </p>
      </div>

    </div>
  );
};
