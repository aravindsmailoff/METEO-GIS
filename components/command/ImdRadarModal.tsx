'use client';

import React, { useState, useEffect } from 'react';
import { Radio, RefreshCw, X, Info } from 'lucide-react';

interface ImdRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStation?: string;
}

const IMD_RADAR_STATIONS = [
  { code: 'cni', name: 'Chennai (NIOT / IMD)', band: 'S-Band', lat: 13.0827, lng: 80.2707 },
  { code: 'mum', name: 'Mumbai (Colaba / Veravali)', band: 'S-Band', lat: 18.9067, lng: 72.8147 },
  { code: 'kol', name: 'Kolkata (Alipore)', band: 'S-Band', lat: 22.5333, lng: 88.3333 },
  { code: 'delhi', name: 'Delhi (Mausam Bhawan / Palam)', band: 'C-Band', lat: 28.5833, lng: 77.2167 },
  { code: 'mpt', name: 'Machilipatnam', band: 'S-Band', lat: 16.1833, lng: 81.1333 },
  { code: 'hyd', name: 'Hyderabad (Begumpet)', band: 'C-Band', lat: 17.4500, lng: 78.4667 },
  { code: 'kkl', name: 'Karaikal Coastal', band: 'S-Band', lat: 10.9254, lng: 79.8380 },
  { code: 'ngp', name: 'Nagpur Central India', band: 'S-Band', lat: 21.1458, lng: 79.0882 },
  { code: 'goa', name: 'Goa Coastal', band: 'S-Band', lat: 15.4909, lng: 73.8278 },
  { code: 'lkn', name: 'Lucknow', band: 'C-Band', lat: 26.8467, lng: 80.9462 },
  { code: 'jpr', name: 'Jaipur', band: 'C-Band', lat: 26.9124, lng: 75.7873 },
];

export const ImdRadarModal: React.FC<ImdRadarModalProps> = ({ isOpen, onClose, initialStation = 'cni' }) => {
  const [station, setStation] = useState<string>(initialStation);
  const [product, setProduct] = useState<'ppz' | 'sri' | 'ppv' | 'pac'>('ppz');
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setImageError(false);
      setLastCheckTime(new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }) + ' IST');
    }
  }, [isOpen, station, product]);

  if (!isOpen) return null;

  const currentStationObj = IMD_RADAR_STATIONS.find(s => s.code === station) || IMD_RADAR_STATIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#0c131f] border border-cyan-700/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-4 py-3 bg-[#080d16] border-b border-[#1f2b3c] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-700/80 text-cyan-400 shadow-sm">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                IMD DOPPLER WEATHER RADAR (LIVE PPI VOLUME SCAN)
              </h3>
              <span className="text-[10px] text-slate-400 font-mono block">
                {currentStationObj.name} ({currentStationObj.band}) • Station Code: {currentStationObj.code.toUpperCase()}
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

        {/* Toolbar: Station Selector & Product Selector */}
        <div className="px-4 py-2 bg-[#0d1624] border-b border-[#1a2636] flex flex-wrap items-center justify-between gap-2 text-xs">
          
          <div className="flex items-center gap-2">
            <span className="text-[10.5px] text-slate-400 font-bold uppercase font-mono">RADAR:</span>
            <select
              value={station}
              onChange={(e) => setStation(e.target.value)}
              className="bg-[#141e2b] border border-[#23354c] rounded px-2 py-1 text-cyan-300 font-semibold text-xs focus:outline-none cursor-pointer"
            >
              {IMD_RADAR_STATIONS.map((stn) => (
                <option key={stn.code} value={stn.code}>{stn.name} ({stn.band})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10.5px] text-slate-400 font-bold uppercase font-mono">PRODUCT:</span>
            
            <button
              onClick={() => setProduct('ppz')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all ${
                product === 'ppz' 
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-600 shadow-sm' 
                  : 'bg-[#121c2b] text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Plan Position Indicator Reflectivity (dBZ)"
            >
              PPZ (Reflectivity)
            </button>

            <button
              onClick={() => setProduct('sri')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all ${
                product === 'sri' 
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-600 shadow-sm' 
                  : 'bg-[#121c2b] text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Surface Rainfall Intensity (mm/h)"
            >
              SRI (Rain Rate)
            </button>

            <button
              onClick={() => setProduct('ppv')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all ${
                product === 'ppv' 
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-600 shadow-sm' 
                  : 'bg-[#121c2b] text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Radial Doppler Velocity (m/s)"
            >
              PPV (Radial Wind)
            </button>
          </div>

        </div>

        {/* Live Radar Image Viewport */}
        <div className="flex-1 bg-black p-2 sm:p-4 flex items-center justify-center overflow-auto min-h-[360px] relative">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 gap-2">
              <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
              <span className="text-xs text-cyan-300 font-mono">Streaming official IMD Doppler radar scan...</span>
            </div>
          )}

          {imageError ? (
            <div className="p-6 text-center flex flex-col items-center gap-3">
              <span className="text-amber-400 text-sm font-bold font-mono">
                ⚠️ Radar data unavailable for {currentStationObj.name}
              </span>
              <p className="text-xs text-slate-400 max-w-md">
                This radar station is currently either in scheduled maintenance or not streaming volumetric data to the public gateway.
                In strict adherence to truth-in-data rules, no simulated radar animation is displayed.
              </p>
              <button 
                onClick={() => setStation('cni')}
                className="px-3 py-1 rounded bg-[#162232] text-cyan-300 border border-cyan-800 text-xs font-mono"
              >
                Switch to Chennai DWR (Verified Operational)
              </button>
            </div>
          ) : (
            <img
              src={`/api/imd/imagery?type=radar&station=${station}&product=${product}`}
              alt={`IMD DWR ${currentStationObj.name} ${product}`}
              onLoad={() => setIsLoading(false)}
              onError={() => { setIsLoading(false); setImageError(true); }}
              className="max-h-[500px] w-auto object-contain rounded-lg border border-[#1e2b3c] shadow-2xl"
            />
          )}
        </div>

        {/* Radar Technical Details Strip */}
        <div className="px-4 py-2 bg-[#090e17] border-t border-[#1a2636] flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <div>
            <strong className="text-cyan-300">Surveillance Radius: 250 km / 500 km</strong>
            <span className="text-slate-500 ml-1">· Operator: IMD MoES Radar Division</span>
          </div>
          <div>
            <span>Refreshed: <strong className="text-cyan-300">{lastCheckTime}</strong></span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-[#080d16] border-t border-[#1f2b3c] flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>Official IMD MoES Doppler Weather Radar Feed (Updated Every 5–10 Min)</span>
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
