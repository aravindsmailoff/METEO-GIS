'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Navigation2, Layers, Crosshair, ZoomIn, ZoomOut, AlertOctagon, Waves, Home } from 'lucide-react';

let L: typeof import('leaflet') | null = null;

const HOTSPOTS = [
  { lat: 27.238, lng: 88.502, name: 'Singtam', rain: '92.4 mm/h', status: 'CRITICAL', color: '#ef4444' },
  { lat: 27.178, lng: 88.527, name: 'Rangpo', rain: '78.2 mm/h', status: 'HIGH', color: '#ef4444' },
  { lat: 27.328, lng: 88.612, name: 'Gangtok', rain: '64.0 mm/h', status: 'ALERT', color: '#f97316' },
  { lat: 27.193, lng: 88.378, name: 'Namchi', rain: '48.5 mm/h', status: 'MODERATE', color: '#eab308' },
  { lat: 27.595, lng: 88.480, name: 'Mangan', rain: '38.1 mm/h', status: 'WATCH', color: '#38bdf8' },
];

const DAMS = [
  { lat: 27.290, lng: 88.480, name: 'Teesta-V Dam', fill: '91.4%', gates: '3 Gates Open', color: '#ef4444' },
  { lat: 27.410, lng: 88.310, name: 'Rathong-Chu HEP', fill: '74.0%', gates: '1 Gate Open', color: '#f97316' },
  { lat: 27.350, lng: 88.510, name: 'Dikchu Dam', fill: '58.2%', gates: 'Gates Closed', color: '#eab308' },
];

const SHELTERS = [
  { lat: 27.225, lng: 88.495, name: 'Singtam Govt. Camp', capacity: '340 / 500 beds', color: '#22c55e' },
  { lat: 27.182, lng: 88.540, name: 'Rangpo Relief Hall', capacity: '190 / 300 beds', color: '#22c55e' },
];

