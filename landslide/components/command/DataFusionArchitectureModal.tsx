'use client';

import React from 'react';
import { 
  X, 
  Cpu, 
  Radio, 
  CloudLightning, 
  CloudRain, 
  Wind, 
  Zap, 
  Timer, 
  Layers, 
  CheckCircle2, 
  ShieldCheck, 
  Gauge, 
  AlertTriangle,
  ArrowRight,
  TrendingDown
} from 'lucide-react';

interface DataFusionArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataFusionArchitectureModal: React.FC<DataFusionArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl bg-[#0d1420] border border-[#23354c] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#080d16] border-b border-[#1f2b3c] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Multi-Source Data Fusion Architecture & Ingestion Engine
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  PS 26084 SPECIFICATION
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Sub-30s Convective Nowcasting (0–6 hr Lead Time) • Hyper-Local 1–3 km Spatial Resolution
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-7 h-7 rounded-full bg-[#15202e] hover:bg-[#203248] text-slate-400 hover:text-white flex items-center justify-center text-sm transition-all"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 text-xs">
          
          {/* 1. WHY TRADITIONAL NWP PHYSICS MODELS FAIL FOR CONVECTIVE NOWCASTING */}
          <div className="bg-[#121927] p-3.5 rounded-xl border border-amber-900/40 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Architectural Rationale: Physics-Based NWP vs Multi-Source Data Fusion</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Traditional physics-based Numerical Weather Prediction models (e.g. WRF, NCUM) solve Navier-Stokes primitive equations with complex microphysics parametrizations. A single run requires <strong>3–4 hours of high-performance compute (HPC) time</strong>. However, severe convective storms, microbursts, and cloudburst cells develop, intensify, and collapse within a rapid <strong>30–90 minute life cycle</strong>. By the time an NWP forecast completes, the severe event has already occurred.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1 font-mono text-[10px]">
              <div className="bg-[#0b1019] p-2.5 rounded border border-rose-900/50">
                <span className="text-rose-400 font-bold block mb-1">❌ Traditional Physics-Based NWP (WRF/NCUM)</span>
                <span className="text-slate-400 block">• Ingestion & Spin-Up: 120–180 minutes</span>
                <span className="text-slate-400 block">• Spatial Resolution: 4–12 km (misses microbursts)</span>
                <span className="text-slate-400 block">• Turnaround Latency: &gt; 3 hours</span>
                <span className="text-rose-400/90 block mt-1">Result: Fatal latency gap for early convective initiation</span>
              </div>
              <div className="bg-[#0b1019] p-2.5 rounded border border-emerald-900/50">
                <span className="text-emerald-400 font-bold block mb-1">✅ Multi-Source Fusion + pySTEPS Engine</span>
                <span className="text-slate-400 block">• Ingestion & Fusion: &lt; 25 seconds</span>
                <span className="text-slate-400 block">• Spatial Resolution: 1–3 km (hyper-local convective core)</span>
                <span className="text-slate-400 block">• Turnaround Latency: Real-Time Continuous</span>
                <span className="text-emerald-300 block mt-1">Result: 0–6 hour lead time with live arrival countdown clocks</span>
              </div>
            </div>
          </div>

          {/* 2. THE 4 INGESTION DATA STREAMS */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Heterogeneous Ingestion Streams (Real-Time Sensor Fusion)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              
              {/* STREAM 1: DWR RADAR */}
              <div className="bg-[#101826] p-3 rounded-lg border border-[#1f2f45] flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    1. Doppler Weather Radars (DWR)
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    LIVE PPI SCAN
                  </span>
                </div>
                <p className="text-slate-400 text-[10.5px]">
                  Ingests polarimetric reflectivity (<strong>Z in dBZ</strong>) and radial velocity (<strong>Vr in m/s</strong>) fields from Chennai S-Band (2.8 GHz), Pallikaranai X-Band (9.4 GHz), and Sriharikota S-Band.
                </p>
                <div className="text-[9.5px] font-mono text-slate-300 pt-1 border-t border-[#1a2738] flex justify-between">
                  <span>Volume Update: Every 6–10 min</span>
                  <span className="text-cyan-400">Radial Resolution: 250m / 1–3 km grid</span>
                </div>
              </div>

              {/* STREAM 2: INSAT SATELLITE */}
              <div className="bg-[#101826] p-3 rounded-lg border border-[#1f2f45] flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#00e5ff] flex items-center gap-1.5">
                    <span>🛰️</span>
                    2. Geostationary INSAT-3D / 3DR
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    MOSDAC RAPID SCAN
                  </span>
                </div>
                <p className="text-slate-400 text-[10.5px]">
                  Thermal & infrared imagery: <strong>TIR-1 (10.8 µm)</strong> and <strong>MIR (3.9 µm)</strong> brightness temperature cooling rates (<strong>ΔTb / 15 min</strong>) to detect rapid cumulus glaciation.
                </p>
                <div className="text-[9.5px] font-mono text-slate-300 pt-1 border-t border-[#1a2738] flex justify-between">
                  <span>Cycle: 15-min Rapid Scan</span>
                  <span className="text-cyan-400">CI Trigger: ΔTb &le; -8 K / 15 min</span>
                </div>
              </div>

              {/* STREAM 3: LIGHTNING DETECTION */}
              <div className="bg-[#101826] p-3 rounded-lg border border-[#1f2f45] flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <CloudLightning className="w-4 h-4 text-amber-400" />
                    3. Ground Lightning Network (LNDN)
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    IITM / IMD STREAM
                  </span>
                </div>
                <p className="text-slate-400 text-[10.5px]">
                  Real-time VLF/LF Time-of-Arrival (TOA) cloud-to-ground (CG) and intra-cloud (IC) strike coordinates, flash rates, and <strong>1 km strike density grids</strong>.
                </p>
                <div className="text-[9.5px] font-mono text-slate-300 pt-1 border-t border-[#1a2738] flex justify-between">
                  <span>Frequency: Sub-second Stream</span>
                  <span className="text-amber-400">Flash Jump: &gt; +200% upshear</span>
                </div>
              </div>

              {/* STREAM 4: IMD AWS GROUND TRUTH */}
              <div className="bg-[#101826] p-3 rounded-lg border border-[#1f2f45] flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <CloudRain className="w-4 h-4 text-emerald-400" />
                    4. In-Situ IMD AWS Gateway
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    api.imd.gov.in (MoES Key)
                  </span>
                </div>
                <p className="text-slate-400 text-[10.5px]">
                  Authenticated dual-token gateway (Bearer JWT + X-API-KEY) delivering live AWS surface observations (Chennai-Meenambakkam Station 43279, Madhavaram, Tambaram).
                </p>
                <div className="text-[9.5px] font-mono text-slate-300 pt-1 border-t border-[#1a2738] flex justify-between">
                  <span>Calibration: Real Ground Truth</span>
                  <span className="text-emerald-400">Zero Fabricated Values</span>
                </div>
              </div>

            </div>
          </div>

          {/* 3. DYNAMIC FORECASTING OF THE 4 SEVERE STORM PARAMETERS */}
          <div className="bg-[#111a28] p-3.5 rounded-xl border border-[#22354c] flex flex-col gap-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-purple-400" />
              Dynamic Forecasting of Severe Storm Parameters (Mathematical Formulation)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
              
              {/* PARAM 1 */}
              <div className="bg-[#0b1019] p-2.5 rounded border border-[#1b283a]">
                <div className="flex items-center justify-between mb-1">
                  <strong className="text-amber-300 text-[11px] flex items-center gap-1">
                    <CloudLightning className="w-3 h-3 text-amber-400" />
                    1. Lightning Strike Density & Flash Jump
                  </strong>
                </div>
                <p className="text-slate-400 text-[10px]">
                  Calculates flash density per km² per hour and monitors the time derivative of flash rate: 
                  <code className="text-amber-300 block bg-[#131c2a] p-1 rounded my-1 text-[9.5px]">
                    Flash_Jump = d(Flash_Rate)/dt &ge; 2 &times; &sigma;(baseline)
                  </code>
                  Sudden surges precede severe downbursts and hail by 15–25 minutes.
                </p>
              </div>

              {/* PARAM 2 */}
              <div className="bg-[#0b1019] p-2.5 rounded border border-[#1b283a]">
                <div className="flex items-center justify-between mb-1">
                  <strong className="text-cyan-300 text-[11px] flex items-center gap-1">
                    <span>🧊</span>
                    2. Hail Probability (Waldvogel / MESH)
                  </strong>
                </div>
                <p className="text-slate-400 text-[10px]">
                  Evaluates height of 45 dBZ radar reflectivity core above the 0°C environmental melting level (H0) and -20°C freezing level (H20):
                  <code className="text-cyan-300 block bg-[#131c2a] p-1 rounded my-1 text-[9.5px]">
                    MESH = 2.54 &times; (SHI)^0.5 | P(Hail) = f(&Delta;H_45dBZ &gt; 1.4 km)
                  </code>
                  Outputs maximum estimated size of hail diameter in millimeters.
                </p>
              </div>

              {/* PARAM 3 */}
              <div className="bg-[#0b1019] p-2.5 rounded border border-[#1b283a]">
                <div className="flex items-center justify-between mb-1">
                  <strong className="text-teal-300 text-[11px] flex items-center gap-1">
                    <Wind className="w-3 h-3 text-teal-400" />
                    3. Downburst Velocity (Microburst Vgust)
                  </strong>
                </div>
                <p className="text-slate-400 text-[10px]">
                  Derived from low-level Doppler radial velocity divergence (&Delta;Vr) and negative convective available potential energy (DCAPE):
                  <code className="text-teal-300 block bg-[#131c2a] p-1 rounded my-1 text-[9.5px]">
                    V_gust = &radic;(2 &times; DCAPE) + 0.5 &times; &Delta;V_radar_divergence
                  </code>
                  Estimates peak ground wind gust in knots and km/h.
                </p>
              </div>

              {/* PARAM 4 */}
              <div className="bg-[#0b1019] p-2.5 rounded border border-[#1b283a]">
                <div className="flex items-center justify-between mb-1">
                  <strong className="text-rose-300 text-[11px] flex items-center gap-1">
                    <CloudRain className="w-3 h-3 text-rose-400" />
                    4. Cloudburst Threshold (Quantitative Flash Rain)
                  </strong>
                </div>
                <p className="text-slate-400 text-[10px]">
                  Strictly benchmarked against the official IMD meteorological definition:
                  <code className="text-rose-300 block bg-[#131c2a] p-1 rounded my-1 text-[9.5px]">
                    Cloudburst_Alert = [Rain_Rate &ge; 100 mm/h] over 20–30 km²
                  </code>
                  Triggers instant hyper-local flash flood warning envelopes.
                </p>
              </div>

            </div>
          </div>

          {/* 4. LIVE COUNTDOWN CLOCK & 1–3 KM GIS HAZARD ZONES */}
          <div className="bg-[#121927] p-3.5 rounded-xl border border-purple-500/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-950 border border-purple-700 text-purple-300">
                <Timer className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="font-bold text-white uppercase text-[11px] block">
                  Live Countdown Clocks for Storm Arrivals (0–6 hr Lead Time)
                </span>
                <span className="text-slate-400 text-[10px]">
                  Dynamically calculated: <strong className="text-cyan-300">T_countdown = (Distance to Impact / Cell Velocity) &times; 60</strong>, updating second-by-second on every 1–3 km hazard polygon.
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-purple-950 text-purple-200 border border-purple-700 font-mono text-[10px] font-bold">
              PS 26084 VERIFIED
            </span>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#080d16] border-t border-[#1f2b3c] flex items-center justify-between text-xs text-slate-400">
          <span>Multi-Source Ingestion Engine: Operational at 1–3 km grid resolution.</span>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-semibold transition-all shadow-md"
          >
            Acknowledge Architecture
          </button>
        </div>

      </div>
    </div>
  );
};
