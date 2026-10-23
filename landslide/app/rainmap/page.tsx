'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';
import { AppleDynamicIsland } from '@/components/rainmap/AppleDynamicIsland';
import { AppleFloatingDock, RainTabType } from '@/components/rainmap/AppleFloatingDock';
import { RainfallAlertPanel } from '@/components/rainmap/RainfallAlertPanel';
import { DamStatusPanel } from '@/components/rainmap/DamStatusPanel';
import { InfraImpactPanel } from '@/components/rainmap/InfraImpactPanel';
import { CitizenReportPanel } from '@/components/rainmap/CitizenReportPanel';
import { ChevronDown, Maximize2, Minimize2, Wifi, Battery } from 'lucide-react';
import './rainmap.css';

// Dynamic import for Leaflet map (client-only)
const RainMap = dynamic(
  () => import('@/components/rainmap/RainMap').then((m) => m.RainMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
      </div>
    ),
  }
);

export default function RainMapPage() {
  const [activeTab, setActiveTab] = useState<RainTabType>('rainfall');
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [isExpandedFull, setIsExpandedFull] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initialize Lenis smooth scroll for drawer content
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const lenis = new Lenis({
      wrapper: scrollContainerRef.current,
      content: scrollContainerRef.current.firstElementChild as HTMLElement,
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [activeTab, isDrawerOpen]);

  const handleTabSelect = (tab: RainTabType) => {
    setActiveTab(tab);
    if (!isDrawerOpen) setIsDrawerOpen(true);
  };

  const toggleDrawer = () => {
    setIsDrawerOpen((prev) => !prev);
  };

  return (
    <div className="phone-stage">
      {/* ── Apple iPhone Mobile Device Shell ── */}
      <div className="phone-chassis">
        {/* iOS Native Status Bar */}
        <div className="ios-status-bar">
          <span className="ios-time">9:41</span>
          <div className="ios-status-icons">
            <span className="text-[10px] font-bold font-mono text-white/80">5G</span>
            <Wifi className="w-3.5 h-3.5 text-white/90" />
            <Battery className="w-4 h-4 text-white/90" />
          </div>
        </div>

        <div className="apple-shell">
          {/* ── Background: Edge-to-Edge Dark Map ── */}
          <RainMap />

          {/* ── Top Apple Dynamic Island ── */}
          <AppleDynamicIsland
            onOpenSOS={() => handleTabSelect('sos')}
            onOpenDams={() => handleTabSelect('dams')}
          />

          {/* ── Apple-Grade Bottom Sheet Drawer ── */}
          <AnimatePresence>
            {isDrawerOpen && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 350, damping: 35 }}
                style={{
                  height: isExpandedFull ? '84%' : '52%',
                }}
                className="apple-drawer-sheet"
              >
                {/* Drawer Header & Grab Handle */}
                <div className="flex flex-col items-center shrink-0 px-5 pt-1 pb-2">
                  <div
                    onClick={() => setIsExpandedFull(!isExpandedFull)}
                    className="apple-drawer-handle cursor-pointer hover:bg-white/60 active:scale-95 transition-all"
                    title="Tap to toggle size"
                  />

                  <div className="w-full flex items-center justify-between mt-1">
                    <div>
                      <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                        {activeTab === 'rainfall' && 'Doppler Rain Intelligence'}
                        {activeTab === 'dams' && 'Dam Reservoir & Gate Discharge'}
                        {activeTab === 'impact' && 'Infrastructure & Flood Impact'}
                        {activeTab === 'sos' && 'Emergency SOS & Citizen Intelligence'}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                          LIVE
                        </span>
                      </h2>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setIsExpandedFull(!isExpandedFull)}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                        title={isExpandedFull ? 'Collapse' : 'Expand full'}
                      >
                        {isExpandedFull ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => setIsDrawerOpen(false)}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                        title="Minimize Drawer"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Scrollable Content with Lenis Momentum */}
                <div ref={scrollContainerRef} className="flex-1 apple-scroll px-5 pt-1">
                  <div>
                    {activeTab === 'rainfall' && <RainfallAlertPanel />}
                    {activeTab === 'dams' && <DamStatusPanel />}
                    {activeTab === 'impact' && <InfraImpactPanel />}
                    {activeTab === 'sos' && <CitizenReportPanel />}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Apple Floating Capsule Bottom Dock ── */}
          <AppleFloatingDock
            activeTab={activeTab}
            onSelectTab={handleTabSelect}
            isDrawerOpen={isDrawerOpen}
            onToggleDrawer={toggleDrawer}
          />
        </div>

        {/* iOS Home Indicator Bar */}
        <div className="ios-home-indicator-bar" />
      </div>
    </div>
  );
}
