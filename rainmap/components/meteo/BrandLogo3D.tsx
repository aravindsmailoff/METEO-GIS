import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SF_PRO } from "../flood/ui";

interface Props {
  compact?: boolean;
}

export function BrandLogo3D({ compact = false }: Props) {
  return (
    <View style={styles.container}>
      {/* ── Apple-Style Weather Emblem ── */}
      <View style={styles.appleIconBadge}>
        <Ionicons name="cloud" size={17} color="#0A84FF" />
      </View>

      {/* ── Apple Typography & Status Pill ── */}
      <View style={styles.textColumn}>
        <View style={styles.titleRow}>
          <Text style={styles.brandTitle}>MeteoGIS</Text>
          <View style={styles.appleLivePill}>
            <View style={styles.pulseDot} />
            <Text style={styles.appleLiveText}>LIVE</Text>
          </View>
        </View>

        {!compact ? (
          <Text numberOfLines={1} style={styles.brandSub}>
            National Meteorological Intelligence
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  appleIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "rgba(10, 132, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(10, 132, 255, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  textColumn: {
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: SF_PRO,
    letterSpacing: -0.3,
  },
  appleLivePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(48, 209, 88, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(48, 209, 88, 0.35)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#30D158",
  },
  appleLiveText: {
    color: "#30D158",
    fontSize: 9,
    fontWeight: "700",
    fontFamily: SF_PRO,
    letterSpacing: 0.3,
  },
  brandSub: {
    color: "rgba(235, 235, 245, 0.55)",
    fontSize: 10,
    fontWeight: "500",
    fontFamily: SF_PRO,
    letterSpacing: 0.1,
  },
});

