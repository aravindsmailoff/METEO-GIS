'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Waves, PhoneCall, ChevronUp, Radio, ShieldAlert } from 'lucide-react';

interface AppleDynamicIslandProps {
  onOpenSOS?: () => void;
  onOpenDams?: () => void;
}

export function AppleDynamicIsland({ onOpenSOS, onOpenDams }: AppleDynamicIslandProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] flex flex-col items-center pointer-events-auto">
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative bg-black/85 backdrop-blur-3xl text-white cursor-pointer overflow-hidden border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.7)]"
        style={{
          borderRadius: isExpanded ? 36 : 999,
          width: isExpanded ? 'min(92vw, 420px)' : 'auto',
          padding: isExpanded ? '16px 20px' : '6px 14px',
        }}
      >
        {/* Subtle glass rim highlight */}
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/20" />

        {!isExpanded ? (
          /* Compact Island State */
          <motion.div
            layout
            className="flex items-center gap-3 select-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <span className="text-[12px] font-semibold tracking-tight text-red-200">
                IMD RED ALERT
              </span>
            </div>

            <div className="h-3 w-px bg-white/20" />

            <div className="flex items-center gap-1.5 text-sky-400">
              <Waves className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium tracking-tight">Teesta-V 91%</span>
            </div>

            <div className="h-3 w-px bg-white/20" />

            <span className="text-[10px] font-mono font-bold text-white/70 bg-white/10 px-1.5 py-0.5 rounded-full">
              LIVE
            </span>
          </motion.div>
        ) : (
          /* Expanded Island State */
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                  <ShieldAlert className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
                    Severe Flood Warning
                    <span className="text-[10px] font-mono font-bold text-red-400 bg-red-950/60 border border-red-800 px-1.5 py-0.2 rounded">
                      CAT 4
                    </span>
                  </h4>
                  <p className="text-[11px] text-white/60">Teesta River Basin • East Sikkim</p>
                </div>
              </div>

              <button
                onClick={() => setIsExpanded(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white/70"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>

            {/* Inundation & Dam Key Metrics */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div
                onClick={() => {
                  setIsExpanded(false);
                  onOpenDams?.();
                }}
                className="cursor-pointer bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-2xl p-2.5 transition-all"
              >
                <div className="flex items-center justify-between text-[11px] text-white/60 mb-1">
                  <span>Teesta-V Spillway</span>
                  <Waves className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="text-base font-bold text-white">3 Gates Discharging</div>
                <div className="text-[10px] text-amber-300 font-medium mt-0.5">
                  Flood wave: 1.5h to Singtam
                </div>
              </div>

              <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-2.5">
                <div className="flex items-center justify-between text-[11px] text-white/60 mb-1">
                  <span>Rain Rate Peak</span>
                  <Radio className="w-3.5 h-3.5 text-red-400" />
                </div>
                <div className="text-base font-bold text-white">92.4 mm/h</div>
                <div className="text-[10px] text-red-400 font-medium mt-0.5">
                  Flash flood imminent
                </div>
              </div>
            </div>

            {/* Immediate Advisory Strip */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-2.5 flex items-start gap-2 text-[11px] text-red-200">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-semibold">Evacuation Order Active</strong>
                Residents in Singtam low-lying banks: Move immediately to designated high-ground shelters.
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  setIsExpanded(false);
                  onOpenSOS?.();
                }}
                className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-[0_4px_16px_rgba(239,68,68,0.4)]"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Emergency SOS (112)</span>
              </button>

              <button
                onClick={() => setIsExpanded(false)}
                className="py-2 px-4 bg-white/10 hover:bg-white/15 active:scale-95 text-white/90 text-xs font-medium rounded-xl transition-all"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