export function RainMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'rain' | 'dams' | 'shelters'>('all');
  const [isLocating, setIsLocating] = useState(false);
  const layersGroupRef = useRef<import('leaflet').LayerGroup | null>(null);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    import('leaflet').then((LModule) => {
      L = LModule.default;

      if (!containerRef.current) return;
      if ((containerRef.current as any)._leaflet_id) {
        (containerRef.current as any)._leaflet_id = null;
      }

      // Initialize Apple Dark Map
      const map = L.map(containerRef.current, {
        center: [27.28, 88.48],
        zoom: 11,
        zoomControl: false,
        attributionControl: false,
      });

      // CartoDB Dark Base Layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        subdomains: 'abcd',
      }).addTo(map);

      // Create Group for markers
      const layersGroup = L.layerGroup().addTo(map);
      layersGroupRef.current = layersGroup;
      mapRef.current = map;

      renderMarkers('all');
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (containerRef.current && (containerRef.current as any)._leaflet_id) {
        (containerRef.current as any)._leaflet_id = null;
      }
    };
  }, []);

  const renderMarkers = (filter: 'all' | 'rain' | 'dams' | 'shelters') => {
    if (!L || !layersGroupRef.current) return;
    layersGroupRef.current.clearLayers();

    // 1. Rain Hotspots with Pulsing Radar Rings
    if (filter === 'all' || filter === 'rain') {
      HOTSPOTS.forEach((h) => {
        const icon = L!.divIcon({
          className: 'apple-map-marker',
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
              <span style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: ${h.color}33; animation: apple-sonar-wave 2s infinite;"></span>
              <div style="position: relative; z-index: 2; padding: 4px 8px; border-radius: 999px; background: rgba(0,0,0,0.85); border: 1px solid ${h.color}; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 14px rgba(0,0,0,0.6);">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: ${h.color};"></span>
                <span style="color: #fff; font-size: 10px; font-weight: 700;">${h.name}</span>
                <span style="color: ${h.color}; font-size: 9px; font-weight: 800; font-family: monospace;">${h.rain}</span>
              </div>
            </div>
          `,
          iconSize: [110, 40],
          iconAnchor: [55, 20],
        });

        const marker = L!.marker([h.lat, h.lng], { icon });
        marker.bindPopup(`
          <div style="padding: 12px; min-width: 170px;">
            <div style="font-size: 13px; font-weight: 800; color: #fff;">${h.name} Hotspot</div>
            <div style="font-size: 11px; color: ${h.color}; font-weight: 700; margin-top: 2px;">${h.status} • ${h.rain}</div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.6); margin-top: 6px;">Flash flood probability: 96%</div>
          </div>
        `);
        layersGroupRef.current?.addLayer(marker);
      });
    }

    // 2. Dam Markers with Reservoir Badges
    if (filter === 'all' || filter === 'dams') {
      DAMS.forEach((d) => {
        const icon = L!.divIcon({
          className: 'apple-dam-marker',
          html: `
            <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
              <div style="padding: 5px 9px; border-radius: 12px; background: rgba(18, 18, 24, 0.92); border: 1px solid ${d.color}; display: flex; align-items: center; gap: 6px; box-shadow: 0 6px 18px rgba(0,0,0,0.7);">
                <span style="color: #38bdf8; font-size: 12px;">🌊</span>
                <div>
                  <div style="color: #fff; font-size: 10px; font-weight: 800; line-height: 1;">${d.name}</div>
                  <div style="color: ${d.color}; font-size: 9px; font-weight: 800; font-family: monospace; margin-top: 2px;">${d.fill} • ${d.gates}</div>
                </div>
              </div>
            </div>
          `,
          iconSize: [140, 44],
          iconAnchor: [70, 22],
        });

        const marker = L!.marker([d.lat, d.lng], { icon });
        marker.bindPopup(`
          <div style="padding: 12px; min-width: 180px;">
            <div style="font-size: 13px; font-weight: 800; color: #fff;">${d.name}</div>
            <div style="font-size: 11px; color: ${d.color}; font-weight: 700; margin-top: 2px;">${d.fill} Capacity • ${d.gates}</div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.7); margin-top: 6px;">Downstream warning active in Teesta riverbed.</div>
          </div>
        `);
        layersGroupRef.current?.addLayer(marker);
      });
    }

    // 3. Shelter Markers
    if (filter === 'all' || filter === 'shelters') {
      SHELTERS.forEach((s) => {
        const icon = L!.divIcon({
          className: 'apple-shelter-marker',
          html: `
            <div style="display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 999px; background: rgba(0,0,0,0.85); border: 1px solid #22c55e; box-shadow: 0 4px 14px rgba(0,0,0,0.5);">
              <span style="color: #22c55e; font-size: 10px;">🏠</span>
              <span style="color: #fff; font-size: 10px; font-weight: 700;">${s.name}</span>
            </div>
          `,
          iconSize: [130, 30],
          iconAnchor: [65, 15],
        });

        const marker = L!.marker([s.lat, s.lng], { icon });
        marker.bindPopup(`
          <div style="padding: 10px;">
            <div style="font-size: 12px; font-weight: 800; color: #fff;">${s.name}</div>
            <div style="font-size: 10px; color: #22c55e; font-weight: 700; margin-top: 2px;">Available: ${s.capacity}</div>
          </div>
        `);
        layersGroupRef.current?.addLayer(marker);
      });
    }
  };

  const handleFilterChange = (filter: 'all' | 'rain' | 'dams' | 'shelters') => {
    setActiveFilter(filter);
    renderMarkers(filter);
  };

  const handleLocateMe = () => {
    if (!mapRef.current) return;
    setIsLocating(true);
    mapRef.current.flyTo([27.238, 88.502], 13, { duration: 1.5 });
    setTimeout(() => setIsLocating(false), 1500);
  };

  const handleZoom = (delta: number) => {
    if (!mapRef.current) return;
    mapRef.current.setZoom(mapRef.current.getZoom() + delta);
  };

  return (
    <div className="relative w-full h-full apple-map-canvas">
      <div ref={containerRef} className="w-full h-full" />

      {/* Floating Apple Map Control Bar (Top Left) */}
      <div className="absolute top-20 left-4 z-[100] flex flex-col gap-2 pointer-events-auto">
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/75 backdrop-blur-3xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {(['all', 'rain', 'dams', 'shelters'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => handleFilterChange(filter)}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold capitalize transition-all ${
                activeFilter === filter
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Floating Map Navigation Controls (Top Right) */}
      <div className="absolute top-20 right-4 z-[100] flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={handleLocateMe}
          title="Recenter Location"
          className="w-10 h-10 rounded-full bg-black/75 backdrop-blur-3xl border border-white/15 flex items-center justify-center text-white/80 hover:text-white active:scale-95 shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-all"
        >
          <Crosshair className={`w-4 h-4 ${isLocating ? 'text-sky-400 animate-spin' : ''}`} />
        </button>

        <div className="flex flex-col rounded-2xl bg-black/75 backdrop-blur-3xl border border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-hidden">
          <button
            onClick={() => handleZoom(1)}
            className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white active:bg-white/10 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-full h-px bg-white/10" />
          <button
            onClick={() => handleZoom(-1)}
            className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white active:bg-white/10 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
