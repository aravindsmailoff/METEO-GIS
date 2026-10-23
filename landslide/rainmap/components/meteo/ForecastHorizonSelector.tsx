import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SF_PRO } from "../flood/ui";
import type { ForecastHorizon } from "@/lib/flood/types";

interface Props {
  selectedHorizon: ForecastHorizon;
  onChangeHorizon: (horizon: ForecastHorizon) => void;
}

export function ForecastHorizonSelector({ selectedHorizon, onChangeHorizon }: Props) {
  const horizons: { key: ForecastHorizon; label: string; sub: string }[] = [
    { key: "6h", label: "6h", sub: "Nowcast" },
    { key: "12h", label: "12h", sub: "Convective" },
    { key: "24h", label: "24h", sub: "Daily Cycle" },
    { key: "48h", label: "48h", sub: "Synoptic" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.segmentedPill}>
        {horizons.map((item) => {
          const isActive = item.key === selectedHorizon;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${item.label} ${item.sub} forecast horizon`}
              onPress={() => onChangeHorizon(item.key)}
              style={[styles.segmentBtn, isActive && styles.segmentBtnActive]}
            >
              <Text style={[styles.segmentLabel, isActive && styles.segmentLabelActive]}>
                {item.label}
              </Text>
              <Text style={[styles.segmentSub, isActive && styles.segmentSubActive]}>
                {item.sub}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    zIndex: 25,
  },
  segmentedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(28, 28, 30, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 14,
    padding: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.16)",
  },
  segmentBtn: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 11,
  },
  segmentBtnActive: {
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
  },
  segmentLabel: {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: 11.5,
    fontWeight: "700",
    fontFamily: SF_PRO,
    letterSpacing: 0.2,
  },
  segmentLabelActive: {
    color: "#FFFFFF",
  },
  segmentSub: {
    color: "rgba(255, 255, 255, 0.35)",
    fontSize: 8.5,
    fontWeight: "600",
    fontFamily: SF_PRO,
  },
  segmentSubActive: {
    color: "#0A84FF",
    fontWeight: "700",
  },
});
