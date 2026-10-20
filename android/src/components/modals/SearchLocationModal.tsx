import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SEARCH_LOCATIONS } from '../../data/indiaGeoCatalog';
import { useAppStore } from '../../store/appStore';
import { ValidatedStationObservation } from '../../types/meteo';

interface SearchLocationModalProps {
  stations: ValidatedStationObservation[];
  onPickLocation: (lat: number, lng: number, name: string, state: string) => void;
}

export const SearchLocationModal: React.FC<SearchLocationModalProps> = ({
  stations,
  onPickLocation,
}) => {
  const isOpen = useAppStore((s) => s.isSearchModalOpen);
  const setSearchModalOpen = useAppStore((s) => s.setSearchModalOpen);
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cityMatches = SEARCH_LOCATIONS.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.sub.toLowerCase().includes(q)
    ).map((c) => ({
      id: `city:${c.name}`,
      name: c.name,
      sub: c.sub,
      lat: c.lat,
      lng: c.lng,
      tag: 'DISTRICT / CITY',
    }));

    const stnMatches = q
      ? stations
          .filter(
            (s) =>
              s.stationName.toLowerCase().includes(q) ||
              s.district.toLowerCase().includes(q) ||
              s.state.toLowerCase().includes(q)
          )
          .slice(0, 12)
          .map((s) => ({
            id: `aws:${s.id}`,
            name: s.stationName,
            sub: `${s.district}, ${s.state}`,
            lat: s.latitude,
            lng: s.longitude,
            tag: 'IMD AWS',
          }))
      : [];

    return [...stnMatches, ...cityMatches];
  }, [query, stations]);

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      transparent
      onRequestClose={() => setSearchModalOpen(false)}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.topRow}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search city, district, state or AWS station…"
              placeholderTextColor="#64748b"
              autoFocus
              style={styles.input}
            />
            <Pressable
              onPress={() => setSearchModalOpen(false)}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close search"
            >
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {results.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  onPickLocation(item.lat, item.lng, item.name, item.sub);
                  setSearchModalOpen(false);
                }}
                style={styles.row}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{item.name}</Text>
                  <Text style={styles.rowSub}>{item.sub}</Text>
                </View>
                <Text style={styles.rowTag}>{item.tag}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.92)',
    padding: 12,
  },
  sheet: {
    flex: 1,
    backgroundColor: '#070d1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  topRow: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  input: {
    flex: 1,
    minHeight: 48,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#38bdf8',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#f8fafc',
    fontSize: 14,
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
    fontSize: 16,
    fontWeight: '800',
  },
  list: {
    flex: 1,
    paddingHorizontal: 10,
  },
  row: {
    minHeight: 54,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowName: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '700',
  },
  rowSub: {
    color: '#94a3b8',
    fontSize: 11.5,
    marginTop: 2,
  },
  rowTag: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
  },
});
