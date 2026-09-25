'use client';

import React, { useState } from 'react';
import {
  X,
  MapPin,
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  AlertTriangle,
  Radio,
  Clock,
  ChevronDown,
  ChevronUp,
  Info,
  Navigation,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface StationTelemetry {
  stationId: string;
  stationName: string;
  district: string;
  state: string;
  distanceKm: number;
  temperatureC: number | null;
  humidityPercent: number | null;
  windSpeedKmh: number | null;
  windDirectionDeg: number | null;
  pressureHpa: number | null;
  rainfall1hMm: number | null;
  rainfall24hMm: number | null;
  observationTimestampIST: string;
  dataAgeMinutes: number;
  freshnessStatus: 'LIVE' | 'DELAYED' | 'STALE' | 'UNAVAILABLE';
  isAvailable: boolean;
}

interface LocationPanelProps {
  onClose: () => void;
  // Location
  locationName: string;
  district: string;
  state: string;
  lat: number | null;
  lng: number | null;
  // Telemetry
  stationTelemetry?: StationTelemetry | null;
  // Warning
  districtWarning?: {
    headline: string;
    district: string;
    validUntil: string;
    severity: string;
    evidence: string;
    source: string;
  } | null;
  // Nowcast
  districtNowcast?: {
    headline: string;
    validUntil: string;
    evidence: string;
  } | null;
  // Rain gauge
  rainGauge?: {
    value: number | null;
    unit: string;
    timestamp: string;
    source: string;
    isAvailable: boolean;
  } | null;
  // Radar
  radarObservation?: {
    isAvailable: boolean;
    radarStation?: string;
    reflectivityDbz?: number;
  } | null;
  // Satellite
  satelliteObservation?: {
    isAvailable: boolean;
    cloudTopTempC?: number;
  } | null;
  onOpenSatelliteViewer?: () => void;
  onOpenRadarViewer?: () => void;
}

/* Helpers */
const fmt = (v: number | null | undefined, decimals = 1, fallback = '—') =>
  v !== null && v !== undefined ? v.toFixed(decimals) : fallback;

const windDir = (deg: number | null | undefined): string => {
  if (deg === null || deg === undefined) return '—';
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
};

const severityStyle = (sev: string) => {
  const s = sev?.toUpperCase();
  if (s?.includes('RED') || s?.includes('EXTREME') || s?.includes('SEVERE'))
    return { cls: 'danger', color: 'var(--mg-danger)', icon: '🔴' };
  if (s?.includes('ORANGE') || s?.includes('WARNING') || s?.includes('HIGH'))
    return { cls: 'warning', color: 'var(--mg-warning)', icon: '🟠' };
  if (s?.includes('YELLOW') || s?.includes('CAUTION') || s?.includes('MODERATE'))
    return { cls: 'caution', color: 'var(--mg-caution)', icon: '🟡' };
  return { cls: 'none', color: 'var(--mg-text-tertiary)', icon: '⚪' };
};

const DataDetail: React.FC<{ label: string; value: string; mono?: boolean }> = ({
  label,
  value,
  mono = false,
}) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--mg-border)' }}>
    <span style={{ fontSize: 12, color: 'var(--mg-text-tertiary)' }}>{label}</span>
    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--mg-text-primary)', fontFamily: mono ? 'monospace' : undefined }}>
      {value}
    </span>
  </div>
);

