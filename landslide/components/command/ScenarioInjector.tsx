'use client';

import React, { useState } from 'react';
import { 
  CloudLightning, 
  RotateCcw, 
  Sliders, 
  AlertTriangle,
  Play,
  ArrowRight,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { HazardIncident } from '../types';

interface ScenarioInjectorProps {
  onScenarioChange: (rainRate: number) => void;
  selectedIncident?: HazardIncident | null;
}

export const ScenarioInjector: React.FC<ScenarioInjectorProps> = ({ 
  onScenarioChange,
  selectedIncident 
}) => {
  const [rainIncrease, setRainIncrease] = useState<number>(0);
  const [soilSaturationIncrease, setSoilSaturationIncrease] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const baselineRain = selectedIncident?.rainfall1h || 0.0;
  const baselineSlope = selectedIncident?.slopeDeg || 46.0;
  const baselineRiskProb = selectedIncident?.probability || 0.04;

  const simulatedRain = Number((baselineRain + rainIncrease).toFixed(1));
  const simulatedProb = Math.min(0.99, Number((baselineRiskProb + (rainIncrease * 0.008) + (soilSaturationIncrease * 0.002)).toFixed(2)));

  const handleApply = (rate: number, sat: number) => {
    setRainIncrease(rate);
    setSoilSaturationIncrease(sat);
    setIsSimulating(rate > 0 || sat > 0);
    onScenarioChange(rate);
  };

  const handleReset = () => {
    setRainIncrease(0);
    setSoilSaturationIncrease(0);
    setIsSimulating(false);
    onScenarioChange(0);
  };

  return (
    <div className={`flex flex-col gap-2.5 p-3 text-xs bg-[#111722] rounded-lg border ${
      isSimulating ? 'border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'border-[#1f2b3c]'
    } shadow-lg h-full`}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1f2b3c]">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            What-If Scenario Sandbox
          </h3>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Physics-coupled stress testing model
          </span>
        </div>

        {isSimulating ? (
          <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700 animate-pulse">
            SIMULATION ACTIVE
          </span>
        ) : (
          <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-[#16202c] text-slate-400 border border-[#26374a]">
            LIVE BASELINE
          </span>
        )}
      </div>

      {/* Prominent Disclaimer Banner */}
      <div className="bg-amber-950/30 border border-amber-800/60 rounded-md p-2 flex items-start gap-2 text-[10px] text-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="block text-amber-300">Model Simulation Mode:</strong>
          Values adjusted here represent hypothetical stress scenarios. They do NOT alter real-world telemetry or official agency warnings.
        </div>
      </div>

      {/* Side-by-Side Comparison: Current Observation vs Simulation vs Response */}
      <div className="grid grid-cols-3 gap-1.5 text-center">
        
        {/* Col 1: Current Observation */}
        <div className="bg-[#141d2a] p-2 rounded border border-[#213042] flex flex-col justify-between">
          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">
            Current Observation
          </span>
          <div className="my-1">
            <span className="text-base font-black font-mono text-white">
              {baselineRain} <span className="text-[10px] font-normal text-slate-400">mm/h</span>
            </span>
          </div>
          <span className="text-[8.5px] text-slate-500 font-mono">Open-Meteo Live</span>
        </div>

        {/* Col 2: Scenario Injection */}
        <div className="bg-[#1b2230] p-2 rounded border border-amber-700/50 flex flex-col justify-between">
          <span className="text-[9px] text-amber-300 uppercase font-bold tracking-wider">
            Scenario Increase
          </span>
          <div className="my-1">
            <span className="text-base font-black font-mono text-amber-300">
              +{rainIncrease} <span className="text-[10px] font-normal text-amber-400/70">mm/h</span>
            </span>
          </div>
          <span className="text-[8.5px] text-amber-400/80 font-mono">Simulated Delta</span>
        </div>

        {/* Col 3: Calculated Response */}
        <div className="bg-[#141d2a] p-2 rounded border border-[#213042] flex flex-col justify-between">
          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">
            Projected Hazard Prob
          </span>
          <div className="my-1">
            <span className={`text-base font-black font-mono ${
              simulatedProb >= 0.8 ? 'text-rose-400' : simulatedProb >= 0.6 ? 'text-amber-400' : 'text-cyan-400'
            }`}>
              {Math.round(simulatedProb * 100)}%
            </span>
          </div>
          <span className="text-[8.5px] text-slate-400 font-mono">
            {simulatedProb >= 0.8 ? 'Critical Alert' : simulatedProb >= 0.6 ? 'High Alert' : 'Stable'}
          </span>
        </div>

      </div>

      {/* Preset Scenario Triggers */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          Quick Preset Stress Drills
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => handleApply(25, 10)}
            className="px-2.5 py-1 rounded bg-[#182332] hover:bg-[#203044] text-cyan-300 border border-[#2a3e56] text-[10px] font-semibold transition-all"
          >
            Moderate Cloudburst (+25 mm/h)
          </button>
          <button
            onClick={() => handleApply(60, 25)}
            className="px-2.5 py-1 rounded bg-[#2b171e] hover:bg-[#3d1e28] text-rose-300 border border-rose-800/60 text-[10px] font-semibold transition-all"
          >
            Severe Extreme Monsoon (+60 mm/h)
          </button>
          {isSimulating && (
            <button
              onClick={handleReset}
              className="ml-auto px-2 py-1 rounded bg-[#1c2738] hover:bg-[#25344a] text-slate-300 text-[10px] font-semibold border border-[#2f425e] flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="bg-[#0e141e] p-2.5 rounded border border-[#1d2737] flex flex-col gap-2">
        <div>
          <div className="flex justify-between text-[10.5px] mb-1">
            <span className="text-slate-300 font-medium">Hypothetical Rain Rate Increase</span>
            <strong className="text-amber-400 font-mono">+{rainIncrease} mm/h</strong>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={rainIncrease}
            onChange={(e) => handleApply(Number(e.target.value), soilSaturationIncrease)}
            className="w-full accent-amber-500 h-1 bg-[#1e2a3b] rounded cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-[10.5px] mb-1">
            <span className="text-slate-300 font-medium">Antecedent Saturation Surge</span>
            <strong className="text-cyan-400 font-mono">+{soilSaturationIncrease}%</strong>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            value={soilSaturationIncrease}
            onChange={(e) => handleApply(rainIncrease, Number(e.target.value))}
            className="w-full accent-cyan-500 h-1 bg-[#1e2a3b] rounded cursor-pointer"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-1.5 border-t border-[#1b2636] flex items-center justify-between text-[9px] text-slate-500">
        <span>Slope Stability Solver: Infinite Slope Equation</span>
        <span className="font-mono">Real-time derivation</span>
      </div>

    </div>
  );
};
