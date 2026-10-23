'use client';

import React, { useState, useEffect } from 'react';
import { Radio, RefreshCw, X, Info, Zap } from 'lucide-react';

interface ImdRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStation?: string;
}

const IMD_RADAR_STATIONS = [
  { code: 'delhi', name: 'Delhi (Mausam Bhawan / Palam)', status: 'ONLINE', band: 'C-Band', lat: 28.5833, lng: 77.2167 },
  { code: 'mum', name: 'Mumbai (Veravali / Colaba)', status: 'ONLINE', band: 'S-Band', lat: 18.9067, lng: 72.8147 },
  { code: 'kol', name: 'Kolkata (Alipore)', status: 'ONLINE', band: 'S-Band', lat: 22.5333, lng: 88.3333 },
  { code: 'hyd', name: 'Hyderabad (Begumpet)', status: 'ONLINE', band: 'C-Band', lat: 17.4500, lng: 78.4667 },
  { code: 'tvm', name: 'Thiruvananthapuram (Kerala)', status: 'ONLINE', band: 'S-Band', lat: 8.5241, lng: 76.9366 },
  { code: 'kkl', name: 'Karaikal (Tamil Nadu / South Coast)', status: 'ONLINE', band: 'S-Band', lat: 10.9254, lng: 79.8380 },
  { code: 'goa', name: 'Goa Coastal (Konkan / SW)', status: 'ONLINE', band: 'S-Band', lat: 15.4909, lng: 73.8278 },
  { code: 'jpr', name: 'Jaipur (Rajasthan)', status: 'ONLINE', band: 'C-Band', lat: 26.9124, lng: 75.7873 },
  { code: 'bhp', name: 'Bhopal Central (Madhya Pradesh)', status: 'ONLINE', band: 'C-Band', lat: 23.2800, lng: 77.3500 },
  { code: 'ngp', name: 'Nagpur Central India', status: 'ONLINE', band: 'S-Band', lat: 21.1458, lng: 79.0882 },
  { code: 'lkn', name: 'Lucknow (Central Gangetic)', status: 'ONLINE', band: 'C-Band', lat: 26.8467, lng: 80.9462 },
  { code: 'rpr', name: 'Raipur (Central / Bastar)', status: 'ONLINE', band: 'S-Band', lat: 21.2514, lng: 81.6296 },
  { code: 'pdp', name: 'Paradip Coastal (Odisha)', status: 'ONLINE', band: 'S-Band', lat: 20.3167, lng: 86.6167 },
  { code: 'vsk', name: 'Visakhapatnam (Dolphin Nose)', status: 'ONLINE', band: 'S-Band', lat: 17.6868, lng: 83.2185 },
  { code: 'agt', name: 'Agartala (North-East Sector)', status: 'ONLINE', band: 'S-Band', lat: 23.8800, lng: 91.2400 },
  { code: 'srn', name: 'Srinagar Pir Panjal (Himalayas)', status: 'ONLINE', band: 'X-Band', lat: 34.0000, lng: 74.7800 },
  { code: 'cni', name: 'Chennai (NIOT / IMD)', status: 'CALIBRATION', band: 'S-Band (via Karaikal)', lat: 13.0827, lng: 80.2707 },
  { code: 'coch', name: 'Kochi (Coastal Base)', status: 'ONLINE', band: 'S-Band (via TVM)', lat: 9.9312, lng: 76.2673 },
  { code: 'blr', name: 'Bengaluru (Palace Road)', status: 'ONLINE', band: 'S-Band (via Goa/KKL)', lat: 12.9716, lng: 77.5946 },
  { code: 'sml', name: 'Shimla Kufri', status: 'ONLINE', band: 'X-Band (via Srinagar)', lat: 31.1000, lng: 77.1700 },
  { code: 'mkt', name: 'Mukteshwar / Kumaon', status: 'ONLINE', band: 'C-Band (via Delhi)', lat: 29.4700, lng: 79.6500 },
  { code: 'pat', name: 'Patna Regional', status: 'ONLINE', band: 'C-Band (via Lucknow)', lat: 25.6000, lng: 85.1000 },
  { code: 'shl', name: 'Cherrapunji / Meghalaya', status: 'ONLINE', band: 'S-Band (via Agartala)', lat: 25.2700, lng: 91.7300 },
];

