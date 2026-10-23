'use client';

import React from 'react';
import { 
  Home, 
  AlertCircle, 
  Clock, 
  MapPin, 
  Navigation, 
  ShieldAlert, 
  CheckCircle,
  Radio
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { IsolatedVillage } from '../types';

interface IsolationRiskEngineProps {
  villages: IsolatedVillage[];
  onSelectLocation?: (coords: [number, number]) => void;
}

export const IsolationRiskEngine: React.FC<IsolationRiskEngineProps> = ({
  villages,
  onSelectLocation,
}) => {
  return (
    <div className="arcgis-widget">
      <div className="arcgis-widget-header">
        <div className="arcgis-widget-title">
          <Navigation className="w-3.5 h-3.5 text-[#2dd36f] animate-pulse" />
          <span>Valhalla Disaster Isolation & Evacuation Routing Engine</span>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/80 text-[#eb445a] border border-red-800">
          {villages.filter((v) => v.isolation_probability >= 0.7).length} Critically Isolated Hamlets
        </span>
      </div>

      {/* Villages Grid / Table */}
      <div className="p-3.5 grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {villages.map((vil) => {
          const isCritical = vil.isolation_probability >= 0.75;
          const isHigh = vil.isolation_probability >= 0.5 && vil.isolation_probability < 0.75;

          return (
            <div
              key={vil.id}
              className={`p-3 rounded border transition-all ${
                isCritical
                  ? 'bg-red-950/20 border-red-800/60 hover:border-red-500'
                  : isHigh
                  ? 'bg-amber-950/20 border-amber-800/60 hover:border-amber-500'
                  : 'bg-[#121820] border-[#283749] hover:border-slate-500'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                    {vil.name}
                    <span className="text-[10px] font-normal text-slate-400">
                      ({vil.district})
                    </span>
                  </h4>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>Pop: <strong>{formatNumber(vil.population)}</strong></span>
                    <span>•</span>
                    <span>Elev: <strong>{vil.elevation_m}m</strong></span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-mono text-xs font-black ${
                      isCritical ? 'text-[#eb445a]' : isHigh ? 'text-[#ff9800]' : 'text-[#00e5ff]'
                    }`}
                  >
                    {Math.round(vil.isolation_probability * 100)}%
                  </span>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                    Cutoff Risk
                  </span>
                </div>
              </div>

              {/* Status details */}
              <div className="grid grid-cols-2 gap-1.5 bg-[#16202c] p-2 rounded text-[10px] my-2">
                <div>
                  <span className="text-slate-400 block">Primary Severed Arterial</span>
                  <strong className="text-white truncate block">{vil.primary_access_road || vil.blocked_road}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Supplies Remaining</span>
                  <strong
                    className={
                      vil.food_supplies_hrs <= 24
                        ? 'text-[#eb445a] font-mono'
                        : 'text-[#ff9800] font-mono'
                    }
                  >
                    {vil.food_supplies_hrs} Hours
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] pt-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-[#0079c1]" />
                  <span>Bypass: <strong>{vil.backup_route_status || vil.recommended_bypass}</strong></span>
                </span>

                {onSelectLocation && (
                  <button
                    onClick={() => onSelectLocation(vil.coordinates)}
                    className="text-[#0096eb] hover:text-white font-bold flex items-center gap-1 transition-all"
                  >
                    <span>Inspect On Web Map</span>
                    <MapPin className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
