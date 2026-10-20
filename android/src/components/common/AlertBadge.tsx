import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HazardSeverity } from '../../types/meteo';
import { severityColors } from '../../utils/formatters';

interface AlertBadgeProps {
  count?: number;
  label?: string;
  severity?: HazardSeverity | string;
}

export const AlertBadge: React.FC<AlertBadgeProps> = ({
  count,
  label,
  severity = 'RED',
}) => {
  const c = severityColors(severity);
  const text = label
    ? count !== undefined
      ? `${count} ${label}`
      : label
    : `${count ?? 0}`;

  return (
    <View style={[styles.badge, { backgroundColor: c.solid, borderColor: c.border }]}>
      <Text
        style={[styles.text, { color: c.badgeText }]}
        numberOfLines={1}
        maxFontSizeMultiplier={1.25}
      >
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