export const LocationPanel: React.FC<LocationPanelProps> = ({
  onClose,
  locationName,
  district,
  state,
  lat,
  lng,
  stationTelemetry,
  districtWarning,
  districtNowcast,
  rainGauge,
  radarObservation,
  satelliteObservation,
  onOpenSatelliteViewer,
  onOpenRadarViewer,
}) => {
  const [showDataDetails, setShowDataDetails] = useState(false);
  const [showWhyWarning, setShowWhyWarning] = useState(false);

  const hasStation = Boolean(stationTelemetry?.isAvailable);
  const hasWarning = Boolean(districtWarning?.headline);
  const hasNowcast = Boolean(districtNowcast?.headline);

  const warnStyle = hasWarning ? severityStyle(districtWarning!.severity) : null;

  const dataAge = stationTelemetry?.dataAgeMinutes;
  const freshnessText =
    dataAge !== undefined && dataAge !== null
      ? dataAge < 5 ? 'Just now'
        : dataAge < 60 ? `${dataAge} min ago`
        : `${Math.round(dataAge / 60)}h ago`
      : null;

  return (
    <div className="mg-panel animate-fade-up">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="mg-panel-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{
              fontSize: 17,
              fontWeight: 700,
              color: 'var(--mg-text-primary)',
              margin: 0,
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {locationName || 'Selected Location'}
            </h2>
            {(district || state) && (
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--mg-text-secondary)' }}>
                {[district, state].filter(Boolean).join(', ')}
              </p>
            )}
            {lat !== null && lng !== null && (
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--mg-text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
                {lat?.toFixed(4)}° N &nbsp; {lng?.toFixed(4)}° E
              </p>
            )}
          </div>
          <button
            className="mg-btn mg-btn-icon"
            style={{ flexShrink: 0, width: 28, height: 28, border: 'none', background: 'none' }}
            onClick={onClose}
          >
            <X size={15} />
          </button>
        </div>

        {/* Freshness */}
        {freshnessText && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Clock size={11} color="var(--mg-text-tertiary)" />
            <span style={{ fontSize: 11, color: 'var(--mg-text-tertiary)' }}>
              Updated {freshnessText}
              {stationTelemetry?.stationName && (
                <span> · {stationTelemetry.stationName}</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="mg-panel-body">

        {/* CURRENT CONDITIONS ─────────────────────────────────── */}
        <div className="mg-panel-section">
          <div className="mg-panel-section-title">Current conditions</div>

          {hasStation ? (
            <>
              <div className="mg-obs-grid">
                <div className="mg-obs-item">
                  <div className="mg-obs-value">
                    {stationTelemetry?.temperatureC !== null && stationTelemetry?.temperatureC !== undefined
                      ? `${fmt(stationTelemetry.temperatureC, 1)}°C`
                      : '—'}
                  </div>
                  <div className="mg-obs-label">Temperature</div>
                </div>
                <div className="mg-obs-item">
                  <div className="mg-obs-value">
                    {stationTelemetry?.humidityPercent !== null && stationTelemetry?.humidityPercent !== undefined
                      ? `${fmt(stationTelemetry.humidityPercent, 0)}%`
                      : '—'}
                  </div>
                  <div className="mg-obs-label">Humidity</div>
                </div>
                <div className="mg-obs-item">
                  <div className="mg-obs-value">
                    {rainGauge?.value !== null && rainGauge?.value !== undefined
                      ? `${fmt(rainGauge.value, 1)} mm`
                      : stationTelemetry?.rainfall1hMm !== null && stationTelemetry?.rainfall1hMm !== undefined
                      ? `${fmt(stationTelemetry.rainfall1hMm, 1)} mm`
                      : '—'}
                  </div>
                  <div className="mg-obs-label">Rainfall (1h)</div>
                </div>
                <div className="mg-obs-item">
                  <div className="mg-obs-value">
                    {stationTelemetry?.windSpeedKmh !== null && stationTelemetry?.windSpeedKmh !== undefined
                      ? `${fmt(stationTelemetry.windSpeedKmh, 0)} km/h`
                      : '—'}
                  </div>
                  <div className="mg-obs-label">
                    Wind {stationTelemetry?.windDirectionDeg !== null && stationTelemetry?.windDirectionDeg !== undefined
                      ? `(${windDir(stationTelemetry.windDirectionDeg)})`
                      : ''}
                  </div>
                </div>
              </div>

              {stationTelemetry?.rainfall24hMm !== null && stationTelemetry?.rainfall24hMm !== undefined && (
                <div style={{
                  marginTop: 10,
                  padding: '8px 10px',
                  background: 'var(--mg-accent-light)',
                  borderRadius: 'var(--mg-radius)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: 12, color: 'var(--mg-accent)' }}>
                    <CloudRain size={12} style={{ display: 'inline', marginRight: 4 }} />
                    24-hour accumulation
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--mg-accent)' }}>
                    {fmt(stationTelemetry.rainfall24hMm, 1)} mm
                  </span>
                </div>
              )}

              {/* Nearest AWS note */}
              {stationTelemetry && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Navigation size={11} color="var(--mg-text-tertiary)" />
                  <span style={{ fontSize: 11, color: 'var(--mg-text-tertiary)' }}>
                    {stationTelemetry.stationName}
                    {stationTelemetry.distanceKm
                      ? ` · ${stationTelemetry.distanceKm.toFixed(1)} km away`
                      : ''}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="mg-warning-badge none">
              <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>No observation available for this location.</span>
            </div>
          )}
        </div>

        {/* IMD WARNING ─────────────────────────────────────────── */}
        <div className="mg-panel-section">
          <div className="mg-panel-section-title">Official IMD Warning</div>

          {hasWarning ? (
            <>
              <div className={`mg-warning-badge ${warnStyle?.cls}`}>
                <AlertTriangle
                  size={14}
                  style={{ flexShrink: 0, marginTop: 2, color: warnStyle?.color }}
                />
                <div>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--mg-text-primary)',
                    marginBottom: 2,
                  }}>
                    {districtWarning!.headline}
                  </div>
                  {districtWarning!.district && (
                    <div style={{ fontSize: 12, color: 'var(--mg-text-secondary)' }}>
                      {districtWarning!.district}
                    </div>
                  )}
                  {districtWarning!.validUntil && (
                    <div style={{ fontSize: 11, color: 'var(--mg-text-tertiary)', marginTop: 3 }}>
                      Valid until {districtWarning!.validUntil}
                    </div>
                  )}
                </div>
              </div>

              {/* Why this warning toggle */}
              <button
                onClick={() => setShowWhyWarning((v) => !v)}
                style={{
                  marginTop: 8,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 12,
                  color: 'var(--mg-accent)',
                  padding: 0,
                  fontWeight: 500,
                }}
              >
                <Info size={12} />
                Why this warning?
                {showWhyWarning ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              {showWhyWarning && (
                <div style={{
                  marginTop: 8,
                  padding: '10px 12px',
                  background: 'var(--mg-surface-2)',
                  borderRadius: 'var(--mg-radius)',
                  fontSize: 12,
                  color: 'var(--mg-text-secondary)',
                  lineHeight: 1.6,
                }}>
                  <strong style={{ display: 'block', marginBottom: 4, color: 'var(--mg-text-primary)' }}>
                    Official IMD Assessment
                  </strong>
                  {districtWarning!.evidence || 'Official meteorological nowcast/warning issued by IMD.'}
                  <div style={{ marginTop: 6, color: 'var(--mg-text-tertiary)', fontSize: 11 }}>
                    Note: A warning represents an official forecast and does not mean rainfall
                    has been observed at every affected location.
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, fontWeight: 600, color: 'var(--mg-text-tertiary)' }}>
                    Source: {districtWarning!.source || 'IMD'}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="mg-warning-badge none">
              <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>No active warning for this area.</span>
            </div>
          )}
        </div>

        {/* IMD NOWCAST ─────────────────────────────────────────── */}
        {hasNowcast && (
          <div className="mg-panel-section">
            <div className="mg-panel-section-title">Nowcast (0–3h)</div>
            <div className="mg-warning-badge caution">
              <Clock size={14} style={{ flexShrink: 0, marginTop: 2, color: 'var(--mg-caution)' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--mg-text-primary)', marginBottom: 2 }}>
                  {districtNowcast!.headline}
                </div>
                {districtNowcast!.validUntil && (
                  <div style={{ fontSize: 11, color: 'var(--mg-text-tertiary)', marginTop: 3 }}>
                    Valid until {districtNowcast!.validUntil}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* REMOTE SENSING ──────────────────────────────────────── */}
        <div className="mg-panel-section">
          <div className="mg-panel-section-title">Remote sensing</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Radar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Radio size={13} color="var(--mg-caution)" />
                <div>
                  <div style={{ fontSize: 13, color: 'var(--mg-text-primary)', fontWeight: 500 }}>
                    Doppler Radar
                  </div>
                  {radarObservation?.radarStation && (
                    <div style={{ fontSize: 11, color: 'var(--mg-text-tertiary)' }}>
                      {radarObservation.radarStation}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {radarObservation?.reflectivityDbz !== undefined && (
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--mg-text-secondary)' }}>
                    {radarObservation.reflectivityDbz} dBZ
                  </span>
                )}
                {onOpenRadarViewer && (
                  <button
                    className="mg-btn"
                    style={{ height: 26, padding: '0 8px', fontSize: 11 }}
                    onClick={onOpenRadarViewer}
                  >
                    View
                    <ExternalLink size={10} />
                  </button>
                )}
              </div>
            </div>

            {/* Satellite */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{
                  width: 13,
                  height: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  ☁
                </div>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--mg-text-primary)', fontWeight: 500 }}>
                    INSAT-3DR Satellite
                  </div>
                  {satelliteObservation?.cloudTopTempC !== undefined && (
                    <div style={{ fontSize: 11, color: 'var(--mg-text-tertiary)' }}>
                      Cloud top: {satelliteObservation.cloudTopTempC}°C
                    </div>
                  )}
                </div>
              </div>
              {onOpenSatelliteViewer && (
                <button
                  className="mg-btn"
                  style={{ height: 26, padding: '0 8px', fontSize: 11 }}
                  onClick={onOpenSatelliteViewer}
                >
                  View
                  <ExternalLink size={10} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* DATA DETAILS (collapsed by default) ─────────────────── */}
        <div className="mg-panel-section">
          <button
            onClick={() => setShowDataDetails((v) => !v)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: 0,
            }}
          >
            <span className="mg-panel-section-title" style={{ margin: 0 }}>Data details</span>
            {showDataDetails ? <ChevronUp size={13} color="var(--mg-text-tertiary)" /> : <ChevronDown size={13} color="var(--mg-text-tertiary)" />}
          </button>

          {showDataDetails && (
            <div style={{ marginTop: 10, animation: 'fadeUp 0.15s ease-out' }}>
              {stationTelemetry?.stationId && (
                <DataDetail label="Station ID" value={stationTelemetry.stationId} mono />
              )}
              {stationTelemetry?.observationTimestampIST && (
                <DataDetail label="Observation time" value={stationTelemetry.observationTimestampIST} />
              )}
              {stationTelemetry?.dataAgeMinutes !== undefined && (
                <DataDetail label="Data age" value={`${stationTelemetry.dataAgeMinutes} minutes`} />
              )}
              {stationTelemetry?.pressureHpa !== null && stationTelemetry?.pressureHpa !== undefined && (
                <DataDetail label="Pressure" value={`${fmt(stationTelemetry.pressureHpa, 1)} hPa`} />
              )}
              {lat !== null && lat !== undefined && (
                <DataDetail label="Coordinates" value={`${lat?.toFixed(4)}° N, ${lng?.toFixed(4)}° E`} mono />
              )}
              <DataDetail label="Source" value={rainGauge?.source || 'IMD Operational Network'} />
              <div style={{
                marginTop: 8,
                padding: '6px 8px',
                background: 'var(--mg-surface-2)',
                borderRadius: 'var(--mg-radius-sm)',
                fontSize: 11,
                color: 'var(--mg-text-tertiary)',
                lineHeight: 1.5,
              }}>
                All observations are sourced directly from official IMD operational feeds.
                No values are estimated or interpolated in this panel.
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
