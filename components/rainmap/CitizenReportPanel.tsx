'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LifeBuoy, PhoneCall, Radio, Send, CheckCircle2, MapPin, AlertOctagon, Share2 } from 'lucide-react';
import { AceternityCard } from './AceternityCard';

export function CitizenReportPanel() {
  const [sosSent, setSosSent] = useState(false);
  const [reportType, setReportType] = useState<'water_rise' | 'landslide' | 'medical' | 'trapped'>('water_rise');
  const [waterDepth, setWaterDepth] = useState('waist');
  const [locationText, setLocationText] = useState('Singtam Bazaar, Lower Ward 3');
  const [peopleCount, setPeopleCount] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const handleTriggerSOS = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSosSent(true);
    }, 1200);
  };

  const handleCitizenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setReportSubmitted(true);
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-4 select-none pb-12">
      {/* Apple-Style Emergency SOS Beacon Card */}
      <AceternityCard className="p-4" glowColor="rgba(239, 68, 68, 0.35)">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-red-400">
              Satellite Emergency Beacon
            </span>
          </div>
          <span className="text-[10px] text-white/50 font-mono">GPS Locked (±3m)</span>
        </div>

        {!sosSent ? (
          <div className="flex flex-col items-center text-center py-2">
            {/* Sonic Pulse SOS Button */}
            <div className="relative my-3 flex items-center justify-center">
              <span className="absolute w-28 h-28 rounded-full bg-red-600/20 animate-sonar pointer-events-none" />
              <span className="absolute w-24 h-24 rounded-full bg-red-600/30 animate-pulse pointer-events-none" />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={handleTriggerSOS}
                disabled={isSubmitting}
                className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-tr from-red-700 via-red-600 to-rose-500 text-white font-black text-xl tracking-wider shadow-[0_0_36px_rgba(239,68,68,0.7)] flex flex-col items-center justify-center border-2 border-white/20 active:opacity-90"
              >
                {isSubmitting ? (
                  <Radio className="w-7 h-7 animate-spin" />
                ) : (
                  <>
                    <span>SOS</span>
                    <span className="text-[8px] font-normal tracking-tight opacity-80">HOLD 1s</span>
                  </>
                )}
              </motion.button>
            </div>

            <h4 className="text-sm font-bold text-white mt-1">Tap to Broadcast Emergency Coordinates</h4>
            <p className="text-xs text-white/60 max-w-xs mt-1">
              Sends immediate high-priority distress ping to NDRF, SDRF, and Singtam District Control.
            </p>

            <div className="flex items-center gap-2 mt-3 text-[11px] font-mono text-white/40">
              <MapPin className="w-3.5 h-3.5 text-red-400" />
              <span>27.2384° N, 88.5021° E (Singtam Basin)</span>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Distress Beacon Broadcast Active</h4>
            <p className="text-xs text-white/70 max-w-xs">
              SDRF Quick Response Boat Unit #3 acknowledged your coordinates. Estimated arrival: 14 minutes.
            </p>
            <button
              onClick={() => setSosSent(false)}
              className="mt-2 text-[11px] font-semibold text-white/50 hover:text-white underline"
            >
              Reset Beacon
            </button>
          </div>
        )}
      </AceternityCard>

      {/* Direct Emergency Hotlines */}
      <div className="grid grid-cols-3 gap-2">
        <a
          href="tel:112"
          className="apple-bento p-3 text-center flex flex-col items-center gap-1 hover:bg-white/[0.08] transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
            <PhoneCall className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-white">112</span>
          <span className="text-[9px] text-white/50 uppercase font-semibold">National SOS</span>
        </a>

        <a
          href="tel:1077"
          className="apple-bento p-3 text-center flex flex-col items-center gap-1 hover:bg-white/[0.08] transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400">
            <PhoneCall className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-white">1077</span>
          <span className="text-[9px] text-white/50 uppercase font-semibold">Disaster HQ</span>
        </a>

        <a
          href="tel:108"
          className="apple-bento p-3 text-center flex flex-col items-center gap-1 hover:bg-white/[0.08] transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <PhoneCall className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-white">108</span>
          <span className="text-[9px] text-white/50 uppercase font-semibold">Ambulance</span>
        </a>
      </div>

      {/* Citizen Ground Flood Report Form */}
      <div className="apple-bento p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Report Flood Condition at Your Location
          </h4>
          <span className="text-[10px] text-sky-400 font-mono">Real-Time Crowdsource</span>
        </div>

        {!reportSubmitted ? (
          <form onSubmit={handleCitizenSubmit} className="flex flex-col gap-3 pt-1">
            {/* Danger Type Pills */}
            <div className="grid grid-cols-2 gap-1.5 text-xs font-medium">
              {[
                { id: 'water_rise', label: 'Rapid Water Rise' },
                { id: 'landslide', label: 'Landslide Block' },
                { id: 'trapped', label: 'People Trapped' },
                { id: 'medical', label: 'Medical Emergency' },
              ].map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setReportType(t.id as any)}
                  className={`py-2 px-2.5 rounded-xl text-left border transition-all ${
                    reportType === t.id
                      ? 'bg-sky-500/20 border-sky-400/50 text-sky-200 font-bold'
                      : 'bg-white/[0.03] border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Water Depth Selector */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-white/60 font-medium">Water Inundation Level</label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {[
                  { id: 'ankle', label: 'Ankle / Knee' },
                  { id: 'waist', label: 'Waist Level' },
                  { id: 'submerged', label: 'Floor Submerged' },
                ].map((d) => (
                  <button
                    type="button"
                    key={d.id}
                    onClick={() => setWaterDepth(d.id)}
                    className={`py-1.5 rounded-xl border text-center transition-all ${
                      waterDepth === d.id
                        ? 'bg-amber-500/20 border-amber-400/50 text-amber-200 font-bold'
                        : 'bg-white/[0.03] border-white/10 text-white/60'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Input */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-white/60 font-medium">Specific Landmark or Address</label>
              <input
                type="text"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/15 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-sky-400 transition-colors"
                placeholder="e.g. Near Singtam Police Station, House #14"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 active:scale-98 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-[0_4px_16px_rgba(2,132,199,0.4)]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Transmitting Alert...' : 'Broadcast Ground Report to Map'}</span>
            </button>
          </form>
        ) : (
          <div className="py-4 text-center flex flex-col items-center gap-1.5">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            <h5 className="text-xs font-bold text-white">Ground Report Broadcasted</h5>
            <p className="text-[11px] text-white/60">
              Your report has been marked on the public emergency map for disaster response teams.
            </p>
            <button
              onClick={() => setReportSubmitted(false)}
              className="mt-1 text-[11px] text-sky-400 hover:underline"
            >
              Submit Another Update
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
