import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { MeteoAlert } from "@/lib/meteo/liveMeteoService";

interface Props {
  alerts: MeteoAlert[];
}

export function MeteoAlertCapsule({ alerts }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  if (!alerts || alerts.length === 0) return null;

  const current = alerts[activeIdx] || alerts[0];
  const isOrange = current.severity === "ORANGE";
  const isRed = current.severity === "RED";
  const accentColor = isRed ? "#EF4444" : isOrange ? "#F97316" : "#EAB308";

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${current.title}. Tap to view official meteorological bulletin`}
        onPress={() => setExpanded(!expanded)}
        style={[styles.capsule, { borderColor: `${accentColor}44` }]}
      >
        <View style={[styles.iconBadge, { backgroundColor: `${accentColor}22` }]}>
          <Ionicons
            name={current.type.toLowerCase().includes("landslide") ? "trending-down" : "warning"}
            size={13}
            color={accentColor}
          />
        </View>

        <View style={styles.textContainer}>
          <View style={styles.headlineRow}>
            <Text style={[styles.severityTag, { color: accentColor }]}>
              {current.severity} ALERT
            </Text>
            <Text style={styles.bulletDot}>·</Text>
            <Text numberOfLines={1} style={styles.titleText}>
              {current.title}
            </Text>
          </View>
        </View>

        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={13}
          color="rgba(255, 255, 255, 0.45)"
        />
      </Pressable>

      {expanded ? (
        <View style={[styles.expandedDrawer, { borderTopColor: `${accentColor}22` }]}>
          <View style={styles.detailHeader}>
            <View>
              <Text style={styles.districtText}>
                {current.district}, {current.state}
              </Text>
              <Text style={styles.hazardType}>{current.type}</Text>
            </View>
            <View style={styles.timeBadge}>
              <Ionicons name="time-outline" size={11} color="rgba(255, 255, 255, 0.6)" />
              <Text style={styles.timeText}>{current.time}</Text>
            </View>
          </View>

          <Text style={styles.impactText}>{current.impact}</Text>

          {current.slopeDeg ? (
            <View style={styles.slopeRow}>
              <Ionicons name="analytics" size={12} color="#F97316" />
              <Text style={styles.slopeText}>
                Monitored Terrain Slope: {current.slopeDeg}° · High Saturation Trigger
              </Text>
            </View>
          ) : null}

          <View style={styles.sourceFooter}>
            <Text style={styles.sourceLabel}>AUTHORITY:</Text>
            <Text numberOfLines={1} style={styles.sourceText}>
              {current.source}
            </Text>
          </View>

          {alerts.length > 1 ? (
            <View style={styles.paginationRow}>
              {alerts.map((_, i) => (
                <Pressable
                  key={i}
                  onPress={() => setActiveIdx(i)}
                  style={[styles.pageDot, i === activeIdx && { backgroundColor: accentColor, width: 14 }]}
                />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: "hidden",
  },
  capsule: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 10,
    gap: 8,
  },
  iconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  headlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  severityTag: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  bulletDot: {
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 11,
  },
  titleText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  expandedDrawer: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  districtText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  hazardType: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 10.5,
    marginTop: 1,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  timeText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 10,
    fontWeight: "500",
  },
  impactText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
  },
  slopeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  slopeText: {
    color: "#F97316",
    fontSize: 10,
    fontWeight: "600",
  },
  sourceFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  sourceLabel: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 8.5,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  sourceText: {
    flex: 1,
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: 9.5,
  },
  paginationRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  pageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
});
