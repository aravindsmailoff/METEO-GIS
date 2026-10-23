import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { QUICK_STATES } from '../../data/indiaGeoCatalog';

interface TerritoryPickerProps {
  selectedState: string;
  onSelectState: (stateName: string) => void;
}

export const TerritoryPicker: React.FC<TerritoryPickerProps> = ({
  selectedState,
  onSelectState,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>OPERATIONAL TERRITORY FILTER (ALL INDIA + 17 STATES)</Text>
      <View style={styles.list}>
        {QUICK_STATES.map((st) => {
          const active = st.name.toLowerCase() === selectedState.toLowerCase();
          return (
            <Pressable
              key={st.name}
              onPress={() => onSelectState(st.name)}
              style={[styles.row, active && styles.rowActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Filter territory to ${st.name}`}
            >
              <Text style={styles.icon}>{st.icon}</Text>
              <Text style={[styles.name, active && styles.nameActive]}>{st.name}</Text>
              {active && <Text style={styles.badge}>ACTIVE</Text>}
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
  list: {
    gap: 6,
  },
  row: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowActive: {
    backgroundColor: 'rgba(14, 165, 233, 0.18)',
    borderColor: '#38bdf8',
  },
  icon: {
    fontSize: 16,
  },
  name: {
    flex: 1,
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  nameActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  badge: {
    color: '#38bdf8',
    fontSize: 10.5,
    fontWeight: '800',
  },
});
