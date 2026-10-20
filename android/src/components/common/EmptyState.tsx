import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface EmptyStateProps {
  title?: string;
  subtitle?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No active warnings for this region.',
  subtitle = 'Official IMD & NRSC synoptic surveillance indicates normal baseline conditions right now.',
}) => (
  <View style={styles.box}>
    <Text style={styles.icon}>🟢</Text>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.sub}>{subtitle}</Text>
  </View>
);

const styles = StyleSheet.create({
  box: {
    marginVertical: 12,
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    fontSize: 22,
  },
  title: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  sub: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
});
