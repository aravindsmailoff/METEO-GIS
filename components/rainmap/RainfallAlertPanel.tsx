'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CloudRain, Wind, Droplets, Thermometer, AlertCircle, Compass, Radio, ArrowUpRight } from 'lucide-react';
import { Apple3DWeatherSphere } from './Apple3DWeatherSphere';
import { AceternityCard } from './AceternityCard';

interface DistrictRain {
  name: string;
  rain: number;
  status: 'EXTREME' | 'VERY HEAVY' | 'HEAVY' | 'MODERATE';
  color: string;
  trend: string;
}

const DISTRICT_DATA: DistrictRain[] = [
  { name: 'East Sikkim (Singtam)', rain: 92.4, status: 'EXTREME', color: '#ef4444', trend: '+14% /hr' },
  { name: 'Rangpo Basin', rain: 78.2, status: 'VERY HEAVY', color: '#f97316', trend: '+8% /hr' },
  { name: 'Gangtok Valley', rain: 64.0, status: 'HEAVY', color: '#f97316', trend: '+4% /hr' },
  { name: 'Namchi Sub-basin', rain: 48.5, status: 'MODERATE', color: '#eab308', trend: '-2% /hr' },
  { name: 'Mangan Heights', rain: 38.1, status: 'MODERATE', color: '#38bdf8', trend: '-5% /hr' },
];

const FORECAST_HOURLY = [
  { time: 'Now', rain: 92, label: 'Torrential' },
  { time: '06:00', rain: 88, label: 'Torrential' },
  { time: '07:00', rain: 74, label: 'Heavy' },
  { time: '08:00', rain: 61, label: 'Heavy' },
  { time: '09:00', rain: 45, label: 'Moderate' },
  { time: '10:00', rain: 30, label: 'Light' },
];

export function RainfallAlertPanel() {
  const [selectedRange, setSelectedRange] = useState<'live' | 'forecast' | 'stations'>('live');
  const [animatedNumber, setAnimatedNumber] = useState(0);

  // Smooth number count-up on mount
  useEffect(() => {
    let start = 0;
    const end = 92.4;
    const duration = 1200;
    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Apple easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentVal = Number((start + (end - start) * ease).toFixed(1));
      setAnimatedNumber(currentVal);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };

    requestAnimationFrame(updateCounter);
  }, []);

  return (
    <div className="flex flex-col gap-4 select-none pb-12">
      {/* 3D Atmospheric Hero Card with Three.js */}
      <AceternityCard className="p-4" glowColor="rgba(56, 189, 248, 0.25)">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-red-400">
              IMD Doppler Live
            </span>
          </div>
          <span className="text-[10px] text-white/50 font-medium">Updated 3 min ago</span>
        </div>

        {/* 3D Weather Sphere Container */}
        <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-gradient-to-b from-sky-950/20 to-black/40 border border-white/5 mb-3">
          <Apple3DWeatherSphere rainfallRate={92.4} stormSeverity="extreme" />
        </div>

        {/* Hero Weather Stat */}
        <div className="flex items-baseline justify-between pt-1">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="apple-stat-hero text-white">{animatedNumber}</span>
              <span className="text-xl font-bold text-sky-400">mm/h</span>
            </div>
            <p className="text-xs font-medium text-white/70 mt-0.5">
              Singtam-Rangpo Cloudburst Inflow
            </p>
          </div>

          <div className="text-right">
            <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/20 border border-red-500/40 text-red-300">
              CAT-4 RED
            </span>
            <p className="text-[10px] text-red-400/80 font-mono mt-1">Runoff Index: 98%</p>
          </div>
        </div>
      </AceternityCard>

      {/* Segmented Control Pill */}
      <div className="flex p-1 rounded-2xl bg-white/[0.05] border border-white/10 text-xs font-semibold">
        {(['live', 'forecast', 'stations'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedRange(tab)}
            className={`flex-1 py-1.5 rounded-xl capitalize transition-all ${
              selectedRange === tab
                ? 'bg-white/20 text-white shadow-sm font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Bento Grid Condition Metrics */}
      {selectedRange === 'live' && (
        <div className="grid grid-cols-2 gap-2.5">
          <div className="apple-bento p-3">
            <div className="flex items-center justify-between text-white/50 text-[11px] mb-1">
              <span>Humidity</span>
              <Droplets className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-white">96%</div>
            <div className="text-[10px] text-white/40 mt-0.5">Dew point 17.8°C</div>
          </div>

          <div className="apple-bento p-3">
            <div className="flex items-center justify-between text-white/50 text-[11px] mb-1">
              <span>Wind Gusts</span>
              <Wind className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">48 km/h</div>
            <div className="text-[10px] text-purple-300/80 mt-0.5">ESE gale force</div>
          </div>

          <div className="apple-bento p-3">
            <div className="flex items-center justify-between text-white/50 text-[11px] mb-1">
              <span>Pressure</span>
              <Compass className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">994 hPa</div>
            <div className="text-[10px] text-amber-300/80 mt-0.5">Rapid low trough</div>
          </div>

          <div className="apple-bento p-3">
            <div className="flex items-center justify-between text-white/50 text-[11px] mb-1">
              <span>Soil Saturation</span>
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-red-400">99.2%</div>
            <div className="text-[10px] text-red-400/80 mt-0.5">Landslide threshold exceeded</div>
          </div>
        </div>
      )}

      {/* Hourly Timeline */}
      {selectedRange === 'forecast' && (
        <div className="apple-bento p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-semibold text-white/80">
            <span>6-Hour Rain Trajectory</span>
            <span className="text-[10px] font-mono text-sky-400">IMD ECMWF Model</span>
          </div>

          <div className="grid grid-cols-6 gap-1 pt-2">
            {FORECAST_HOURLY.map((f, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5 text-center">
                <span className="text-[10px] text-white/50 font-medium">{f.time}</span>
                <div className="w-full h-24 bg-white/[0.04] rounded-full p-1 flex items-end justify-center">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(f.rain / 100) * 100}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                    className="w-full rounded-full"
                    style={{
                      backgroundColor:
                        f.rain > 80 ? '#ef4444' : f.rain > 50 ? '#f97316' : '#38bdf8',
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold text-white">{f.rain}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* District Hotspot Ranked Bars */}
      <div className="apple-bento p-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-white/80 mb-1">
          <span>Active Sub-Basin Rain Totals</span>
          <span className="text-[10px] text-white/40">Rain Rate mm/h</span>
        </div>

        {DISTRICT_DATA.map((dist, i) => (
          <div key={dist.name} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-white/90">{dist.name}</span>
              <div className="flex items-center gap-2">
                <span
                  className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold"
                  style={{
                    backgroundColor: `${dist.color}22`,
                    color: dist.color,
                  }}
                >
                  {dist.status}
                </span>
                <span className="text-white font-bold text-xs">{dist.rain} mm</span>
              </div>
            </div>

            {/* Visual Bar */}
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(dist.rain / 100) * 100}%` }}
                transition={{ duration: 0.9, delay: i * 0.08 }}
                className="h-full rounded-full"
                style={{ backgroundColor: dist.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
