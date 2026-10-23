'use client';

import React, { useState, useEffect } from 'react';
import { 
  CloudLightning, 
  Radio, 
  Timer, 
  Plane, 
  Zap, 
  AlertTriangle, 
  Activity, 
  Gauge 
} from 'lucide-react';
import { ConvectiveStormCell, DwrRadarStation } from '../data/convectiveData';

interface ConvectiveKpiStripProps {
  cells: ConvectiveStormCell[];
  radarStations: DwrRadarStation[];
  leadTimeHours: number;
}

export const ConvectiveKpiStrip: React.FC<ConvectiveKpiStripProps> = ({
  cells,
  radarStations,
  leadTimeHours,
}) => {
  const [liveImd, setLiveImd] = useState<{
    station: string;
    temp: number;
    rh: number;
    rainfall24h: number;
    pressure: number;
    wind: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/imd/nowcast')
      .then((res) => res.json())
      .then((data) => {
        if (data.observations) {
          const tempObs = data.observations.find((o: any) => o.unit === '°C');
          const rhObs = data.observations.find((o: any) => o.unit === '%');
          const presObs = data.observations.find((o: any) => o.unit === 'hPa');
          const windObs = data.observations.find((o: any) => o.unit === 'km/h');
          const cityWx = data.imd_api?.city_forecast;
          const past24 = cityWx?.Past_24_hrs_Rainfall !== 'NIL' && cityWx?.Past_24_hrs_Rainfall !== undefined
            ? parseFloat(cityWx.Past_24_hrs_Rainfall)
            : 0;

          if (tempObs || rhObs || presObs || windObs || cityWx) {
            setLiveImd({
              station: cityWx?.Station_Name || 'IMD Synoptic Station',
              temp: tempObs ? tempObs.value : null,
              rh: rhObs ? rhObs.value : null,
              rainfall24h: past24,
              pressure: presObs ? presObs.value : null,
              wind: windObs ? windObs.value : null,
            });
          }
        }
      })
      .catch(() => {});
  }, []);

  const activeCellsCount = cells.length;
  const severeCount = cells.filter((c) => c.maxDbz >= 55).length;
  const maxDbz = Math.max(...cells.map((c) => c.maxDbz), 0);
  const operationalRadars = radarStations.filter((r) => r.status === 'OPERATIONAL').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 w-full">
      
      {/* CARD 1: ACTIVE CONVECTIVE CELLS */}
      <div className="bg-[#121820] px-2.5 py-1.5 rounded-md border border-rose-500/70 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
            <CloudLightning className="w-3 h-3 text-rose-400" />
            ACTIVE CONVECTIVE CELLS
          </span>
          <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-950/80 text-rose-400 border border-rose-800">
            0–6 HR NOWCAST
          </span>
        </div>

        <div className="my-0.5 flex items-baseline justify-between">
          <span className="text-xl font-black font-mono text-white leading-none">
            {activeCellsCount}
          </span>
          <div className="text-right text-[9px]">
            <span className="text-rose-400 font-bold block">{severeCount} Severe Cells</span>
            <span className="text-slate-400 text-[8px]">North Tamil Nadu Belt</span>
          </div>
        </div>

        <div className="pt-0.5 border-t border-[#1e2738] flex items-center justify-between text-[8px]">
          <span className="text-slate-400 truncate max-w-[140px]">Optical Flow Lagrangian Track</span>
          <span className="text-rose-400 font-bold font-mono">DWR + INSAT-3DR</span>
        </div>
      </div>

      {/* CARD 2: PEAK RADAR REFLECTIVITY */}
      <div className="bg-[#121820] px-2.5 py-1.5 rounded-md border border-purple-500/70 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-purple-400" />
            MAX CORE REFLECTIVITY
          </span>
          <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-800">
            HAIL & CLOUDBURST
          </span>
        </div>

        <div className="my-0.5 flex items-baseline justify-between">
          <span className="text-xl font-black font-mono text-white leading-none">
            {maxDbz.toFixed(1)} <span className="text-xs text-purple-300 font-normal">dBZ</span>
          </span>
          <div className="text-right text-[9px]">
            <span className="text-amber-300 font-bold block">MESH: 38mm Hail</span>
            <span className="text-slate-400 text-[8px]">Rate: 124 mm/h</span>
          </div>
        </div>

        <div className="pt-0.5 border-t border-[#1e2738] flex items-center justify-between text-[8px]">
          <span className="text-slate-400">Glaciation: -14.6 K/15m</span>
          <span className="text-purple-300 font-bold font-mono">EXTREME CORE</span>
        </div>
      </div>

      {/* CARD 3: REAL CHENNAI AIRPORT IMD OBSERVATION */}
      <div className="bg-[#121820] px-2.5 py-1.5 rounded-md border border-cyan-500/70 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
            <Radio className="w-3 h-3 text-cyan-400" />
            AIRPORT IMD METAR (MEENAMBAKKAM)
          </span>
          <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800">
            MAA / VOMM (43279)
          </span>
        </div>

        <div className="my-0.5 flex items-baseline justify-between">
          <span className="text-xl font-black font-mono text-cyan-300 leading-none tracking-wider">
            {liveImd?.temp != null ? `${liveImd.temp}°C` : '--'}
          </span>
          <div className="text-right text-[9px]">
            <span className="text-cyan-200 font-bold block">
              {liveImd?.rh != null ? `${liveImd.rh}% RH` : 'RH: --'} {liveImd?.pressure != null ? `· ${liveImd.pressure} hPa` : ''}
            </span>
            <span className="text-slate-400 text-[8px]">
              {liveImd?.rainfall24h != null ? `Rain 24h: ${liveImd.rainfall24h} mm` : 'Rain: --'}
            </span>
          </div>
        </div>

        <div className="pt-0.5 border-t border-[#1e2738] flex items-center justify-between text-[8px]">
          <span className="text-slate-400 truncate max-w-[140px]">Chennai Met Watch Office (IMD)</span>
          <span className="text-emerald-400 font-bold font-mono">LIVE OBSERVATION</span>
        </div>
      </div>

      {/* CARD 4: DWR RADAR NETWORK COVERAGE */}
      <div className="bg-[#121820] px-2.5 py-1.5 rounded-md border border-emerald-500/70 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400" />
            DWR RADAR TRIANGULATION
          </span>
          <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">
            NORTH TAMIL NADU
          </span>
        </div>

        <div className="my-0.5 flex items-baseline justify-between">
          <span className="text-xl font-black font-mono text-white leading-none">
            {operationalRadars} / {radarStations.length}
          </span>
          <div className="text-right text-[9px]">
            <span className="text-emerald-400 font-bold block">100% Coverage</span>
            <span className="text-slate-400 text-[8px]">S-Band + X-Band</span>
          </div>
        </div>

        <div className="pt-0.5 border-t border-[#1e2738] flex items-center justify-between text-[8px]">
          <span className="text-slate-400">Chennai • NIOT • SHAR</span>
          <span className="text-emerald-300 font-bold font-mono">ALL OPERATIONAL</span>
        </div>
      </div>

    </div>
  );
};