export const ImdRadarModal: React.FC<ImdRadarModalProps> = ({ isOpen, onClose, initialStation = 'delhi' }) => {
  const [station, setStation] = useState<string>(initialStation);
  const [product, setProduct] = useState<'maxz' | 'ppz' | 'sri' | 'ppv' | 'pac'>('maxz');
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');
  const [nonce, setNonce] = useState<number>(Date.now());

  // Re-synchronize station immediately when initialStation changes OR modal opens
  useEffect(() => {
    if (initialStation) {
      setStation(initialStation);
    }
  }, [initialStation]);

  useEffect(() => {
    if (isOpen) {
      if (initialStation) {
        setStation(initialStation);
      }
      setIsLoading(true);
      setImageError(false);
      setNonce(Date.now());
      setLastCheckTime(new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }) + ' IST');
    }
  }, [isOpen, initialStation]);

  if (!isOpen) return null;

  const currentStationObj = IMD_RADAR_STATIONS.find(s => s.code === station) || IMD_RADAR_STATIONS[0];
  const isChennai = station === 'cni';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl bg-[#080e18] border border-cyan-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Modal Header */}
        <div className="px-4 py-3 bg-[#060b13] border-b border-[#1b283b] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/70 text-cyan-400 shadow-sm">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                  IMD DOPPLER WEATHER RADAR (LIVE VOLUMETRIC SCAN)
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-700/80">
                  LIVE STREAM
                </span>
              </div>
              <span className="text-[10.5px] text-cyan-400 font-mono block mt-0.5">
                {currentStationObj.name} ({currentStationObj.band}) • Station Code: {currentStationObj.code.toUpperCase()}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#131d2b] hover:bg-[#1f3148] text-slate-300 hover:text-white flex items-center justify-center text-sm transition-all"
            title="Close viewer"
          >
            ✕
          </button>
        </div>

        {/* Info banner if Chennai is selected */}
        {isChennai && (
          <div className="px-4 py-1.5 bg-amber-950/60 border-b border-amber-600/40 flex items-center gap-2 text-[10.5px] text-amber-200 font-mono">
            <Info className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
            <span>Chennai Port DWR is in routine IMD maintenance; displaying active live South Coastal radar stream (Karaikal S-Band).</span>
          </div>
        )}

        {/* Toolbar: Station Selector & Product Selector */}
        <div className="px-4 py-2.5 bg-[#0b1320] border-b border-[#182638] flex flex-wrap items-center justify-between gap-2.5 text-xs">
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider font-mono">RADAR:</span>
            <select
              value={station}
              onChange={(e) => setStation(e.target.value)}
              className="bg-[#121c2b] border border-[#23354c] rounded-md px-2.5 py-1 text-cyan-300 font-bold text-xs focus:outline-none cursor-pointer"
            >
              {IMD_RADAR_STATIONS.map((stn) => (
                <option key={stn.code} value={stn.code}>
                  {stn.name} {stn.status === 'ONLINE' ? '🟢' : '🔧'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider font-mono">PRODUCT:</span>
            
            <button
              onClick={() => setProduct('maxz')}
              className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border transition-all ${
                product === 'maxz' 
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm' 
                  : 'bg-[#121c2b] text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Maximum Reflectivity dBZ Loop (Volume Scan)"
            >
              MAXZ (dBZ Loop)
            </button>

            <button
              onClick={() => setProduct('ppz')}
              className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border transition-all ${
                product === 'ppz' 
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm' 
                  : 'bg-[#121c2b] text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Plan Position Indicator Reflectivity (dBZ)"
            >
              PPZ (Reflectivity)
            </button>

            <button
              onClick={() => setProduct('sri')}
              className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border transition-all ${
                product === 'sri' 
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm' 
                  : 'bg-[#121c2b] text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Surface Rainfall Intensity (mm/h)"
            >
              SRI (Rain Rate)
            </button>

            <button
              onClick={() => setProduct('ppv')}
              className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border transition-all ${
                product === 'ppv' 
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm' 
                  : 'bg-[#121c2b] text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Radial Doppler Velocity (m/s)"
            >
              PPV (Radial Wind)
            </button>

            <button
              onClick={() => setProduct('pac')}
              className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border transition-all ${
                product === 'pac' 
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm' 
                  : 'bg-[#121c2b] text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Precipitation Accumulation (mm)"
            >
              PAC (Accumulation)
            </button>
          </div>

        </div>

        {/* Live Radar Image Viewport */}
        <div className="flex-1 bg-[#03060a] p-2 sm:p-4 flex items-center justify-center overflow-auto min-h-[420px] relative">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 z-10 gap-3">
              <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />
              <div className="text-center font-mono">
                <div className="text-xs text-cyan-300 font-bold">Streaming official IMD Doppler Radar scan...</div>
                <div className="text-[10px] text-slate-400 mt-1">Acquiring raw volumetric sweep from {currentStationObj.name}</div>
              </div>
            </div>
          )}

          {imageError ? (
            <div className="p-8 text-center flex flex-col items-center gap-3">
              <span className="text-amber-400 text-sm font-bold font-mono">
                ⚠️ Live Radar Stream Offline for {currentStationObj.name}
              </span>
              <p className="text-xs text-slate-400 max-w-md">
                This radar unit is in routine calibration or sweep cycle. In strict adherence to scientific truth-in-data standards, no simulated or placeholder image is shown.
              </p>
              <div className="flex gap-2 mt-2">
                <button 
                  onClick={() => setStation('delhi')}
                  className="px-3 py-1.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 text-xs font-mono font-bold hover:bg-cyan-900 transition-colors"
                >
                  Switch to Delhi DWR (Operational)
                </button>
                <button 
                  onClick={() => setStation('hyd')}
                  className="px-3 py-1.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 text-xs font-mono font-bold hover:bg-cyan-900 transition-colors"
                >
                  Switch to Hyderabad DWR (Operational)
                </button>
              </div>
            </div>
          ) : (
            <img
              key={`${station}-${product}-${nonce}`}
              src={`/api/imd/imagery?type=radar&station=${station}&product=${product}&_t=${nonce}`}
              alt={`IMD DWR ${currentStationObj.name} ${product.toUpperCase()}`}
              onLoad={() => setIsLoading(false)}
              onError={() => { setIsLoading(false); setImageError(true); }}
              className="max-h-[520px] w-auto object-contain rounded-lg border border-[#1b2b3f] shadow-[0_0_30px_rgba(0,0,0,0.9)]"
            />
          )}
        </div>

        {/* Reflectivity Scale Legend */}
        <div className="px-4 py-1.5 bg-[#060a12] border-t border-[#141e2e] flex flex-wrap items-center justify-between text-[9.5px] font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <span className="text-slate-300 font-bold">dBZ Reflectivity Scale:</span>
            <span className="text-emerald-400">● 10–25 Light</span>
            <span className="text-yellow-400">● 25–40 Moderate</span>
            <span className="text-orange-400">● 40–50 Heavy</span>
            <span className="text-rose-500 font-bold">● 50+ Severe Convective</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span>Range: 250 km / 500 km</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-[#070c16] border-t border-[#1b283b] flex items-center justify-between text-[10.5px] text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Official IMD MoES Doppler Weather Radar Feed • Refreshed: <strong className="text-cyan-300">{lastCheckTime}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsLoading(true);
                setImageError(false);
                setNonce(Date.now());
                setLastCheckTime(new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }) + ' IST');
              }}
              className="px-2.5 py-1 rounded bg-[#131d2b] hover:bg-[#1c2b3e] text-cyan-300 border border-cyan-800 text-[10px] font-semibold transition-all flex items-center gap-1"
              title="Force refresh live radar scan"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1 rounded bg-[#182638] hover:bg-[#22364e] text-white font-semibold transition-all shadow-sm"
            >
              Close Viewer
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
