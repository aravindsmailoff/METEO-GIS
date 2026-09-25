'use client';

import React, { useState, useEffect } from 'react';
import { Eye, Satellite, RefreshCw, X, Radio, Info } from 'lucide-react';

interface InsatSatelliteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InsatSatelliteModal: React.FC<InsatSatelliteModalProps> = ({ isOpen, onClose }) => {
  const [channel, setChannel] = useState<'ir1' | 'ctbt' | 'vis'>('ir1');
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dataAgeMin, setDataAgeMin] = useState<number>(20);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setImageError(false);
      const now = new Date();
      setLastCheckTime(now.toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }) + ' IST');
    }
  }, [isOpen, channel]);

  if (!isOpen) return null;

  const channelLabels: Record<string, { title: string; subtitle: string; desc: string }> = {
    ir1: {
      title: 'TIR-1 (Thermal Infrared 10.8 µm)',
      subtitle: 'INSAT-3DS / 3DR Geostationary Payload L1C Mercator',
      desc: 'Infrared radiometer channel measuring cloud-top thermal radiation day & night. Highlights convective updrafts & storm anvils.',
    },
    ctbt: {
      title: 'CTBT (Cloud Top Temperature °C)',
      subtitle: 'INSAT-3DR Derived Product',
      desc: 'Calibrated brightness temperature scale indicating cloud top heights and deep convection glaciation.',
    },
    vis: {
      title: 'VIS (Visible Spectrum 0.65 µm)',
      subtitle: 'INSAT-3DR Day-Only Optical Imagery',
      desc: 'High-resolution daytime optical reflection showing low, middle, and high cloud morphology.',
    },
  };

  const currentInfo = channelLabels[channel];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#0c131f] border border-cyan-700/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header (Matching input_file_0.png) */}
        <div className="px-4 py-3 bg-[#080d16] border-b border-[#1f2b3c] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-950 border border-purple-700/80 text-purple-400 shadow-sm">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                INSAT-3DR GEOSTATIONARY SATELLITE (TIR-1 RAPID SCAN)
              </h3>
              <span className="text-[10px] text-slate-400 font-mono block">
                ISRO MOSDAC / IMD Mausam Asia Sector Composite
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#141e2b] hover:bg-[#1e2f42] text-slate-400 hover:text-white flex items-center justify-center text-sm transition-all"
          >
            ✕
          </button>
        </div>

        {/* Channel Selection Toolbar */}
        <div className="px-4 py-2 bg-[#0d1624] border-b border-[#1a2636] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10.5px] text-slate-400 font-bold uppercase font-mono">CHANNEL:</span>
            
            <button
              onClick={() => setChannel('ir1')}
              className={`px-3 py-1 rounded text-[10.5px] font-mono font-bold border transition-all ${
                channel === 'ir1' 
                  ? 'bg-purple-950 text-purple-300 border-purple-600 shadow-sm' 
                  : 'bg-[#121c2b] text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              TIR-1 (Thermal Infrared 10.8 µm)
            </button>

            <button
              onClick={() => setChannel('ctbt')}
              className={`px-3 py-1 rounded text-[10.5px] font-mono font-bold border transition-all ${
                channel === 'ctbt' 
                  ? 'bg-purple-950 text-purple-300 border-purple-600 shadow-sm' 
                  : 'bg-[#121c2b] text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              CTBT (Cloud Top Temperature °C)
            </button>

            <button
              onClick={() => setChannel('vis')}
              className={`px-3 py-1 rounded text-[10.5px] font-mono font-bold border transition-all ${
                channel === 'vis' 
                  ? 'bg-purple-950 text-purple-300 border-purple-600 shadow-sm' 
                  : 'bg-[#121c2b] text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              VIS (Visible)
            </button>
          </div>

          <div className="flex items-center gap-2 font-mono text-[9.5px]">
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE STREAM
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">Data Age: ~{dataAgeMin} min</span>
          </div>
        </div>

        {/* Live Satellite Image Viewport */}
        <div className="flex-1 bg-black p-2 sm:p-4 flex items-center justify-center overflow-auto min-h-[360px] relative">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 gap-2">
              <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
              <span className="text-xs text-purple-300 font-mono">Streaming official IMD satellite payload...</span>
            </div>
          )}

          {imageError ? (
            <div className="p-6 text-center flex flex-col items-center gap-3">
              <span className="text-amber-400 text-sm font-bold font-mono">
                ⚠️ INSAT satellite feed unavailable
              </span>
              <p className="text-xs text-slate-400 max-w-md">
                The upstream IMD Mausam satellite stream is currently unreachable or undergoing scheduled telemetry transmission. 
                In strict adherence to truth-in-data rules, no synthetic fallback image is displayed.
              </p>
              <button 
                onClick={() => { setImageError(false); setIsLoading(true); }}
                className="px-3 py-1 rounded bg-[#162232] text-cyan-300 border border-cyan-800 text-xs font-mono"
              >
                Retry Ingestion
              </button>
            </div>
          ) : (
            <img
              src={`/api/imd/imagery?type=satellite&channel=${channel}`}
              alt={currentInfo.title}
              onLoad={() => setIsLoading(false)}
              onError={() => { setIsLoading(false); setImageError(true); }}
              className="max-h-[500px] w-auto object-contain rounded-lg border border-[#1e2b3c] shadow-2xl"
            />
          )}
        </div>

        {/* Satellite Technical Details Strip */}
        <div className="px-4 py-2 bg-[#090e17] border-t border-[#1a2536] flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <div>
            <strong className="text-purple-300">{currentInfo.title}</strong>
            <span className="text-slate-500 ml-1">· Coverage: Asia Sector / North Indian Ocean</span>
          </div>
          <div>
            <span>Refreshed: <strong className="text-cyan-300">{lastCheckTime}</strong></span>
          </div>
        </div>

        {/* Modal Footer (Matching input_file_0.png) */}
        <div className="px-4 py-2.5 bg-[#080d16] border-t border-[#1f2b3c] flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>Official IMD / ISRO INSAT-3DR Geostationary Payload (Updated Every 30 Min)</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1 rounded bg-[#162232] hover:bg-[#203248] text-white font-semibold transition-all shadow-sm"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
};
