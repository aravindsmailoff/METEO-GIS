import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatRelativeMinutes } from '../../utils/formatters';

interface OfflineBannerProps {
  fetchedAt: number | null;
  onRetry: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ fetchedAt, onRetry }) => (
  <View style={styles.banner}>
    <View style={styles.copy}>
      <Text style={styles.title} numberOfLines={1}>
        📡 No connection. Showing last received data.
      </Text>
      <Text style={styles.sub} numberOfLines={1}>
        Last updated {formatRelativeMinutes(fetchedAt)} · Auto-refreshes on reconnect
      </Text>
    </View>
    <Pressable
      onPress={onRetry}
      style={styles.retryBtn}
      accessibilityRole="button"
      accessibilityLabel="Retry connection"
    >
      <Text style={styles.retryText}>Retry</Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  banner: {
    backgroundColor: 'rgba(124, 45, 18, 0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(251, 146, 60, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  copy: {
    flex: 1,
  },
  title: {
    color: '#ffedd5',
    fontSize: 12,
    fontWeight: '800',
  },
  sub: {
    color: '#fdba74',
    fontSize: 11,
  },
  retryBtn: {
    minHeight: 48,
    minWidth: 64,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#ea580c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});
