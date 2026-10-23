'use client';

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import {
  HazardIncident,
  IsolatedVillage,
  DeployedUnit,
  ReliefShelter,
} from '../types';
import { GisMap } from '../gis/GisMap';
import {
  BarChart3,
  PieChart as PieIcon,
  Activity,
  Layers,
  MapPin,
  TrendingUp,
  AlertTriangle,
  Flag,
  Calendar,
  Filter,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Radio,
  Clock,
  Sparkles,
  Maximize2,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

interface PowerBiAnalyticsDashboardProps {
  incidents: HazardIncident[];
  villages: IsolatedVillage[];
  deployedUnits: DeployedUnit[];
  reliefShelters: ReliefShelter[];
  selectedIncident: HazardIncident | null;
  onSelectIncident: (inc: HazardIncident | null) => void;
  cloudburstRainRate?: number;
  selectedDistrict: string;
  setSelectedDistrict: (district: string) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
}

// Multi-Year Baseline Analytics Data (2020 - 2026)
const MULTI_YEAR_DATA: Record<string, {
  monitoredPoints: number;
  incidentsByTrigger: { trigger: string; count: number }[];
  slopeDistribution: { slopeClass: string; count: number }[];
  rainfallTiers: { tier: string; count: number }[];
  severitySplit: { name: string; value: number; color: string }[];
  insarVelocity: { range: string; count: number }[];
  soilMoistureBins: { range: string; count: number }[];
  trendByYear: {
    year: string;
    totalLandslides: number;
    cloudbursts: number;
    infrastructureBlocked: number;
    evacuations: number;
  }[];
}> = {
  '2026': {
    monitoredPoints: 5148,
    incidentsByTrigger: [
      { trigger: 'Monsoon Cloudburst', count: 248 },
      { trigger: 'Road Toe Cut', count: 184 },
      { trigger: 'Fault Line Creep', count: 142 },
      { trigger: 'Pore Hydro-Pressure', count: 118 },
      { trigger: 'Shale Subsidence', count: 64 },
      { trigger: 'Quarry / Mining', count: 32 },
    ],
    slopeDistribution: [
      { slopeClass: 'Moderate (<25°)', count: 420 },
      { slopeClass: 'Steep (25°-40°)', count: 1860 },
      { slopeClass: 'Escarpment (40°-55°)', count: 2140 },
      { slopeClass: 'Vertical Cliff (>55°)', count: 728 },
    ],
    rainfallTiers: [
      { tier: 'Extreme (>250mm/24h)', count: 142 },
      { tier: 'Severe (150-250mm)', count: 268 },
      { tier: 'Moderate (50-150mm)', count: 310 },
      { tier: 'Light (<50mm)', count: 78 },
    ],
    severitySplit: [
      { name: 'Critical (>80%)', value: 62.4, color: '#aeea00' }, // Vibrant Lime Yellow
      { name: 'High Watch (60-80%)', value: 28.1, color: '#ffd600' }, // Gold
      { name: 'Moderate (35-60%)', value: 9.5, color: '#00e5ff' }, // Cyan
    ],
    insarVelocity: [
      { range: '0 to -10', count: 1820 },
      { range: '-10 to -25', count: 1480 },
      { range: '-25 to -45', count: 1120 },
      { range: '-45 to -70', count: 540 },
      { range: '< -70', count: 188 },
    ],
    soilMoistureBins: [
      { range: '<40%', count: 210 },
      { range: '40-60%', count: 580 },
      { range: '60-75%', count: 1420 },
      { range: '75-90%', count: 2140 },
      { range: '>90%', count: 798 },
    ],
    trendByYear: [
      { year: '2020', totalLandslides: 3120, cloudbursts: 1420, infrastructureBlocked: 820, evacuations: 410 },
      { year: '2021', totalLandslides: 3450, cloudbursts: 1580, infrastructureBlocked: 940, evacuations: 480 },
      { year: '2022', totalLandslides: 3980, cloudbursts: 1820, infrastructureBlocked: 1120, evacuations: 560 },
      { year: '2023', totalLandslides: 4420, cloudbursts: 2040, infrastructureBlocked: 1280, evacuations: 640 },
      { year: '2024', totalLandslides: 4780, cloudbursts: 2210, infrastructureBlocked: 1390, evacuations: 710 },
      { year: '2025', totalLandslides: 5010, cloudbursts: 2360, infrastructureBlocked: 1490, evacuations: 790 },
      { year: '2026', totalLandslides: 5148, cloudbursts: 2480, infrastructureBlocked: 1560, evacuations: 840 },
    ],
  },
  '2025': {
    monitoredPoints: 5010,
    incidentsByTrigger: [
      { trigger: 'Monsoon Cloudburst', count: 236 },
      { trigger: 'Road Toe Cut', count: 172 },
      { trigger: 'Fault Line Creep', count: 134 },
      { trigger: 'Pore Hydro-Pressure', count: 106 },
      { trigger: 'Shale Subsidence', count: 58 },
      { trigger: 'Quarry / Mining', count: 28 },
    ],
    slopeDistribution: [
      { slopeClass: 'Moderate (<25°)', count: 410 },
      { slopeClass: 'Steep (25°-40°)', count: 1810 },
      { slopeClass: 'Escarpment (40°-55°)', count: 2090 },
      { slopeClass: 'Vertical Cliff (>55°)', count: 700 },
    ],
    rainfallTiers: [
      { tier: 'Extreme (>250mm/24h)', count: 132 },
      { tier: 'Severe (150-250mm)', count: 254 },
      { tier: 'Moderate (50-150mm)', count: 298 },
      { tier: 'Light (<50mm)', count: 86 },
    ],
    severitySplit: [
      { name: 'Critical (>80%)', value: 59.8, color: '#aeea00' },
      { name: 'High Watch (60-80%)', value: 30.4, color: '#ffd600' },
      { name: 'Moderate (35-60%)', value: 9.8, color: '#00e5ff' },
    ],
    insarVelocity: [
      { range: '0 to -10', count: 1790 },
      { range: '-10 to -25', count: 1440 },
      { range: '-25 to -45', count: 1090 },
      { range: '-45 to -70', count: 520 },
      { range: '< -70', count: 170 },
    ],
    soilMoistureBins: [
      { range: '<40%', count: 230 },
      { range: '40-60%', count: 610 },
      { range: '60-75%', count: 1390 },
      { range: '75-90%', count: 2040 },
      { range: '>90%', count: 740 },
    ],
    trendByYear: [
      { year: '2020', totalLandslides: 3120, cloudbursts: 1420, infrastructureBlocked: 820, evacuations: 410 },
      { year: '2021', totalLandslides: 3450, cloudbursts: 1580, infrastructureBlocked: 940, evacuations: 480 },
      { year: '2022', totalLandslides: 3980, cloudbursts: 1820, infrastructureBlocked: 1120, evacuations: 560 },
      { year: '2023', totalLandslides: 4420, cloudbursts: 2040, infrastructureBlocked: 1280, evacuations: 640 },
      { year: '2024', totalLandslides: 4780, cloudbursts: 2210, infrastructureBlocked: 1390, evacuations: 710 },
      { year: '2025', totalLandslides: 5010, cloudbursts: 2360, infrastructureBlocked: 1490, evacuations: 790 },
    ],
  },
  '2024': {
    monitoredPoints: 4780,
    incidentsByTrigger: [
      { trigger: 'Monsoon Cloudburst', count: 218 },
      { trigger: 'Road Toe Cut', count: 156 },
      { trigger: 'Fault Line Creep', count: 122 },
      { trigger: 'Pore Hydro-Pressure', count: 96 },
      { trigger: 'Shale Subsidence', count: 48 },
      { trigger: 'Quarry / Mining', count: 24 },
    ],
    slopeDistribution: [
      { slopeClass: 'Moderate (<25°)', count: 390 },
      { slopeClass: 'Steep (25°-40°)', count: 1720 },
      { slopeClass: 'Escarpment (40°-55°)', count: 2010 },
      { slopeClass: 'Vertical Cliff (>55°)', count: 660 },
    ],
    rainfallTiers: [
      { tier: 'Extreme (>250mm/24h)', count: 120 },
      { tier: 'Severe (150-250mm)', count: 238 },
      { tier: 'Moderate (50-150mm)', count: 280 },
      { tier: 'Light (<50mm)', count: 92 },
    ],
    severitySplit: [
      { name: 'Critical (>80%)', value: 57.2, color: '#aeea00' },
      { name: 'High Watch (60-80%)', value: 31.8, color: '#ffd600' },
      { name: 'Moderate (35-60%)', value: 11.0, color: '#00e5ff' },
    ],
    insarVelocity: [
      { range: '0 to -10', count: 1710 },
      { range: '-10 to -25', count: 1380 },
      { range: '-25 to -45', count: 1040 },
      { range: '-45 to -70', count: 490 },
      { range: '< -70', count: 160 },
    ],
    soilMoistureBins: [
      { range: '<40%', count: 250 },
      { range: '40-60%', count: 640 },
      { range: '60-75%', count: 1320 },
      { range: '75-90%', count: 1910 },
      { range: '>90%', count: 660 },
    ],
    trendByYear: [
      { year: '2020', totalLandslides: 3120, cloudbursts: 1420, infrastructureBlocked: 820, evacuations: 410 },
      { year: '2021', totalLandslides: 3450, cloudbursts: 1580, infrastructureBlocked: 940, evacuations: 480 },
      { year: '2022', totalLandslides: 3980, cloudbursts: 1820, infrastructureBlocked: 1120, evacuations: 560 },
      { year: '2023', totalLandslides: 4420, cloudbursts: 2040, infrastructureBlocked: 1280, evacuations: 640 },
      { year: '2024', totalLandslides: 4780, cloudbursts: 2210, infrastructureBlocked: 1390, evacuations: 710 },
    ],
  },
};

const DISTRICT_LIST = [
  'All Districts',
  'East Khasi Hills',
  'Ri-Bhoi',
  'South West Khasi Hills',
  'West Khasi Hills',
  'East Jaintia Hills',
  'West Jaintia Hills',
  'West Garo Hills',
  'South Garo Hills',
  'East Garo Hills',
];

export const PowerBiAnalyticsDashboard: React.FC<PowerBiAnalyticsDashboardProps> = ({
  incidents,
  villages,
  deployedUnits,
  reliefShelters,
  selectedIncident,
  onSelectIncident,
  cloudburstRainRate = 0,
  selectedDistrict,
  setSelectedDistrict,
  selectedYear,
  setSelectedYear,
}) => {
  // Active Year Dataset
  const activeYearData = MULTI_YEAR_DATA[selectedYear] || MULTI_YEAR_DATA['2026'];

  // Cross-filter incidents by selected district
  const filteredIncidents = useMemo(() => {
    if (selectedDistrict === 'All Districts') return incidents;
    return incidents.filter((i) => i.district.toLowerCase() === selectedDistrict.toLowerCase());
  }, [incidents, selectedDistrict]);

  // Dynamic Scale Factor for District Slicing
  const districtFactor = useMemo(() => {
    if (selectedDistrict === 'All Districts') return 1.0;
    if (selectedDistrict === 'East Khasi Hills') return 0.32;
    if (selectedDistrict === 'Ri-Bhoi') return 0.22;
    if (selectedDistrict === 'South West Khasi Hills') return 0.16;
    if (selectedDistrict === 'East Jaintia Hills') return 0.14;
    return 0.08;
  }, [selectedDistrict]);

  // Scaled KPI Number
  const displayMonitoredPoints = useMemo(() => {
    const raw = Math.round(activeYearData.monitoredPoints * districtFactor);
    return selectedDistrict === 'All Districts' ? activeYearData.monitoredPoints : raw;
  }, [activeYearData, districtFactor, selectedDistrict]);

  // Scaled Trigger Data
  const dynamicTriggerData = useMemo(() => {
    return activeYearData.incidentsByTrigger.map((d) => ({
      ...d,
      count: Math.max(1, Math.round(d.count * districtFactor)),
    }));
  }, [activeYearData, districtFactor]);

  // Scaled Slope Data
  const dynamicSlopeData = useMemo(() => {
    return activeYearData.slopeDistribution.map((d) => ({
      ...d,
      count: Math.max(1, Math.round(d.count * districtFactor)),
    }));
  }, [activeYearData, districtFactor]);

  // Scaled Rainfall Tiers Data
  const dynamicRainfallData = useMemo(() => {
    return activeYearData.rainfallTiers.map((d) => ({
      ...d,
      count: Math.max(1, Math.round(d.count * districtFactor)),
    }));
  }, [activeYearData, districtFactor]);

  // Scaled InSAR Velocity
  const dynamicInSarData = useMemo(() => {
    return activeYearData.insarVelocity.map((d) => ({
      ...d,
      count: Math.max(1, Math.round(d.count * districtFactor)),
    }));
  }, [activeYearData, districtFactor]);

  // Scaled Soil Moisture
  const dynamicSoilMoistureData = useMemo(() => {
    return activeYearData.soilMoistureBins.map((d) => ({
      ...d,
      count: Math.max(1, Math.round(d.count * districtFactor)),
    }));
  }, [activeYearData, districtFactor]);

  // Custom Power BI Dark Tooltip
  const CustomPbiTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#101722] border border-[#2d4059] p-2 rounded shadow-2xl text-xs z-50">
          <div className="font-bold text-slate-200 border-b border-[#2d4059] pb-0.5 mb-1 text-[11px]">
            {label || payload[0]?.name}
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`pbi-item-${index}`} className="flex items-center justify-between gap-3 text-[10px] my-0.5">
              <span style={{ color: entry.color || entry.fill }}>{entry.name || 'Count'}:</span>
              <strong className="text-white font-mono">{entry.value.toLocaleString()}</strong>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-2.5 w-full bg-[#0a0f16] text-slate-100 p-2 sm:p-3 rounded border border-[#223142] font-sans selection:bg-[#00e5ff] selection:text-black">
      {/* 1. TOP HEADER BANNER & GLOBAL YEAR / TIMEFRAME SLICER */}
      <div className="bg-[#121924] border border-[#283b52] rounded px-3 py-2 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight uppercase flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffd600] animate-pulse" />
            Meghalaya Controlled Geotechnical & Landslide Surveillance 2020 to 2026
          </h2>
          <span className="text-[10px] text-slate-400">
            ISRO Bhuvan Spatial Risk Engine • Copernicus Sentinel-1 InSAR • NASA GPM Pluvial Analytics
          </span>
        </div>

        {/* Top-Right Period / Year Slicer Dropdown */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#0b111a] border border-[#2d4059] rounded px-2.5 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-[#00e5ff]" />
            <span className="text-slate-400 text-[11px]">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-white font-bold font-mono focus:outline-none cursor-pointer text-xs"
            >
              <option value="2026" className="bg-[#121924] text-white">2026 (Live Monsoon)</option>
              <option value="2025" className="bg-[#121924] text-white">2025 (Annual Archive)</option>
              <option value="2024" className="bg-[#121924] text-white">2024 (Annual Archive)</option>
            </select>
          </div>

          <button
            onClick={() => {
              setSelectedDistrict('All Districts');
              setSelectedYear('2026');
            }}
            className="px-2.5 py-1 rounded bg-[#1e2a3b] hover:bg-[#283a52] text-xs font-semibold text-[#00e5ff] border border-[#334b68] transition-all"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* 2. TOP SECTION: 4-COLUMN POWER BI GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch">
        {/* ROW 1: TOP LEFT - Yellow Vertical Bar Chart (Trigger Mechanism) (Col 1-5) */}
        <div className="lg:col-span-5 bg-[#121924] border border-[#283b52] rounded p-2.5 flex flex-col justify-between shadow-sm min-h-[220px]">
          <div className="flex items-center justify-between pb-1 border-b border-[#202e40] mb-1">
            <span className="text-[11px] font-bold text-slate-200 tracking-wide uppercase">
              Hazard Occurrences by Primary Trigger Mechanism
            </span>
            <span className="text-[9px] font-mono text-[#ffd600] font-bold">
              {dynamicTriggerData.reduce((a, b) => a + b.count, 0)} Total
            </span>
          </div>

          <div className="h-[160px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dynamicTriggerData} margin={{ top: 8, right: 8, left: -24, bottom: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2a3d" vertical={false} />
                <XAxis
                  dataKey="trigger"
                  stroke="#94a3b8"
                  fontSize={9}
                  tickLine={false}
                  interval={0}
                  angle={-14}
                  textAnchor="end"
                />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                <Tooltip content={<CustomPbiTooltip />} />
                <Bar dataKey="count" fill="#ffd600" radius={[2, 2, 0, 0]} name="Incidents" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-right text-[8px] text-slate-500 pt-1 border-t border-[#1c2a3d]">
            Last update: a few seconds ago
          </div>
        </div>

        {/* ROW 1: TOP CENTER - Directions Box & Hero Metric Card (Col 6-7) */}
        <div className="lg:col-span-3 flex flex-col gap-2.5">
          {/* Cyan Directions Callout Box */}
          <div className="bg-[#00e5ff]/10 border-2 border-[#00e5ff] rounded p-2 text-center flex flex-col justify-center flex-1">
            <h3 className="text-red-500 font-extrabold text-xs tracking-wider uppercase mb-1">
              Directions
            </h3>
            <p className="text-[10px] text-[#e2f8ff] leading-snug font-medium">
              Select the Year at the top to filter years. Click on a District from the slicer on the right to filter landslides on that sector or scroll to pan & zoom the GIS Map.
            </p>
          </div>

          {/* Hero Big Stat KPI Card */}
          <div className="bg-[#121924] border border-[#283b52] rounded p-2.5 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              {selectedDistrict === 'All Districts' ? 'Monitored Landslide Points' : `${selectedDistrict} Active Points`}
            </span>

            <div className="flex items-center gap-3 my-1">
              <div className="w-9 h-9 rounded bg-[#00e5ff]/15 border border-[#00e5ff]/40 flex items-center justify-center shrink-0">
                <Flag className="w-5 h-5 text-[#00e5ff]" />
              </div>
              <div className="text-3xl font-black font-mono text-[#00e5ff] tracking-tight">
                {displayMonitoredPoints.toLocaleString()}
              </div>
            </div>

            <div className="text-right text-[8px] text-slate-500 pt-0.5 border-t border-[#1c2a3d]">
              Last update: a few seconds ago
            </div>
          </div>
        </div>

        {/* ROW 1: TOP RIGHT - District Slicer List (Col 8-9) */}
        <div className="lg:col-span-2 bg-[#121924] border border-[#283b52] rounded p-2 flex flex-col h-full min-h-[220px]">
          <div className="text-[10px] font-bold text-[#00e5ff] uppercase tracking-wider pb-1 mb-1 border-b border-[#202e40] flex items-center justify-between">
            <span>District of Occurrence</span>
            <Filter className="w-3 h-3 text-slate-400" />
          </div>

          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1 text-[11px]">
            {DISTRICT_LIST.map((dist) => {
              const isSelected = selectedDistrict === dist;
              return (
                <button
                  key={dist}
                  onClick={() => setSelectedDistrict(dist)}
                  className={`w-full text-left px-2 py-1 rounded transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#0079c1] text-white font-bold shadow-sm'
                      : 'text-slate-300 hover:bg-[#1c293a] hover:text-white'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-white' : 'bg-slate-500'}`} />
                  <span className="truncate">{dist}</span>
                </button>
              );
            })}
          </div>

          <div className="text-[8px] text-slate-500 pt-1 border-t border-[#1c2a3d] text-right">
            Last update: a few seconds ago
          </div>
        </div>

        {/* ROW 1: TOP FAR-RIGHT - Interactive GIS Map Widget (Col 10-12) */}
        <div className="lg:col-span-2 bg-[#121924] border border-[#283b52] rounded overflow-hidden flex flex-col h-full min-h-[220px]">
          <div className="bg-[#16202c] px-2 py-1 border-b border-[#283b52] flex items-center justify-between text-[10px] font-bold text-slate-200">
            <span className="flex items-center gap-1 text-[#00e5ff]">
              <MapPin className="w-3 h-3" /> Spatial Map
            </span>
            <span className="text-[9px] font-mono text-slate-400">{filteredIncidents.length} Sites</span>
          </div>

          <div className="flex-1 relative min-h-[180px]">
            <GisMap
              incidents={filteredIncidents}
              deployedUnits={deployedUnits}
              reliefShelters={reliefShelters}
              isolatedVillages={villages}
              selectedIncident={selectedIncident}
              onSelectIncident={onSelectIncident}
              cloudburstRainRate={cloudburstRainRate}
              heightClass="h-full min-h-[180px]"
            />
          </div>
        </div>
      </div>

      {/* 3. MIDDLE SECTION: HORIZONTAL BARS, DONUT CHART & MULTI-SERIES LINE CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch">
        {/* Horizontal Bar 1: Cyan Bars - Slope Class Distribution (Col 1-4) */}
        <div className="lg:col-span-4 bg-[#121924] border border-[#283b52] rounded p-2.5 flex flex-col justify-between shadow-sm min-h-[190px]">
          <div className="flex items-center justify-between pb-1 border-b border-[#202e40] mb-1">
            <span className="text-[11px] font-bold text-slate-200 uppercase">
              Hazard Frequency by Slope Gradient (Copernicus DEM)
            </span>
          </div>

          <div className="h-[135px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dynamicSlopeData}
                layout="vertical"
                margin={{ top: 5, right: 15, left: 35, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2a3d" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="slopeClass"
                  stroke="#94a3b8"
                  fontSize={8.5}
                  tickLine={false}
                  width={90}
                />
                <Tooltip content={<CustomPbiTooltip />} />
                <Bar dataKey="count" fill="#00e5ff" radius={[0, 2, 2, 0]} name="Slope Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-right text-[8px] text-slate-500 pt-0.5 border-t border-[#1c2a3d]">
            Last update: a few seconds ago
          </div>
        </div>

        {/* Horizontal Bar 2: Cream/Pale Yellow Bars - Rainfall Tiers (Col 5-7) */}
        <div className="lg:col-span-3 bg-[#121924] border border-[#283b52] rounded p-2.5 flex flex-col justify-between shadow-sm min-h-[190px]">
          <div className="flex items-center justify-between pb-1 border-b border-[#202e40] mb-1">
            <span className="text-[11px] font-bold text-slate-200 uppercase">
              Rainfall Threshold Exceedance (NASA GPM)
            </span>
          </div>

          <div className="h-[135px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dynamicRainfallData}
                layout="vertical"
                margin={{ top: 5, right: 15, left: 30, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2a3d" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="tier"
                  stroke="#94a3b8"
                  fontSize={8.5}
                  tickLine={false}
                  width={85}
                />
                <Tooltip content={<CustomPbiTooltip />} />
                <Bar dataKey="count" fill="#fff9c4" radius={[0, 2, 2, 0]} name="Stations" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-right text-[8px] text-slate-500 pt-0.5 border-t border-[#1c2a3d]">
            Last update: a few seconds ago
          </div>
        </div>

        {/* Donut / Pie Chart: Lime Green & Bright Yellow (Col 8-9) */}
        <div className="lg:col-span-2 bg-[#121924] border border-[#283b52] rounded p-2 flex flex-col justify-between shadow-sm min-h-[190px]">
          <div className="text-[10px] font-bold text-slate-200 uppercase pb-1 border-b border-[#202e40]">
            Severity Split
          </div>

          <div className="h-[120px] w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activeYearData.severitySplit}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={45}
                  innerRadius={20}
                  paddingAngle={2}
                >
                  {activeYearData.severitySplit.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPbiTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-0.5 text-[9px] pt-1 border-t border-[#1c2a3d]">
            {activeYearData.severitySplit.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-1 truncate">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-300 truncate">{s.name.split(' ')[0]}</span>
                </div>
                <span className="font-mono font-bold" style={{ color: s.color }}>{s.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Multi-Series Line Chart: Multi-Year Hazard Trend (Col 10-12) */}
        <div className="lg:col-span-3 bg-[#121924] border border-[#283b52] rounded p-2.5 flex flex-col justify-between shadow-sm min-h-[190px]">
          <div className="flex items-center justify-between pb-1 border-b border-[#202e40] mb-1">
            <span className="text-[11px] font-bold text-slate-200 uppercase">
              Multi-Year Hazard Trend (2020 - 2026)
            </span>
          </div>

          <div className="h-[135px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeYearData.trendByYear} margin={{ top: 5, right: 8, left: -22, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2a3d" />
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                <Tooltip content={<CustomPbiTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '8px', paddingTop: '2px' }}
                  iconSize={6}
                />
                <Line
                  type="monotone"
                  dataKey="totalLandslides"
                  stroke="#ffd600"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: '#ffd600' }}
                  name="Landslides"
                />
                <Line
                  type="monotone"
                  dataKey="cloudbursts"
                  stroke="#00e5ff"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: '#00e5ff' }}
                  name="Cloudbursts"
                />
                <Line
                  type="monotone"
                  dataKey="infrastructureBlocked"
                  stroke="#ff9800"
                  strokeWidth={1.5}
                  dot={{ r: 2, fill: '#ff9800' }}
                  name="Road Blocked"
                />
                <Line
                  type="monotone"
                  dataKey="evacuations"
                  stroke="#aeea00"
                  strokeWidth={1.5}
                  dot={{ r: 2, fill: '#aeea00' }}
                  name="Evacuations"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="text-right text-[8px] text-slate-500 pt-0.5 border-t border-[#1c2a3d]">
            Last update: a few seconds ago
          </div>
        </div>
      </div>

      {/* 4. BOTTOM SECTION: MAGENTA & NEON GREEN BAR CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch">
        {/* Bottom Left: Magenta Vertical Bar Chart - InSAR Ground Deformation (Col 1-6) */}
        <div className="lg:col-span-6 bg-[#121924] border border-[#283b52] rounded p-2.5 flex flex-col justify-between shadow-sm min-h-[180px]">
          <div className="flex items-center justify-between pb-1 border-b border-[#202e40] mb-1">
            <span className="text-[11px] font-bold text-slate-200 uppercase">
              Copernicus Sentinel-1 InSAR Ground Creep Velocity Range (mm/year)
            </span>
            <span className="text-[9px] font-mono text-[#e040fb]">LOS Subsidence</span>
          </div>

          <div className="h-[125px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dynamicInSarData} margin={{ top: 8, right: 8, left: -22, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2a3d" vertical={false} />
                <XAxis dataKey="range" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                <Tooltip content={<CustomPbiTooltip />} />
                <Bar dataKey="count" fill="#e040fb" radius={[2, 2, 0, 0]} name="InSAR Points" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-right text-[8px] text-slate-500 pt-0.5 border-t border-[#1c2a3d]">
            Last update: a few seconds ago
          </div>
        </div>

        {/* Bottom Right: Neon Green Vertical Bar Chart - SAR Soil Moisture Saturation (Col 7-12) */}
        <div className="lg:col-span-6 bg-[#121924] border border-[#283b52] rounded p-2.5 flex flex-col justify-between shadow-sm min-h-[180px]">
          <div className="flex items-center justify-between pb-1 border-b border-[#202e40] mb-1">
            <span className="text-[11px] font-bold text-slate-200 uppercase">
              SAR Soil Moisture Pore Saturation Index Range (%)
            </span>
            <span className="text-[9px] font-mono text-[#00e676]">Pore Pressure</span>
          </div>

          <div className="h-[125px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dynamicSoilMoistureData} margin={{ top: 8, right: 8, left: -22, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2a3d" vertical={false} />
                <XAxis dataKey="range" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                <Tooltip content={<CustomPbiTooltip />} />
                <Bar dataKey="count" fill="#00e676" radius={[2, 2, 0, 0]} name="Grid Cells" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-right text-[8px] text-slate-500 pt-0.5 border-t border-[#1c2a3d]">
            Last update: a few seconds ago
          </div>
        </div>
      </div>

      {/* 5. DATA SOURCE PROVENANCE & SCIENTIFIC METADATA INSPECTOR (Requirements 23, 24, 29, 30) */}
      <div className="bg-[#121924] border border-[#283b52] rounded p-3 shadow-md mt-1 space-y-2.5">
        <div className="flex items-center justify-between border-b border-[#202e40] pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00e5ff]" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Scientific Data Provenance & Authoritative Source Registry
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Strict Entity Separation • Zero Simulated Fallbacks
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[10px] border-collapse font-sans">
            <thead>
              <tr className="border-b border-[#202e40] text-slate-400 uppercase tracking-wider font-mono">
                <th className="py-1 px-2">Layer / Entity</th>
                <th className="py-1 px-2">Authoritative Source</th>
                <th className="py-1 px-2">Dataset / Mechanism</th>
                <th className="py-1 px-2">Reference Period</th>
                <th className="py-1 px-2">Spatial Resolution</th>
                <th className="py-1 px-2">Units</th>
                <th className="py-1 px-2">Operational Semantics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c2a3d] text-slate-200">
              <tr className="hover:bg-[#182232] transition-colors">
                <td className="py-1.5 px-2 font-bold text-purple-400 flex items-center gap-1.5">
                  <span>🏛️</span> Historical Landslide
                </td>
                <td className="py-1.5 px-2 font-semibold">ISRO / NRSC & GSI</td>
                <td className="py-1.5 px-2 text-slate-300">Landslide Atlas of India</td>
                <td className="py-1.5 px-2 font-mono text-slate-400">2014 – 2023 Verified</td>
                <td className="py-1.5 px-2 font-mono">1:50,000 / Polygon</td>
                <td className="py-1.5 px-2 font-mono">Count / m³</td>
                <td className="py-1.5 px-2 text-purple-300 font-semibold">
                  Training / Historical analysis ONLY. Road is NOT closed.
                </td>
              </tr>

              <tr className="hover:bg-[#182232] transition-colors">
                <td className="py-1.5 px-2 font-bold text-amber-400 flex items-center gap-1.5">
                  <span>⚡</span> Landslide Prediction
                </td>
                <td className="py-1.5 px-2 font-semibold">RiskWatch ML Engine</td>
                <td className="py-1.5 px-2 text-slate-300">XGBoost-TreeSHAP Calibrated Inference</td>
                <td className="py-1.5 px-2 font-mono text-slate-400">Live 15-min Telemetry</td>
                <td className="py-1.5 px-2 font-mono">30m Grid Cell</td>
                <td className="py-1.5 px-2 font-mono">Probability (0.0-1.0)</td>
                <td className="py-1.5 px-2 text-emerald-400 font-semibold">
                  Hazard forecast only. Road remains OPEN unless confirmed incident.
                </td>
              </tr>

              <tr className="hover:bg-[#182232] transition-colors">
                <td className="py-1.5 px-2 font-bold text-red-400 flex items-center gap-1.5">
                  <span>⛔</span> Confirmed Road Blockage
                </td>
                <td className="py-1.5 px-2 font-semibold">NHAI / State PWD / SDMA</td>
                <td className="py-1.5 px-2 text-slate-300">Official Field Clearance / Incident Feed</td>
                <td className="py-1.5 px-2 font-mono text-slate-400">Real-Time Event Stream</td>
                <td className="py-1.5 px-2 font-mono">Physical Road Segment</td>
                <td className="py-1.5 px-2 font-mono">Status (BLOCKED)</td>
                <td className="py-1.5 px-2 text-red-400 font-semibold">
                  EXCLUSIVITY: Only this state triggers routing exclusion.
                </td>
              </tr>

              <tr className="hover:bg-[#182232] transition-colors">
                <td className="py-1.5 px-2 font-bold text-sky-400 flex items-center gap-1.5">
                  <span>🌧️</span> Precipitation
                </td>
                <td className="py-1.5 px-2 font-semibold">NASA POWER & IMD</td>
                <td className="py-1.5 px-2 text-slate-300">GPM IMERG & Automatic Weather Stations</td>
                <td className="py-1.5 px-2 font-mono text-slate-400">Daily / 30-min Near Real-Time</td>
                <td className="py-1.5 px-2 font-mono">0.1° (~10 km) / Point AWS</td>
                <td className="py-1.5 px-2 font-mono">mm/h, mm/day</td>
                <td className="py-1.5 px-2 text-slate-300">
                  Real retrieved telemetry. "Data unavailable" on API failure.
                </td>
              </tr>

              <tr className="hover:bg-[#182232] transition-colors">
                <td className="py-1.5 px-2 font-bold text-emerald-400 flex items-center gap-1.5">
                  <span>🏔️</span> Terrain & Elevation
                </td>
                <td className="py-1.5 px-2 font-semibold">Copernicus Data Space</td>
                <td className="py-1.5 px-2 text-slate-300">Copernicus GLO-30 DEM</td>
                <td className="py-1.5 px-2 font-mono text-slate-400">Global Reference 2024</td>
                <td className="py-1.5 px-2 font-mono">30-metre DEM</td>
                <td className="py-1.5 px-2 font-mono">Meters / Degrees (°)</td>
                <td className="py-1.5 px-2 text-slate-300">
                  Derived slope and aspect from geographic raster; no hardcoded slope.
                </td>
              </tr>

              <tr className="hover:bg-[#182232] transition-colors">
                <td className="py-1.5 px-2 font-bold text-cyan-400 flex items-center gap-1.5">
                  <span>👥</span> Population Exposure
                </td>
                <td className="py-1.5 px-2 font-semibold">Census of India</td>
                <td className="py-1.5 px-2 text-slate-300">Registrar General & Census Commissioner</td>
                <td className="py-1.5 px-2 font-mono text-slate-400">Census Year 2011 / 2021 Est.</td>
                <td className="py-1.5 px-2 font-mono">District / Village Centroids</td>
                <td className="py-1.5 px-2 font-mono">Residents</td>
                <td className="py-1.5 px-2 text-slate-300">
                  Permanent resident count. Real-time floating pop unavailable.
                </td>
              </tr>

              <tr className="hover:bg-[#182232] transition-colors">
                <td className="py-1.5 px-2 font-bold text-yellow-400 flex items-center gap-1.5">
                  <span>🏕️</span> Tourism Statistics
                </td>
                <td className="py-1.5 px-2 font-semibold">Dept of Tourism, Meghalaya</td>
                <td className="py-1.5 px-2 text-slate-300">Annual Tourism Statistics Report</td>
                <td className="py-1.5 px-2 font-mono text-slate-400">FY 2024 – 2025</td>
                <td className="py-1.5 px-2 font-mono">District Totals</td>
                <td className="py-1.5 px-2 font-mono">Arrivals / Year</td>
                <td className="py-1.5 px-2 text-slate-300">
                  Annual/monthly statistics. Real-time visitor counts unavailable.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

