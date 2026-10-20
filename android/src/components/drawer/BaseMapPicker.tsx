import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { METEO_MAPS } from '../../data/indiaGeoCatalog';
import { BaseMapId } from '../../types/meteo';

interface BaseMapPickerProps {
  selectedBaseMap: BaseMapId;
  onSelectBaseMap: (id: BaseMapId) => void;
}

export const BaseMapPicker: React.FC<BaseMapPickerProps> = ({
  selectedBaseMap,
  onSelectBaseMap,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>METEOROLOGICAL & ISRO BHUVAN BASE MAPS (9)</Text>
      <View style={styles.grid}>
        {METEO_MAPS.map((item) => {
          const active = item.id === selectedBaseMap;
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelectBaseMap(item.id)}
              style={[styles.card, active && styles.cardActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={`${item.label}. ${item.sub}`}
            >
              <View style={styles.cardTop}>
                <Text style={styles.icon}>{item.icon}</Text>
                {active && <Text style={styles.check}>✓</Text>}
              </View>
              <Text style={[styles.title, active && styles.titleActive]} numberOfLines={2}>
                {item.label}
              </Text>
              <Text style={styles.sub} numberOfLines={2}>
                {item.sub}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  heading: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    width: '48.4%',
    minHeight: 74,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 3,
  },
  cardActive: {
    backgroundColor: 'rgba(14, 165, 233, 0.16)',
    borderColor: '#38bdf8',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: {
    fontSize: 18,
  },
  check: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '900',
  },
  title: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
  },
  titleActive: {
    color: '#ffffff',
  },
  sub: {
    color: '#64748b',
    fontSize: 10.5,
    lineHeight: 14,
  },
});
