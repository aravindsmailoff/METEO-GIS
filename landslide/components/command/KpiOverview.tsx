'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Users,
  Building2,
  Luggage
} from 'lucide-react';
import { HazardIncident, DeployedUnit } from '../types';
import { MEGHALAYA_STATE_TOTALS, MEGHALAYA_DISTRICT_DEMOGRAPHICS } from '../data/meghalayaDemographics';
import { formatNumber } from '@/lib/utils';

interface KpiOverviewProps {
  incidents: HazardIncident[];
  villages?: any[];
  deployedUnits?: DeployedUnit[];
  cloudburstRainRate?: number;
  selectedDistrict?: string;
}

export const KpiOverview: React.FC<KpiOverviewProps> = ({
  incidents,
  cloudburstRainRate = 0,
  selectedDistrict = 'All Districts',
}) => {
  // Filter district if selected
  const districtData = selectedDistrict !== 'All Districts' 
    ? MEGHALAYA_DISTRICT_DEMOGRAPHICS.find(d => d.district === selectedDistrict)
    : null;

  const residentPop = districtData ? districtData.residentPopulation : MEGHALAYA_STATE_TOTALS.totalResidentPopulation;
  const annualTourists = districtData ? districtData.annualTouristInflow : MEGHALAYA_STATE_TOTALS.annualTotalTourists;
  const slopeResidentsAtRisk = districtData ? districtData.vulnerableSlopePopulation : MEGHALAYA_STATE_TOTALS.totalVulnerableSlopePopulation;
  const slopeTouristsAtRisk = districtData ? districtData.vulnerableTouristExposure : MEGHALAYA_STATE_TOTALS.totalVulnerableTouristExposure;
  const totalPeopleAtRisk = slopeResidentsAtRisk + slopeTouristsAtRisk;

  // Real Counts from connected database
  const criticalCount = incidents.filter((i) => i.risk === 'Critical').length;
  const highCount = incidents.filter((i) => i.risk === 'High').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 w-full">
      
      {/* CARD 1: ACTIVE CRITICAL HAZARDS */}
      <div className="bg-[#121820] px-2.5 py-1.5 rounded-md border border-[#eb445a]/70 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#eb445a] flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-[#eb445a]" />
            ACTIVE CRITICAL HAZARDS
          </span>
          <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-red-950/80 text-[#eb445a] border border-red-800">
            20K SITES
          </span>
        </div>

        <div className="my-0.5 flex items-baseline justify-between">
          <span className="text-xl font-black font-mono text-white leading-none">
            {criticalCount}
          </span>
          <div className="text-right text-[9px]">
            <span className="text-amber-400 font-bold block">+{highCount} High Watch</span>
            <span className="text-slate-400 text-[8px]">of {incidents.length} monitored sectors</span>
          </div>
        </div>

        <div className="pt-0.5 border-t border-[#1e2738] flex items-center justify-between text-[8px]">
          <span className="text-slate-400 truncate max-w-[140px]">NH-06 & NH-206 Escarpments</span>
          <span className="text-rose-400 font-bold font-mono">LIVE SENSORS</span>
        </div>
      </div>

      {/* CARD 2: PERMANENT RESIDENTS */}
      <div className="bg-[#121820] px-2.5 py-1.5 rounded-md border border-[#0096eb]/70 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#00e5ff] flex items-center gap-1">
            <Building2 className="w-3 h-3 text-[#00e5ff]" />
            PERMANENT RESIDENTS
          </span>
          <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-950/80 text-[#00e5ff] border border-cyan-800">
            CENSUS OF INDIA
          </span>
        </div>

        <div className="my-0.5 flex items-baseline justify-between">
          <span className="text-xl font-black font-mono text-white leading-none">
            {formatNumber(residentPop)}
          </span>
          <div className="text-right text-[9px]">
            <span className="text-[#00e5ff] font-bold block">↗ {selectedDistrict === 'All Districts' ? 'Meghalaya State' : selectedDistrict}</span>
            <span className="text-slate-400 text-[8px]">Density: 132/km²</span>
          </div>
        </div>

        <div className="pt-0.5 border-t border-[#1e2738] flex items-center justify-between text-[8px]">
          <span className="text-slate-400">Sex Ratio: 989 F/1k M</span>
          <span className="text-cyan-300 font-bold font-mono">LIT: 74.43%</span>
        </div>
      </div>

      {/* CARD 3: TOURIST INFLOW & FLOATING POP */}
      <div className="bg-[#121820] px-2.5 py-1.5 rounded-md border border-[#ff9800]/70 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#ff9800] flex items-center gap-1">
            <Luggage className="w-3 h-3 text-[#ff9800]" />
            TOURIST INFLOW & FLOATING POP
          </span>
          <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-950/80 text-[#ff9800] border border-amber-800">
            DEPT OF TOURISM
          </span>
        </div>

        <div className="my-0.5 flex items-baseline justify-between">
          <span className="text-xl font-black font-mono text-white leading-none">
            {formatNumber(annualTourists)}
          </span>
          <div className="text-right text-[9px]">
            <span className="text-amber-400 font-bold block">~159,111/mo</span>
            <span className="text-slate-400 text-[8px]">Peak Season Inflow</span>
          </div>
        </div>

        <div className="pt-0.5 border-t border-[#1e2738] flex items-center justify-between text-[8px]">
          <span className="text-slate-400">Domestic + Foreign Visitors</span>
          <span className="text-amber-400 font-bold font-mono">FLOATING RISK</span>
        </div>
      </div>

      {/* CARD 4: HAZARD BUFFER EXPOSURE */}
      <div className="bg-[#121820] px-2.5 py-1.5 rounded-md border border-[#2dd36f]/70 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#2dd36f] flex items-center gap-1">
            <Users className="w-3 h-3 text-[#2dd36f]" />
            HAZARD BUFFER EXPOSURE
          </span>
          <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-950/80 text-[#2dd36f] border border-emerald-800">
            1.5 KM BUFFER
          </span>
        </div>

        <div className="my-0.5 flex items-baseline justify-between">
          <span className="text-xl font-black font-mono text-white leading-none">
            {formatNumber(totalPeopleAtRisk)}
          </span>
          <div className="text-right text-[9px]">
            <span className="text-cyan-300 font-bold block">{formatNumber(slopeResidentsAtRisk)} Locals</span>
            <span className="text-amber-400 text-[8px]">+{formatNumber(slopeTouristsAtRisk)} Tourists</span>
          </div>
        </div>

        <div className="pt-0.5 border-t border-[#1e2738] flex items-center justify-between text-[8px]">
          <span className="text-slate-400">5 Hamlets at Cutoff Risk</span>
          <span className="text-emerald-400 font-bold font-mono">125 NDRF Onsite</span>
        </div>
      </div>

    </div>
  );
};
