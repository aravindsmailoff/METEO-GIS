'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  Layers, 
  Map as MapIcon, 
  Eye, 
  EyeOff, 
  Radio, 
  CloudRain, 
  CloudLightning, 
  Plane, 
  Crosshair, 
  Maximize2, 
  RotateCcw,
  Zap,
  Info
} from 'lucide-react';
import { 
  ConvectiveStormCell, 
  DwrRadarStation, 
  ImdAwsStation, 
  CHENNAI_DWR_NETWORK,
  AVIATION_TERMINAL_PROFILE 
} from '../data/convectiveData';

interface ConvectiveRadarMapProps {
  cells: ConvectiveStormCell[];
  selectedCell: ConvectiveStormCell | null;
  onSelectCell: (cell: ConvectiveStormCell) => void;
  radarStations: DwrRadarStation[];
  awsStations: ImdAwsStation[];
  leadTimeHours: number;
  heightClass?: string;
}

export const ConvectiveRadarMap: React.FC<ConvectiveRadarMapProps> = ({
  cells,
  selectedCell,
  onSelectCell,
  radarStations,
  awsStations,
  leadTimeHours,
  heightClass = 'h-full',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupsRef = useRef<Record<string, any>>({});

  // Basemap style - Including ISRO Bhuvan
  const [baseMap, setBaseMap] = useState<'dark' | 'bhuvan_sat' | 'bhuvan_2d' | 'bhuvan_hybrid' | 'satellite' | 'topo'>('dark');

  // Layer toggles
  const [showRadarReflectivity, setShowRadarReflectivity] = useState(true);
  const [showDwrRings, setShowDwrRings] = useState(true);
  const [showMotionVectors, setShowMotionVectors] = useState(true);
  const [showAwsStations, setShowAwsStations] = useState(true);
  const [showAviationTma, setShowAviationTma] = useState(true);
  const [showBhuvanMosdac, setShowBhuvanMosdac] = useState(true); // ISRO MOSDAC INSAT-3DR TIR-1 Glaciation Layer
  const [show1to3kmGrid, setShow1to3kmGrid] = useState(false);

  // Inspector & mouse coords
  const [cursorCoords, setCursorCoords] = useState<{ lat: string; lng: string }>({
    lat: '13.0827',
    lng: '80.2707',
  });

  // Dynamic Point Inspection (Click anywhere)
  const [inspectedPoint, setInspectedPoint] = useState<any | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      if (!document.getElementById('leaflet-css-link')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css-link';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Center on Chennai & North Tamil Nadu Coastal Radar Belt
      const map = L.map(mapContainerRef.current, {
        center: [13.0827, 80.2000],
        zoom: 9.0,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Basemaps
      const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        minZoom: 6,
      });

      // ISRO Bhuvan High-Resolution Satellite & CartoSat style layer
      const bhuvanSatLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        minZoom: 6,
        attribution: 'ISRO Bhuvan / NRSC LISS-IV & CartoSat Imagery',
      });

      // ISRO Bhuvan 2D Terrain & National Boundary Layer
      const bhuvan2dLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        minZoom: 6,
        attribution: 'ISRO Bhuvan Thematic 2D Services',
      });

      // ISRO Bhuvan Topographic Hybrid
      const bhuvanTopoLayer = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        minZoom: 6,
        attribution: 'ISRO Bhuvan DEM & Topo',
      });

      darkLayer.addTo(map);

      layerGroupsRef.current.baseLayers = {
        dark: darkLayer,
        bhuvan_sat: bhuvanSatLayer,
        bhuvan_2d: bhuvan2dLayer,
        bhuvan_hybrid: bhuvanTopoLayer,
        satellite: bhuvanSatLayer,
        topo: bhuvanTopoLayer,
      };

      layerGroupsRef.current.bhuvanMosdac = L.layerGroup().addTo(map);
      layerGroupsRef.current.dwrRings = L.layerGroup().addTo(map);
      layerGroupsRef.current.reflectivity = L.layerGroup().addTo(map);
      layerGroupsRef.current.cells = L.layerGroup().addTo(map);
      layerGroupsRef.current.vectors = L.layerGroup().addTo(map);
      layerGroupsRef.current.aws = L.layerGroup().addTo(map);
      layerGroupsRef.current.aviation = L.layerGroup().addTo(map);
      layerGroupsRef.current.grid = L.layerGroup().addTo(map);

      // Mousemove
      map.on('mousemove', (e: any) => {
        if (isMounted) {
          setCursorCoords({
            lat: e.latlng.lat.toFixed(4),
            lng: e.latlng.lng.toFixed(4),
          });
        }
      });

      // Map Click Inspector
      map.on('click', (e: any) => {
        const cLat = Number(e.latlng.lat.toFixed(4));
        const cLng = Number(e.latlng.lng.toFixed(4));
        
        // Calculate distance from nearest convective cell
        let nearestCell: any = null;
        let minDist = 999;
        cells.forEach((c) => {
          const d = Math.hypot(c.lat - cLat, c.lng - cLng) * 111;
          if (d < minDist) {
            minDist = d;
            nearestCell = c;
          }
        });

        const estDbz = nearestCell ? Math.max(10, Math.round(nearestCell.maxDbz - minDist * 1.8)) : 15;
        const estEtaMin = nearestCell ? Math.round(Math.max(5, minDist / (nearestCell.motionSpeedKmh / 60))) : 90;

        setInspectedPoint({
          lat: cLat,
          lng: cLng,
          estDbz,
          nearestCellName: nearestCell?.name || 'Isolated Convective Core',
          estEtaMin,
          distanceKm: Math.round(minDist),
          threatLevel: estDbz >= 55 ? 'SEVERE_HAIL' : estDbz >= 45 ? 'HEAVY_RAIN' : 'NORMAL',
        });
      });

      mapInstanceRef.current = map;
      renderLayers(L, map);

      setTimeout(() => {
        if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
      }, 250);
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Basemap
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupsRef.current.baseLayers) return;
    const map = mapInstanceRef.current;
    const layers = layerGroupsRef.current.baseLayers;

    Object.values(layers).forEach((l: any) => {
      if (map.hasLayer(l)) map.removeLayer(l);
    });

    if (layers[baseMap]) {
      layers[baseMap].addTo(map);
    }
  }, [baseMap]);

  // Re-render layers on state or lead time update
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import('leaflet').then((L) => {
      renderLayers(L.default, mapInstanceRef.current);
    });
  }, [
    cells,
    selectedCell,
    radarStations,
    awsStations,
    leadTimeHours,
    showRadarReflectivity,
    showDwrRings,
    showMotionVectors,
    showAwsStations,
    showAviationTma,
    showBhuvanMosdac,
    show1to3kmGrid,
  ]);

  // Fly to selected cell
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedCell) return;
    mapInstanceRef.current.flyTo([selectedCell.lat, selectedCell.lng], 9.5, {
      duration: 1.0,
    });
  }, [selectedCell]);

  const renderLayers = (L: any, map: any) => {
    const lg = layerGroupsRef.current;
    if (!lg) return;

    // Clear previous
    if (lg.bhuvanMosdac) lg.bhuvanMosdac.clearLayers();
    lg.dwrRings.clearLayers();
    lg.reflectivity.clearLayers();
    lg.cells.clearLayers();
    lg.vectors.clearLayers();
    lg.aws.clearLayers();
    lg.aviation.clearLayers();
    lg.grid.clearLayers();

    // 0. ISRO MOSDAC INSAT-3DR TIR-1 Glaciation Proxy Overlay
    if (showBhuvanMosdac) {
      cells.forEach((cell) => {
        if (cell.ciStatus === 'TRIGGERED' || cell.ciStatus === 'PRE_CONVECTIVE') {
          // Cloud-top cold anvil footprint (10.8 µm channel)
          L.circle([cell.lat, cell.lng], {
            radius: (cell.diameterKm * 1000) * 0.9,
            color: '#00e5ff',
            weight: 1.5,
            dashArray: '3, 6',
            fillColor: '#00e5ff',
            fillOpacity: 0.12,
          })
          .bindTooltip(`
            <div style="font-family: sans-serif; font-size: 10px; padding: 2px;">
              <strong style="color: #00e5ff;">ISRO MOSDAC INSAT-3DR TIR-1 (10.8 µm)</strong><br/>
              <span>Cloud-Top Temp: <strong>${cell.cloudTopTempC}°C</strong></span><br/>
              <span>15-min Cooling: <strong>${cell.coolingRateK15min} K/15m</strong> (Glaciating)</span>
            </div>
          `, { sticky: true })
          .addTo(lg.bhuvanMosdac);
        }
      });
    }

    // 1. DWR Coverage Range Rings
    if (showDwrRings) {
      radarStations.forEach((radar) => {
        // Outer Surveillance Radius (250 km / 100 km)
        L.circle([radar.lat, radar.lng], {
          radius: radar.maxRangeKm * 1000,
          color: radar.band === 'S-Band' ? '#00e5ff' : '#a855f7',
          weight: 1.5,
          dashArray: '4, 8',
          fillColor: radar.band === 'S-Band' ? '#00e5ff' : '#a855f7',
          fillOpacity: 0.03,
        }).addTo(lg.dwrRings);

        // Core Quantitative Precipitation Estimation (QPE) Ring (100 km / 40 km)
        L.circle([radar.lat, radar.lng], {
          radius: (radar.band === 'S-Band' ? 100 : 40) * 1000,
          color: radar.band === 'S-Band' ? '#00e5ff' : '#a855f7',
          weight: 1,
          dashArray: '2, 4',
          fill: false,
        }).addTo(lg.dwrRings);

        // Radar Dish Marker
        const radarIcon = L.divIcon({
          className: 'custom-radar-icon',
          html: `
            <div style="background: #0d1624; border: 2px solid ${radar.band === 'S-Band' ? '#00e5ff' : '#c084fc'}; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(0,229,255,0.4);">
              <span style="font-size: 11px;">📡</span>
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        L.marker([radar.lat, radar.lng], { icon: radarIcon })
          .bindPopup(`
            <div style="font-family: sans-serif; font-size: 11px; padding: 4px;">
              <strong style="color: #00e5ff;">${radar.name}</strong><br/>
              <span>Band: <strong>${radar.band}</strong> (${radar.frequencyGhz} GHz)</span><br/>
              <span>Operator: <strong>${radar.operator}</strong></span><br/>
              <span>Max Surveillance: <strong>${radar.maxRangeKm} km</strong></span><br/>
              <span style="color: #2dd36f;">Status: ${radar.status}</span>
            </div>
          `)
          .addTo(lg.dwrRings);
      });
    }

    // 2. Convective Storm Cells & pySTEPS Extrapolated Positions
    cells.forEach((cell) => {
      // Calculate extrapolated position based on leadTimeHours
      // Motion vector: speed (km/h) along bearing (deg)
      const distKm = cell.motionSpeedKmh * leadTimeHours;
      const rad = (cell.motionDirectionDeg * Math.PI) / 180;
      const dLat = (distKm * Math.cos(rad)) / 111.0;
      const dLng = (distKm * Math.sin(rad)) / (111.0 * Math.cos((cell.lat * Math.PI) / 180));

      const curLat = cell.lat + dLat;
      const curLng = cell.lng + dLng;

      // Color based on dBZ
      const dbz = cell.maxDbz;
      const coreColor = dbz >= 60 ? '#d946ef' : dbz >= 55 ? '#ef4444' : dbz >= 45 ? '#f97316' : '#22c55e';

      // Reflectivity Footprint Swath (0-6h loop)
      if (showRadarReflectivity) {
        // Outer precipitation echo (35 dBZ)
        L.circle([curLat, curLng], {
          radius: (cell.diameterKm * 1000) / 2,
          color: coreColor,
          weight: 1.5,
          fillColor: coreColor,
          fillOpacity: 0.22,
        }).addTo(lg.reflectivity);

        // Severe Core (55+ dBZ)
        L.circle([curLat, curLng], {
          radius: (cell.diameterKm * 1000) / 4,
          color: coreColor,
          weight: 2,
          fillColor: coreColor,
          fillOpacity: 0.55,
        }).addTo(lg.reflectivity);
      }

      // Storm Cell Interactive Icon Marker
      const isSel = selectedCell?.id === cell.id;
      const cellIcon = L.divIcon({
        className: 'custom-cell-icon',
        html: `
          <div style="background: ${isSel ? '#ffffff' : coreColor}; border: 2px solid #ffffff; border-radius: 50%; width: 30px; height: 30px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 0 14px ${coreColor}; cursor: pointer;">
            <span style="font-size: 10px; font-weight: 900; color: ${isSel ? '#000000' : '#ffffff'}; font-family: monospace;">${Math.round(cell.maxDbz)}</span>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const marker = L.marker([curLat, curLng], { icon: cellIcon }).addTo(lg.cells);
      marker.on('click', () => onSelectCell(cell));

      // Motion Vector Arrow (pySTEPS Lagrangian Extrapolation)
      if (showMotionVectors) {
        // Project 4 trajectory steps (+15m, +30m, +45m, +60m)
        const trajCoords: [number, number][] = [
          [curLat, curLng],
          ...cell.trajectoryPoints.map(([tLat, tLng]) => [tLat + dLat, tLng + dLng] as [number, number]),
        ];

        L.polyline(trajCoords, {
          color: coreColor,
          weight: 2.5,
          dashArray: '5, 5',
          opacity: 0.85,
        }).addTo(lg.vectors);

        // Arrow head at end of vector
        const endPt = trajCoords[trajCoords.length - 1];
        L.circleMarker(endPt, {
          radius: 4,
          color: coreColor,
          fillColor: '#ffffff',
          fillOpacity: 1,
        }).addTo(lg.vectors);
      }
    });

    // 3. Named Beneficiary: Chennai International Airport (MAA / VOMM)
    if (showAviationTma) {
      const airport = AVIATION_TERMINAL_PROFILE;

      // 15 km Terminal Manoeuvring Area (TMA) warning zone
      L.circle([airport.lat, airport.lng], {
        radius: 15000,
        color: '#f59e0b',
        weight: 1.5,
        dashArray: '6, 6',
        fillColor: '#f59e0b',
        fillOpacity: 0.05,
      }).addTo(lg.aviation);

      // Runway 07/25 alignment vector
      L.polyline([
        [airport.lat - 0.012, airport.lng - 0.024],
        [airport.lat + 0.012, airport.lng + 0.024],
      ], {
        color: '#ffffff',
        weight: 4,
      }).addTo(lg.aviation);

      const airportIcon = L.divIcon({
        className: 'custom-airport-icon',
        html: `
          <div style="background: #1e293b; border: 2px solid #f59e0b; border-radius: 6px; padding: 3px 6px; display: flex; align-items: center; gap: 4px; box-shadow: 0 0 12px rgba(245,158,11,0.5); font-family: monospace; font-size: 10px; color: #ffffff; font-weight: bold; cursor: pointer;">
            <span>✈️</span>
            <span>MAA / VOMM</span>
          </div>
        `,
        iconSize: [88, 26],
        iconAnchor: [44, 13],
      });

      L.marker([airport.lat, airport.lng], { icon: airportIcon })
        .bindPopup(`
          <div style="font-family: sans-serif; font-size: 11px; padding: 4px;">
            <strong style="color: #f59e0b;">Chennai International Airport (MAA / VOMM)</strong><br/>
            <span>Beneficiary: <strong>Meteorological Watch Office (MWO Chennai)</strong></span><br/>
            <span>Runway: <strong>07/25 (3,658m)</strong></span><br/>
            <span style="color: #ef4444; font-weight: bold;">SIGMET: SEV TS / HAIL ACTIVE</span><br/>
            <span>Arrival Countdown: <strong>${Math.round(airport.stormArrivalCountdownSec / 60)} min</strong></span>
          </div>
        `)
        .addTo(lg.aviation);
    }

    // 4. Ground Automatic Weather Stations (AWS)
    if (showAwsStations) {
      awsStations.forEach((aws) => {
        const awsIcon = L.divIcon({
          className: 'custom-aws-icon',
          html: `
            <div style="background: ${aws.isSpikeDetected ? '#7f1d1d' : '#0f172a'}; border: 1.5px solid ${aws.isSpikeDetected ? '#ef4444' : '#38bdf8'}; border-radius: 4px; padding: 2px 4px; font-size: 9px; font-family: monospace; color: #ffffff; display: flex; align-items: center; gap: 2px; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">
              <span>${aws.isSpikeDetected ? '⚠️' : '📊'}</span>
              <span>${Math.round(aws.instantRateMmH)}mm/h</span>
            </div>
          `,
          iconSize: [64, 20],
          iconAnchor: [32, 10],
        });

        L.marker([aws.lat, aws.lng], { icon: awsIcon })
          .bindPopup(`
            <div style="font-family: sans-serif; font-size: 11px; padding: 4px;">
              <strong>${aws.name} (${aws.district})</strong><br/>
              <span>Instant Rate: <strong>${aws.instantRateMmH} mm/h</strong></span><br/>
              <span>Hourly Rain: <strong>${aws.hourlyRainMm} mm</strong></span><br/>
              <span>Wind Gust: <strong>${aws.windGustKts} kts</strong></span><br/>
              <span>Pressure: <strong>${aws.pressureHpa} hPa</strong></span><br/>
              <span style="color: #94a3b8; font-size: 9px;">Source: ${aws.lastUpdated}</span>
            </div>
          `)
          .addTo(lg.aws);
      });
    }
  };

  return (
    <div className={`w-full ${heightClass} relative overflow-hidden bg-[#0a0f18]`}>
      
      {/* 1. Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* 2. Top-Left: Radar & Extrapolation HUD Controls */}
      <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-[#0e1624]/90 backdrop-blur-md p-1.5 rounded-lg border border-[#1f2b3c] shadow-lg text-[10px]">
        
        {/* Basemap Toggle - ISRO Bhuvan First */}
        <select
          value={baseMap}
          onChange={(e: any) => setBaseMap(e.target.value)}
          className="bg-[#15202e] border border-[#23354c] rounded px-2 py-1 text-cyan-300 font-semibold focus:outline-none cursor-pointer text-[10px]"
        >
          <option value="dark">Dark Radar Canvas (NOAA/IMD)</option>
          <option value="bhuvan_sat">🇮🇳 ISRO Bhuvan Satellite (CartoSat)</option>
          <option value="bhuvan_2d">🇮🇳 ISRO Bhuvan 2D Terrain</option>
          <option value="bhuvan_hybrid">🇮🇳 ISRO Bhuvan Topo Hybrid</option>
        </select>

        <div className="h-4 w-[1px] bg-[#1f2b3c]" />

        {/* Layer Toggles */}
        <button
          onClick={() => setShowBhuvanMosdac(!showBhuvanMosdac)}
          className={`px-2 py-1 rounded font-semibold transition-all flex items-center gap-1 ${
            showBhuvanMosdac ? 'bg-cyan-950 text-[#00e5ff] border border-cyan-600 shadow-sm' : 'bg-[#15202e] text-slate-400'
          }`}
          title="ISRO MOSDAC INSAT-3DR Glaciation Proxy Overlay"
        >
          <span>🛰️</span>
          <span>MOSDAC INSAT-3DR</span>
        </button>

        <button
          onClick={() => setShowDwrRings(!showDwrRings)}
          className={`px-2 py-1 rounded font-semibold transition-all flex items-center gap-1 ${
            showDwrRings ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' : 'bg-[#15202e] text-slate-400'
          }`}
        >
          <Radio className="w-3 h-3" />
          <span>DWR Rings</span>
        </button>

        <button
          onClick={() => setShowMotionVectors(!showMotionVectors)}
          className={`px-2 py-1 rounded font-semibold transition-all flex items-center gap-1 ${
            showMotionVectors ? 'bg-purple-950 text-purple-300 border border-purple-700' : 'bg-[#15202e] text-slate-400'
          }`}
        >
          <Crosshair className="w-3 h-3" />
          <span>Vectors</span>
        </button>

        <button
          onClick={() => setShowAwsStations(!showAwsStations)}
          className={`px-2 py-1 rounded font-semibold transition-all flex items-center gap-1 ${
            showAwsStations ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-[#15202e] text-slate-400'
          }`}
        >
          <CloudRain className="w-3 h-3" />
          <span>AWS Stations</span>
        </button>

        <button
          onClick={() => setShowAviationTma(!showAviationTma)}
          className={`px-2 py-1 rounded font-semibold transition-all flex items-center gap-1 ${
            showAviationTma ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'bg-[#15202e] text-slate-400'
          }`}
        >
          <Plane className="w-3 h-3" />
          <span>MAA Runway</span>
        </button>

      </div>

      {/* 3. Bottom-Left: Standard IMD / NOAA Radar Reflectivity dBZ Color Ramp */}
      <div className="absolute bottom-2 left-2 z-20 bg-[#0e1624]/90 backdrop-blur-md p-2 rounded-lg border border-[#1f2b3c] shadow-lg flex flex-col gap-1 text-[9px]">
        <div className="flex items-center justify-between text-slate-300 font-bold uppercase text-[8.5px]">
          <span>Radar Reflectivity (dBZ)</span>
          <span className="text-cyan-400 font-mono">0.5° PPI</span>
        </div>
        <div className="flex items-center gap-0.5">
          <div className="w-5 h-2.5 bg-[#00e5ff] rounded-xs" title="15-25 dBZ Light" />
          <div className="w-5 h-2.5 bg-[#22c55e] rounded-xs" title="25-35 dBZ Moderate" />
          <div className="w-5 h-2.5 bg-[#eab308] rounded-xs" title="35-45 dBZ Heavy" />
          <div className="w-5 h-2.5 bg-[#f97316] rounded-xs" title="45-50 dBZ Very Heavy" />
          <div className="w-5 h-2.5 bg-[#ef4444] rounded-xs" title="50-55 dBZ Hail Threat" />
          <div className="w-5 h-2.5 bg-[#d946ef] rounded-xs" title="55-65 dBZ Severe Hail Core" />
          <div className="w-5 h-2.5 bg-[#ffffff] rounded-xs" title=">65 dBZ Cloudburst" />
        </div>
        <div className="flex justify-between text-[8px] font-mono text-slate-400">
          <span>15</span>
          <span>35</span>
          <span>50</span>
          <span>65+</span>
        </div>
      </div>

      {/* 4. Bottom-Center: Click Inspector HUD */}
      {inspectedPoint && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 bg-[#0e1624]/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/60 shadow-xl flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-bold text-white uppercase text-[10px]">
              Inspected Coord: {inspectedPoint.lat}°N, {inspectedPoint.lng}°E
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px]">
            <span>Reflectivity: <strong className="text-purple-300 font-mono">{inspectedPoint.estDbz} dBZ</strong></span>
            <span>•</span>
            <span>Storm Core: <strong className="text-slate-200">{inspectedPoint.nearestCellName}</strong></span>
            <span>•</span>
            <span>ETA to Intercept: <strong className="text-cyan-300 font-mono">{inspectedPoint.estEtaMin} mins</strong></span>
          </div>

          <button
            onClick={() => setInspectedPoint(null)}
            className="text-[10px] text-slate-400 hover:text-white ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 5. Bottom-Right Cursor Tracker */}
      <div className="absolute bottom-2 right-12 z-20 bg-[#0e1624]/85 backdrop-blur-md px-2 py-1 rounded border border-[#1f2b3c] font-mono text-[9px] text-slate-400">
        Lat: {cursorCoords.lat}°N | Lng: {cursorCoords.lng}°E | Grid: 1–3km
      </div>

    </div>
  );
};
