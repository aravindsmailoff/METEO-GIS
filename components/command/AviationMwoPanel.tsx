'use client';

import React from 'react';
import { Plane, AlertTriangle, Wind, ShieldAlert, CheckCircle2, Clock, MapPin, Gauge } from 'lucide-react';
import { AVIATION_TERMINAL_PROFILE, ConvectiveStormCell } from '../data/convectiveData';

interface AviationMwoPanelProps {
  selectedCell: ConvectiveStormCell | null;
}

export const AviationMwoPanel: React.FC<AviationMwoPanelProps> = ({ selectedCell }) => {
  const profile = AVIATION_TERMINAL_PROFILE;
  const etaMinutes = selectedCell?.arrivalEtaMinutes || 24;

  return (
    <div className="flex flex-col gap-2.5 p-3 text-xs bg-[#111722] rounded-lg border border-[#1f2b3c] shadow-lg">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1f2b3c]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-blue-950/80 border border-blue-700/60 text-cyan-300">
            <Plane className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              MWO Chennai • Aviation Terminal Impact
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              ICAO: {profile.icao} • {profile.airportName}
            </span>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono text-[9px] font-bold animate-pulse">
          SIGMET ACTIVE
        </span>
      </div>

      {/* Runway Status & Microburst Hazard Matrix */}
      <div className="bg-[#141d2a] p-2.5 rounded-lg border border-[#23354c] flex flex-col gap-2">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-400 font-semibold uppercase">Runway Configuration</span>
          <span className="text-cyan-300 font-mono font-bold">{profile.runway}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          
          {/* Microburst Hazard */}
          <div className="bg-[#0f1622] p-2 rounded border border-rose-900/60 flex flex-col justify-between">
            <span className="text-[9px] text-slate-400 uppercase font-bold">
              Microburst Risk
            </span>
            <div className="my-1">
              <span className="text-lg font-black font-mono text-rose-400">
                CRITICAL
              </span>
            </div>
            <span className="text-[8px] text-rose-300 block">
              Severe downdraft &gt; 50 kts
            </span>
          </div>

          {/* Low-Level Wind Shear (LLWS) */}
          <div className="bg-[#0f1622] p-2 rounded border border-amber-900/60 flex flex-col justify-between">
            <span className="text-[9px] text-slate-400 uppercase font-bold">
              Low-Level Wind Shear
            </span>
            <div className="my-1">
              <span className="text-lg font-black font-mono text-amber-300">
                TRIGGERED
              </span>
            </div>
            <span className="text-[8px] text-amber-300 block">
              Runway 07/25 approach path
            </span>
          </div>

        </div>
      </div>

      {/* Crosswind Gust Telemetry */}
      <div className="bg-[#141d2a] p-2.5 rounded-lg border border-[#23354c] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-cyan-400" />
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Peak Runway Crosswind Gust
            </span>
            <span className="text-xs text-slate-200">
              Downburst vector intersecting Runway 07 threshold
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xl font-black font-mono text-rose-400">
            {profile.crosswindGustKts} kts
          </span>
          <span className="text-[9px] text-slate-400 block font-mono">
            ({Math.round(profile.crosswindGustKts * 1.852)} km/h)
          </span>
        </div>
      </div>

      {/* Official ICAO SIGMET Bulletin Text */}
      <div className="bg-[#0b1018] p-2 rounded border border-[#1a2536] flex flex-col gap-1">
        <div className="flex items-center justify-between text-[9px] text-slate-400 uppercase font-bold">
          <span>Active WMO SIGMET Bulletin (MWO Chennai)</span>
          <span className="text-cyan-400 font-mono">VALID NOW</span>
        </div>
        <pre className="font-mono text-[8.5px] text-amber-300/90 whitespace-pre-wrap leading-tight bg-[#070b12] p-1.5 rounded border border-[#162130]">
          {profile.sigmetText}
        </pre>
      </div>

      {/* Terminal Aerodrome Advisory & Recommendation */}
      <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/80 text-red-200 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          Operational Aerodrome Intervention
        </span>
        <p className="text-[9.5px] text-slate-300 leading-relaxed">
          Convective core CC-701A projected arrival in <strong>{etaMinutes} minutes</strong> with severe hail (&gt; 35 mm) and wind shear. Recommend immediate holding patterns over maritime Bay of Bengal sector for incoming inbound traffic.
        </p>
      </div>

    </div>
  );
};
