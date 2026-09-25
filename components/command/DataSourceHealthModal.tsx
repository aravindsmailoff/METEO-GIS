'use client';

import React, { useState, useEffect } from 'react';
import { X, Server, CheckCircle2, AlertCircle, Clock, ShieldCheck, RefreshCw, Zap } from 'lucide-react';

interface AuthoritativeSourceHealth {
  id: string;
  name: string;
  agency: string;
  category: string;
  status: 'CONNECTED' | 'NEAR-REAL-TIME' | 'DELAYED' | 'UNAVAILABLE';
  lastObservationIST: string;
  lastReceivedIST: string;
  dataAgeMinutes: number;
  updateIntervalMinutes: number;
  recordsCount?: number;
  endpoint: string;
  protocol: string;
  latencyMs: number;
  details: string;
}

interface DataSourceHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataSourceHealthModal: React.FC<DataSourceHealthModalProps> = ({ isOpen, onClose }) => {
  const [sources, setSources] = useState<AuthoritativeSourceHealth[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');
  const [healthScore, setHealthScore] = useState<number>(100);

  const fetchStatus = () => {
    setIsLoading(true);
    fetch('/api/system/data-status')
      .then((res) => res.json())
      .then((data) => {
        if (data.sources) {
          setSources(data.sources);
          setHealthScore(data.healthPercent || 100);
          setLastCheckTime(data.serverTimeIST || new Date().toLocaleTimeString('en-IN') + ' IST');
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#0f1724] border border-[#23354c] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        
        {/* Modal Header */}
        <div className="px-4 py-3 bg-[#0a101b] border-b border-[#1f2b3c] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Live Meteorological Data Source Health & Latency Monitor
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchStatus}
              className="p-1 rounded bg-[#162232] hover:bg-[#22354c] text-slate-300 transition-all"
              title="Ping & Refresh All Data Feeds"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">✕</button>
          </div>
        </div>

        {/* Status Strip */}
        <div className="bg-[#0c1420] px-4 py-2 border-b border-[#192636] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">System Ingestion Health:</span>
            <span className={`font-bold ${healthScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {healthScore}% Operational
            </span>
          </div>
          <span className="text-slate-500 text-[10px]">Audited: {lastCheckTime || 'Live'}</span>
        </div>

        {/* Sources List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
          <p className="text-xs text-slate-400 leading-relaxed">
            Strict truth-in-data registry. In accordance with operational meteorological policy, 
            delayed data is explicitly labeled with true latency, and missing sensors report 
            <strong> UNAVAILABLE</strong>. Zero synthetic data is tolerated.
          </p>

          <div className="flex flex-col gap-2">
            {sources.map((source) => {
              const isConnected = source.status === 'CONNECTED';
              const isNrt = source.status === 'NEAR-REAL-TIME';
              const isDelayed = source.status === 'DELAYED';
              const isOffline = source.status === 'UNAVAILABLE';

              return (
                <div 
                  key={source.id} 
                  className={`p-3 rounded-lg border flex flex-col gap-1.5 ${
                    isConnected 
                      ? 'bg-[#131d2b] border-[#22354c]' 
                      : isNrt 
                      ? 'bg-[#141b28] border-cyan-800/60'
                      : isDelayed
                      ? 'bg-[#1b1915] border-amber-800/60'
                      : 'bg-[#181515] border-rose-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        isConnected ? 'bg-emerald-400 animate-pulse' 
                        : isNrt ? 'bg-cyan-400' 
                        : isDelayed ? 'bg-amber-400' 
                        : 'bg-rose-500'
                      }`} />
                      <div>
                        <span className="font-bold text-xs text-white block">
                          {source.name}
                        </span>
                        <span className="text-[9.5px] text-slate-400 block font-mono">
                          {source.agency}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {source.latencyMs > 0 && (
                        <span className="text-[9px] font-mono text-slate-500">
                          {source.latencyMs} ms
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold border ${
                        isConnected 
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700' 
                          : isNrt
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                          : isDelayed
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-rose-950 text-rose-300 border-rose-800'
                      }`}>
                        {source.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono pt-1 border-t border-[#1a2536]">
                    <div>
                      <span>Observed: </span>
                      <strong className={isConnected ? 'text-cyan-300' : 'text-slate-300'}>
                        {source.lastObservationIST}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span>Age: </span>
                      <strong className={source.dataAgeMinutes <= 60 ? 'text-emerald-400' : 'text-amber-400'}>
                        {source.dataAgeMinutes < 999 ? `${source.dataAgeMinutes} min` : 'Offline'}
                      </strong>
                      <span className="text-slate-500 ml-1">· Refresh: {source.updateIntervalMinutes}m</span>
                    </div>
                  </div>

                  <div className="text-[9.5px] text-slate-400 leading-snug">
                    {source.details}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-[#0a101b] border-t border-[#1f2b3c] flex items-center justify-between text-xs text-slate-400">
          <span>Official MoES / IMD Operational Ingestion Gateway Active.</span>
          <button 
            onClick={onClose}
            className="px-3 py-1 rounded bg-[#162232] hover:bg-[#203248] text-white font-semibold transition-all"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
