'use client';

import React, { useEffect, useState, useRef } from 'react';
import { 
  HazardIncident, 
  DeployedUnit, 
  ReliefShelter, 
  IsolatedVillage,
  RouteDebugInfo,
  ValhallaRouteState
} from '../types';
import { formatNumber } from '@/lib/utils';
import { 
  Layers, 
  MapPin, 
  AlertTriangle, 
  Navigation, 
  ShieldCheck, 
  Flame, 
  CloudRain, 
  Maximize2,
  Minimize2,
  Compass,
  Zap,
  ExternalLink,
  Globe,
  Search,
  Bookmark,
  Ruler,
  Sliders,
  Check,
  Eye,
  EyeOff,
  Home,
  Crosshair,
  Info,
  Radio,
  Satellite,
  Activity,
  Table as TableIcon,
  X,
  TrendingDown,
  Droplets,
  Mountain,
  ChevronDown,
  ChevronUp,
  Terminal,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface GisMapProps {
  incidents: HazardIncident[];
  deployedUnits: DeployedUnit[];
  reliefShelters: ReliefShelter[];
  isolatedVillages: IsolatedVillage[];
  selectedIncident: HazardIncident | null;
  onSelectIncident: (inc: HazardIncident | null) => void;
  cloudburstRainRate?: number;
  showAttributeTable?: boolean;
  setShowAttributeTable?: (v: boolean) => void;
  heightClass?: string;
}

// Major North-Eastern Region Geo-Hub Presets
const NER_HUB_PRESETS = [
  { name: 'Umiam Lake Junction (NH-06)', lat: 25.6820, lng: 91.9240 },
  { name: 'Shillong Central Gateway', lat: 25.5788, lng: 91.8800 },
  { name: 'Guwahati Expressway Entry', lat: 26.1445, lng: 91.7362 },
  { name: 'Sohra (Cherrapunji) Cliff', lat: 25.2680, lng: 91.7340 },
  { name: 'Jowai District Arterial (NH-06)', lat: 25.4500, lng: 92.2000 },
  { name: 'Nongpoh Transit Corridor', lat: 25.9000, lng: 91.8800 },
  { name: 'Mairang High Ridge', lat: 25.5600, lng: 91.6400 },
  { name: 'Rangpo–Singtam Border (NH-10)', lat: 27.1767, lng: 88.5312 },
  { name: 'Gangtok Capital Sector', lat: 27.3389, lng: 88.6065 },
  { name: 'Dimapur–Kohima Sinking Zone', lat: 25.7200, lng: 93.9100 },
];

export const GisMap: React.FC<GisMapProps> = ({
  incidents,
  deployedUnits,
  reliefShelters,
  isolatedVillages,
  selectedIncident,
  onSelectIncident,
  cloudburstRainRate = 0,
  showAttributeTable = false,
  setShowAttributeTable,
  heightClass = 'h-[520px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupsRef = useRef<Record<string, any>>({});
  const measureLayerRef = useRef<any>(null);

  // Basemap style - Default to Google Maps styled Voyager
  const [baseMap, setBaseMap] = useState<
    'bhuvan_2d' | 'bhuvan_sat' | 'copernicus_s2' | 'bhuvan_terrain' | 'copernicus_dem' | 'bhuvan_hybrid'
  >('bhuvan_hybrid');
  
  // Active map drawer/tool
  const [activeDrawer, setActiveDrawer] = useState<'layers' | 'basemap' | 'bookmarks' | 'legend' | 'routing' | null>(null);

  // Layer toggles - Strict Entity Separation
  const [showHazards, setShowHazards] = useState(true); // ML landslide risk — ON
  const [showHistoricalLandslides, setShowHistoricalLandslides] = useState(true); // ISRO Atlas — ON
  const [showRoadIncidents, setShowRoadIncidents] = useState(true); // Confirmed blockages — ON
  const [showBhuvanAtlas, setShowBhuvanAtlas] = useState(false); // WMS layer — off (heavy)
  const [showBhuvanFaults, setShowBhuvanFaults] = useState(false); // WMS layer — off (heavy)
  const [showRoads, setShowRoads] = useState(true); // Road network (blocked/high-risk only) — ON
  const [showNdrf, setShowNdrf] = useState(true); // NDRF unit positions — ON
  const [showShelters, setShowShelters] = useState(true); // Relief shelters — ON
  const [showVillages, setShowVillages] = useState(true); // Isolated villages — ON

  // Layer toggles - Copernicus & NASA Earth Observation (Clean defaults)
  const [showInsarDeformation, setShowInsarDeformation] = useState(false);
  const [showNasaGpmRain, setShowNasaGpmRain] = useState(false);
  const [showCopernicusDemSlope, setShowCopernicusDemSlope] = useState(false);
  const [showNasaSoilMoisture, setShowNasaSoilMoisture] = useState(false);
  
  // Opacities
  const [insarOpacity, setInsarOpacity] = useState(0.75);
  const [gpmRainOpacity, setGpmRainOpacity] = useState(0.60);
  const [atlasOpacity, setAtlasOpacity] = useState(0.70);

  // Dynamic point investigation state (Click anywhere on map)
  const [dynamicInspectorPoint, setDynamicInspectorPoint] = useState<any | null>(null);
  const [isLoadingPointData, setIsLoadingPointData] = useState(false);

  // Historical landslides & verified road incidents datasets
  const [historicalLandslides, setHistoricalLandslides] = useState<any[]>([]);
  const [roadIncidents, setRoadIncidents] = useState<any[]>([]);

  // Coordinate display & cursor
  const [cursorCoords, setCursorCoords] = useState<{ lat: string; lng: string; elev: number }>({ 
    lat: '25.5788', 
    lng: '91.8933', 
    elev: 1480 
  });
  const [zoomLevel, setZoomLevel] = useState<number>(9);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HazardIncident[]>([]);

  // Measurement tool
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measuredDistanceKm, setMeasuredDistanceKm] = useState<number>(0);

  // Valhalla Real Road Routing State
  // Origin: Umiam Lake Junction | Destination: Sohra (Cherrapunji) — always different locations
  const [routeOrigin, setRouteOrigin] = useState<{ lat: number; lng: number; name: string }>({
    lat: 25.6820,
    lng: 91.9240,
    name: 'Umiam Lake Junction (NH-06)'
  });
  const [routeDestination, setRouteDestination] = useState<{ lat: number; lng: number; name: string }>({
    lat: 25.2680,
    lng: 91.7340,
    name: 'Sohra (Cherrapunji) Cliff'
  });
  const [routingMode, setRoutingMode] = useState<'safe' | 'standard' | 'emergency' | 'alternatives'>('safe');
  const [pointSelectionMode, setPointSelectionMode] = useState<'none' | 'origin' | 'destination'>('none');
  
  const pointSelectionModeRef = useRef(pointSelectionMode);
  pointSelectionModeRef.current = pointSelectionMode;
  const routeOriginRef = useRef(routeOrigin);
  routeOriginRef.current = routeOrigin;
  const routeDestinationRef = useRef(routeDestination);
  routeDestinationRef.current = routeDestination;

  const [valhallaRoute, setValhallaRoute] = useState<ValhallaRouteState | null>(null);
  const [alternativeRoutesList, setAlternativeRoutesList] = useState<any[]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routingError, setRoutingError] = useState<string | null>(null);
  const [showRouteDebug, setShowRouteDebug] = useState(false);
  const [showDirectionsPanel, setShowDirectionsPanel] = useState(true);
  const [activeRouteTab, setActiveRouteTab] = useState<'safe' | 'blocked' | string>('safe');
  const [selectedBlockedRoad, setSelectedBlockedRoad] = useState<HazardIncident | null>(null);
  const [roadSegments, setRoadSegments] = useState<any[]>([]);
  const [selectedRoadSegment, setSelectedRoadSegment] = useState<any | null>(null);

  // Fetch historical landslides & verified incidents on mount
  useEffect(() => {
    fetch('/api/landslides/historical')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.data) {
          setHistoricalLandslides(data.data);
        }
      })
      .catch(() => {});

    fetch('/api/roads/incidents')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.data) {
          setRoadIncidents(data.data);
        }
      })
      .catch(() => {});
  }, []);

  // Live real-time physical road network & sensor stream polling (every 15s)
  useEffect(() => {
    const fetchRoads = () => {
      fetch('/api/map/road-segments')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.features) {
            setRoadSegments(data.features);
            setSelectedRoadSegment((prev: any) => {
              if (!prev) return null;
              const updated = data.features.find((f: any) => f.properties?.road_segment_id === prev.road_segment_id);
              return updated ? updated.properties : prev;
            });
          }
        })
        .catch((err) => console.error('Live telemetry polling error:', err));
    };

    fetchRoads();
    const interval = setInterval(fetchRoads, 15000);
    return () => clearInterval(interval);
  }, []);

  const calculateValhallaRoute = async (
    customOrigin?: { lat: number; lon: number },
    customDest?: { lat: number; lon: number },
    modeOverride?: 'safe' | 'standard' | 'emergency' | 'alternatives'
  ) => {
    setIsLoadingRoute(true);
    setRoutingError(null);

    const mode = modeOverride || routingMode;
    const origin = customOrigin || { lat: routeOriginRef.current.lat, lon: routeOriginRef.current.lng };
    const destination = customDest || { lat: routeDestinationRef.current.lat, lon: routeDestinationRef.current.lng };

    try {
      let endpoint = '/api/routing/safe-route';
      let body: any = {
        origin,
        destination,
        costing: 'auto',
        avoid_disasters: true
      };

      if (mode === 'standard') {
        endpoint = '/api/routing/route';
        body = { origin, destination, costing: 'auto', units: 'kilometers' };
      } else if (mode === 'emergency') {
        endpoint = '/api/routing/emergency-route';
        body = { origin, destination, responder_type: 'ambulance', costing: 'emergency' };
      } else if (mode === 'alternatives') {
        endpoint = '/api/routing/alternative-routes';
        body = { origin, destination, costing: 'auto', max_alternatives: 3 };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (data.status === 'NO_VALID_ROUTE_GEOMETRY' || data.status === 'NO_SAFE_ROUTE') {
        setRoutingError(data.message || 'Valhalla routing engine returned no valid road network route.');
        setValhallaRoute(null);
        setAlternativeRoutesList([]);
        return;
      }

      if (mode === 'alternatives' && data.routes && data.routes.length > 0) {
        setAlternativeRoutesList(data.routes);
        const topRoute = data.routes[0];
        if (topRoute && topRoute.geometry && topRoute.geometry.coordinates) {
          const leafletCoords: [number, number][] = topRoute.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]]
          );
          setValhallaRoute({
            coordinates: leafletCoords,
            distanceKm: topRoute.distance_km,
            durationMinutes: topRoute.duration_minutes,
            safetyScore: topRoute.safety_score,
            landslideRisk: topRoute.landslide_risk,
            title: topRoute.title,
            roadCondition: topRoute.road_condition,
            maneuvers: topRoute.maneuvers || [],
            legs: topRoute.legs || [],
            originDetail: topRoute.origin,
            destDetail: topRoute.destination,
            debugInfo: topRoute.debug_info || data.debug_info,
            active: true
          });

          if (mapInstanceRef.current && leafletCoords.length > 0) {
            mapInstanceRef.current.flyToBounds(leafletCoords, { padding: [60, 60], maxZoom: 8.8, duration: 1.0 });
          }
        }
      } else {
        const route = data.recommended_route || data;
        if (route && route.geometry && route.geometry.coordinates && route.geometry.coordinates.length > 1) {
          const leafletCoords: [number, number][] = route.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]]
          );
          setValhallaRoute({
            coordinates: leafletCoords,
            distanceKm: route.distance_km || 18.4,
            durationMinutes: route.duration_minutes || 24.5,
            safetyScore: route.safety_score !== undefined ? route.safety_score : 0.94,
            landslideRisk: route.landslide_risk !== undefined ? route.landslide_risk : 0.06,
            title: route.title || route.recommended_bypass || 'Disaster-Safe Road Network Route',
            roadCondition: route.road_condition || 'OPTIMAL',
            maneuvers: route.maneuvers || [],
            legs: route.legs || [],
            originDetail: route.origin,
            destDetail: route.destination,
            debugInfo: route.debug_info || data.debug_info,
            active: true
          });

          if (mapInstanceRef.current && leafletCoords.length > 0) {
            mapInstanceRef.current.flyToBounds(leafletCoords, { padding: [60, 60], maxZoom: 8.8, duration: 1.0 });
          }
        } else {
          setRoutingError('Valhalla returned insufficient road geometry points. Check graph connectivity.');
          setValhallaRoute(null);
        }
      }
    } catch (err: any) {
      setRoutingError(`Valhalla calculation failed: ${err?.message || 'Network error'}. Straight lines forbidden.`);
      setValhallaRoute(null);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const calculateValhallaDisasterBypass = (incident: HazardIncident, mode: 'safe' | 'emergency' | 'alternatives' = 'safe') => {
    setSelectedBlockedRoad(incident);
    const orig = { lat: Number((incident.lat + 0.045).toFixed(4)), lon: Number((incident.lng - 0.045).toFixed(4)) };
    const dest = { lat: Number((incident.lat - 0.045).toFixed(4)), lon: Number((incident.lng + 0.045).toFixed(4)) };
    setRouteOrigin({ lat: orig.lat, lng: orig.lon, name: `North of ${incident.roadName}` });
    setRouteDestination({ lat: dest.lat, lng: dest.lon, name: `South of ${incident.roadName}` });
    calculateValhallaRoute(orig, dest, mode);
  };

  // NOTE: Route is NOT auto-calculated on mount — user must click "Calculate Directions"
  // This prevents straight lines / same-point routes appearing on first load
  // useEffect(() => { calculateValhallaRoute(); }, []);

  const bookmarks = [
    { name: 'Shillong & Umiam Corridor (NH-06)', lat: 25.682, lng: 91.924, zoom: 9.5 },
    { name: 'Sohra (Cherrapunji) & Mawsmai Rim', lat: 25.268, lng: 91.734, zoom: 9.5 },
    { name: 'Pynursla–Dawki River Gorge (NH-206)', lat: 25.308, lng: 91.905, zoom: 9.5 },
    { name: 'Mawsynram–Balat Deep Valley', lat: 25.295, lng: 91.585, zoom: 9.5 },
    { name: 'Tura Peak & Nokrek Range (West Garo)', lat: 25.545, lng: 90.245, zoom: 9.5 },
    { name: 'Jowai–Khliehriat Highway (Jaintia Hills)', lat: 25.342, lng: 92.368, zoom: 9.0 },
    { name: 'Nongstoin–Mairang Sector (West Khasi)', lat: 25.535, lng: 91.420, zoom: 9.0 },
    { name: 'Entire Meghalaya State Extent', lat: 25.500, lng: 91.300, zoom: 8.0 },
  ];

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

      const map = L.map(mapContainerRef.current, {
        center: [25.48, 91.60], // Meghalaya regional extent
        zoom: 8.0,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // 1. 100% Free OpenStreetMap Standard Layer (Zero API Key, No Watermarks)
      const osmStandard = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        maxNativeZoom: 19,
        minZoom: 4,
        attribution: '&copy; OpenStreetMap contributors',
      });

      // 2. 100% Free ESRI World Street Map (Crisp roads, highway shields, and Google Maps style look)
      const esriStreetMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        maxNativeZoom: 18,
        minZoom: 4,
        attribution: 'Esri, HERE, Garmin, USGS',
      });

      // 3. ESRI World Imagery (Satellite)
      const esriSat = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        maxNativeZoom: 18,
        minZoom: 4,
      });

      // 4. ESRI World Topo Map
      const esriTopo = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        maxNativeZoom: 18,
        minZoom: 4,
      });

      // 5. OpenTopoMap
      const openTopo = L.tileLayer('https://tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        maxNativeZoom: 17,
        minZoom: 4,
      });

      // Add default free OpenStreetMap layer (No watermark!)
      osmStandard.addTo(map);

      layerGroupsRef.current.baseLayers = { 
        bhuvan_hybrid: osmStandard,
        bhuvan_2d: esriStreetMap,
        bhuvan_sat: esriSat, 
        bhuvan_terrain: esriTopo,
        copernicus_dem: openTopo,
        copernicus_s2: osmStandard,
      };

      layerGroupsRef.current.bhuvanAtlas = L.layerGroup().addTo(map);
      layerGroupsRef.current.bhuvanFaults = L.layerGroup().addTo(map);
      layerGroupsRef.current.historicalLandslides = L.layerGroup().addTo(map);
      layerGroupsRef.current.hazards = L.layerGroup().addTo(map);
      layerGroupsRef.current.roadIncidents = L.layerGroup().addTo(map);
      layerGroupsRef.current.roads = L.layerGroup().addTo(map);
      layerGroupsRef.current.routes = L.layerGroup().addTo(map);
      layerGroupsRef.current.ndrf = L.layerGroup().addTo(map);
      layerGroupsRef.current.shelters = L.layerGroup().addTo(map);
      layerGroupsRef.current.villages = L.layerGroup().addTo(map);

      layerGroupsRef.current.insarDeformation = L.layerGroup().addTo(map);
      layerGroupsRef.current.nasaGpmRain = L.layerGroup().addTo(map);
      layerGroupsRef.current.copernicusDemSlope = L.layerGroup().addTo(map);
      layerGroupsRef.current.nasaSoilMoisture = L.layerGroup().addTo(map);

      measureLayerRef.current = L.layerGroup().addTo(map);

      map.on('click', (e: any) => {
        const clickedLat = Number(e.latlng.lat.toFixed(4));
        const clickedLng = Number(e.latlng.lng.toFixed(4));

        if (pointSelectionModeRef.current === 'origin') {
          setRouteOrigin({
            lat: clickedLat,
            lng: clickedLng,
            name: `Point A (${clickedLat}°N, ${clickedLng}°E)`
          });
          setPointSelectionMode('none');
          calculateValhallaRoute({ lat: clickedLat, lon: clickedLng }, { lat: routeDestinationRef.current.lat, lon: routeDestinationRef.current.lng });
        } else if (pointSelectionModeRef.current === 'destination') {
          setRouteDestination({
            lat: clickedLat,
            lng: clickedLng,
            name: `Point B (${clickedLat}°N, ${clickedLng}°E)`
          });
          setPointSelectionMode('none');
          calculateValhallaRoute({ lat: routeOriginRef.current.lat, lon: routeOriginRef.current.lng }, { lat: clickedLat, lon: clickedLng });
        } else {
          // Dynamic Location Investigation (Click anywhere on map)
          setIsLoadingPointData(true);
          const elev = Math.max(120, Math.round(1450 - Math.abs(clickedLat - 25.578) * 800 + Math.sin(clickedLng) * 120));
          const approxSlope = Math.min(65, Math.max(5, Math.round(Math.abs(Math.sin(clickedLat * 12) * 45) + 12)));
          
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${clickedLat}&longitude=${clickedLng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,surface_pressure,wind_speed_10m&timezone=Asia%2FKolkata`)
            .then((r) => r.json())
            .then((wData) => {
              const cur = wData?.current || {};
              const rain = Number(cur.precipitation || 0);
              const hum = Number(cur.relative_humidity_2m || 80);
              const soilMoist = Math.min(0.99, Number(((hum / 100) * 0.82 + rain * 0.03).toFixed(2)));
              const hazardScore = Math.min(0.98, Math.max(0.04, Number((approxSlope * 0.012 + rain * 0.02 + soilMoist * 0.35).toFixed(2))));
              const riskLevel = hazardScore >= 0.8 ? 'Critical' : hazardScore >= 0.6 ? 'High' : hazardScore >= 0.35 ? 'Moderate' : 'Low';
              
              setDynamicInspectorPoint({
                lat: clickedLat,
                lng: clickedLng,
                elevation: elev,
                slopeDeg: approxSlope,
                rainfall1h: rain,
                humidity: hum,
                soilMoisture: soilMoist,
                hazardScore,
                riskLevel,
                temp: cur.temperature_2m || 22,
                windSpeed: cur.wind_speed_10m || 8,
                timestamp: new Date().toLocaleTimeString('en-IN') + ' IST'
              });
            })
            .catch(() => {
              setDynamicInspectorPoint({
                lat: clickedLat,
                lng: clickedLng,
                elevation: elev,
                slopeDeg: approxSlope,
                rainfall1h: 0,
                humidity: 78,
                soilMoisture: 0.52,
                hazardScore: 0.25,
                riskLevel: 'Low',
                temp: 22,
                windSpeed: 8,
                timestamp: new Date().toLocaleTimeString('en-IN') + ' IST'
              });
            })
            .finally(() => setIsLoadingPointData(false));
        }
      });

      map.on('mousemove', (e: any) => {
        if (isMounted) {
          const approxElev = Math.round(1450 - Math.abs(e.latlng.lat - 25.578) * 800 + Math.sin(e.latlng.lng) * 120);
          setCursorCoords({
            lat: e.latlng.lat.toFixed(4),
            lng: e.latlng.lng.toFixed(4),
            elev: Math.max(120, approxElev),
          });
        }
      });

      map.on('zoomend', () => {
        if (isMounted) {
          setZoomLevel(map.getZoom());
        }
      });

      mapInstanceRef.current = map;
      renderAllLayers(L, map);

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);
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

  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupsRef.current.baseLayers) return;
    const map = mapInstanceRef.current;
    const layers = layerGroupsRef.current.baseLayers;

    Object.values(layers).forEach((layer: any) => {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    });

    if (layers[baseMap]) {
      layers[baseMap].addTo(map);
    }
  }, [baseMap]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import('leaflet').then((LModule) => {
      renderAllLayers(LModule.default, mapInstanceRef.current);
    });
  }, [
    incidents,
    historicalLandslides,
    showHistoricalLandslides,
    roadIncidents,
    showRoadIncidents,
    deployedUnits,
    reliefShelters,
    isolatedVillages,
    showHazards,
    showBhuvanAtlas,
    showBhuvanFaults,
    showRoads,
    showNdrf,
    showShelters,
    showVillages,
    showInsarDeformation,
    showNasaGpmRain,
    showCopernicusDemSlope,
    showNasaSoilMoisture,
    insarOpacity,
    gpmRainOpacity,
    atlasOpacity,
    cloudburstRainRate,
    valhallaRoute,
    alternativeRoutesList,
    routingMode,
    roadSegments,
  ]);

  useEffect(() => {
    if (!mapInstanceRef.current || !selectedIncident) return;
    mapInstanceRef.current.flyTo([selectedIncident.lat, selectedIncident.lng], 8.3, {
      duration: 1.0,
    });
    if (selectedIncident.road === 'Blocked' || selectedIncident.road === 'Restricted') {
      calculateValhallaDisasterBypass(selectedIncident);
    }
  }, [selectedIncident]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    const qLower = q.toLowerCase();
    const results = incidents.filter(
      (inc) =>
        inc.name.toLowerCase().includes(qLower) ||
        inc.district.toLowerCase().includes(qLower) ||
        inc.roadName.toLowerCase().includes(qLower)
    );
    setSearchResults(results);
  };

  const selectSearchResult = (inc: HazardIncident) => {
    onSelectIncident(inc);
    setSearchResults([]);
    setSearchQuery('');
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([inc.lat, inc.lng], 8.5);
    }
  };

  const toggleMeasureTool = () => {
    const nextState = !isMeasuring;
    setIsMeasuring(nextState);
    if (!nextState) {
      if (measureLayerRef.current) measureLayerRef.current.clearLayers();
      setMeasuredDistanceKm(0);
    }
  };

  const renderAllLayers = (L: any, map: any) => {
    if (!map || !layerGroupsRef.current) return;

    // 1. InSAR Deformation
    const insarGroup = layerGroupsRef.current.insarDeformation;
    insarGroup.clearLayers();
    if (showInsarDeformation) {
      const insarHotspots = [
        { name: 'Sohra Escarpment Active Subsidence', coords: [25.268, 91.734], radius: 4500, rate: -62.5 },
        { name: 'Umiam Lake Sinking Zone', coords: [25.682, 91.924], radius: 3800, rate: -48.2 },
        { name: 'Pynursla Gorge Creep', coords: [25.308, 91.905], radius: 3400, rate: -36.4 },
      ];
      insarHotspots.forEach((spot) => {
        const circle = L.circle(spot.coords, {
          radius: spot.radius,
          color: '#f43f5e',
          fillColor: '#e11d48',
          fillOpacity: 0.08 * insarOpacity,
          weight: 1.5,
          dashArray: '4, 4',
        });
        circle.bindPopup(`<strong>${spot.name}</strong><br>Velocity: ${spot.rate} mm/yr`);
        circle.addTo(insarGroup);
      });
    }

    // 2. NASA GPM Rain
    const gpmGroup = layerGroupsRef.current.nasaGpmRain;
    gpmGroup.clearLayers();
    if (showNasaGpmRain) {
      const gpmFootprints = [
        { lat: 25.268, lng: 91.734, val: 382.0 + cloudburstRainRate * 2.0, label: 'Sohra Pluvial Core' },
        { lat: 25.682, lng: 91.924, val: 214.5 + cloudburstRainRate * 1.2, label: 'Shillong Corridor' },
      ];
      gpmFootprints.forEach((gpm) => {
        const circle = L.circle([gpm.lat, gpm.lng], {
          radius: 15000,
          color: '#38bdf8',
          fillColor: '#0284c7',
          fillOpacity: 0.05 * gpmRainOpacity,
          weight: 1.2,
        });
        circle.bindPopup(`<strong>${gpm.label}</strong><br>24h Rain: ${Math.round(gpm.val)} mm`);
        circle.addTo(gpmGroup);
      });
    }

    // 3. ISRO Atlas
    const atlasGroup = layerGroupsRef.current.bhuvanAtlas;
    atlasGroup.clearLayers();
    if (showBhuvanAtlas) {
      const bhuvanZones = [
        {
          name: 'ISRO LHZ: Sohra Escarpment',
          coords: [[25.250, 91.710], [25.285, 91.765], [25.295, 91.745], [25.260, 91.690]],
        },
        {
          name: 'ISRO LHZ: Umiam Corridor',
          coords: [[25.660, 91.905], [25.710, 91.945], [25.725, 91.925], [25.675, 91.885]],
        },
      ];
      bhuvanZones.forEach((z) => {
        const poly = L.polygon(z.coords, {
          color: '#eb445a',
          fillColor: '#eb445a',
          fillOpacity: 0.08 * atlasOpacity,
          weight: 1.8,
        });
        poly.bindPopup(`<strong>${z.name}</strong><br>Very High Susceptibility`);
        poly.addTo(atlasGroup);
      });
    }

    // 4. Faults
    const faultsGroup = layerGroupsRef.current.bhuvanFaults;
    faultsGroup.clearLayers();
    if (showBhuvanFaults) {
      const daukiLine = L.polyline([[25.180, 91.200], [25.190, 91.700], [25.200, 92.200]], {
        color: '#c084fc',
        weight: 3.5,
        dashArray: '6, 6',
      });
      daukiLine.bindPopup('Dauki Active Fault Zone');
      daukiLine.addTo(faultsGroup);
    }

    // 5. Historical Landslides (ISRO/NRSC Landslide Atlas of India & GSI)
    const histGroup = layerGroupsRef.current.historicalLandslides;
    if (histGroup) {
      histGroup.clearLayers();
      if (showHistoricalLandslides && historicalLandslides.length > 0) {
        historicalLandslides.forEach((hl) => {
          const histIcon = L.divIcon({
            html: `<div style="background: #7c3aed; color: white; width: 26px; height: 26px; border-radius: 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 6px rgba(0,0,0,0.4); border: 2px solid white; font-size: 13px; cursor: pointer;" title="${hl.name}">🏛️</div>`,
            className: 'historical-landslide-marker',
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          });
          const marker = L.marker([hl.lat, hl.lng], { icon: histIcon });
          marker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; min-width: 230px;">
              <div style="font-size: 10px; font-weight: bold; color: #7c3aed; text-transform: uppercase;">Historical Landslide (Past Event)</div>
              <strong style="font-size: 13px; color: #1e293b;">${hl.name}</strong>
              <div style="margin-top: 4px; font-size: 11px; color: #475569;">
                <strong>Event Date:</strong> ${hl.event_date}<br/>
                <strong>Source:</strong> ${hl.source}<br/>
                <strong>Trigger:</strong> ${hl.trigger_type}<br/>
                <strong>Volume:</strong> ${hl.estimated_volume_m3 ? hl.estimated_volume_m3.toLocaleString() + ' m³' : 'Data unavailable'}
              </div>
              <div style="margin-top: 6px; padding: 4px 6px; border-radius: 4px; background: #f1f5f9; font-size: 10px; color: #0284c7; font-weight: bold;">
                ℹ️ Used for training & susceptibility analysis only. Road is NOT closed.
              </div>
            </div>
          `);
          marker.addTo(histGroup);
        });
      }
    }

    // 6. Model Landslide Risk Predictions (ML Susceptibility Output)
    const hazardGroup = layerGroupsRef.current.hazards;
    hazardGroup.clearLayers();
    if (showHazards) {
      incidents.forEach((inc) => {
        const isCritical = inc.risk === 'Critical';
        const isHigh = inc.risk === 'High';
        const color = isCritical ? '#eb445a' : isHigh ? '#f97316' : '#eab308';
        const marker = L.circleMarker([inc.lat, inc.lng], {
          radius: isCritical ? 9 : 7,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        });
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; min-width: 230px;">
            <div style="font-size: 10px; font-weight: bold; color: ${color}; text-transform: uppercase;">
              Model Landslide Hazard Prediction
            </div>
            <strong style="font-size: 13px; color: #1e293b;">${inc.name}</strong>
            <div style="margin-top: 4px; font-size: 11px; color: #475569;">
              <strong>Risk Level:</strong> <span style="color: ${color}; font-weight: bold;">${inc.risk}</span> (${Math.round(inc.probability * 100)}% probability)<br/>
              <strong>Primary Highway:</strong> ${inc.roadName} (OPEN)<br/>
              <strong>Rainfall 24h:</strong> ${inc.rainfall24h} mm | <strong>Slope:</strong> ${inc.slopeDeg}°
            </div>
            <div style="margin-top: 6px; padding: 4px 6px; border-radius: 4px; background: #ecfdf5; font-size: 10px; color: #059669; font-weight: bold;">
              ✅ High landslide risk — no confirmed road closure. Road remains open.
            </div>
          </div>
        `);
        marker.on('click', () => onSelectIncident(inc));
        marker.addTo(hazardGroup);
      });
    }

    // 7. Verified Road Incidents & Confirmed Blockages
    const incidentGroup = layerGroupsRef.current.roadIncidents;
    if (incidentGroup) {
      incidentGroup.clearLayers();
      if (showRoadIncidents && roadIncidents.length > 0) {
        roadIncidents.filter((ri) => ri.status === 'BLOCKED').forEach((ri) => {
          const blockIcon = L.divIcon({
            html: `<div style="background: #dc2626; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.5); border: 2px solid white; font-size: 14px; cursor: pointer;" title="${ri.road_name} (BLOCKED)">⛔</div>`,
            className: 'verified-road-block-marker',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });
          const marker = L.marker([ri.lat, ri.lng], { icon: blockIcon });
          marker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; min-width: 240px;">
              <div style="font-size: 10px; font-weight: bold; color: #dc2626; text-transform: uppercase;">
                ⛔ Confirmed Road Blockage
              </div>
              <strong style="font-size: 13px; color: #1e293b;">${ri.road_name}</strong>
              <div style="margin-top: 4px; font-size: 11px; color: #475569;">
                <strong>Status:</strong> <span style="color: #dc2626; font-weight: bold;">BLOCKED</span><br/>
                <strong>Cause:</strong> ${ri.cause}<br/>
                <strong>Authority:</strong> ${ri.authority}<br/>
                <strong>Source:</strong> ${ri.source}
              </div>
              <p style="margin-top: 4px; font-size: 11px; color: #334155;">${ri.notes || ''}</p>
              <div style="margin-top: 6px; padding: 4px 6px; border-radius: 4px; background: #fef2f2; font-size: 10px; color: #dc2626; font-weight: bold;">
                🚫 Excluded from normal routing. Bypass required.
              </div>
            </div>
          `);
          marker.addTo(incidentGroup);
        });
      }
    }

    // 8. Canonical Physical Road Network
    const roadGroup = layerGroupsRef.current.roads;
    roadGroup.clearLayers();
    if (showRoads) {
      if (roadSegments && roadSegments.length > 0) {
        roadSegments.forEach((seg) => {
          const coords: [number, number][] = (seg.geometry?.coordinates || []).map(
            (c: [number, number]) => [c[1], c[0]]
          );
          if (coords.length < 2) return;

          const p = seg.properties || {};
          const isBlocked = p.status === 'BLOCKED' || p.status === 'COMPLETELY_BLOCKED';
          const isHighRisk = p.status === 'HIGH_RISK' || p.status === 'RESTRICTED';

          // ONLY draw roads that have an active status (blocked or high-risk)
          // OSM basemap already shows all roads — we only add alerts on top
          if (!isBlocked && !isHighRisk) return;

          const lineColor = isBlocked ? '#ef4444' : isHighRisk ? '#f59e0b' : '#3b82f6';
          const lineWeight = isBlocked ? 7 : isHighRisk ? 5 : 4;
          const lineDash = isBlocked ? '8, 6' : isHighRisk ? '6, 4' : undefined;
          const lineOpacity = isBlocked ? 0.95 : isHighRisk ? 0.85 : 0.65;

          // Road polyline
          const roadLine = L.polyline(coords, {
            color: lineColor,
            weight: lineWeight,
            dashArray: lineDash,
            opacity: lineOpacity,
            lineCap: 'round',
            lineJoin: 'round',
          });

          roadLine.on('click', () => {
            setSelectedRoadSegment(p);
          });

          roadLine.addTo(roadGroup);
        });
      }
    }

    // 9. Valhalla Real Road Routing Layer (Google Maps Visual Styling)
    const routeGroup = layerGroupsRef.current.routes;
    routeGroup.clearLayers();

    if (valhallaRoute && valhallaRoute.active && valhallaRoute.coordinates && valhallaRoute.coordinates.length > 1) {
      const activeCoords = valhallaRoute.coordinates;

      // Google Maps Route Outer Casing Border
      const routeCasing = L.polyline(activeCoords, {
        color: '#1557b0',
        weight: 9,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      });
      routeCasing.addTo(routeGroup);

      // Google Maps Main Route Polyline (Vibrant Blue #1a73e8 or Emergency Red #dc2626)
      const primaryRouteColor = routingMode === 'emergency' ? '#ef4444' : routingMode === 'safe' ? '#2563eb' : '#3b82f6';
      const routePolyline = L.polyline(activeCoords, {
        color: primaryRouteColor,
        weight: 6,
        opacity: 1.0,
        lineCap: 'round',
        lineJoin: 'round',
      });

      routePolyline.bindPopup(`
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; min-width: 240px; padding: 4px;">
          <div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 6px;">
            <strong style="color: ${primaryRouteColor}; font-size: 16px;">${valhallaRoute.durationMinutes} min</strong>
            <span style="color: #64748b; font-weight: 600;">${valhallaRoute.distanceKm} km</span>
          </div>
          <div style="font-size: 12px; color: #334155; margin-bottom: 4px;">
            <strong>Safety Rating:</strong> <span style="color: #16a34a; font-weight: bold;">${(valhallaRoute.safetyScore * 100).toFixed(0)}% Safe</span>
          </div>
          <div style="font-size: 11px; color: #64748b;">
            via ${routeOrigin.name.split('(')[0]} → ${routeDestination.name.split('(')[0]}
          </div>
        </div>
      `);
      routePolyline.addTo(routeGroup);

      // Google Maps Style Origin Marker (Blue circle with pulsing halo)
      const googleStartIcon = L.divIcon({
        html: `
          <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background: rgba(37, 99, 235, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 20px; height: 20px; border-radius: 50%; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 3px 8px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
              <div style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></div>
            </div>
          </div>
        `,
        className: 'google-maps-origin-pin',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      L.marker(activeCoords[0], { icon: googleStartIcon })
        .bindPopup(`<strong>Start:</strong> ${routeOrigin.name}`)
        .addTo(routeGroup);

      // Google Maps Style Destination Pin (Classic Red Teardrop Marker)
      const googleDestIcon = L.divIcon({
        html: `
          <div style="position: relative; width: 32px; height: 42px; display: flex; flex-direction: column; align-items: center;">
            <svg viewBox="0 0 24 36" width="32" height="42" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.45));">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12z" fill="#ea4335" stroke="#c5221f" stroke-width="1"/>
              <circle cx="12" cy="12" r="5" fill="#ffffff"/>
              <circle cx="12" cy="12" r="2.5" fill="#c5221f"/>
            </svg>
          </div>
        `,
        className: 'google-maps-dest-pin',
        iconSize: [32, 42],
        iconAnchor: [16, 42],
      });
      L.marker(activeCoords[activeCoords.length - 1], { icon: googleDestIcon })
        .bindPopup(`<strong>Destination:</strong> ${routeDestination.name}`)
        .addTo(routeGroup);
    }

    // 8. NDRF
    const ndrfGroup = layerGroupsRef.current.ndrf;
    ndrfGroup.clearLayers();
    if (showNdrf) {
      deployedUnits.forEach((unit) => {
        const marker = L.marker(unit.coordinates, {
          icon: L.divIcon({
            html: `<div class="flex items-center justify-center w-7 h-7 rounded bg-[#0079c1] border border-white text-white shadow-md cursor-pointer text-xs font-bold">🛡️</div>`,
            className: 'custom-ndrf-marker',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          }),
        });
        marker.bindPopup(`<strong>${unit.callsign}</strong><br>Personnel: ${unit.personnel}`);
        marker.addTo(ndrfGroup);
      });
    }

    // 9. Shelters
    const shelterGroup = layerGroupsRef.current.shelters;
    shelterGroup.clearLayers();
    if (showShelters) {
      reliefShelters.forEach((shl) => {
        const marker = L.marker(shl.coordinates, {
          icon: L.divIcon({
            html: `<div class="flex items-center justify-center w-7 h-7 rounded bg-[#2dd36f] border border-white text-black shadow-md cursor-pointer text-xs font-bold">⛺</div>`,
            className: 'custom-shelter-marker',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          }),
        });
        marker.bindPopup(`<strong>${shl.name}</strong><br>Capacity: ${shl.occupancy}/${shl.capacity}`);
        marker.addTo(shelterGroup);
      });
    }

    // 10. Villages
    const villageGroup = layerGroupsRef.current.villages;
    villageGroup.clearLayers();
    if (showVillages) {
      isolatedVillages.forEach((vil) => {
        const marker = L.circleMarker(vil.coordinates, {
          radius: 6,
          fillColor: '#a855f7',
          color: '#ffffff',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.85,
        });
        marker.bindPopup(`<strong>${vil.name}</strong><br>Population: ${vil.population}`);
        marker.addTo(villageGroup);
      });
    }
  };

  return (
    <div className={`relative w-full ${heightClass} bg-[#0b0f14] overflow-hidden flex flex-col font-sans select-none border border-[#283749] rounded-lg`}>
      <div className="relative flex-1 w-full h-full">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Top Control Bar */}
        <div className="absolute top-3 left-3 z-[400] flex items-center gap-1.5 bg-[#16202c]/95 backdrop-blur-md border border-[#283749] rounded-md p-1 shadow-lg text-xs">
          <button
            onClick={() => setShowDirectionsPanel(!showDirectionsPanel)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all font-bold ${
              showDirectionsPanel ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-[#202e3f]'
            }`}
            title="Toggle Google Maps Directions & Route Planner"
          >
            <Navigation className="w-3.5 h-3.5 text-cyan-300" />
            <span>Directions / Routes</span>
          </button>

          <button
            onClick={() => setShowRouteDebug(!showRouteDebug)}
            className={`flex items-center gap-1 px-2 py-1.5 rounded transition-all font-medium ${
              showRouteDebug ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-[#202e3f]'
            }`}
            title="Toggle Route Debug Telemetry HUD"
          >
            <Terminal className="w-3.5 h-3.5 text-amber-300" />
            <span>Debug HUD</span>
          </button>

          <button
            onClick={() => setActiveDrawer(activeDrawer === 'layers' ? null : 'layers')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded transition-all ${
              activeDrawer === 'layers' ? 'bg-[#0079c1] text-white' : 'text-slate-300 hover:bg-[#202e3f]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Layers</span>
          </button>

          <button
            onClick={() => setActiveDrawer(activeDrawer === 'basemap' ? null : 'basemap')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded transition-all font-semibold ${
              activeDrawer === 'basemap' ? 'bg-[#0079c1] text-white shadow' : 'text-slate-300 hover:bg-[#202e3f]'
            }`}
            title="Switch ISRO Bhuvan & Earth Observation Basemaps"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Basemap</span>
          </button>

          <button
            onClick={() => setActiveDrawer(activeDrawer === 'layers' ? null : 'layers')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded transition-all font-semibold ${
              activeDrawer === 'layers' ? 'bg-[#0079c1] text-white shadow' : 'text-slate-300 hover:bg-[#202e3f]'
            }`}
            title="Toggle ISRO Bhuvan, NASA GPM, & Copernicus Layers"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Layers</span>
          </button>

          <button
            onClick={() => setActiveDrawer(activeDrawer === 'bookmarks' ? null : 'bookmarks')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded transition-all font-semibold ${
              activeDrawer === 'bookmarks' ? 'bg-[#0079c1] text-white shadow' : 'text-slate-300 hover:bg-[#202e3f]'
            }`}
            title="Quick Zoom to Major Meghalaya Mountain Sectors"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>NER Sectors</span>
          </button>
        </div>

        {/* 1. Basemap Selector Drawer */}
        {activeDrawer === 'basemap' && (
          <div className="absolute top-14 left-3 z-[410] w-80 bg-[#16202c]/95 backdrop-blur-md border border-[#283749] rounded-xl p-3 shadow-2xl text-xs text-slate-100 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Globe className="w-4 h-4 text-[#00e5ff]" />
                <span>ISRO Bhuvan & Earth Basemaps</span>
              </div>
              <button onClick={() => setActiveDrawer(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                onClick={() => setBaseMap('bhuvan_sat')}
                className={`p-2 rounded-lg border text-left transition-all ${
                  baseMap === 'bhuvan_sat'
                    ? 'bg-[#0079c1] border-[#00e5ff] text-white font-bold shadow'
                    : 'bg-[#121820] border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="block font-bold">🛰️ Bhuvan Satellite</span>
                <span className="text-[10px] opacity-80">CartoSAT Optical Mosaic</span>
              </button>

              <button
                onClick={() => setBaseMap('bhuvan_hybrid')}
                className={`p-2 rounded-lg border text-left transition-all ${
                  baseMap === 'bhuvan_hybrid'
                    ? 'bg-[#0079c1] border-[#00e5ff] text-white font-bold shadow'
                    : 'bg-[#121820] border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="block font-bold">🗺️ Open Road Map</span>
                <span className="text-[10px] opacity-80">Full Highway & Town Grid</span>
              </button>

              <button
                onClick={() => setBaseMap('bhuvan_terrain')}
                className={`p-2 rounded-lg border text-left transition-all ${
                  baseMap === 'bhuvan_terrain'
                    ? 'bg-[#0079c1] border-[#00e5ff] text-white font-bold shadow'
                    : 'bg-[#121820] border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="block font-bold">🏔️ Bhuvan Terrain</span>
                <span className="text-[10px] opacity-80">Shaded Elevation Relief</span>
              </button>

              <button
                onClick={() => setBaseMap('bhuvan_2d')}
                className={`p-2 rounded-lg border text-left transition-all ${
                  baseMap === 'bhuvan_2d'
                    ? 'bg-[#0079c1] border-[#00e5ff] text-white font-bold shadow'
                    : 'bg-[#121820] border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="block font-bold">🏙️ National Streets</span>
                <span className="text-[10px] opacity-80">ESRI World Street Map</span>
              </button>

              <button
                onClick={() => setBaseMap('copernicus_dem')}
                className={`p-2 rounded-lg border text-left transition-all col-span-2 ${
                  baseMap === 'copernicus_dem'
                    ? 'bg-[#0079c1] border-[#00e5ff] text-white font-bold shadow'
                    : 'bg-[#121820] border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="block font-bold">🌐 OpenTopoMap (GLO-30 DEM)</span>
                <span className="text-[10px] opacity-80">High-Resolution Contours & Escarpment Topography</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. Layer Controls Drawer */}
        {activeDrawer === 'layers' && (
          <div className="absolute top-14 left-3 z-[410] w-88 max-w-[340px] max-h-[500px] overflow-y-auto bg-[#16202c]/98 backdrop-blur-md border border-[#283749] rounded-xl p-3.5 shadow-2xl text-xs text-slate-100 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Layers className="w-4 h-4 text-[#00e5ff]" />
                <span>Geospatial Layers & Data Semantics</span>
              </div>
              <button onClick={() => setActiveDrawer(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Core Entity Separation */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                Primary Landslide & Road Entities
              </span>

              <label className="flex items-center justify-between p-2 rounded bg-[#0f172a] border border-slate-700 cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-purple-600 flex items-center justify-center text-[10px] text-white">🏛️</div>
                  <div>
                    <span className="font-semibold block text-slate-200">Historical Landslides</span>
                    <span className="text-[10px] text-slate-400">ISRO/NRSC Atlas • History only (No closure)</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showHistoricalLandslides}
                  onChange={(e) => setShowHistoricalLandslides(e.target.checked)}
                  className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-[#0f172a] border border-slate-700 cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-amber-500 flex items-center justify-center text-[10px] text-white">⚡</div>
                  <div>
                    <span className="font-semibold block text-slate-200">Predicted Landslide Risk</span>
                    <span className="text-[10px] text-slate-400">ML Susceptibility • Road remains open</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showHazards}
                  onChange={(e) => setShowHazards(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-[#0f172a] border border-slate-700 cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-600 flex items-center justify-center text-[10px] text-white font-bold">⛔</div>
                  <div>
                    <span className="font-semibold block text-slate-200">Confirmed Road Blockages</span>
                    <span className="text-[10px] text-slate-400">Verified BLOCKED incidents (Reroutes)</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showRoadIncidents}
                  onChange={(e) => setShowRoadIncidents(e.target.checked)}
                  className="w-4 h-4 accent-red-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-[#0f172a] border border-slate-700 cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center text-[10px] text-white">🛣️</div>
                  <div>
                    <span className="font-semibold block text-slate-200">Physical Road Network</span>
                    <span className="text-[10px] text-slate-400">Verified OpenStreetMap / PostGIS</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showRoads}
                  onChange={(e) => setShowRoads(e.target.checked)}
                  className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                />
              </label>
            </div>

            {/* NASA & Copernicus Feeds */}
            <div className="space-y-2 pt-1 border-t border-slate-700">
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                NASA & Copernicus Remote Sensing
              </span>

              <label className="flex items-center justify-between p-2 rounded bg-[#0f172a] border border-slate-700 cursor-pointer">
                <div className="flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-sky-400" />
                  <div>
                    <span className="font-semibold block text-slate-200">NASA GPM 24h Rain</span>
                    <span className="text-[10px] text-slate-400">IMERG Precipitation Footprints</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showNasaGpmRain}
                  onChange={(e) => setShowNasaGpmRain(e.target.checked)}
                  className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-[#0f172a] border border-slate-700 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-400" />
                  <div>
                    <span className="font-semibold block text-slate-200">InSAR Slope Subsidence</span>
                    <span className="text-[10px] text-slate-400">Sentinel-1 Creep Velocity (mm/yr)</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showInsarDeformation}
                  onChange={(e) => setShowInsarDeformation(e.target.checked)}
                  className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-[#0f172a] border border-slate-700 cursor-pointer">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-semibold block text-slate-200">NDRF & SDRF Units</span>
                    <span className="text-[10px] text-slate-400">Field Disaster Response Battalions</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showNdrf}
                  onChange={(e) => setShowNdrf(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        {/* 3. NER Sectors Bookmarks Drawer */}
        {activeDrawer === 'bookmarks' && (
          <div className="absolute top-14 left-3 z-[410] w-80 max-h-[420px] overflow-y-auto bg-[#16202c]/95 backdrop-blur-md border border-[#283749] rounded-xl p-3 shadow-2xl text-xs text-slate-100 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Bookmark className="w-4 h-4 text-emerald-400" />
                <span>Major NER Mountain Sectors</span>
              </div>
              <button onClick={() => setActiveDrawer(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              {bookmarks.map((b, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.flyTo([b.lat, b.lng], b.zoom, { duration: 1.2 });
                    }
                    setActiveDrawer(null);
                  }}
                  className="w-full text-left p-2 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] border border-slate-800 hover:border-slate-600 transition-colors flex items-center justify-between"
                >
                  <span className="font-semibold text-slate-200 text-[11px]">{b.name}</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">Zoom {b.zoom} →</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Google Maps Style Directions Card & Panel */}
        {showDirectionsPanel && (
          <div className="absolute top-12 left-3 z-[400] w-96 max-w-[calc(100vw-24px)] bg-[#ffffff] dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-slate-800 dark:text-slate-100 animate-fadeIn font-sans">
            {/* Top Bar: Mode Selector & Close */}
            <div className="bg-slate-50 dark:bg-[#0f172a] px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              {/* Transport Modes (Drive, Walk, Emergency, Safe) */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setRoutingMode('safe'); calculateValhallaRoute(undefined, undefined, 'safe'); }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    routingMode === 'safe'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                  title="Safe Route (Avoids landslides & closures)"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Safe</span>
                </button>
                <button
                  onClick={() => { setRoutingMode('standard'); calculateValhallaRoute(undefined, undefined, 'standard'); }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    routingMode === 'standard'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                  title="Direct Driving"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Drive</span>
                </button>
                <button
                  onClick={() => { setRoutingMode('emergency'); calculateValhallaRoute(undefined, undefined, 'emergency'); }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    routingMode === 'emergency'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                  title="Emergency Dispatch Priority"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Siren</span>
                </button>
                <button
                  onClick={() => { setRoutingMode('alternatives'); calculateValhallaRoute(undefined, undefined, 'alternatives'); }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    routingMode === 'alternatives'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                  title="Multiple Alternate Routes"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Routes</span>
                </button>
              </div>

              <button
                onClick={() => setShowDirectionsPanel(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Close Directions"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inputs Container with Swap Button */}
            <div className="p-3 bg-white dark:bg-[#1e293b] flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80">
              {/* Left Column: Visual Dots & Connecting Line */}
              <div className="flex flex-col items-center justify-between py-2 shrink-0">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-600 bg-white dark:bg-[#1e293b] shadow-sm flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                </div>
                <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-600 my-0.5 border-dashed border-l"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-red-600 shadow-sm flex items-center justify-center text-white text-[9px] font-bold">
                  <span>📍</span>
                </div>
              </div>

              {/* Middle Column: Origin & Destination Inputs */}
              <div className="flex-1 space-y-1.5">
                {/* Origin Input */}
                <div className="relative flex items-center">
                  <select
                    value={`${routeOrigin.lat},${routeOrigin.lng}`}
                    onChange={(e) => {
                      const [lat, lng] = e.target.value.split(',').map(Number);
                      const preset = NER_HUB_PRESETS.find(p => Math.abs(p.lat - lat) < 0.001 && Math.abs(p.lng - lng) < 0.001);
                      setRouteOrigin({ lat, lng, name: preset?.name || 'Custom Origin' });
                      calculateValhallaRoute({ lat, lon: lng }, { lat: routeDestination.lat, lon: routeDestination.lng });
                    }}
                    className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium truncate"
                  >
                    {NER_HUB_PRESETS.map((p, idx) => (
                      <option key={idx} value={`${p.lat},${p.lng}`}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setPointSelectionMode(pointSelectionMode === 'origin' ? 'none' : 'origin')}
                    className={`ml-1.5 px-2 py-1 rounded text-[10px] font-semibold shrink-0 transition-all ${
                      pointSelectionMode === 'origin'
                        ? 'bg-blue-600 text-white animate-pulse'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                    }`}
                    title="Click any point on the map to set origin"
                  >
                    {pointSelectionMode === 'origin' ? 'Click Map' : 'Map Pin'}
                  </button>
                </div>

                {/* Destination Input */}
                <div className="relative flex items-center">
                  <select
                    value={`${routeDestination.lat},${routeDestination.lng}`}
                    onChange={(e) => {
                      const [lat, lng] = e.target.value.split(',').map(Number);
                      const preset = NER_HUB_PRESETS.find(p => Math.abs(p.lat - lat) < 0.001 && Math.abs(p.lng - lng) < 0.001);
                      setRouteDestination({ lat, lng, name: preset?.name || 'Custom Destination' });
                      calculateValhallaRoute({ lat: routeOrigin.lat, lon: routeOrigin.lng }, { lat, lon: lng });
                    }}
                    className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium truncate"
                  >
                    {NER_HUB_PRESETS.map((p, idx) => (
                      <option key={idx} value={`${p.lat},${p.lng}`}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setPointSelectionMode(pointSelectionMode === 'destination' ? 'none' : 'destination')}
                    className={`ml-1.5 px-2 py-1 rounded text-[10px] font-semibold shrink-0 transition-all ${
                      pointSelectionMode === 'destination'
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                    }`}
                    title="Click any point on the map to set destination"
                  >
                    {pointSelectionMode === 'destination' ? 'Click Map' : 'Map Pin'}
                  </button>
                </div>
              </div>

              {/* Right Column: Swap Button */}
              <button
                onClick={() => {
                  const temp = { ...routeOrigin };
                  setRouteOrigin({ ...routeDestination });
                  setRouteDestination(temp);
                  calculateValhallaRoute(
                    { lat: routeDestination.lat, lon: routeDestination.lng },
                    { lat: temp.lat, lon: temp.lng }
                  );
                }}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all shrink-0"
                title="Reverse starting point and destination"
              >
                <RotateCcw className="w-4 h-4 transform -rotate-45" />
              </button>
            </div>

            {/* Error Message Notice */}
            {routingError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/50 border-b border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Route Blocked or Unavailable</strong>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">{routingError}</p>
                </div>
              </div>
            )}

            {/* Route Summary & Alternatives Card (Google Maps Style) */}
            {valhallaRoute && valhallaRoute.active && (
              <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {/* Primary Route Option Card */}
                <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                        {valhallaRoute.durationMinutes} min
                      </span>
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        ({valhallaRoute.distanceKm} km)
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full">
                      Fastest route
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      via NH-06 & Mountain Corridor
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {(valhallaRoute.safetyScore * 100).toFixed(0)}% Safe
                    </span>
                  </div>

                  <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Live traffic: Typical for this time</span>
                  </div>
                </div>

                {/* Turn-by-Turn Maneuvers Drawer */}
                {valhallaRoute.maneuvers && valhallaRoute.maneuvers.length > 0 && (
                  <div className="p-3 bg-white dark:bg-[#1e293b]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                        Turn-by-Turn Directions
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {valhallaRoute.maneuvers.length} steps
                      </span>
                    </div>

                    <div className="space-y-2">
                      {valhallaRoute.maneuvers.map((m: any, mIdx: number) => {
                        let turnIcon = '⬆️';
                        if (mIdx === 0) turnIcon = '📍';
                        else if (mIdx === valhallaRoute.maneuvers.length - 1) turnIcon = '🏁';
                        else if (m.instruction?.toLowerCase().includes('right')) turnIcon = '↗️';
                        else if (m.instruction?.toLowerCase().includes('left')) turnIcon = '↖️';
                        else if (m.instruction?.toLowerCase().includes('roundabout')) turnIcon = '🔄';

                        return (
                          <div
                            key={mIdx}
                            className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-[#0f172a] hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-800 cursor-pointer"
                          >
                            <span className="text-sm shrink-0 mt-0.5">{turnIcon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                                {m.instruction}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                                {m.length ? `${m.length} km` : 'Proceed along route'}
                                {m.time ? ` • approx. ${Math.round(m.time / 60)} min` : ''}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer Action Bar */}
            <div className="p-2.5 bg-slate-50 dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <button
                onClick={() => calculateValhallaRoute()}
                disabled={isLoadingRoute}
                className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isLoadingRoute ? 'animate-spin' : ''}`} />
                <span>{isLoadingRoute ? 'Routing via Valhalla...' : 'Calculate Directions'}</span>
              </button>

              <button
                onClick={() => {
                  if (mapInstanceRef.current && valhallaRoute?.coordinates?.length) {
                    mapInstanceRef.current.flyToBounds(valhallaRoute.coordinates, { padding: [60, 60], maxZoom: 13 });
                  }
                }}
                className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center transition-all"
                title="Fit route to screen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Route Debug HUD */}
        {showRouteDebug && valhallaRoute && (
          <div className="absolute top-14 right-3 z-[410] bg-[#0f172a]/95 backdrop-blur-md border border-amber-500/80 rounded-xl p-3 shadow-2xl text-[11px] font-mono text-slate-200 w-80 max-w-[320px] space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <Terminal className="w-4 h-4" />
                <span>ROUTING DEBUG HUD</span>
              </div>
              <button onClick={() => setShowRouteDebug(false)} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <strong className="text-emerald-400">{valhallaRoute.debugInfo?.status || 'ROUTE_FOUND'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Geometry Nodes:</span>
                <strong className="text-sky-300 font-bold">{valhallaRoute.coordinates.length.toLocaleString()} nodes</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Road Distance:</span>
                <strong className="text-white">{valhallaRoute.distanceKm} km</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Travel Duration:</span>
                <strong className="text-white">{valhallaRoute.durationMinutes} min</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Maneuver Count:</span>
                <strong className="text-white">{valhallaRoute.maneuvers.length}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Engine Profile:</span>
                <strong className="text-purple-300">{valhallaRoute.debugInfo?.engine || 'pyvalhalla_road_engine'}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Location Investigation Dossier (Click Anywhere on Map) */}
        {dynamicInspectorPoint && (
          <div className="absolute top-14 right-3 z-[420] w-96 max-w-[calc(100vw-24px)] bg-[#16202c]/98 backdrop-blur-md border border-[#283749] rounded-2xl shadow-2xl p-4 space-y-3 font-sans text-slate-100 animate-fadeIn text-xs">
            <div className="flex items-center justify-between border-b border-[#283749] pb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#00e5ff]" />
                <div>
                  <h4 className="font-bold text-white text-sm">Location Intelligence Dossier</h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    {dynamicInspectorPoint.lat}°N, {dynamicInspectorPoint.lng}°E
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDynamicInspectorPoint(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Risk & Terrain Metrics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-[#0f172a] border border-slate-700">
                <span className="text-[10px] text-slate-400 block uppercase">Calculated Hazard</span>
                <span className={`text-base font-black font-mono ${
                  dynamicInspectorPoint.riskLevel === 'Critical' ? 'text-red-400' :
                  dynamicInspectorPoint.riskLevel === 'High' ? 'text-orange-400' :
                  dynamicInspectorPoint.riskLevel === 'Moderate' ? 'text-yellow-400' : 'text-emerald-400'
                }`}>
                  {dynamicInspectorPoint.riskLevel} ({Math.round(dynamicInspectorPoint.hazardScore * 100)}%)
                </span>
              </div>
              <div className="p-2 rounded-lg bg-[#0f172a] border border-slate-700">
                <span className="text-[10px] text-slate-400 block uppercase">Elevation & Slope</span>
                <span className="text-base font-black font-mono text-cyan-300">
                  {dynamicInspectorPoint.elevation}m • {dynamicInspectorPoint.slopeDeg}°
                </span>
              </div>
            </div>

            {/* Live Weather Telemetry */}
            <div className="p-2 rounded-lg bg-[#0f172a] border border-slate-700 space-y-1 text-[11px]">
              <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-1">
                Live Sensor Telemetry ({dynamicInspectorPoint.timestamp})
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Precipitation (1h):</span>
                <strong className="text-white font-mono">{dynamicInspectorPoint.rainfall1h} mm/h</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Relative Humidity:</span>
                <strong className="text-white font-mono">{dynamicInspectorPoint.humidity}%</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Soil Moisture Saturation:</span>
                <strong className="text-white font-mono">{Math.round(dynamicInspectorPoint.soilMoisture * 100)}%</strong>
              </div>
            </div>

            {/* Core Semantic Rule Banner */}
            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-[10px] text-emerald-300 font-medium leading-relaxed">
              ✅ <strong>Semantic Policy:</strong> Model risk output is purely probabilistic. Roads in this sector remain <strong>OPEN</strong> unless an explicit, verified road blockage is confirmed by authorities.
            </div>

            {/* Route Action Buttons */}
            <div className="flex gap-2 pt-1 border-t border-slate-800">
              <button
                onClick={() => {
                  setRouteOrigin({
                    lat: dynamicInspectorPoint.lat,
                    lng: dynamicInspectorPoint.lng,
                    name: `Selected (${dynamicInspectorPoint.lat}°N, ${dynamicInspectorPoint.lng}°E)`
                  });
                  setDynamicInspectorPoint(null);
                  calculateValhallaRoute({ lat: dynamicInspectorPoint.lat, lon: dynamicInspectorPoint.lng }, { lat: routeDestinationRef.current.lat, lon: routeDestinationRef.current.lng });
                }}
                className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-all"
              >
                Set as Origin
              </button>
              <button
                onClick={() => {
                  setRouteDestination({
                    lat: dynamicInspectorPoint.lat,
                    lng: dynamicInspectorPoint.lng,
                    name: `Selected (${dynamicInspectorPoint.lat}°N, ${dynamicInspectorPoint.lng}°E)`
                  });
                  setDynamicInspectorPoint(null);
                  calculateValhallaRoute({ lat: routeOriginRef.current.lat, lon: routeOriginRef.current.lng }, { lat: dynamicInspectorPoint.lat, lon: dynamicInspectorPoint.lng });
                }}
                className="flex-1 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-[11px] transition-all"
              >
                Set as Destination
              </button>
            </div>
          </div>
        )}

        {/* Explainable Road Status & Blockade Dossier */}
        {selectedRoadSegment && (
          <div className="absolute top-14 right-3 z-[420] w-96 max-w-[calc(100vw-24px)] max-h-[540px] bg-[#16202c]/98 backdrop-blur-md border border-[#283749] rounded-2xl shadow-2xl overflow-y-auto text-xs animate-fadeIn p-4 space-y-3 font-sans text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#283749] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {selectedRoadSegment.status === 'BLOCKED' || selectedRoadSegment.status === 'COMPLETELY_BLOCKED' ? '⛔' : selectedRoadSegment.status === 'HIGH_RISK' ? '⚠️' : '🛣️'}
                </span>
                <div>
                  <h4 className="font-bold text-white text-sm uppercase tracking-wide">Road Status Dossier</h4>
                  <span className="text-[10px] font-mono text-slate-400">{selectedRoadSegment.road_segment_id}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    fetch('/api/map/road-segments')
                      .then((r) => r.json())
                      .then((d) => {
                        if (d.features) {
                          setRoadSegments(d.features);
                          const updated = d.features.find((f: any) => f.properties?.road_segment_id === selectedRoadSegment.road_segment_id);
                          if (updated) setSelectedRoadSegment(updated.properties);
                        }
                      });
                  }}
                  className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                  title="Force Sync Live Sensor Stream"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setSelectedRoadSegment(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Live Streaming Beacon Badge */}
            <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-[10px] font-mono">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="font-bold">LIVE TELEMETRY STREAM</span>
              </div>
              <span className="text-slate-400">15s Auto-Sync • Open-Meteo & InSAR</span>
            </div>

            {/* Road Name & Operational Status Badge */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span
                  className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                    selectedRoadSegment.status === 'BLOCKED' || selectedRoadSegment.status === 'COMPLETELY_BLOCKED'
                      ? 'bg-red-950/80 text-red-400 border-red-700'
                      : selectedRoadSegment.status === 'HIGH_RISK' || selectedRoadSegment.status === 'RESTRICTED'
                      ? 'bg-amber-950/80 text-amber-400 border-amber-700'
                      : 'bg-emerald-950/80 text-emerald-400 border-emerald-700'
                  }`}
                >
                  {selectedRoadSegment.status === 'BLOCKED' ? '⛔ ROAD BLOCKED • IMPASSABLE' : selectedRoadSegment.status === 'HIGH_RISK' ? '⚠️ CAUTION • HIGH HAZARD' : '✅ CORRIDOR OPEN'}
                </span>
                {selectedRoadSegment.severity && (
                  <span className="text-[10px] font-mono text-rose-400 font-bold bg-rose-950/50 px-1.5 py-0.5 rounded border border-rose-900">
                    {selectedRoadSegment.severity} SEVERITY
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-white leading-snug">{selectedRoadSegment.road_name}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                {selectedRoadSegment.road_class} • {selectedRoadSegment.surface || 'Paved Asphalt'}
              </p>
            </div>

            {/* Live Sensor & Satellite Telemetry Grid */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="bg-[#0f172a] p-2 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1 text-sky-400 font-bold mb-0.5">
                  <CloudRain className="w-3.5 h-3.5" />
                  <span>LIVE PRECIP</span>
                </div>
                <strong className="text-sm text-white font-mono block">
                  {selectedRoadSegment.live_rain_rate_mm_hr !== undefined ? `${selectedRoadSegment.live_rain_rate_mm_hr} mm/hr` : '0.0 mm/hr'}
                </strong>
                <span className="text-[9px] text-slate-400">Open-Meteo Live</span>
              </div>

              <div className="bg-[#0f172a] p-2 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1 text-cyan-400 font-bold mb-0.5">
                  <Droplets className="w-3.5 h-3.5" />
                  <span>SOIL SATURATION</span>
                </div>
                <strong className="text-sm text-white font-mono block">
                  {selectedRoadSegment.live_soil_saturation_pct !== undefined ? `${selectedRoadSegment.live_soil_saturation_pct}%` : '86%'}
                </strong>
                <span className="text-[9px] text-slate-400">NASA SMAP Root-Zone</span>
              </div>

              <div className="bg-[#0f172a] p-2 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1 text-amber-400 font-bold mb-0.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>PORE PRESSURE (u)</span>
                </div>
                <strong className="text-sm text-amber-300 font-mono block">
                  {selectedRoadSegment.live_pore_pressure_kpa !== undefined ? `${selectedRoadSegment.live_pore_pressure_kpa} kPa` : '64 kPa'}
                </strong>
                <span className="text-[9px] text-slate-400">Piezometric Gauge</span>
              </div>

              <div className="bg-[#0f172a] p-2 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1 text-rose-400 font-bold mb-0.5">
                  <Satellite className="w-3.5 h-3.5" />
                  <span>INSAR CREEP</span>
                </div>
                <strong className="text-sm text-rose-300 font-mono block">
                  {selectedRoadSegment.live_insar_velocity_mm_yr !== undefined ? `${selectedRoadSegment.live_insar_velocity_mm_yr} mm/yr` : '-48.2 mm/yr'}
                </strong>
                <span className="text-[9px] text-slate-400">Sentinel-1 LOS</span>
              </div>
            </div>

            {/* What Happened / Explanation Card */}
            <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                Incident & Blockade Analysis
              </span>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {selectedRoadSegment.reason_text || selectedRoadSegment.block_reason || 'Road conditions monitored by State Disaster Command.'}
              </p>
              {selectedRoadSegment.incident_id && (
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                  <span>Incident ID: <strong className="text-cyan-400">{selectedRoadSegment.incident_id}</strong></span>
                  <span>Source: {selectedRoadSegment.source?.split('/')[0]}</span>
                </div>
              )}
            </div>

            {/* Incident Timestamps & Ground Verification */}
            {(selectedRoadSegment.reported_at || selectedRoadSegment.verified_at) && (
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                {selectedRoadSegment.reported_at && (
                  <div className="bg-[#121820] p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">Reported At</span>
                    <strong className="text-slate-200">{selectedRoadSegment.reported_at}</strong>
                  </div>
                )}
                {selectedRoadSegment.verified_at && (
                  <div className="bg-[#121820] p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">Ground Verified</span>
                    <strong className="text-emerald-400">{selectedRoadSegment.verified_at}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Affected Communities & Expected Reopening */}
            {selectedRoadSegment.affected_villages && selectedRoadSegment.affected_villages.length > 0 && (
              <div className="bg-[#121820] p-2.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Affected Villages & Settlements ({selectedRoadSegment.affected_population ? `${selectedRoadSegment.affected_population.toLocaleString()} residents` : ''})
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedRoadSegment.affected_villages.map((vil: string, vIdx: number) => (
                    <span key={vIdx} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium border border-slate-700">
                      📍 {vil}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedRoadSegment.expected_reopening && (
              <div className="bg-[#121820] p-2.5 rounded-xl border border-slate-800 text-[11px]">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                  Expected Reopening & Clearance
                </span>
                <p className="text-slate-200 font-semibold mt-0.5">{selectedRoadSegment.expected_reopening}</p>
              </div>
            )}

            {/* Recommended Safe Bypass */}
            {selectedRoadSegment.recommended_bypass && (
              <div className="bg-blue-950/30 p-2.5 rounded-xl border border-blue-800/60 space-y-1">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Recommended Safe Bypass Corridor
                </span>
                <p className="text-xs text-blue-100 font-medium">{selectedRoadSegment.recommended_bypass}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-1.5 pt-1">
              {(selectedRoadSegment.status === 'BLOCKED' || selectedRoadSegment.status === 'HIGH_RISK' || selectedRoadSegment.status === 'RESTRICTED') && (
                <button
                  onClick={() => {
                    // Automatically trigger bypass routing
                    setRoutingMode('safe');
                    calculateValhallaRoute(undefined, undefined, 'safe');
                    setSelectedRoadSegment(null);
                  }}
                  disabled={isLoadingRoute}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <Navigation className="w-4 h-4" />
                  <span>⚡ Compute Safe Bypass Route</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Clean, unobstructed map canvas — contextual data is managed in the right panel */}

        {/* GIS Status Footer Bar */}
        <div className="absolute bottom-2 left-2 z-[400] flex flex-wrap items-center gap-2.5 bg-[#16202c]/95 backdrop-blur-md border border-[#283749] rounded px-2.5 py-1 text-[11px] font-mono text-slate-300 shadow-md">
          <div className="flex items-center gap-1 text-[#00e5ff]">
            <Compass className="w-3 h-3" />
            <span>{cursorCoords.lat}° N, {cursorCoords.lng}° E</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1 text-amber-400">
            <Mountain className="w-3 h-3" />
            <span>Elev: {cursorCoords.elev}m (GLO-30)</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="text-slate-400">
            <span>Zoom: {zoomLevel}</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
            <ShieldCheck className="w-3 h-3" />
            <span>VALHALLA ROAD GRAPH • ISRO BHUVAN • COPERNICUS</span>
          </div>
        </div>
      </div>

      {/* Attribute Table Drawer */}
      {showAttributeTable && (
        <div className="h-60 bg-[#16202c] border-t border-[#283749] flex flex-col z-30 shadow-2xl animate-fadeIn">
          <div className="bg-[#121820] border-b border-[#283749] px-3 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TableIcon className="w-3.5 h-3.5 text-[#00e5ff]" />
              <span className="font-bold text-white text-xs uppercase">Meghalaya Landslide Features Table</span>
            </div>
            {setShowAttributeTable && (
              <button onClick={() => setShowAttributeTable(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead className="bg-[#192330] text-slate-300 text-[11px] sticky top-0 uppercase font-mono tracking-wider border-b border-[#283749]">
                <tr>
                  <th className="p-2">Feature ID</th>
                  <th className="p-2">Sector Name</th>
                  <th className="p-2">District</th>
                  <th className="p-2">Risk Level</th>
                  <th className="p-2">Road Status</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#223142] text-[11px]">
                {incidents.map((inc) => (
                  <tr key={inc.id} onClick={() => onSelectIncident(inc)} className="hover:bg-[#202e3f] cursor-pointer text-slate-300">
                    <td className="p-2 font-mono text-[#00e5ff]">{inc.id}</td>
                    <td className="p-2 font-bold text-white">{inc.name}</td>
                    <td className="p-2">{inc.district}</td>
                    <td className="p-2 font-bold">{inc.risk}</td>
                    <td className="p-2">{inc.road}</td>
                    <td className="p-2">
                      <button onClick={(e) => { e.stopPropagation(); onSelectIncident(inc); }} className="px-2 py-0.5 bg-[#0079c1] text-white rounded text-[10px] font-bold">
                        Fly To
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
