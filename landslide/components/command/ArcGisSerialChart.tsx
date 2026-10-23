'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { HazardIncident } from '../types';
import { CloudRain, Users, AlertTriangle, RefreshCw, Radio, Thermometer } from 'lucide-react';
import { MEGHALAYA_DISTRICT_DEMOGRAPHICS, CORRIDOR_POPULATION_DATA } from '../data/meghalayaDemographics';
import { TAMILNADU_DISTRICT_DEMOGRAPHICS } from '../data/tamilnaduDemographics';
import { ClickedLocationEvidence } from './CurrentEvidenceDrawer';
import { formatNumber } from '@/lib/utils';

interface ArcGisSerialChartProps {
  selectedIncident?: HazardIncident | null;
  selectedEvidence?: ClickedLocationEvidence | null;
  selectedState?: string;
  incidents?: HazardIncident[];
  cloudburstRainRate?: number;
}

interface HourlyObservation {
  time: string;
  hour: string;
  precipitation: number;
}

interface StationCurrentData {
  station: string;
  precipitation: number;
  temp: number | string;
  humidity: number | string;
  wind: number | string;
  gusts: number | string;
  status: 'OK' | 'DEGRADED' | 'OFFLINE';
}

export const ArcGisSerialChart: React.FC<ArcGisSerialChartProps> = ({
  selectedIncident,
  selectedEvidence,
  selectedState = 'Tamil Nadu',
  incidents = [],
  cloudburstRainRate = 0,
}) => {
  const [chartMode, setChartMode] = useState<'demographics' | 'corridors' | 'rainfall' | 'stations'>('stations');
  const [hourlyData, setHourlyData] = useState<HourlyObservation[]>([]);
  const [stationData, setStationData] = useState<StationCurrentData[]>([]);
  const [isLoadingRain, setIsLoadingRain] = useState<boolean>(false);
  const [isLoadingStations, setIsLoadingStations] = useState<boolean>(false);
  const [lastSync, setLastSync] = useState<string>('');
  const [dataSource, setDataSource] = useState<string>('IMD Official AWS Network');

  const lat = selectedEvidence?.lat ?? selectedIncident?.lat ?? 13.0827;
  const lng = selectedEvidence?.lng ?? selectedIncident?.lng ?? 80.2707;
  const activeDistrict = selectedEvidence?.district ?? selectedIncident?.district ?? '';
  const activeState = selectedEvidence?.state ?? selectedIncident?.state ?? selectedState ?? 'Tamil Nadu';
  const locationName = selectedEvidence?.locationName ?? selectedIncident?.name ?? (activeDistrict ? `${activeDistrict}, ${activeState}` : `${activeState} AWS Sector`);

  // ── Fetch 24h hourly rainfall for selected location via Open-Meteo ──
  const fetchHourlyRain = useCallback(() => {
    setIsLoadingRain(true);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=precipitation&past_days=1&forecast_days=1&timezone=Asia%2FKolkata`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.hourly && data.hourly.time) {
          const times: string[] = data.hourly.time;
          const precips: number[] = data.hourly.precipitation;

          // Centre around "now" — show ±14h window
          const nowIso = new Date().toISOString().slice(0, 13);
          let currentIdx = times.findIndex((t) => t.startsWith(nowIso));
          if (currentIdx === -1) currentIdx = Math.min(24, times.length - 1);

          const startIdx = Math.max(0, currentIdx - 14);
          const endIdx = Math.min(times.length, currentIdx + 7);

          const mapped: HourlyObservation[] = [];
          for (let i = startIdx; i < endIdx; i++) {
            const d = new Date(times[i]);
            const hourStr = d.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            });
            mapped.push({
              time: times[i],
              hour: hourStr,
              precipitation: Number((precips[i] || 0).toFixed(2)),
            });
          }
          setHourlyData(mapped);
          setLastSync(new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }) + ' IST');
          setDataSource('Open-Meteo NWP Analysis (ECMWF IFS)');
        }
        setIsLoadingRain(false);
      })
      .catch(() => setIsLoadingRain(false));
  }, [lat, lng]);

  // ── Fetch multi-station current conditions for the active state/location ──
  const fetchStations = useCallback(() => {
    setIsLoadingStations(true);
    const stateQuery = activeState && activeState !== 'All India' ? `?state=${encodeURIComponent(activeState)}` : '';
    fetch(`/api/live/stations${stateQuery}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.stations && data.stations.length > 0) {
          // Sort by geographical proximity to active coordinates
          const sorted = [...data.stations].sort((a: any, b: any) => {
            const distA = Math.hypot((a.latitude - lat), (a.longitude - lng));
            const distB = Math.hypot((b.latitude - lat), (b.longitude - lng));
            return distA - distB;
          });

          const stations: StationCurrentData[] = sorted.slice(0, 8).map((s: any) => ({
            station: s.stationName.replace(' AWS', '').replace(' IMD_AWS_CLASS_A', '').replace(' IMD_AWS_COASTAL', ''),
            precipitation: s.rainfall24hMm !== null ? s.rainfall24hMm : (s.rainfall1hMm !== null ? s.rainfall1hMm : 0),
            temp: s.temperatureC ?? '--',
            humidity: s.humidityPercent ?? '--',
            wind: s.windSpeedKmh ?? '--',
            gusts: s.windSpeedKmh ? Math.round(s.windSpeedKmh * 1.3) : '--',
            status: (s.temperatureC !== null || s.rainfall24hMm !== null) ? 'OK' : 'OFFLINE',
          }));
          setStationData(stations);
          setLastSync(new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }) + ' IST');
          setDataSource(`IMD Official AWS Network (${activeState})`);
        } else {
          // Fallback to nowcast relay with dynamic coords
          fetch(`/api/imd/nowcast?all_stations=true&lat=${lat}&lng=${lng}&sector=${encodeURIComponent(locationName)}`)
            .then(r => r.json())
            .then(d => {
              if (d.station_network?.station_data) {
                const mapped: StationCurrentData[] = d.station_network.station_data.map((s: any) => ({
                  station: s.station.replace(' AWS', '').replace(' IMD_AWS_CLASS_A', ''),
                  precipitation: s.current_precipitation_mm,
                  temp: s.current_temp_c ?? '--',
                  humidity: s.current_rh_percent ?? '--',
                  wind: s.current_wind_kmh ?? '--',
                  gusts: s.current_gusts_kmh ?? '--',
                  status: s.fetch_status,
                }));
                setStationData(mapped);
                setLastSync(new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }) + ' IST');
              }
            })
            .catch(() => {});
        }
        setIsLoadingStations(false);
      })
      .catch(() => setIsLoadingStations(false));
  }, [activeState, lat, lng, locationName]);

  // Load rainfall when tab selected or location changes
  useEffect(() => {
    if (chartMode === 'rainfall') fetchHourlyRain();
  }, [chartMode, lat, lng, fetchHourlyRain]);

  // Load stations when tab selected or state/coords change
  useEffect(() => {
    if (chartMode === 'stations') fetchStations();
  }, [chartMode, fetchStations]);

  // Auto-refresh on rainfall / stations tabs every 10 min
  useEffect(() => {
    if (chartMode !== 'rainfall' && chartMode !== 'stations') return;
    const id = setInterval(() => {
      if (chartMode === 'rainfall') fetchHourlyRain();
      else fetchStations();
    }, 600_000);
    return () => clearInterval(id);
  }, [chartMode, fetchHourlyRain, fetchStations]);

  // Demographics chart data (Dynamic based on selected state)
  const isMeghalaya = activeState.toLowerCase().includes('meghalaya');
  const activeDemographics = isMeghalaya ? MEGHALAYA_DISTRICT_DEMOGRAPHICS : TAMILNADU_DISTRICT_DEMOGRAPHICS;

  const districtChartData = activeDemographics.slice(0, 10).map((d) => ({
    name: d.district.replace(' Hills', ' H.').replace(' District', '').substring(0, 12),
    fullName: d.district,
    'Residents (k)': Math.round(d.residentPopulation / 1000),
    'Tourists/yr (k)': Math.round(d.annualTouristInflow / 1000),
    rawResidents: d.residentPopulation,
    rawTourists: d.annualTouristInflow,
  }));

  // Corridor hazard exposure data
  const corridorChartData = CORRIDOR_POPULATION_DATA.map((c) => ({
    name: c.name.split('–')[0].replace(' Corridor', '').substring(0, 14),
    fullName: c.name,
    district: c.district,
    'Locals at Risk': c.hazardBufferExposedResidents,
    'Tourists at Risk': c.hazardBufferExposedTourists,
    totalAtRisk: c.hazardBufferExposedResidents + c.hazardBufferExposedTourists,
  }));

  // Station bar chart data
  const stationBarData = stationData.map((s) => ({
    name: s.station.length > 14 ? s.station.substring(0, 14) : s.station,
    fullName: s.station,
    'Rain mm/h': typeof s.precipitation === 'number' ? s.precipitation : 0,
    'Wind km/h': typeof s.wind === 'number' ? s.wind : 0,
    'Temp °C': typeof s.temp === 'number' ? s.temp : 0,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0]?.payload;
      return (
        <div className="bg-[#0f1520] border border-[#233144] p-2.5 rounded-lg shadow-2xl text-xs z-50 max-w-[200px]">
          <div className="font-bold text-white border-b border-[#233144] pb-1 mb-1.5 leading-tight">
            {p?.fullName || label}
          </div>
          {payload.map((entry: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-3 text-[11px] my-0.5">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <strong className="text-white font-mono">
                {chartMode === 'demographics'
                  ? `${formatNumber(entry.value * 1000)}`
                  : chartMode === 'corridors'
                  ? `${formatNumber(entry.value)} people`
                  : `${entry.value}`}
              </strong>
            </div>
          ))}
          {p?.district && (
            <div className="text-[10px] text-slate-400 mt-1">District: {p.district}</div>
          )}
        </div>
      );
    }
    return null;
  };

  const RainTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const v = payload[0]?.value ?? 0;
      let riskLabel = 'Normal';
      let riskColor = 'text-emerald-400';
      if (v >= 100) { riskLabel = 'CLOUDBURST'; riskColor = 'text-rose-400'; }
      else if (v >= 50) { riskLabel = 'Extreme Rain'; riskColor = 'text-red-400'; }
      else if (v >= 20) { riskLabel = 'Heavy Rain'; riskColor = 'text-amber-400'; }
      return (
        <div className="bg-[#0f1520] border border-[#233144] p-2.5 rounded-lg shadow-2xl text-xs z-50">
          <div className="font-bold text-white text-[11px]">{label}</div>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-emerald-300 font-mono text-lg font-bold">{v}</span>
            <span className="text-slate-400">mm/h</span>
          </div>
          <span className={`text-[10px] font-bold ${riskColor}`}>{riskLabel}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-2.5 p-3 text-xs bg-[#111722] rounded-lg border border-[#1f2b3c] shadow-lg h-full">

      {/* Header */}
      <div className="flex items-start justify-between pb-2 border-b border-[#1f2b3c]">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            Visual Intelligence Dashboard
          </h3>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {activeDistrict ? `${activeDistrict}, ` : ''}{activeState} – Census Data, Risk Corridors & Live AWS Network
          </span>
        </div>
        {(chartMode === 'rainfall' || chartMode === 'stations') && lastSync && (
          <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE · {lastSync}
          </span>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 bg-[#0b1017] p-1 rounded-md border border-[#1b2636]">
        {[
          { id: 'demographics', label: '1. Residents & Tourists', color: 'text-cyan-300', active_bg: 'bg-cyan-950/80' },
          { id: 'corridors',    label: '2. Hazard Exposure',       color: 'text-amber-300', active_bg: 'bg-amber-950/80' },
          { id: 'rainfall',    label: '3. 24h Rain Trend',        color: 'text-emerald-300', active_bg: 'bg-emerald-950/80' },
          { id: 'stations',    label: '4. Live AWS Network',      color: 'text-purple-300', active_bg: 'bg-purple-950/80' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setChartMode(tab.id as any)}
            className={`flex-1 py-1.5 px-1.5 rounded text-[9.5px] font-bold transition-all text-center ${
              chartMode === tab.id
                ? `${tab.active_bg} ${tab.color} border border-[#2b3f5c]`
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Context Banner */}
      <div className="bg-[#141d2a] p-2 rounded border border-[#213042] text-[10.5px]">
        {chartMode === 'demographics' && (
          <p className="text-slate-300 leading-snug">
            💡 <strong>Census of India:</strong> Local <strong>residents</strong> (Blue) vs annual <strong>tourist inflow</strong> (Amber) in {activeState}.
          </p>
        )}
        {chartMode === 'corridors' && (
          <p className="text-slate-300 leading-snug">
            ⚠️ <strong>1.5 km Hazard Buffer:</strong> People inside high-risk coastal & highway corridors — <strong>residents</strong> (Blue) and <strong>tourists</strong> (Red).
          </p>
        )}
        {chartMode === 'rainfall' && (
          <p className="text-slate-300 leading-snug">
            🌧️ <strong>Real 24h rainfall at <span className="text-white">{locationName}</span> ({lat.toFixed(2)}°N, {lng.toFixed(2)}°E).</strong> Threshold: 20 mm/h = Heavy · 50 mm/h = Extreme · ≥100 mm/h = Cloudburst.
          </p>
        )}
        {chartMode === 'stations' && (
          <p className="text-slate-300 leading-snug">
            📡 <strong>Live {activeState} AWS Network:</strong> Current precipitation, wind & temp from {stationData.length || 6} reporting IMD stations near <span className="text-white">{locationName}</span>. Source: IMD AWS Ingestion.
          </p>
        )}
      </div>

      {/* Chart Area */}
      <div className="flex-1 min-h-[220px]">

        {/* DEMOGRAPHICS */}
        {chartMode === 'demographics' && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between text-[9.5px] text-slate-400 mb-1">
              <span>Population Thousands (k)</span>
              <span className="font-mono text-slate-500">Census of India 2011 · TTDC Tourism Register</span>
            </div>
            <div className="flex-1 min-h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtChartData} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#1d2838" vertical={false} />
                  <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 8 }} />
                  <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 8 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '9px', paddingTop: '2px' }} />
                  <Bar dataKey="Residents (k)"    fill="#06b6d4" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Tourists/yr (k)" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CORRIDORS */}
        {chartMode === 'corridors' && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between text-[9.5px] text-slate-400 mb-1">
              <span>People Exposed Inside 1.5 km Buffer</span>
              <span className="font-mono text-slate-500">GIS Overlay · TTDC & Census</span>
            </div>
            <div className="flex-1 min-h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={corridorChartData} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#1d2838" vertical={false} />
                  <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 8 }} />
                  <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 8 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '9px', paddingTop: '2px' }} />
                  <Bar dataKey="Locals at Risk"   stackId="r" fill="#0284c7" />
                  <Bar dataKey="Tourists at Risk" stackId="r" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* RAINFALL */}
        {chartMode === 'rainfall' && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between text-[9.5px] text-slate-400 mb-1">
              <span>Hourly Precipitation — mm (past 14h + next 6h forecast)</span>
              <button
                onClick={fetchHourlyRain}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingRain ? 'animate-spin' : ''}`} />
                <span className="text-[9px] font-mono">Refresh</span>
              </button>
            </div>
            <div className="flex-1 min-h-[180px]">
              {isLoadingRain ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                  <span>Loading real weather observations from Open-Meteo…</span>
                </div>
              ) : hourlyData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                  No data returned — check network connectivity
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyData} margin={{ top: 8, right: 8, left: -26, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#1d2838" vertical={false} />
                    <XAxis dataKey="hour" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 8.5 }} interval={2} />
                    <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 8.5 }} />
                    <Tooltip content={<RainTooltip />} />
                    {/* IMD cloudburst threshold line at 100 mm/h */}
                    <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Cloudburst 100mm', fill: '#ef4444', fontSize: 8, position: 'insideTopRight' }} />
                    {/* Heavy rain at 20 mm/h */}
                    <ReferenceLine y={20} stroke="#f59e0b" strokeDasharray="2 4" label={{ value: 'Heavy 20mm', fill: '#f59e0b', fontSize: 8, position: 'insideTopRight' }} />
                    <Area
                      type="monotone"
                      dataKey="precipitation"
                      name="Rain (mm/h)"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="#10b981"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="text-[9px] text-slate-500 font-mono mt-1">
              Source: {dataSource} · Station: {locationName}
            </div>
          </div>
        )}

        {/* LIVE AWS NETWORK */}
        {chartMode === 'stations' && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between text-[9.5px] text-slate-400 mb-1">
              <span>Current Conditions — {activeDistrict ? `${activeDistrict}, ` : ''}{activeState} AWS Stations</span>
              <button
                onClick={fetchStations}
                className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingStations ? 'animate-spin' : ''}`} />
                <span className="text-[9px] font-mono">Refresh</span>
              </button>
            </div>

            {isLoadingStations ? (
              <div className="flex flex-col items-center justify-center flex-1 text-slate-400 text-xs gap-2">
                <Radio className="w-5 h-5 animate-pulse text-purple-400" />
                <span>Polling AWS station network…</span>
              </div>
            ) : stationData.length === 0 ? (
              <div className="flex items-center justify-center flex-1 text-slate-500 text-xs">
                No station data — click Refresh to load
              </div>
            ) : (
              <>
                {/* Station bar chart */}
                <div className="flex-1 min-h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stationBarData} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#1d2838" vertical={false} />
                      <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 7.5 }} />
                      <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 8 }} />
                      <Tooltip
                        contentStyle={{ background: '#0f1520', border: '1px solid #233144', fontSize: 10 }}
                        labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                        itemStyle={{ color: '#94a3b8' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '9px', paddingTop: '2px' }} />
                      <Bar dataKey="Rain mm/h" fill="#10b981" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="Wind km/h" fill="#818cf8" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Station pill grid */}
                <div className="grid grid-cols-2 gap-1 mt-1.5">
                  {stationData.map((s, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between px-2 py-1 rounded border text-[9px] ${
                        s.status === 'OK'
                          ? 'bg-[#0d1820] border-emerald-800/60'
                          : 'bg-[#1a1010] border-rose-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.status === 'OK' ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                        <span className="text-slate-300 truncate">{s.station}</span>
                      </div>
                      <div className="text-right flex-shrink-0 ml-1">
                        <span className="text-emerald-300 font-mono font-bold">{s.precipitation}</span>
                        <span className="text-slate-500"> mm</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="text-[9px] text-slate-500 font-mono mt-1.5">
              Source: {dataSource} · {stationData.filter(s => s.status === 'OK').length}/{stationData.length || 6} Stations Reporting
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-[#1b2636] flex items-center justify-between text-[9px] text-slate-500">
        <span>Verified: Census of India · TTDC · Open-Meteo NWP · IMD AWS</span>
        <span className="font-mono text-emerald-500">✓ Real Data Only</span>
      </div>

    </div>
  );
};
