'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CloudRain, Waves, ShieldAlert, LifeBuoy, MapPin, Eye, EyeOff } from 'lucide-react';

export type RainTabType = 'rainfall' | 'dams' | 'impact' | 'sos';

interface AppleFloatingDockProps {
  activeTab: RainTabType | null;
  onSelectTab: (tab: RainTabType) => void;
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
}

const TABS: { id: RainTabType; label: string; icon: React.ElementType; badge?: string; badgeColor?: string }[] = [
  { id: 'rainfall', label: 'Rainfall', icon: CloudRain, badge: '92mm', badgeColor: '#ef4444' },
  { id: 'dams', label: 'Dams', icon: Waves, badge: '91%', badgeColor: '#f97316' },
  { id: 'impact', label: 'Impact', icon: ShieldAlert, badge: '4 cut', badgeColor: '#fbbf24' },
  { id: 'sos', label: 'SOS Beacon', icon: LifeBuoy, badge: 'LIVE', badgeColor: '#ef4444' },
];

export function AppleFloatingDock({
  activeTab,
  onSelectTab,
  isDrawerOpen,
  onToggleDrawer,
}: AppleFloatingDockProps) {
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[250] flex items-center gap-2 pointer-events-auto">
      {/* Floating Capsule Nav */}
      <motion.nav
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative flex items-center gap-1.5 p-1.5 rounded-full bg-black/75 backdrop-blur-3xl border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.6)] select-none"
      >
        {/* Specular ring highlight */}
        <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/20" />

        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id && isDrawerOpen;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className="relative px-3.5 py-2 rounded-full flex items-center gap-2 text-xs font-semibold tracking-tight transition-all active:scale-95 text-white/70 hover:text-white"
            >
              {/* Active Tab Sliding Pill with Spring Physics */}
              {isActive && (
                <motion.div
                  layoutId="appleDockActivePill"
                  className="absolute inset-0 rounded-full bg-white/15 border border-white/20 shadow-sm"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}

              <span className="relative z-10 flex items-center gap-1.5">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-sky-400' : 'text-white/60'
                  }`}
                />
                <span className={`hidden sm:inline ${isActive ? 'text-white font-bold' : ''}`}>
                  {tab.label}
                </span>

                {/* Micro Badge */}
                {tab.badge && (
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold leading-tight"
                    style={{
                      backgroundColor: `${tab.badgeColor}22`,
                      color: tab.badgeColor,
                      border: `1px solid ${tab.badgeColor}44`,
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </motion.nav>

      {/* Map View Toggle Pill */}
      <motion.button
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.05 }}
        onClick={onToggleDrawer}
        title={isDrawerOpen ? 'Maximize Map' : 'Show Intelligence Drawer'}
        className="w-11 h-11 rounded-full bg-black/75 backdrop-blur-3xl border border-white/15 flex items-center justify-center text-white/80 hover:text-white active:scale-90 shadow-[0_16px_40px_rgba(0,0,0,0.6)] transition-all"
      >
        {isDrawerOpen ? <EyeOff className="w-4 h-4 text-sky-400" /> : <Eye className="w-4 h-4 text-white" />}
      </motion.button>
    </div>
  );
}
