import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '../../store/appStore';
import { DataState, DerivedHazardEvent } from '../../types/meteo';
import { formatCountdownParts, severityColors } from '../../utils/formatters';
import { AlertBadge } from '../common/AlertBadge';
import { DataStatusLabel } from '../common/DataStatusLabel';

interface TopHazardStripProps {
  events: DerivedHazardEvent[];
  alertCount: number;
  dataState: DataState;
  fetchedAt: number | null;
  isReferenceSnapshot?: boolean;
  onRefresh: () => void;
  onInspectEvent: (event: DerivedHazardEvent) => void;
}

export const TopHazardStrip: React.FC<TopHazardStripProps> = ({
  events,
  alertCount,
  dataState,
  fetchedAt,
  isReferenceSnapshot,
  onRefresh,
  onInspectEvent,
}) => {
  const bottomSheetSnap = useAppStore((s) => s.bottomSheetSnap);
  const isTopStripExpanded = useAppStore((s) => s.isTopStripExpanded);
  const setTopStripExpanded = useAppStore((s) => s.setTopStripExpanded);
  const isDrawerOpen = useAppStore((s) => s.isDrawerOpen);
  const setDrawerOpen = useAppStore((s) => s.setDrawerOpen);
  const setSearchModalOpen = useAppStore((s) => s.setSearchModalOpen);
  const operationalMode = useAppStore((s) => s.operationalMode);
  const setOperationalMode = useAppStore((s) => s.setOperationalMode);
  const isHazardFocusOnly = useAppStore((s) => s.isHazardFocusOnly);
  const toggleHazardFocusOnly = useAppStore((s) => s.toggleHazardFocusOnly);
  const stepperIdx = useAppStore((s) => s.activeZoneStepperIndex);
  const setStepperIdx = useAppStore((s) => s.setActiveZoneStepperIndex);

  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const safeIndex = events.length > 0 ? stepperIdx % events.length : 0;
  const activeEvent = events[safeIndex] || null;
  const cd = formatCountdownParts(activeEvent?.validUntilEpoch, nowMs);
  const sev = severityColors(activeEvent?.severity || 'ORANGE');

  return (
    <View style={styles.wrapper}>
      {/* Row 1: Primary App Header (Search + Live/Hist + Status + Hamburger ☰ / ✕) */}
      <View style={styles.appBar}>
        <View style={styles.brandBox}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandGlobe}>🌐</Text>
          </View>
          <View>
            <Text style={styles.brandTitle} maxFontSizeMultiplier={1.15}>
              MeteoGIS
            </Text>
            <Text style={styles.brandSub} maxFontSizeMultiplier={1.1}>
              INDIA OPS
            </Text>
          </View>
        </View>

        {/* Search Trigger Pill */}
        <Pressable
          onPress={() => setSearchModalOpen(true)}
          style={styles.searchPill}
          accessibilityRole="search"
          accessibilityLabel="Search city, district, state or AWS station"
        >
          <Text style={styles.searchPlaceholder} numberOfLines={1} maxFontSizeMultiplier={1.15}>
            🔍 Search district, AWS…
          </Text>
        </Pressable>

        {/* LIVE / HIST Mode Pill */}
        <Pressable
          onPress={() => setOperationalMode(operationalMode === 'LIVE' ? 'HISTORICAL' : 'LIVE')}
          style={[
            styles.modeBtn,
            operationalMode === 'HISTORICAL' && styles.modeBtnHist,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Operational mode ${operationalMode}`}
        >
          <Text
            style={[
              styles.modeText,
              operationalMode === 'HISTORICAL' && { color: '#fde68a' },
            ]}
            maxFontSizeMultiplier={1.15}
          >
            {operationalMode === 'LIVE' ? '● LIVE' : '↺ HIST'}
          </Text>
        </Pressable>

        {/* Hamburger ☰ -> morphs into ✕ while LayerDrawer is open */}
        <Pressable
          onPress={() => setDrawerOpen(!isDrawerOpen)}
          style={[styles.menuBtn, isDrawerOpen && styles.menuBtnOpen]}
          accessibilityRole="button"
          accessibilityLabel={
            isDrawerOpen ? 'Close Layers and Territory drawer' : 'Open Layers and Territory drawer'
          }
        >
          <Text style={styles.menuIcon}>{isDrawerOpen ? '✕' : '☰'}</Text>
        </Pressable>
      </View>

      {/* Row 2: TopHazardStrip (Auto-collapses to 0 height when BottomSheet is FULL!) */}
      {bottomSheetSnap !== 'full' && (
        <View style={styles.hazardContainer}>
          <Pressable
            onPress={() => setTopStripExpanded(!isTopStripExpanded)}
            style={[styles.compactRow, { borderLeftColor: sev.solid }]}
            accessibilityRole="button"
            accessibilityLabel="Active hazard summary strip. Tap to expand details"
          >
            <View style={[styles.pulseDot, { backgroundColor: sev.solid }]} />
            <AlertBadge
              count={alertCount}
              label="Alerts"
              severity={activeEvent?.severity || 'ORANGE'}
            />
            <Text style={styles.compactTitle} numberOfLines={1} maxFontSizeMultiplier={1.2}>
              {activeEvent
                ? `${activeEvent.district} · ${activeEvent.severity}`
                : 'National Synoptic Watch'}
            </Text>
            <Text style={styles.countdownMono} maxFontSizeMultiplier={1.15}>
              {cd.formatted}
            </Text>
            <Text style={styles.chevron}>{isTopStripExpanded ? '▴' : '▾'}</Text>
          </Pressable>

          {/* Expanded Alert Card */}
          {isTopStripExpanded && (
            <View style={styles.expandedCard}>
              <View style={styles.expandedMetaRow}>
                <DataStatusLabel
                  state={dataState}
                  fetchedAt={fetchedAt}
                  isReferenceSnapshot={isReferenceSnapshot}
                  onRefresh={onRefresh}
                />
                {events.length > 1 && (
                  <View style={styles.stepperGroup}>
                    <Pressable
                      onPress={() =>
                        setStepperIdx((safeIndex - 1 + events.length) % events.length)
                      }
                      style={styles.stepBtn}
                      accessibilityLabel="Previous danger zone"
                    >
                      <Text style={styles.stepBtnText}>‹</Text>
                    </Pressable>
                    <Text style={styles.stepCounter}>
                      Zone {safeIndex + 1}/{events.length}
                    </Text>
                    <Pressable
                      onPress={() => setStepperIdx((safeIndex + 1) % events.length)}
                      style={styles.stepBtn}
                      accessibilityLabel="Next danger zone"
                    >
                      <Text style={styles.stepBtnText}>›</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              <Text style={styles.expandedHeadline}>
                {activeEvent?.headline || 'Active Multi-Hazard Surveillance'}
              </Text>
              <Text style={styles.expandedSummary} numberOfLines={3}>
                {activeEvent?.summary || 'Tap Inspect Zone to view ground AWS & Doppler evidence.'}
              </Text>

              <View style={styles.expandedActions}>
                <Pressable
                  onPress={toggleHazardFocusOnly}
                  style={[styles.focusBtn, isHazardFocusOnly && styles.focusBtnActive]}
                >
                  <Text style={styles.focusBtnText}>
                    ⚡ Focus Severe: {isHazardFocusOnly ? 'ON' : 'OFF'}
                  </Text>
                </Pressable>

                {activeEvent && (
                  <Pressable
                    onPress={() => onInspectEvent(activeEvent)}
                    style={styles.inspectBtn}
                  >
                    <Text style={styles.inspectBtnText}>Inspect Zone →</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#020617',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    zIndex: 30,
  },
  appBar: {
    minHeight: 54,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandGlobe: {
    fontSize: 15,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '900',
  },
  brandSub: {
    color: '#38bdf8',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  searchPill: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
  },
  searchPlaceholder: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  modeBtn: {
    minHeight: 48,
    paddingHorizontal: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtnHist: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#f59e0b',
  },
  modeText: {
    color: '#6ee7b7',
    fontSize: 10.5,
    fontWeight: '900',
  },
  menuBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtnOpen: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  menuIcon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  hazardContainer: {
    backgroundColor: '#090f1d',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  compactRow: {
    minHeight: 48,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderLeftWidth: 4,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  compactTitle: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '800',
  },
  countdownMono: {
    color: '#fde68a',
    fontSize: 12,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  chevron: {
    color: '#94a3b8',
    fontSize: 12,
  },
  expandedCard: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    gap: 8,
  },
  expandedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stepperGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
  },
  stepCounter: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  expandedHeadline: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  expandedSummary: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
  },
  expandedActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  focusBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  focusBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#f87171',
  },
  focusBtnText: {
    color: '#f1f5f9',
    fontSize: 11.5,
    fontWeight: '800',
  },
  inspectBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  inspectBtnText: {
    color: '#0f172a',
    fontSize: 12.5,
    fontWeight: '900',
  },
});
