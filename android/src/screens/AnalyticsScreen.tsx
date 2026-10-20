import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { DataStatusLabel } from '../components/common/DataStatusLabel';
import { OfflineBanner } from '../components/common/OfflineBanner';
import { ImdRadarModal } from '../components/modals/ImdRadarModal';
import { AnalyticsTab } from '../components/sheets/tabs/AnalyticsTab';
import { QUICK_STATES } from '../data/indiaGeoCatalog';
import { useHazards } from '../hooks/useHazards';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useAppStore } from '../store/appStore';

export const AnalyticsScreen: React.FC = () => {
  const { height: windowHeight } = useWindowDimensions();
  const { isOnline } = useNetworkStatus();
  const selectedState = useAppStore((s) => s.selectedState);
  const setSelectedState = useAppStore((s) => s.setSelectedState);

  const { hazards, dataState, fetchedAt, refetch } = useHazards();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Meteorological Analytics</Text>
          <Text style={styles.sub}>
            Connected to /mobile-analytics + Native SVG Offline Charts
          </Text>
        </View>
        <DataStatusLabel
          state={dataState}
          fetchedAt={fetchedAt}
          isReferenceSnapshot={hazards.isReferenceSnapshot}
          onRefresh={refetch}
        />
      </View>

      {!isOnline && <OfflineBanner fetchedAt={fetchedAt} onRetry={refetch} />}

      {/* State Territory Slicer */}
      <View style={styles.slicerWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.slicerRow}
        >
          {QUICK_STATES.map((st) => {
            const active = st.name === selectedState;
            return (
              <Pressable
                key={st.name}
                onPress={() => setSelectedState(st.name)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {st.icon} {st.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <AnalyticsTab
          hazards={hazards}
          fetchedAt={fetchedAt}
          height={Math.max(460, windowHeight - 250)}
        />
      </ScrollView>

      <ImdRadarModal />
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
  slicerWrap: {
    backgroundColor: '#070d1a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingVertical: 8,
  },
  slicerRow: {
    paddingHorizontal: 10,
    gap: 6,
  },
  chip: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  chipText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 12,
    paddingBottom: 28,
  },
});
