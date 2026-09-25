'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Layers, Globe, RefreshCw, Database, Info, Map as MapIcon, X } from 'lucide-react';

/* ─── India location dataset for search ─────────────────────────────── */
const INDIA_LOCATIONS = [
  { name: 'Chennai', subtitle: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, type: 'city' },
  { name: 'Mumbai', subtitle: 'Maharashtra', lat: 19.0760, lng: 72.8777, type: 'city' },
  { name: 'Delhi', subtitle: 'National Capital Territory', lat: 28.6139, lng: 77.2090, type: 'city' },
  { name: 'Kolkata', subtitle: 'West Bengal', lat: 22.5726, lng: 88.3639, type: 'city' },
  { name: 'Bengaluru', subtitle: 'Karnataka', lat: 12.9716, lng: 77.5946, type: 'city' },
  { name: 'Hyderabad', subtitle: 'Telangana', lat: 17.3850, lng: 78.4867, type: 'city' },
  { name: 'Pune', subtitle: 'Maharashtra', lat: 18.5204, lng: 73.8567, type: 'city' },
  { name: 'Ahmedabad', subtitle: 'Gujarat', lat: 23.0225, lng: 72.5714, type: 'city' },
  { name: 'Visakhapatnam', subtitle: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185, type: 'city' },
  { name: 'Bhubaneswar', subtitle: 'Odisha', lat: 20.2961, lng: 85.8245, type: 'city' },
  { name: 'Thiruvananthapuram', subtitle: 'Kerala', lat: 8.5241, lng: 76.9366, type: 'city' },
  { name: 'Kochi', subtitle: 'Kerala', lat: 9.9312, lng: 76.2673, type: 'city' },
  { name: 'Coimbatore', subtitle: 'Tamil Nadu', lat: 11.0168, lng: 76.9558, type: 'city' },
  { name: 'Jaipur', subtitle: 'Rajasthan', lat: 26.9124, lng: 75.7873, type: 'city' },
  { name: 'Lucknow', subtitle: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, type: 'city' },
  { name: 'Patna', subtitle: 'Bihar', lat: 25.5941, lng: 85.1376, type: 'city' },
  { name: 'Nagpur', subtitle: 'Maharashtra', lat: 21.1458, lng: 79.0882, type: 'city' },
  { name: 'Srinagar', subtitle: 'Jammu & Kashmir', lat: 34.0837, lng: 74.7973, type: 'city' },
  { name: 'Shimla', subtitle: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734, type: 'city' },
  { name: 'Dehradun', subtitle: 'Uttarakhand', lat: 30.3165, lng: 78.0322, type: 'city' },
  { name: 'Gangtok', subtitle: 'Sikkim', lat: 27.3389, lng: 88.6065, type: 'city' },
  { name: 'Shillong', subtitle: 'Meghalaya', lat: 25.5788, lng: 91.8933, type: 'city' },
  { name: 'Agartala', subtitle: 'Tripura', lat: 23.8315, lng: 91.2868, type: 'city' },
  // States
  { name: 'Tamil Nadu', subtitle: 'State', lat: 11.1271, lng: 78.6569, type: 'state' },
  { name: 'Maharashtra', subtitle: 'State', lat: 19.7515, lng: 75.7139, type: 'state' },
  { name: 'Kerala', subtitle: 'State', lat: 10.8505, lng: 76.2711, type: 'state' },
  { name: 'Karnataka', subtitle: 'State', lat: 15.3173, lng: 75.7139, type: 'state' },
  { name: 'West Bengal', subtitle: 'State', lat: 22.9868, lng: 87.8550, type: 'state' },
  { name: 'Odisha', subtitle: 'State', lat: 20.9517, lng: 85.0985, type: 'state' },
  { name: 'Andhra Pradesh', subtitle: 'State', lat: 15.9129, lng: 79.7400, type: 'state' },
  { name: 'Gujarat', subtitle: 'State', lat: 22.2587, lng: 71.1924, type: 'state' },
  { name: 'Meghalaya', subtitle: 'State', lat: 25.4670, lng: 91.3662, type: 'state' },
  { name: 'Sikkim', subtitle: 'State', lat: 27.5330, lng: 88.5122, type: 'state' },
  { name: 'Uttarakhand', subtitle: 'State', lat: 30.0668, lng: 79.0193, type: 'state' },
  { name: 'Himachal Pradesh', subtitle: 'State', lat: 31.1048, lng: 77.1734, type: 'state' },
];

