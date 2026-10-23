import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getDataStatusBadgeConfig } from '../../safety/feedIntegrity';
import { DataState } from '../../types/meteo';

interface DataStatusLabelProps {
  state: DataState;
  fetchedAt: number | null;
  onRefresh?: () => void;
  isReferenceSnapshot?: boolean;
}

export const DataStatusLabel: React.FC<DataStatusLabelProps> = ({
  state,
  fetchedAt,
  onRefresh,
  isReferenceSnapshot = false,
}) => {
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 20000);
    return () => clearInterval(id);
  }, []);

  const config = getDataStatusBadgeConfig({
    state,
    fetchedAt,
    nowMs,
    isReferenceSnapshot,
  });

  if (onRefresh) {
    return (
      <Pressable
        onPress={onRefresh}
        hitSlop={10}
        style={[styles.container, { backgroundColor: config.bg, borderColor: config.border }]}
        accessibilityRole="button"
        accessibilityLabel={`${config.label}. Tap to refresh`}
      >
        <View style={[styles.dot, { backgroundColor: config.dot }]} />
        <Text
          style={[styles.label, { color: config.text }]}
          numberOfLines={1}
          maxFontSizeMultiplier={1.2}
        >
          {config.label}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: config.bg, borderColor: config.border }]}>
      <View style={[styles.dot, { backgroundColor: config.dot }]} />
      <Text
        style={[styles.label, { color: config.text }]}
        numberOfLines={1}
        maxFontSizeMultiplier={1.2}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
});
