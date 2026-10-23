'use client';

import React from 'react';
import { Play, Pause, RotateCcw, FastForward, Calendar, AlertOctagon, CheckCircle2, ShieldAlert } from 'lucide-react';
import { BACKTEST_SCENARIOS } from '../data/convectiveData';

interface BacktestScrubberProps {
  currentScenarioId: string;
  onSelectScenario: (id: string) => void;
  leadTimeHours: number;
  setLeadTimeHours: (hours: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

export const BacktestScrubber: React.FC<BacktestScrubberProps> = ({
  currentScenarioId,
  onSelectScenario,
  leadTimeHours,
  setLeadTimeHours,
  isPlaying,
  setIsPlaying,
}) => {
  const currentScenario = BACKTEST_SCENARIOS.find((s) => s.id === currentScenarioId) || BACKTEST_SCENARIOS[0];

  return (
    <div className="flex flex-col gap-2.5 p-3 text-xs bg-[#111722] rounded-lg border border-[#1f2b3c] shadow-lg">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1f2b3c]">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Historical Backtest & Extrapolation Replay
            </h3>
            <span className="text-[10px] text-slate-400">
              Verified Real Atmospheric Events for Model Validation
            </span>
          </div>
        </div>

        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${
          currentScenarioId === 'LIVE_SYNCHRONOUS'
            ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
            : 'bg-amber-950 text-amber-300 border-amber-700'
        }`}>
          {currentScenarioId === 'LIVE_SYNCHRONOUS' ? 'LIVE FEED' : 'BACKTEST REPLAY'}
        </span>
      </div>

      {/* Scenario Selector Tabs */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[9.5px] uppercase font-bold text-slate-400">
          Select Meteorological Scenario:
        </span>
        <div className="grid grid-cols-1 gap-1.5">
          {BACKTEST_SCENARIOS.map((scen) => {
            const isSel = scen.id === currentScenarioId;
            return (
              <button
                key={scen.id}
                onClick={() => {
                  onSelectScenario(scen.id);
                  setLeadTimeHours(0);
                }}
                className={`p-2 rounded-lg text-left border transition-all flex flex-col gap-1 ${
                  isSel
                    ? 'bg-[#182333] border-cyan-400 shadow-sm ring-1 ring-cyan-400/30'
                    : 'bg-[#121924] border-[#1f2b3c] hover:bg-[#16202c]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-xs ${isSel ? 'text-white' : 'text-slate-300'}`}>
                    {scen.title}
                  </span>
                  <span className="text-[9px] font-mono text-cyan-300 bg-[#0e141f] px-1.5 py-0.2 rounded border border-[#233346]">
                    {scen.date}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  {scen.description}
                </p>
                <div className="flex items-center gap-3 text-[9px] text-slate-500 pt-0.5">
                  <span>Peak Rate: <strong className="text-rose-400">{scen.peakRainfallMmH} mm/h</strong></span>
                  <span>•</span>
                  <span>Max dBZ: <strong className="text-purple-300">{scen.peakDbz} dBZ</strong></span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 0-6 Hour Interactive Time Scrubber */}
      <div className="bg-[#141d2a] p-3 rounded-lg border border-[#23354c] flex flex-col gap-2 mt-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-300 flex items-center gap-1.5">
            <FastForward className="w-3.5 h-3.5 text-cyan-400" />
            0–6 Hour Extrapolation Horizon
          </span>
          <span className="text-xs font-mono font-black text-cyan-300">
            t + {Math.round(leadTimeHours * 60)} min ({leadTimeHours.toFixed(2)}h)
          </span>
        </div>

        {/* Range Slider */}
        <input
          type="range"
          min="0"
          max="6"
          step="0.25"
          value={leadTimeHours}
          onChange={(e) => setLeadTimeHours(parseFloat(e.target.value))}
          className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-[#0f1722] rounded-lg"
        />

        <div className="flex justify-between text-[8.5px] font-mono text-slate-400 px-0.5">
          <span>0h (Now)</span>
          <span>+1h</span>
          <span>+2h</span>
          <span>+3h</span>
          <span>+4h</span>
          <span>+5h</span>
          <span>+6h (Max)</span>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-2 pt-1 border-t border-[#1f2b3c]">
          <button
            onClick={() => setLeadTimeHours(0)}
            className="px-2.5 py-1 rounded bg-[#0f1722] hover:bg-[#1a2536] text-slate-300 border border-[#23354c] text-[10px] flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset (0h)</span>
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm transition-all"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause Playback' : 'Play Extrapolation Loop'}</span>
          </button>
        </div>
      </div>

    </div>
  );
};
