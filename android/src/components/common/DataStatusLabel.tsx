import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DataState } from '../../types/meteo';
import { formatRelativeMinutes } from '../../utils/formatters';

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

  const config = (() => {
    switch (state) {
      case 'loading':
        return {
          dot: '#38bdf8',
          bg: 'rgba(56, 189, 248, 0.14)',
          border: 'rgba(56, 189, 248, 0.35)',
          text: '#7dd3fc',
          label: 'Syncing…',
        };
      case 'stale':
        return {
          dot: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.16)',
          border: 'rgba(245, 158, 11, 0.4)',
          text: '#fcd34d',
          label: `Cached · ${formatRelativeMinutes(fetchedAt, nowMs)}`,
        };
      case 'offline':
        return {
          dot: '#f97316',
          bg: 'rgba(249, 115, 22, 0.16)',
          border: 'rgba(249, 115, 22, 0.42)',
          text: '#fdba74',
          label: fetchedAt ? `Offline · ${formatRelativeMinutes(fetchedAt, nowMs)}` : 'Offline',
        };
      case 'error':
        return {
          dot: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.16)',
          border: 'rgba(239, 68, 68, 0.45)',
          text: '#fca5a5',
          label: 'Feed Error',
        };
      case 'empty':
        return {
          dot: '#94a3b8',
          bg: 'rgba(148, 163, 184, 0.14)',
          border: 'rgba(148, 163, 184, 0.3)',
          text: '#cbd5e1',
          label: 'No Active Alerts',
        };
      case 'success':
      default:
        return {
          dot: '#10b981',
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.4)',
          text: '#6ee7b7',
          label: isReferenceSnapshot ? 'Live Gateway' : 'Live',
        };
    }
  })();

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
        <Text style={[styles.label, { color: config.text }]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
          {config.label}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: config.bg, borderColor: config.border }]}>
      <View style={[styles.dot, { backgroundColor: config.dot }]} />
      <Text style={[styles.label, { color: config.text }]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
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
