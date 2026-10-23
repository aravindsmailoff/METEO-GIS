import { HazardSeverity } from '../types/meteo';

export function formatRelativeMinutes(fetchedAt: number | null, nowMs = Date.now()): string {
  if (!fetchedAt) return 'just now';
  const diffSec = Math.max(0, Math.floor((nowMs - fetchedAt) / 1000));
  if (diffSec < 45) return 'just now';
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

export function formatCountdownParts(validUntilEpoch?: number, nowMs = Date.now()) {
  const defaultWindowMs = (10 * 3600 + 32 * 60 + 58) * 1000;
  const target = validUntilEpoch && validUntilEpoch > nowMs
    ? validUntilEpoch
    : Math.floor(nowMs / 86400000) * 86400000 + 86400000 + (defaultWindowMs % 7200000);
  const diffSec = Math.max(0, Math.floor((target - nowMs) / 1000));
  const hrs = String(Math.floor(diffSec / 3600)).padStart(2, '0');
  const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
  const secs = String(diffSec % 60).padStart(2, '0');
  return {
    hrs,
    mins,
    secs,
    formatted: `${hrs}:${mins}:${secs}`,
  };
}

export function formatIstClock(date = new Date()): string {
  try {
    return (
      date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Kolkata',
      }) + ' IST'
    );
  } catch {
    return date.toTimeString().slice(0, 8) + ' IST';
  }
}

export function severityColors(severity?: HazardSeverity | string) {
  switch (String(severity || 'GREEN').toUpperCase()) {
    case 'RED':
    case 'CRITICAL':
      return {
        bg: 'rgba(239, 68, 68, 0.18)',
        solid: '#ef4444',
        border: '#f87171',
        text: '#fecaca',
        badgeText: '#ffffff',
        label: 'RED ALERT',
      };
    case 'ORANGE':
    case 'HIGH':
      return {
        bg: 'rgba(249, 115, 22, 0.18)',
        solid: '#f97316',
        border: '#fb923c',
        text: '#fed7aa',
        badgeText: '#ffffff',
        label: 'ORANGE ALERT',
      };
    case 'YELLOW':
    case 'MODERATE':
      return {
        bg: 'rgba(234, 179, 8, 0.18)',
        solid: '#eab308',
        border: '#facc15',
        text: '#fef08a',
        badgeText: '#0f172a',
        label: 'YELLOW WATCH',
      };
    default:
      return {
        bg: 'rgba(16, 185, 129, 0.16)',
        solid: '#10b981',
        border: '#34d399',
        text: '#a7f3d0',
        badgeText: '#022c22',
        label: 'GREEN NORMAL',
      };
  }
}

export function formatCompactNumber(val: number): string {
  if (val >= 10000000) return `${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `${(val / 100000).toFixed(2)} L`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return String(Math.round(val));
}
