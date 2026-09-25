'use client';

import React from 'react';
import { X, Layers, Eye, EyeOff, Cloud, CloudRain, Radio, Satellite, Map, AlertTriangle, Navigation } from 'lucide-react';

interface LayerGroup {
  title: string;
  layers: {
    id: string;
    label: string;
    icon: React.ReactNode;
    enabled: boolean;
    onChange: (v: boolean) => void;
  }[];
}

interface LayersPanelProps {
  onClose: () => void;
  // Layer states
  showLiveRainfall: boolean;
  setShowLiveRainfall: (v: boolean) => void;
  showAwsStations: boolean;
  setShowAwsStations: (v: boolean) => void;
  showDistrictWarnings: boolean;
  setShowDistrictWarnings: (v: boolean) => void;
  showNowcastAlerts: boolean;
  setShowNowcastAlerts: (v: boolean) => void;
  showDwrRings: boolean;
  setShowDwrRings: (v: boolean) => void;
  showSlopeHazards: boolean;
  setShowSlopeHazards: (v: boolean) => void;
  // Basemap
  baseMap: 'dark' | 'street' | 'bhuvan_sat' | 'bhuvan_2d' | 'bhuvan_hybrid';
  setBaseMap: (b: 'dark' | 'street' | 'bhuvan_sat' | 'bhuvan_2d' | 'bhuvan_hybrid') => void;
}

const Toggle: React.FC<{ enabled: boolean; onChange: (v: boolean) => void; id: string }> = ({
  enabled,
  onChange,
  id,
}) => (
  <label
    className="mg-toggle"
    htmlFor={id}
    style={{ cursor: 'pointer' }}
    onClick={(e) => e.stopPropagation()}
  >
    <input
      id={id}
      type="checkbox"
      checked={enabled}
      onChange={(e) => onChange(e.target.checked)}
    />
    <div className="mg-toggle-track" />
    <div className="mg-toggle-thumb" />
  </label>
);

export const LayersPanel: React.FC<LayersPanelProps> = ({
  onClose,
  showLiveRainfall,
  setShowLiveRainfall,
  showAwsStations,
  setShowAwsStations,
  showDistrictWarnings,
  setShowDistrictWarnings,
  showNowcastAlerts,
  setShowNowcastAlerts,
  showDwrRings,
  setShowDwrRings,
  showSlopeHazards,
  setShowSlopeHazards,
  baseMap,
  setBaseMap,
}) => {
  const layerGroups: LayerGroup[] = [
    {
      title: 'Weather',
      layers: [
        {
          id: 'rainfall',
          label: 'Rainfall observations',
          icon: <CloudRain size={13} color="var(--mg-accent)" />,
          enabled: showLiveRainfall,
          onChange: setShowLiveRainfall,
        },
        {
          id: 'nowcast',
          label: 'IMD Nowcast alerts',
          icon: <Cloud size={13} color="#7c3aed" />,
          enabled: showNowcastAlerts,
          onChange: setShowNowcastAlerts,
        },
        {
          id: 'radar',
          label: 'Doppler radar coverage',
          icon: <Radio size={13} color="var(--mg-caution)" />,
          enabled: showDwrRings,
          onChange: setShowDwrRings,
        },
      ],
    },
    {
      title: 'Observations',
      layers: [
        {
          id: 'aws',
          label: 'AWS / ARG stations',
          icon: <Navigation size={13} color="var(--mg-success)" />,
          enabled: showAwsStations,
          onChange: setShowAwsStations,
        },
      ],
    },
    {
      title: 'Warnings',
      layers: [
        {
          id: 'warnings',
          label: 'IMD district warnings',
          icon: <AlertTriangle size={13} color="var(--mg-danger)" />,
          enabled: showDistrictWarnings,
          onChange: setShowDistrictWarnings,
        },
        {
          id: 'slope',
          label: 'Slope hazard zones',
          icon: <Map size={13} color="var(--mg-warning)" />,
          enabled: showSlopeHazards,
          onChange: setShowSlopeHazards,
        },
      ],
    },
  ];

  const basemapOptions: { id: LayersPanelProps['baseMap']; label: string }[] = [
    { id: 'street', label: 'Street (OSM)' },
    { id: 'bhuvan_2d', label: 'Bhuvan 2D' },
    { id: 'bhuvan_sat', label: 'Satellite' },
    { id: 'bhuvan_hybrid', label: 'Hybrid topo' },
    { id: 'dark', label: 'Dark (Carto)' },
  ];

  return (
    <div className="mg-layers-panel">
      {/* Header */}
      <div className="mg-layers-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={15} color="var(--mg-text-secondary)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--mg-text-primary)' }}>
            Layers
          </span>
        </div>
        <button
          className="mg-btn mg-btn-icon"
          style={{ width: 26, height: 26, border: 'none', background: 'none' }}
          onClick={onClose}
        >
          <X size={14} />
        </button>
      </div>

      {/* Layer groups */}
      {layerGroups.map((group) => (
        <div key={group.title} className="mg-layer-group">
          <div className="mg-layer-group-title">{group.title}</div>
          {group.layers.map((layer) => (
            <div key={layer.id} className="mg-layer-item">
              <div className="mg-layer-label">
                {layer.icon}
                {layer.label}
              </div>
              <Toggle
                id={`layer-${layer.id}`}
                enabled={layer.enabled}
                onChange={layer.onChange}
              />
            </div>
          ))}
        </div>
      ))}

      {/* Basemap picker */}
      <div className="mg-layer-group">
        <div className="mg-layer-group-title">Basemap</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
          {basemapOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setBaseMap(opt.id)}
              style={{
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 500,
                borderRadius: 99,
                border: '1px solid',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: baseMap === opt.id ? 'var(--mg-accent)' : 'var(--mg-surface-2)',
                borderColor: baseMap === opt.id ? 'var(--mg-accent)' : 'var(--mg-border)',
                color: baseMap === opt.id ? 'white' : 'var(--mg-text-secondary)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
