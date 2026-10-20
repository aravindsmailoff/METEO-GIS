import React, { useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import axios from 'axios';
import { API_ROUTES } from '../config/api';
import { OfflineBanner } from '../components/common/OfflineBanner';
import { SampleDataBanner } from '../components/common/SampleDataBanner';
import { LayerDrawer } from '../components/drawer/LayerDrawer';
import { MapCanvas } from '../components/map/MapCanvas';
import { ImdRadarModal } from '../components/modals/ImdRadarModal';
import { InsatSatelliteModal } from '../components/modals/InsatSatelliteModal';
import { SearchLocationModal } from '../components/modals/SearchLocationModal';
import { BottomSheet, COLLAPSED_SHEET_HEIGHT } from '../components/sheets/BottomSheet';
import { TopHazardStrip } from '../components/sheets/TopHazardStrip';
import { useHazards } from '../hooks/useHazards';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useSelection } from '../hooks/useSelection';
import { useStations } from '../hooks/useStations';
import { useWarnings } from '../hooks/useWarnings';
import { useAppStore } from '../store/appStore';

export const MapScreen: React.FC = () => {
  const { isOnline } = useNetworkStatus();
  const operationalMode = useAppStore((s) => s.operationalMode);
  const setOperationalMode = useAppStore((s) => s.setOperationalMode);
  const handleHardwareBackPress = useAppStore((s) => s.handleHardwareBackPress);

  const {
    hazards,
    dataState: hazardsState,
    fetchedAt: hazardsFetchedAt,
    errorMessage: hazardsError,
    refetch: refetchHazards,
  } = useHazards();

  const {
    warnings,
    dataState: warningsState,
    errorMessage: warningsError,
    refetch: refetchWarnings,
  } = useWarnings();

  const {
    stations,
    rainfallPoints,
    dataState: stationsState,
    errorMessage: stationsError,
    refetch: refetchStations,
  } = useStations();

  const {
    selectWarning,
    selectHazard,
    selectPluvialZone,
    selectStation,
    selectCoordinates,
  } = useSelection(stations);

  const [historicalCount, setHistoricalCount] = useState<number | null>(null);

  // Android Hardware Back Button Priority Stack (Spec Section 7)
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      return handleHardwareBackPress();
    });
    return () => sub.remove();
  }, [handleHardwareBackPress]);

  // Historical archive count when switched to HISTORICAL mode
  useEffect(() => {
    if (operationalMode !== 'HISTORICAL') return;
    axios
      .get(API_ROUTES.historicalLandslides(), {
        timeout: 5000,
      })
      .then((res) => {
        const count =
          typeof res.data?.count === 'number'
            ? res.data.count
            : Array.isArray(res.data?.data)
              ? res.data.data.length
              : null;
        setHistoricalCount(count);
      })
      .catch(() => setHistoricalCount(null));
  }, [operationalMode]);

  const refreshAll = () => {
    refetchHazards();
    refetchWarnings();
    refetchStations();
  };

  const totalAlerts = Math.max(
    warnings.filter((w) => w.currentAlertLevel !== 'GREEN').length,
    hazards.events.length
  );

  return (
    <View style={styles.screen}>
      {/* Top Non-Overlapping Chrome Stack */}
      <TopHazardStrip
        events={hazards.events}
        alertCount={totalAlerts}
        dataState={hazardsState}
        fetchedAt={hazardsFetchedAt}
        isReferenceSnapshot={hazards.isReferenceSnapshot}
        onRefresh={refreshAll}
        onInspectEvent={(ev) => selectHazard(ev)}
      />

      {(hazardsState === 'sample' || hazards.isReferenceSnapshot) && <SampleDataBanner />}

      {!isOnline && (
        <OfflineBanner fetchedAt={hazardsFetchedAt} onRetry={refreshAll} />
      )}

      {operationalMode === 'HISTORICAL' && (
        <View style={styles.histBar}>
          <Text style={styles.histText} numberOfLines={1}>
            {historicalCount !== null
              ? `📜 Historical Archive Mode · ${historicalCount} ISRO/GSI events indexed`
              : '📜 Historical Archive Mode · Archive feed unavailable'}
          </Text>
          <Pressable
            onPress={() => setOperationalMode('LIVE')}
            style={styles.returnLiveBtn}
          >
            <Text style={styles.returnLiveText}>Return LIVE</Text>
          </Pressable>
        </View>
      )}

      {/* Map Viewport (Strictly reserved above 56dp collapsed sheet so ZERO elements collide!) */}
      <View style={styles.mapSlot}>
        <MapCanvas
          hazards={hazards.events}
          warnings={warnings}
          pluvialZones={hazards.pluvialFloodZones}
          stations={stations}
          rainfallPoints={rainfallPoints}
          onSelectWarning={selectWarning}
          onSelectHazard={selectHazard}
          onSelectPluvialZone={selectPluvialZone}
          onSelectStation={selectStation}
          onLocateUserGps={(lat, lng) =>
            selectCoordinates(lat, lng, 'Current Field Position', 'India', true)
          }
        />
      </View>

      {/* 3-Snap Draggable Bottom Sheet (Collapsed 56dp -> Half 50vh -> Full 90vh) */}
      <BottomSheet
        hazards={hazards}
        hazardsState={hazardsState}
        hazardsFetchedAt={hazardsFetchedAt}
        hazardsError={hazardsError}
        onRetryHazards={refetchHazards}
        warnings={warnings}
        warningsState={warningsState}
        warningsError={warningsError}
        onRetryWarnings={refetchWarnings}
        stations={stations}
        rainfallPoints={rainfallPoints}
        stationsState={stationsState}
        stationsError={stationsError}
        onRetryStations={refetchStations}
        onSelectWarning={selectWarning}
        onSelectHazard={selectHazard}
        onSelectPluvialZone={selectPluvialZone}
        onSelectStation={selectStation}
      />

      {/* Right-Slide / Small-Phone Fullscreen Layer Drawer */}
      <LayerDrawer
        pluvialZones={hazards.pluvialFloodZones}
        onSelectPluvialZone={selectPluvialZone}
      />

      {/* Dedicated Full-View Modals */}
      <ImdRadarModal />
      <InsatSatelliteModal />
      <SearchLocationModal
        stations={stations}
        onPickLocation={(lat, lng, name, state) =>
          selectCoordinates(lat, lng, name, state, false)
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#020617',
    position: 'relative',
  },
  histBar: {
    minHeight: 48,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(120, 53, 15, 0.45)',
    borderBottomWidth: 1,
    borderBottomColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  histText: {
    flex: 1,
    color: '#fef3c7',
    fontSize: 11.5,
    fontWeight: '700',
  },
  returnLiveBtn: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  returnLiveText: {
    color: '#0f172a',
    fontSize: 11.5,
    fontWeight: '900',
  },
  mapSlot: {
    flex: 1,
    marginBottom: COLLAPSED_SHEET_HEIGHT,
  },
});
