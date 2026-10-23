import React, { useRef } from 'react';
import {
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useAppStore } from '../../store/appStore';
import {
  DataState,
  DerivedHazardEvent,
  HazardsPayload,
  InspectorTab,
  PluvialFloodZone,
  RainfallObservationPoint,
  ValidatedDistrictWarning,
  ValidatedStationObservation,
} from '../../types/meteo';
import { severityColors } from '../../utils/formatters';
import { DataStatusLabel } from '../common/DataStatusLabel';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import { DataTab } from './tabs/DataTab';
import { ImpactTab } from './tabs/ImpactTab';
import { ObsTab } from './tabs/ObsTab';
import { OverviewTab } from './tabs/OverviewTab';
import { WarningsTab } from './tabs/WarningsTab';

export const COLLAPSED_SHEET_HEIGHT = 56;

const TAB_ITEMS: Array<{ id: InspectorTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'warnings', label: 'Warnings' },
  { id: 'obs', label: 'Obs' },
  { id: 'impact', label: 'Impact' },
  { id: 'data', label: 'Data' },
  { id: 'analytics', label: 'Analytics' },
];

interface BottomSheetProps {
  hazards: HazardsPayload;
  hazardsState: DataState;
  hazardsFetchedAt: number | null;
  hazardsError: string | null;
  onRetryHazards: () => void;

  warnings: ValidatedDistrictWarning[];
  warningsState: DataState;
  warningsError: string | null;
  onRetryWarnings: () => void;

  stations: ValidatedStationObservation[];
  rainfallPoints: RainfallObservationPoint[];
  stationsState: DataState;
  stationsError: string | null;
  onRetryStations: () => void;