/* ─── Props ──────────────────────────────────────────────────────────── */
interface MeteoHeaderProps {
  onSearchLocation: (lat: number, lng: number, name: string, state: string) => void;
  onToggleLayers: () => void;
  layersOpen: boolean;
  onOpenDataSources: () => void;
  onOpenSystemOverview: () => void;
  onManualRefresh: () => void;
  lastRefreshTime: string;
  warningsActive: number;
  liveStations: number;
}

export const MeteoHeader: React.FC<MeteoHeaderProps> = ({
  onSearchLocation,
  onToggleLayers,
  layersOpen,
  onOpenDataSources,
  onOpenSystemOverview,
  onManualRefresh,
  lastRefreshTime,
  warningsActive,
  liveStations,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<typeof INDIA_LOCATIONS>([]);
  const [showResults, setShowResults] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  /* Live clock IST */
  useEffect(() => {
    const update = () => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-IN', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Kolkata',
        }) + ' IST'
      );
    };
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, []);

  /* Search */
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    const q = query.toLowerCase();
    const filtered = INDIA_LOCATIONS.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.subtitle.toLowerCase().includes(q)
    ).slice(0, 6);
    setResults(filtered);
    setShowResults(filtered.length > 0);
  }, [query]);

  /* Click outside to close */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (loc: typeof INDIA_LOCATIONS[0]) => {
    onSearchLocation(loc.lat, loc.lng, loc.name, loc.subtitle);
    setQuery(loc.name);
    setShowResults(false);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    onManualRefresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <header className="mg-header">
      {/* ── Logo ───────────────────────────────────────────────────── */}
      <div className="mg-logo flex-shrink-0">
        <div className="mg-logo-icon">
          <Globe size={14} color="white" strokeWidth={2} />
        </div>
        <div>
          <div className="mg-wordmark">MeteoGIS</div>
          <div className="mg-tagline">Live Meteorological Intelligence</div>
        </div>
      </div>

      {/* ── Search ─────────────────────────────────────────────────── */}
      <div className="mg-search" ref={searchRef} style={{ marginLeft: 'auto' }}>
        <Search
          size={14}
          className="mg-search-icon"
        />
        <input
          type="text"
          className="mg-search-input"
          placeholder="Search location, district, state…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setShowResults(false); }}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--mg-text-tertiary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            <X size={13} />
          </button>
        )}

        {showResults && (
          <div className="mg-search-results">
            {results.map((loc) => (
              <div
                key={`${loc.lat}-${loc.lng}`}
                className="mg-search-result-item"
                onClick={() => handleSelect(loc)}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: loc.type === 'state' ? 'var(--mg-surface-3)' : 'var(--mg-accent-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <MapIcon size={13} color={loc.type === 'state' ? 'var(--mg-text-tertiary)' : 'var(--mg-accent)'} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--mg-text-primary)' }}>
                    {loc.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--mg-text-tertiary)' }}>
                    {loc.subtitle}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Right controls ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8, flexShrink: 0 }}>

        {/* Layers toggle */}
        <button
          className={`mg-btn${layersOpen ? ' mg-btn-primary' : ''}`}
          onClick={onToggleLayers}
          title="Toggle layer controls"
        >
          <Layers size={14} />
          <span style={{ display: 'none' }} className="sm-show">Layers</span>
        </button>

        {/* Data sources */}
        <button
          className="mg-btn mg-btn-icon"
          onClick={onOpenDataSources}
          title="Data sources & status"
        >
          <Database size={14} />
        </button>

        {/* System overview / proposal */}
        <button
          className="mg-btn mg-btn-icon"
          onClick={onOpenSystemOverview}
          title="System overview & proposal"
        >
          <Info size={14} />
        </button>

        {/* Refresh */}
        <button
          className="mg-btn mg-btn-icon"
          onClick={handleRefresh}
          title={`Refresh — last updated ${lastRefreshTime}`}
        >
          <RefreshCw
            size={14}
            style={{
              transition: 'transform 0.6s',
              transform: isRefreshing ? 'rotate(360deg)' : 'rotate(0deg)',
              color: isRefreshing ? 'var(--mg-accent)' : undefined,
            }}
          />
        </button>

        {/* Live status pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '0 10px',
            height: 34,
            background: 'var(--mg-success-bg)',
            border: '1px solid var(--mg-success-border)',
            borderRadius: 99,
            flexShrink: 0,
          }}
        >
          <span className="mg-live-dot" />
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--mg-success)' }}>
            {currentTime}
          </span>
        </div>
      </div>
    </header>
  );
};
