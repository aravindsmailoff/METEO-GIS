import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '../../../store/appStore';
import {
  DataState,
  DerivedHazardEvent,
  HazardsPayload,
  PluvialFloodZone,
  ValidatedDistrictWarning,
} from '../../../types/meteo';
import { formatCountdownParts, severityColors } from '../../../utils/formatters';
import { EmptyState } from '../../common/EmptyState';
import { ErrorRetry } from '../../common/ErrorRetry';
import { LoadingState } from '../../common/LoadingState';

interface OverviewTabProps {
  hazards: HazardsPayload;
  warnings: ValidatedDistrictWarning[];
  dataState: DataState;
  errorMessage: string | null;
  onRetry: () => void;
  onSelectPluvialZone: (zone: PluvialFloodZone) => void;
  onSelectHazard: (ev: DerivedHazardEvent) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  hazards,
  warnings,
  dataState,
  errorMessage,
  onRetry,
  onSelectPluvialZone,
  onSelectHazard,
}) => {
  const selectedState = useAppStore((s) => s.selectedState);
  const selectedEvidence = useAppStore((s) => s.selectedEvidence);
  const openRadarModal = useAppStore((s) => s.openRadarModal);
  const resetNationalView = useAppStore((s) => s.resetNationalView);

  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (dataState === 'loading' && hazards.events.length === 0) {
    return <LoadingState message="Synchronizing IMD synoptic & satellite overview…" />;
  }
  if (dataState === 'error' && hazards.events.length === 0) {
    return <ErrorRetry message={errorMessage || undefined} onRetry={onRetry} />;
  }

  const primaryEvent = hazards.events[0] || null;
  const cd = formatCountdownParts(
    selectedEvidence?.validUntilEpoch || primaryEvent?.validUntilEpoch,
    nowMs
  );

  const redCount =
    warnings.filter((w) => w.currentAlertLevel === 'RED').length ||
    hazards.events.filter((e) => e.severity === 'RED').length;
  const orangeCount =
    warnings.filter((w) => w.currentAlertLevel === 'ORANGE').length ||
    hazards.events.filter((e) => e.severity === 'ORANGE').length;
  const yellowCount =
    warnings.filter((w) => w.currentAlertLevel === 'YELLOW').length ||
    hazards.events.filter((e) => e.severity === 'YELLOW').length;

  const tempC = selectedEvidence?.temperatureC ?? 27.6;
  const humidity = selectedEvidence?.humidityPercent ?? 78;
  const rain1h = selectedEvidence?.rainfall1hMm ?? primaryEvent?.rainfallRateMmH ?? 0.0;
  const windKmh = selectedEvidence?.windSpeedKmh ?? 16;

  const activeHeadline =
    selectedEvidence?.headline ||
    primaryEvent?.headline ||
    `Active Synoptic Surveillance · ${selectedState}`;
  const activeSummary =
    selectedEvidence?.summary ||
    primaryEvent?.summary ||
    'Real-time IMD multi-hazard fusion across surface AWS telemetry, INSAT-3DR IR, and 34 Doppler radars.';
  const sevStyle = severityColors(selectedEvidence?.severity || primaryEvent?.severity || 'ORANGE');

  return (
    <View style={styles.container}>
      {/* Breadcrumb & Reset Row */}
      <View style={styles.breadcrumbRow}>
        <Text style={styles.breadcrumbText} numberOfLines={1}>
          INDIA › {(selectedEvidence?.state || selectedState).toUpperCase()}
          {selectedEvidence?.district ? ` › ${selectedEvidence.district.toUpperCase()}` : ''}
        </Text>
        {selectedState !== 'All India' || selectedEvidence ? (
          <Pressable onPress={resetNationalView} style={styles.resetPill}>
            <Text style={styles.resetPillText}>↺ All India</Text>
          </Pressable>
        ) : null}
      </View>

      {/* 4 Meteorological Telemetry Cards */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>🌡 TEMPERATURE</Text>
          <Text style={styles.metricValue}>{tempC.toFixed(1)}°C</Text>
          <Text style={styles.metricSub} numberOfLines={1}>
            {selectedEvidence?.stationName || 'IMD / INSAT Grid'}
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>💧 HUMIDITY</Text>
          <Text style={styles.metricValue}>{Math.round(humidity)}%</Text>
          <Text style={styles.metricSub}>INSAT-3DR Sounder</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>🌧 RAINFALL (1H)</Text>
          <Text style={styles.metricValue}>{rain1h.toFixed(1)} mm</Text>
          <Text style={styles.metricSub}>
            24h: {(selectedEvidence?.rainfall24hMm ?? 0).toFixed(1)} mm
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>💨 SURFACE WIND</Text>
          <Text style={styles.metricValue}>{Math.round(windKmh)} km/h</Text>
          <Text style={styles.metricSub}>
            {selectedEvidence?.pressureHpa ?? 1006.4} hPa
          </Text>
        </View>
      </View>

      {/* Severity KPI Strip (RED / ORANGE / YELLOW) */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiChip, { borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.14)' }]}>
          <Text style={[styles.kpiNum, { color: '#fca5a5' }]}>{redCount}</Text>
          <Text style={styles.kpiTag}>RED</Text>
        </View>
        <View style={[styles.kpiChip, { borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,0.14)' }]}>
          <Text style={[styles.kpiNum, { color: '#fdba74' }]}>{orangeCount}</Text>
          <Text style={styles.kpiTag}>ORANGE</Text>
        </View>
        <View style={[styles.kpiChip, { borderColor: '#eab308', backgroundColor: 'rgba(234,179,8,0.14)' }]}>
          <Text style={[styles.kpiNum, { color: '#fde047' }]}>{yellowCount}</Text>
          <Text style={styles.kpiTag}>YELLOW</Text>
        </View>
      </View>

      {/* Doppler Nowcast Validity Countdown Card */}
      <View style={[styles.countdownCard, { borderColor: sevStyle.border }]}>
        <View style={styles.countdownHeader}>
          <Text style={styles.countdownTitle}>● DOPPLER NOWCAST VALIDITY</Text>
          <Text style={[styles.stormTag, { color: sevStyle.text }]}>{sevStyle.label}</Text>
        </View>
        <View style={styles.clockRow}>
          <View style={styles.clockBox}>
            <Text style={styles.clockDigits}>{cd.hrs}</Text>
            <Text style={styles.clockUnit}>HOURS</Text>
          </View>
          <Text style={styles.clockColon}>:</Text>
          <View style={styles.clockBox}>
            <Text style={styles.clockDigits}>{cd.mins}</Text>
            <Text style={styles.clockUnit}>MINS</Text>
          </View>
          <Text style={styles.clockColon}>:</Text>
          <View style={styles.clockBox}>
            <Text style={styles.clockDigits}>{cd.secs}</Text>
            <Text style={styles.clockUnit}>SECS</Text>
          </View>
        </View>
      </View>

      {/* Authoritative System Evidence Card */}
      <View style={styles.evidenceCard}>
        <Text style={styles.sectionLabel}>AUTHORITATIVE BULLETIN & EVIDENCE</Text>
        <Text style={styles.evidenceHeadline}>{activeHeadline}</Text>
        <Text style={styles.evidenceBody}>{activeSummary}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaKey}>Source Feed</Text>
          <Text style={styles.metaVal}>
            {selectedEvidence?.source || 'India Meteorological Department (NWFC)'}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaKey}>Nearest Doppler Radar</Text>
          <Text style={styles.metaVal}>
            {selectedEvidence?.radarName || 'Karaikal S-Band'} (
            {selectedEvidence?.radarDistanceKm ?? 48} km)
          </Text>
        </View>
        <Pressable
          onPress={() => openRadarModal(selectedEvidence?.radarCode)}
          style={styles.radarCta}
        >
          <Text style={styles.radarCtaText}>
            📡 Launch Live DWR Volumetric Scan ({(selectedEvidence?.radarCode || 'kkl').toUpperCase()})
          </Text>
        </Pressable>
      </View>

      {/* Pluvial Flood Zones List */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionLabel}>
          PLUVIAL INUNDATION CORRIDORS ({hazards.pluvialFloodZones.length})
        </Text>
        {hazards.pluvialFloodZones.length === 0 ? (
          <EmptyState
            title="No urban inundation corridors flagged in this territory."
            subtitle="Switch Territory to All India to inspect national pluvial flood basins."
          />
        ) : (
          hazards.pluvialFloodZones.map((zone) => (
            <Pressable
              key={zone.id}
              onPress={() => onSelectPluvialZone(zone)}
              style={styles.zoneCard}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.zoneTitle}>{zone.zoneName}</Text>
                <Text style={styles.zoneSub}>
                  {zone.district}, {zone.state} · {zone.estimatedHousesAtRisk.toLocaleString()} structures · 24h: {zone.cumulativeRain24hMm} mm
                </Text>
              </View>
              <Text style={styles.zoneAction}>{zone.pluvialFloodRisk} →</Text>
            </Pressable>
          ))
        )}
      </View>

      {/* Active Severe Events Quick List */}
      {hazards.events.length > 0 && (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>ACTIVE SEVERE CORRIDORS ({hazards.events.length})</Text>
          {hazards.events.slice(0, 5).map((ev) => {
            const c = severityColors(ev.severity);
            return (
              <Pressable
                key={ev.id}
                onPress={() => onSelectHazard(ev)}
                style={[styles.zoneCard, { borderColor: c.border }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.zoneTitle}>
                    {ev.district}, {ev.state}
                  </Text>
                  <Text style={styles.zoneSub} numberOfLines={2}>
                    {ev.summary}
                  </Text>
                </View>
                <Text style={[styles.zoneAction, { color: c.text }]}>{ev.severity}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  breadcrumbText: {
    flex: 1,
    color: '#38bdf8',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  resetPill: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetPillText: {
    color: '#e2e8f0',
    fontSize: 11.5,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    width: '48.4%',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 2,
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
  },
  metricValue: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '900',
  },
  metricSub: {
    color: '#64748b',
    fontSize: 10.5,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  kpiNum: {
    fontSize: 18,
    fontWeight: '900',
  },
  kpiTag: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '800',
  },
  countdownCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0c1322',
    borderWidth: 1.5,
    gap: 8,
  },
  countdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countdownTitle: {
    color: '#fbbf24',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stormTag: {
    fontSize: 10.5,
    fontWeight: '900',
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  clockBox: {
    minWidth: 64,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  clockDigits: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  clockUnit: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
  },
  clockColon: {
    color: '#94a3b8',
    fontSize: 20,
    fontWeight: '900',
  },
  evidenceCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 8,
  },
  sectionLabel: {
    color: '#94a3b8',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  evidenceHeadline: {
    color: '#f8fafc',
    fontSize: 13.5,
    fontWeight: '800',
    lineHeight: 19,
  },
  evidenceBody: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  metaKey: {
    color: '#64748b',
    fontSize: 11,
  },
  metaVal: {
    color: '#6ee7b7',
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  radarCta: {
    marginTop: 4,
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#164e63',
    borderWidth: 1,
    borderColor: '#22d3ee',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  radarCtaText: {
    color: '#ecfeff',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionBlock: {
    gap: 8,
  },
  zoneCard: {
    minHeight: 56,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.45)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  zoneTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
  },
  zoneSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  zoneAction: {
    color: '#fb923c',
    fontSize: 11.5,
    fontWeight: '900',
  },
});