  onSelectWarning: (w: ValidatedDistrictWarning) => void;
  onSelectHazard: (ev: DerivedHazardEvent) => void;
  onSelectPluvialZone: (z: PluvialFloodZone) => void;
  onSelectStation: (s: ValidatedStationObservation) => void;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  hazards,
  hazardsState,
  hazardsFetchedAt,
  hazardsError,
  onRetryHazards,
  warnings,
  warningsState,
  warningsError,
  onRetryWarnings,
  stations,
  rainfallPoints,
  stationsState,
  stationsError,
  onRetryStations,
  onSelectWarning,
  onSelectHazard,
  onSelectPluvialZone,
  onSelectStation,
}) => {
  const { height: windowHeight } = useWindowDimensions();
  const snap = useAppStore((s) => s.bottomSheetSnap);
  const setSnap = useAppStore((s) => s.setBottomSheetSnap);
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const selectedState = useAppStore((s) => s.selectedState);
  const selectedEvidence = useAppStore((s) => s.selectedEvidence);
  const clearSelection = useAppStore((s) => s.clearSelection);

  const sheetHeight =
    snap === 'collapsed'
      ? COLLAPSED_SHEET_HEIGHT
      : snap === 'half'
        ? Math.round(windowHeight * 0.5)
        : Math.round(windowHeight * 0.9);

  // Spec Section 5: Gesture handle ONLY moves the sheet; map pan works everywhere else without conflict!
  const handlePanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10,
      onPanResponderRelease: (_, g) => {
        const current = useAppStore.getState().bottomSheetSnap;
        if (g.dy < -28) {
          setSnap(current === 'collapsed' ? 'half' : 'full');
        } else if (g.dy > 28) {
          setSnap(current === 'full' ? 'half' : 'collapsed');
        }
      },
    })
  ).current;

  const primaryEvent = hazards.events[0] || null;
  const activeTitle = selectedEvidence
    ? `${selectedEvidence.locationName}`
    : selectedState !== 'All India'
      ? `${selectedState} Sector`
      : 'All India Surveillance';
  const activeSeverity =
    selectedEvidence?.severity || primaryEvent?.severity || 'ORANGE';
  const sev = severityColors(activeSeverity);

  return (
    <View style={[styles.sheet, { height: sheetHeight }]}>
      {/* Top 56dp Handle + Location Header Bar */}
      <Pressable
        {...handlePanResponder.panHandlers}
        onPress={() => {
          // Spec Section 5: Tap anywhere on 56dp collapsed bar -> snap to HALF immediately!
          if (snap === 'collapsed') {
            setSnap('half');
          }
        }}
        style={styles.handleHeader}
        accessibilityRole="button"
        accessibilityLabel={
          snap === 'collapsed'
            ? `${activeTitle}. Collapsed bottom sheet. Tap to expand to half height`
            : `${activeTitle}. Drag handle to resize bottom sheet`
        }
      >
        <View style={styles.dragPill} />
        <View style={styles.headerRow}>
          <View style={styles.locationGroup}>
            <View style={[styles.sevDot, { backgroundColor: sev.solid }]} />
            <Text style={styles.locationTitle} numberOfLines={1} maxFontSizeMultiplier={1.2}>
              {activeTitle}
            </Text>
          </View>

          <View style={styles.rightBadges}>
            <DataStatusLabel
              state={hazardsState}
              fetchedAt={hazardsFetchedAt}
              isReferenceSnapshot={hazards.isReferenceSnapshot}
            />
            {snap !== 'collapsed' && (
              <Pressable
                onPress={() => setSnap(snap === 'half' ? 'full' : 'half')}
                style={styles.snapStepBtn}
                accessibilityRole="button"
                accessibilityLabel={snap === 'half' ? 'Expand sheet full' : 'Restore half height'}
              >
                <Text style={styles.snapStepText}>{snap === 'half' ? '⤢' : '⤡'}</Text>
              </Pressable>
            )}
            {snap !== 'collapsed' && (
              <Pressable
                onPress={() => {
                  if (selectedEvidence) {
                    clearSelection();
                  } else {
                    setSnap('collapsed');
                  }
                }}
                style={styles.snapStepBtn}
                accessibilityRole="button"
                accessibilityLabel="Collapse sheet"
              >
                <Text style={styles.snapStepText}>▾</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>

      {/* Tabs & Scrollable Content ONLY rendered at HALF or FULL (Spec Section 5 fix) */}
      {snap !== 'collapsed' && (
        <>
          <View style={styles.tabsWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsRow}
            >
              {TAB_ITEMS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => setActiveTab(tab.id)}
                    style={[styles.tabPill, active && styles.tabPillActive]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                  >
                    <Text
                      style={[styles.tabLabel, active && styles.tabLabelActive]}
                      maxFontSizeMultiplier={1.2}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.contentInner}
            showsVerticalScrollIndicator
          >
            {activeTab === 'overview' && (
              <OverviewTab
                hazards={hazards}
                warnings={warnings}
                dataState={hazardsState}
                errorMessage={hazardsError}
                onRetry={onRetryHazards}
                onSelectPluvialZone={onSelectPluvialZone}
                onSelectHazard={onSelectHazard}
              />
            )}

            {activeTab === 'warnings' && (
              <WarningsTab
                warnings={warnings}
                dataState={warningsState}
                errorMessage={warningsError}
                onRetry={onRetryWarnings}
                onSelectWarning={onSelectWarning}
              />
            )}

            {activeTab === 'obs' && (
              <ObsTab
                stations={stations}
                rainfallPoints={rainfallPoints}
                dataState={stationsState}
                errorMessage={stationsError}
                onRetry={onRetryStations}
                onSelectStation={onSelectStation}
              />
            )}

            {activeTab === 'impact' && <ImpactTab hazards={hazards} />}

            {activeTab === 'data' && <DataTab />}

            {activeTab === 'analytics' && (
              <AnalyticsTab
                hazards={hazards}
                fetchedAt={hazardsFetchedAt}
                height={snap === 'full' ? Math.round(windowHeight * 0.64) : 340}
              />
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#070d1a',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1.5,
    borderTopColor: '#334155',
    zIndex: 35,
    overflow: 'hidden',
  },
  handleHeader: {
    height: COLLAPSED_SHEET_HEIGHT,
    paddingHorizontal: 12,
    paddingTop: 5,
    paddingBottom: 6,
    justifyContent: 'space-between',
    backgroundColor: '#091122',
  },
  dragPill: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#475569',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  locationGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sevDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  locationTitle: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 13.5,
    fontWeight: '800',
  },
  rightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  snapStepBtn: {
    minWidth: 48,
    minHeight: 36,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapStepText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '800',
  },
  tabsWrapper: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#0b1324',
  },
  tabsRow: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  tabPill: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  tabLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  contentScroll: {
    flex: 1,
  },
  contentInner: {
    padding: 12,
    paddingBottom: 28,
  },
});
