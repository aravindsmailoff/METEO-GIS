import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '../../../store/appStore';
import { DataState, ValidatedDistrictWarning } from '../../../types/meteo';
import { severityColors } from '../../../utils/formatters';
import { EmptyState } from '../../common/EmptyState';
import { ErrorRetry } from '../../common/ErrorRetry';
import { LoadingState } from '../../common/LoadingState';

interface WarningsTabProps {
  warnings: ValidatedDistrictWarning[];
  dataState: DataState;
  errorMessage: string | null;
  onRetry: () => void;
  onSelectWarning: (w: ValidatedDistrictWarning) => void;
}

export const WarningsTab: React.FC<WarningsTabProps> = ({
  warnings,
  dataState,
  errorMessage,
  onRetry,
  onSelectWarning,
}) => {
  const selectedWarningObjId = useAppStore((s) => s.selectedWarningObjId);

  if (dataState === 'loading' && warnings.length === 0) {
    return <LoadingState message="Fetching 5-day IMD district warning bulletins…" />;
  }
  if (dataState === 'error' && warnings.length === 0) {
    return <ErrorRetry message={errorMessage || undefined} onRetry={onRetry} />;
  }
  if (warnings.length === 0) {
    return <EmptyState title="No active warnings for this region." />;
  }

  // Bring selected district warning right to top if highlighted
  const sortedWarnings = [...warnings].sort((a, b) => {
    if (a.objId === selectedWarningObjId) return -1;
    if (b.objId === selectedWarningObjId) return 1;
    const rank = (s: string) =>
      s === 'RED' ? 4 : s === 'ORANGE' ? 3 : s === 'YELLOW' ? 2 : 1;
    return rank(b.currentAlertLevel) - rank(a.currentAlertLevel);
  });

  return (
    <View style={styles.list}>
      <Text style={styles.heading}>
        OFFICIAL 5-DAY DISTRICT BULLETINS ({sortedWarnings.length})
      </Text>
      {sortedWarnings.map((w) => {
        const isSelected = w.objId === selectedWarningObjId;
        const sev = severityColors(w.currentAlertLevel);
        const days = [
          { label: 'D1', color: w.day1Color },
          { label: 'D2', color: w.day2Color },
          { label: 'D3', color: w.day3Color },
          { label: 'D4', color: w.day4Color },
          { label: 'D5', color: w.day5Color },
        ];

        return (
          <Pressable
            key={w.objId}
            onPress={() => onSelectWarning(w)}
            style={[
              styles.card,
              { borderColor: isSelected ? '#38bdf8' : sev.border },
              isSelected && styles.cardSelected,
            ]}
          >
            <View style={styles.topRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.district}>
                  {w.district}
                  {w.state ? `, ${w.state}` : ''}
                </Text>
                <Text style={styles.meta}>
                  {w.source} · {w.updatedAtIST}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: sev.solid }]}>
                <Text style={[styles.badgeText, { color: sev.badgeText }]}>
                  {w.currentAlertLevel}
                </Text>
              </View>
            </View>

            <Text style={styles.warningCopy}>
              {w.currentWarning || w.day1Warning}
            </Text>

            {/* 5-Day Color Matrix */}
            <View style={styles.dayRow}>
              {days.map((d) => {
                const dc = severityColors(d.color);
                return (
                  <View
                    key={d.label}
                    style={[
                      styles.dayPill,
                      { backgroundColor: dc.bg, borderColor: dc.border },
                    ]}
                  >
                    <Text style={[styles.dayText, { color: dc.text }]}>
                      {d.label}: {d.color.slice(0, 3)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  heading: {
    color: '#94a3b8',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  card: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    gap: 8,
  },
  cardSelected: {
    backgroundColor: 'rgba(14, 165, 233, 0.16)',
    borderWidth: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  district: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
  },
  meta: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  warningCopy: {
    color: '#e2e8f0',
    fontSize: 12.5,
    lineHeight: 18,
  },
  dayRow: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
  },
  dayPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  dayText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
