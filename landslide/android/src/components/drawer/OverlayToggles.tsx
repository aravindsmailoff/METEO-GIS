import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { LayerPreferences, PluvialFloodZone } from '../../types/meteo';

interface OverlayTogglesProps {
  layerConfig: LayerPreferences;
  onToggle: (key: keyof Omit<LayerPreferences, 'baseMap'>) => void;
  pluvialZones: PluvialFloodZone[];
  onSelectPluvialZone: (zone: PluvialFloodZone) => void;
}

const OVERLAY_ITEMS: Array<{
  key: keyof Omit<LayerPreferences, 'baseMap'>;
  icon: string;
  label: string;
  desc: string;
}> = [
  {
    key: 'showDistrictWarnings',
    icon: '🛡️',
    label: 'IMD District Warnings',
    desc: '5-day color-coded severe weather bulletins',
  },
  {
    key: 'showLiveRainfall',
    icon: '🌧️',
    label: 'Rainfall Gauges (24h)',
    desc: 'Observed precipitation intensity classification',
  },
  {
    key: 'showAwsStations',
    icon: '📍',
    label: 'AWS Telemetry Stations',
    desc: '15-min ground temperature, wind & pressure',
  },
  {
    key: 'showDwrRings',
    icon: '📡',
    label: 'DWR Radar Coverage Rings',
    desc: 'Dual-Pol Doppler 250 km surveillance envelopes',
  },
  {
    key: 'showPluvialFloodLayer',
    icon: '🌊',
    label: 'Low-Lying DEM Inundation',
    desc: 'NRSC depression basins & urban flood corridors',
  },
];

export const OverlayToggles: React.FC<OverlayTogglesProps> = ({
  layerConfig,
  onToggle,
  pluvialZones,
  onSelectPluvialZone,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>OPERATIONAL GIS OVERLAYS (5)</Text>
      <View style={styles.list}>
        {OVERLAY_ITEMS.map((item) => {
          const value = layerConfig[item.key];
          return (
            <Pressable
              key={item.key}
              onPress={() => onToggle(item.key)}
              style={styles.row}
              accessibilityRole="switch"
              accessibilityState={{ checked: value }}
              accessibilityLabel={item.label}
            >
              <Text style={styles.rowIcon}>{item.icon}</Text>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{item.label}</Text>
                <Text style={styles.rowDesc}>{item.desc}</Text>
              </View>
              <Switch
                value={value}
                onValueChange={() => onToggle(item.key)}
                trackColor={{ false: '#334155', true: '#0284c7' }}
                thumbColor={value ? '#f8fafc' : '#94a3b8'}
              />
            </Pressable>
          );
        })}
      </View>

      {pluvialZones.length > 0 && (
        <View style={styles.hotspotsBox}>
          <Text style={styles.heading}>LOW-LYING CITY INUNDATION CORRIDORS</Text>
          <Text style={styles.hotspotHint}>
            Tap any corridor to auto-switch to ISRO Bhuvan Satellite and inspect affected structures:
          </Text>
          {pluvialZones.map((zone) => (
            <Pressable
              key={zone.id}
              onPress={() => onSelectPluvialZone(zone)}
              style={styles.hotspotBtn}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.hotspotTitle}>{zone.zoneName}</Text>
                <Text style={styles.hotspotSub}>
                  {zone.district}, {zone.state} · 24h Rain: {zone.cumulativeRain24hMm} mm
                </Text>
              </View>
              <Text style={styles.hotspotRisk}>{zone.pluvialFloodRisk}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  heading: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  list: {
    gap: 8,
  },
  row: {
    minHeight: 54,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowIcon: {
    fontSize: 18,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '700',
  },
  rowDesc: {
    color: '#94a3b8',
    fontSize: 11,
  },
  hotspotsBox: {
    marginTop: 6,
    gap: 8,
  },
  hotspotHint: {
    color: '#64748b',
    fontSize: 11,
    lineHeight: 15,
  },
  hotspotBtn: {
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hotspotTitle: {
    color: '#f8fafc',
    fontSize: 12.5,
    fontWeight: '700',
  },
  hotspotSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  hotspotRisk: {
    color: '#fb923c',
    fontSize: 11,
    fontWeight: '800',
  },
});
