'use client';

import React, { useEffect, useState } from 'react';
import { X, Database, ExternalLink } from 'lucide-react';

interface Source {
  id: string;
  name: string;
  description: string;
  status: 'live' | 'nrt' | 'delayed' | 'unavail';
  statusLabel: string;
  dataAge?: string;
}

interface DataSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRadarAvailable?: boolean;
}

const STATUS_LABELS: Record<Source['status'], string> = {
  live: 'Live',
  nrt: 'Near-real-time',
  delayed: 'Delayed',
  unavail: 'Unavailable',
};

const DEFAULT_SOURCES: Source[] = [
  {
    id: 'IMD_AWS',
    name: 'IMD AWS / ARG Network',
    description: '1,165+ automatic weather stations across India providing surface observations.',
    status: 'live',
    statusLabel: 'Live',
    dataAge: '~15 min',
  },
  {
    id: 'IMD_NOWCAST',
    name: 'IMD District Nowcast',
    description: '0–3 hour district-level precipitation nowcast for all 755 districts.',
    status: 'live',
    statusLabel: 'Live',
    dataAge: '~30 min',
  },
  {
    id: 'IMD_WARNINGS',
    name: 'IMD Official Warnings',
    description: '1–5 day district warnings issued by India Meteorological Department.',
    status: 'live',
    statusLabel: 'Live',
    dataAge: '~45 min',
  },
  {
    id: 'INSAT_3DR',
    name: 'INSAT-3DR (ISRO MOSDAC)',
    description: 'Geostationary satellite imagery — IR, visible, water vapour channels.',
    status: 'live',
    statusLabel: 'Live',
    dataAge: '~15 min',
  },
  {
    id: 'IMD_RADAR',
    name: 'IMD Doppler Weather Radar',
    description: '34-station DWR network. Coverage within 250 km of each station.',
    status: 'live',
    statusLabel: 'Live',
    dataAge: '~10 min',
  },
  {
    id: 'NASA_GPM',
    name: 'NASA GPM / IMERG',
    description: 'Global Precipitation Measurement satellite-derived precipitation estimates.',
    status: 'nrt',
    statusLabel: 'Near-real-time',
    dataAge: '~3 hours',
  },
];

const StatusBadge: React.FC<{ status: Source['status'] }> = ({ status }) => {
  const colors: Record<Source['status'], { bg: string; text: string; dot: string }> = {
    live: { bg: 'var(--mg-success-bg)', text: 'var(--mg-success)', dot: 'var(--mg-success)' },
    nrt: { bg: 'var(--mg-caution-bg)', text: 'var(--mg-caution)', dot: 'var(--mg-caution)' },
    delayed: { bg: 'var(--mg-warning-bg)', text: 'var(--mg-warning)', dot: 'var(--mg-warning)' },
    unavail: { bg: 'var(--mg-surface-2)', text: 'var(--mg-text-tertiary)', dot: 'var(--mg-text-tertiary)' },
  };
  const c = colors[status];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '2px 8px',
      borderRadius: 99,
      background: c.bg,
      fontSize: 11,
      fontWeight: 500,
      color: c.text,
      flexShrink: 0,
    }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: c.dot,
        display: 'inline-block',
        animation: status === 'live' ? 'mg-pulse 2s infinite' : undefined,
      }} />
      {STATUS_LABELS[status]}
    </span>
  );
};

export const DataSourcesModal: React.FC<DataSourcesModalProps> = ({
  isOpen,
  onClose,
  isRadarAvailable = true,
}) => {
  const [sources, setSources] = useState<Source[]>(DEFAULT_SOURCES);
  const [lastChecked, setLastChecked] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/system/data-status')
      .then((r) => r.json())
      .then((data) => {
        if (data.sources && Array.isArray(data.sources)) {
          setSources(
            data.sources.map((s: any) => {
              let status: Source['status'] = 'live';
              if (s.id === 'IMD_DWR_RADAR_NETWORK' && !isRadarAvailable) {
                status = 'unavail';
              } else if (s.status === 'CONNECTED' && s.dataAgeMinutes <= 90) {
                status = 'live';
              } else if (s.status === 'NEAR-REAL-TIME' || (s.dataAgeMinutes > 90 && s.dataAgeMinutes <= 240)) {
                status = 'nrt';
              } else if (s.dataAgeMinutes > 240) {
                status = 'delayed';
              } else if (s.status === 'UNAVAILABLE') {
                status = 'unavail';
              }
              const base = DEFAULT_SOURCES.find((d) => d.id === s.id || d.id === s.id?.replace('_NETWORK', '').replace('DISTRICT_', '').replace('IMD_', 'IMD_'));
              return {
                id: s.id,
                name: s.name || base?.name || s.id,
                description: base?.description || s.name,
                status,
                statusLabel: STATUS_LABELS[status],
                dataAge: s.dataAgeMinutes ? `~${s.dataAgeMinutes} min` : base?.dataAge,
              };
            })
          );
          setLastChecked(
            new Date().toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
              timeZone: 'Asia/Kolkata',
            }) + ' IST'
          );
        }
      })
      .catch(() => {
        setLastChecked(
          new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Kolkata',
          }) + ' IST'
        );
      });
  }, [isOpen, isRadarAvailable]);

  if (!isOpen) return null;

  return (
    <div className="mg-modal-overlay" onClick={onClose}>
      <div className="mg-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mg-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={16} color="var(--mg-text-secondary)" />
            <span className="mg-modal-title">Data Sources</span>
          </div>
          <button
            className="mg-btn mg-btn-icon"
            style={{ width: 28, height: 28, border: 'none', background: 'none' }}
            onClick={onClose}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="mg-modal-body" style={{ padding: '8px 20px 20px' }}>
          {lastChecked && (
            <p style={{ fontSize: 11, color: 'var(--mg-text-tertiary)', margin: '4px 0 12px' }}>
              Status checked at {lastChecked}
            </p>
          )}

          {(sources.length > 0 ? sources : DEFAULT_SOURCES).map((src, idx) => (
            <div key={src.id || idx} className="mg-source-row">
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--mg-text-primary)', marginBottom: 1 }}>
                  {src.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--mg-text-tertiary)', lineHeight: 1.5 }}>
                  {src.description}
                </div>
                {src.dataAge && (
                  <div style={{ fontSize: 11, color: 'var(--mg-text-tertiary)', marginTop: 2 }}>
                    Data age: {src.dataAge}
                  </div>
                )}
              </div>
              <div style={{ marginLeft: 12, flexShrink: 0 }}>
                <StatusBadge status={src.status} />
              </div>
            </div>
          ))}

          <p style={{
            marginTop: 16,
            fontSize: 11,
            color: 'var(--mg-text-tertiary)',
            lineHeight: 1.6,
            padding: '10px 12px',
            background: 'var(--mg-surface-2)',
            borderRadius: 'var(--mg-radius)',
          }}>
            All data is sourced from official government meteorological agencies.
            No third-party or commercial weather APIs are used for operational decisions.
          </p>
        </div>
      </div>
    </div>
  );
};
