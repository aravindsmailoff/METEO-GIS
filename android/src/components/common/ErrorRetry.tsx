import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface ErrorRetryProps {
  message?: string;
  onRetry: () => void;
}

export const ErrorRetry: React.FC<ErrorRetryProps> = ({
  message = 'Could not load meteorological feed.',
  onRetry,
}) => (
  <View style={styles.box}>
    <Text style={styles.title}>⚠️ Feed Unavailable</Text>
    <Text style={styles.desc}>{message}</Text>
    <Pressable
      onPress={onRetry}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel="Retry loading data"
    >
      <Text style={styles.buttonText}>↻ Retry</Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  box: {
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(127, 29, 29, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.45)',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#fca5a5',
    fontSize: 14,
    fontWeight: '800',
  },
  desc: {
    color: '#cbd5e1',
    fontSize: 12,
    textAlign: 'center',
  },
  button: {
    marginTop: 4,
    minHeight: 48,
    minWidth: 128,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
