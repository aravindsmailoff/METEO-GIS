import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DataStatusLabel } from '../components/common/DataStatusLabel';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorRetry } from '../components/common/ErrorRetry';
import { LoadingState } from '../components/common/LoadingState';
import { OfflineBanner } from '../components/common/OfflineBanner';
import { SampleDataBanner } from '../components/common/SampleDataBanner';
import { QUICK_STATES } from '../data/indiaGeoCatalog';
import { useHazards } from '../hooks/useHazards';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useSelection } from '../hooks/useSelection';
import { useStations } from '../hooks/useStations';
import { useWarnings } from '../hooks/useWarnings';
import { useAppStore } from '../store/appStore';
import { severityColors } from '../utils/formatters';

export const AlertsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isOnline } = useNetworkStatus();
  const selectedState = useAppStore((s) => s.selectedState);
  const setSelectedState = useAppStore((s) => s.setSelectedState);

  const { warnings, dataState, fetchedAt, errorMessage, refetch, warningsPayload } = useWarnings();
  const { hazards, refetch: refetchHazards } = useHazards();
  const { stations } = useStations();
  const { selectWarning, selectHazard } = useSelection(stations);

  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'RED' | 'ORANGE' | 'YELLOW'>('ALL');
  const [searchText, setSearchText] = useState<string>('');

  const filteredWarnings = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return warnings.filter((w) => {
      if (severityFilter !== 'ALL' && w.currentAlertLevel !== severityFilter) {
        return false;
      }
      if (!q) return true;
      return (
        w.district.toLowerCase().includes(q) ||
        (w.state && w.state.toLowerCase().includes(q)) ||
        (w.currentWarning && w.currentWarning.toLowerCase().includes(q))
      );
    });
  }, [searchText, severityFilter, warnings]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Active Warnings & Nowcasts</Text>
          <Text style={styles.sub}>
            Tap any district alert to center map & inspect bulletin
          </Text>
        </View>
        <DataStatusLabel
          state={dataState}
          fetchedAt={fetchedAt}
          isReferenceSnapshot={warningsPayload.isReferenceSnapshot}
          onRefresh={() => {
            refetch();
            refetchHazards();
          }}
        />
      </View>

      {(dataState === 'sample' || warningsPayload.isReferenceSnapshot) && <SampleDataBanner />}

      {!isOnline && <OfflineBanner fetchedAt={fetchedAt} onRetry={refetch} />}

      <View style={styles.filterBlock}>
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Filter district, state, or warning type…"
          placeholderTextColor="#64748b"
          style={styles.searchInput}
        />

        <View style={styles.sevRow}>
          {(['ALL', 'RED', 'ORANGE', 'YELLOW'] as const).map((level) => {
            const active = severityFilter === level;
            return (
              <Pressable
                key={level}
                onPress={() => setSeverityFilter(level)}
                style={[styles.sevChip, active && styles.sevChipActive]}
              >
                <Text style={[styles.sevChipText, active && styles.sevChipTextActive]}>
                  {level}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stateStrip}
        >
          {QUICK_STATES.map((st) => {
            const active = st.name === selectedState;
            return (
              <Pressable
                key={st.name}
                onPress={() => setSelectedState(st.name)}
                style={[styles.stateChip, active && styles.stateChipActive]}
              >
                <Text style={[styles.stateText, active && styles.stateTextActive]}>
                  {st.icon} {st.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {dataState === 'loading' && warnings.length === 0 ? (
          <LoadingState message="Fetching district warning feed…" />
        ) : dataState === 'error' && warnings.length === 0 ? (
          <ErrorRetry message={errorMessage || undefined} onRetry={refetch} />
        ) : filteredWarnings.length === 0 && hazards.events.length === 0 ? (
          <EmptyState title="No active warnings match your current filter." />
        ) : (
          <>
            {hazards.events
              .filter(
                (ev) =>
                  severityFilter === 'ALL' || ev.severity === severityFilter
              )
              .map((ev) => {
                const c = severityColors(ev.severity);
                return (
                  <Pressable
                    key={`haz-${ev.id}`}
                    onPress={() => {
                      selectHazard(ev);
                      navigation.navigate('Map');
                    }}
                    style={[styles.card, { borderColor: c.border }]}
                  >
                    <View style={styles.cardTop}>
                      <Text style={styles.cardTitle}>
                        ⚡ {ev.district}, {ev.state}
                      </Text>
                      <View style={[styles.badge, { backgroundColor: c.solid }]}>
                        <Text style={[styles.badgeText, { color: c.badgeText }]}>
                          {ev.severity}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.cardBody}>{ev.summary}</Text>
                    <Text style={styles.cardFooter}>
                      Source: IMD {ev.sourceEndpoint} · Tap to Inspect on Map →
                    </Text>
                  </Pressable>
                );
              })}

            {filteredWarnings.map((w) => {
              const c = severityColors(w.currentAlertLevel);
              return (
                <Pressable
                  key={w.objId}
                  onPress={() => {
                    selectWarning(w);
                    navigation.navigate('Map');
                  }}
                  style={[styles.card, { borderColor: c.border }]}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle}>
                      🛡️ {w.district}
                      {w.state ? `, ${w.state}` : ''}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: c.solid }]}>
                      <Text style={[styles.badgeText, { color: c.badgeText }]}>
                        {w.currentAlertLevel}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardBody}>
                    {w.currentWarning || w.day1Warning}
                  </Text>
                  <Text style={styles.cardFooter}>
                    {w.source} · Updated {w.updatedAtIST} · View on Map →
                  </Text>
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  sub: {
    color: '#94a3b8',
    fontSize: 11.5,
    marginTop: 2,
  },
  filterBlock: {
    padding: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#070d1a',
  },
  searchInput: {
    minHeight: 48,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#f8fafc',
    fontSize: 13,
  },
  sevRow: {
    flexDirection: 'row',
    gap: 6,
  },
  sevChip: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sevChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  sevChipText: {
    color: '#94a3b8',
    fontSize: 11.5,
    fontWeight: '800',
  },
  sevChipTextActive: {
    color: '#ffffff',
  },
  stateStrip: {
    gap: 6,
    paddingVertical: 2,
  },
  stateChip: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateChipActive: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderColor: '#38bdf8',
  },
  stateText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  stateTextActive: {
    color: '#ffffff',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 12,
    gap: 10,
    paddingBottom: 28,
  },
  card: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    gap: 6,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '900',
  },
  cardBody: {
    color: '#cbd5e1',
    fontSize: 12.5,
    lineHeight: 18,
  },
  cardFooter: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
});
