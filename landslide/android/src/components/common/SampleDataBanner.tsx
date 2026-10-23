import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '../../store/appStore';

export const SampleDataBanner: React.FC = () => {
  const disableSampleMode = useAppStore((s) => s.setUseReferenceFallbackWhenUpstreamDown);

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.text} numberOfLines={2}>
        🧪 SAMPLE / NOT LIVE — QA Development Fixture Active. Do NOT use for real emergency decisions.
      </Text>
      <Pressable
        onPress={() => disableSampleMode(false)}
        style={styles.turnOffBtn}
        accessibilityRole="button"
        accessibilityLabel="Turn off QA sample data mode"
      >
        <Text style={styles.turnOffText}>Turn Off</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#581c87',
    borderBottomWidth: 1,
    borderBottomColor: '#e879f9',
  },
  text: {
    flex: 1,
    color: '#fdf4ff',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 15,
  },
  turnOffBtn: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#86198f',
    borderWidth: 1,
    borderColor: '#f5d0fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnOffText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
});
