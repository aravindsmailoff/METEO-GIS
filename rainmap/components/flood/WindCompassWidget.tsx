import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Polygon } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import type { LiveWindTelemetry } from "@/lib/meteo/liveMeteoService";

interface Props {
  telemetry: LiveWindTelemetry;
  onToggleExpand?: () => void;
}

export function WindCompassWidget({ telemetry }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Compass needle rotation
  const deg = telemetry.directionDeg;

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Wind speed ${telemetry.speedKmh} km/h from ${telemetry.cardinal}. Tap to toggle details`}
        onPress={() => setExpanded(!expanded)}
        style={styles.pillSurface}
      >
        {/* Mini Rotating Compass Indicator */}
        <View style={styles.compassWrapper}>
          <Svg width={36} height={36} viewBox="0 0 40 40">
            {/* Outer Ring */}
            <Circle cx={20} cy={20} r={18} fill="#0F172A" stroke="rgba(255, 255, 255, 0.15)" strokeWidth={1.5} />
            {/* Cardinal Dots */}
            <Circle cx={20} cy={4} r={1.5} fill="#38BDF8" />
            <Circle cx={36} cy={20} r={1.2} fill="rgba(255, 255, 255, 0.4)" />
            <Circle cx={20} cy={36} r={1.2} fill="rgba(255, 255, 255, 0.4)" />
            <Circle cx={4} cy={20} r={1.2} fill="rgba(255, 255, 255, 0.4)" />
            {/* Rotating Arrow Needle */}
            <View
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 40,
                height: 40,
                transform: [{ rotate: `${deg}deg` }],
              }}
            >
              <Svg width={40} height={40} viewBox="0 0 40 40">
                {/* Arrowhead pointing towards direction */}
                <Polygon points="20,7 23.5,20 20,17 16.5,20" fill="#38BDF8" />
                <Polygon points="20,33 23,21 20,24 17,21" fill="rgba(255, 255, 255, 0.25)" />
                <Circle cx={20} cy={20} r={2.5} fill="#0F172A" stroke="#38BDF8" strokeWidth={1.5} />
              </Svg>
            </View>
          </Svg>
        </View>

        {/* Telemetry Snapshot */}
        <View style={styles.textStack}>
          <View style={styles.topRow}>
            <Text style={styles.speedText}>{telemetry.speedKmh}</Text>
            <Text style={styles.unitText}>km/h</Text>
            <Text style={styles.divider}>·</Text>
            <Text style={styles.cardinalText}>{telemetry.cardinal}</Text>
          </View>
          <Text numberOfLines={1} style={styles.subText}>
            Gusts {telemetry.gustsKmh} km/h · {telemetry.pressureHpa} hPa
          </Text>
        </View>

        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={14}
          color="rgba(255, 255, 255, 0.5)"
          style={styles.chevron}
        />
      </Pressable>

      {/* Expanded Atmospheric Detail Card */}
      {expanded ? (
        <View style={styles.expandedSheet}>
          <View style={styles.sheetHeader}>
            <View style={styles.liveIndicatorRow}>
              <View style={styles.liveDot} />
              <Text style={styles.sheetEyebrow}>LIVE METEO-GIS TELEMETRY</Text>
            </View>
            <Text style={styles.updatedText}>{telemetry.observationTime}</Text>
          </View>

          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>WIND DIRECTION</Text>
              <Text style={styles.gridValue}>
                {telemetry.directionDeg}° {telemetry.cardinal}
              </Text>
            </View>

            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>PEAK GUSTS</Text>
              <Text style={styles.gridValue}>{telemetry.gustsKmh} km/h</Text>
            </View>

            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>BAROMETRIC</Text>
              <Text style={styles.gridValue}>{telemetry.pressureHpa} hPa</Text>
            </View>

            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>HUMIDITY</Text>
              <Text style={styles.gridValue}>{telemetry.humidityPercent}% RH</Text>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    overflow: "hidden",
  },
  pillSurface: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 10,
  },
  compassWrapper: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  textStack: {
    flex: 1,
    justifyContent: "center",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  speedText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  unitText: {
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: 11,
    fontWeight: "600",
  },
  divider: {
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 12,
  },
  cardinalText: {
    color: "#38BDF8",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  subText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 10.5,
    marginTop: 1,
    letterSpacing: 0.1,
  },
  chevron: {
    marginLeft: 2,
  },
  expandedSheet: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    marginTop: 4,
  },
  liveIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  sheetEyebrow: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  updatedText: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 9.5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  gridItem: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  gridLabel: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 8.5,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  gridValue: {
    color: "#F8FAFC",
    fontSize: 12.5,
    fontWeight: "700",
  },
});
