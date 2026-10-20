import React, { useMemo, useRef, useState } from 'react';
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
import { PluvialFloodZone } from '../../types/meteo';
import { BaseMapPicker } from './BaseMapPicker';
import { OverlayToggles } from './OverlayToggles';
import { TerritoryPicker } from './TerritoryPicker';

interface LayerDrawerProps {
  pluvialZones: PluvialFloodZone[];
  onSelectPluvialZone: (zone: PluvialFloodZone) => void;
}

export const LayerDrawer: React.FC<LayerDrawerProps> = ({
  pluvialZones,
  onSelectPluvialZone,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const isDrawerOpen = useAppStore((s) => s.isDrawerOpen);
  const setDrawerOpen = useAppStore((s) => s.setDrawerOpen);
  const layerConfig = useAppStore((s) => s.layerConfig);
  const setBaseMap = useAppStore((s) => s.setBaseMap);
  const toggleOverlay = useAppStore((s) => s.toggleOverlay);
  const selectedState = useAppStore((s) => s.selectedState);
  const setSelectedState = useAppStore((s) => s.setSelectedState);

  const [section, setSection] = useState<'maps' | 'overlays' | 'territory'>('overlays');

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dx > 22 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        if (g.dx > 48) {
          setDrawerOpen(false);
        }
      },
    })
  ).current;

  const activeCount = useMemo(
    () =>
      [
        layerConfig.showDistrictWarnings,
        layerConfig.showLiveRainfall,
        layerConfig.showAwsStations,
        layerConfig.showDwrRings,
        layerConfig.showPluvialFloodLayer,
      ].filter(Boolean).length,
    [layerConfig]
  );

  if (!isDrawerOpen) return null;

  // Spec Section 5: full-screen on <360dp small phones, right-slide drawer otherwise
  const isFullWidth = screenWidth <= 365;
  const drawerWidth = isFullWidth ? screenWidth : Math.min(360, Math.round(screenWidth * 0.88));

  return (
    <View style={styles.overlayRoot} pointerEvents="box-none">
      <Pressable
        style={styles.scrim}
        onPress={() => setDrawerOpen(false)}
        accessibilityLabel="Close Layers and Territory drawer"
      />
      <View
        style={[styles.panel, { width: drawerWidth }]}
        {...panResponder.panHandlers}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Layers & Territory</Text>
            <Text style={styles.headerSub}>
              {activeCount}/5 Overlays Active · {selectedState}
            </Text>
          </View>
          <Pressable
            onPress={() => setDrawerOpen(false)}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close drawer"
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        {/* Sub-Tabs */}
        <View style={styles.tabBar}>
          {(
            [
              { id: 'overlays', label: `Overlays (${activeCount})` },
              { id: 'maps', label: 'Base Maps (9)' },
              { id: 'territory', label: 'Territory' },
            ] as const
          ).map((tab) => {
            const active = section === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setSection(tab.id)}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {section === 'maps' && (
            <BaseMapPicker
              selectedBaseMap={layerConfig.baseMap}
              onSelectBaseMap={(id) => {
                setBaseMap(id);
              }}
            />
          )}

          {section === 'overlays' && (
            <OverlayToggles
              layerConfig={layerConfig}
              onToggle={toggleOverlay}
              pluvialZones={pluvialZones}
              onSelectPluvialZone={(zone) => {
                onSelectPluvialZone(zone);
                setDrawerOpen(false);
              }}
            />
          )}

          {section === 'territory' && (
            <TerritoryPicker
              selectedState={selectedState}
              onSelectState={(stateName) => {
                setSelectedState(stateName);
                setDrawerOpen(false);
              }}
            />
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.72)',
  },
  panel: {
    height: '100%',
    backgroundColor: '#070d1a',
    borderLeftWidth: 1,
    borderLeftColor: '#1e293b',
    zIndex: 51,
  },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
  },
  headerSub: {
    color: '#38bdf8',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '800',
  },
  tabBar: {
    flexDirection: 'row',
    padding: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0b1324',
  },
  tabBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(14, 165, 233, 0.22)',
    borderColor: '#38bdf8',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 11.5,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 12,
    paddingBottom: 32,
  },
});
