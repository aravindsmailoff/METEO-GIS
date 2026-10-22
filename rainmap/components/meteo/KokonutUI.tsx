import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { SF_PRO } from "../flood/ui";

/**
 * Kokonut UI: Task interface for Status Island
 */
export interface KokonutTask {
  id: string;
  label: string;
  detail: string;
  status: "running" | "synced" | "warning";
  source: string;
}

/**
 * Kokonut UI: Status Island (Dynamic Island Telemetry Capsule)
 * Features morphing spring expansion, live status beacon, and stacked task details.
 * Inspired by https://kokonutui.com/docs/navigation/status-island
 */
export function KokonutStatusIsland({
  tasks,
  onRefresh,
}: {
  tasks: KokonutTask[];
  onRefresh?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const morphAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.spring(morphAnim, {
      toValue: expanded ? 1 : 0,
      friction: 8,
      tension: 110,
      useNativeDriver: false,
    }).start();
  }, [expanded, morphAnim]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const activeTask = tasks[0] || {
    id: "active",
    label: "IMD Doppler Radar",
    detail: "Real-time Telemetry Live",
    status: "synced",
    source: "IMD Weather Network",
  };

  return (
    <Animated.View
      style={[
        styles.islandCapsule,
        {
          borderRadius: morphAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [99, 20],
          }),
          borderColor: morphAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ["rgba(255, 255, 255, 0.12)", "rgba(255, 255, 255, 0.22)"],
          }),
        },
      ]}
    >
      {/* Specular hairline top reflection */}
      <View style={styles.islandSpecularLine} />

      {/* Collapsed Pill Header (Tappable to expand/collapse) */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Toggle Kokonut UI Telemetry Status Island"
        onPress={() => setExpanded(!expanded)}
        style={styles.islandHeader}
      >
        <View style={styles.islandHeaderLeft}>
          <Animated.View
            style={[
              styles.beaconDot,
              {
                backgroundColor:
                  activeTask.status === "synced"
                    ? "#30D158"
                    : activeTask.status === "warning"
                    ? "#F59E0B"
                    : "#38BDF8",
                opacity: pulseAnim,
              },
            ]}
          />
          <Text style={styles.islandBrandText}>TELEMETRY</Text>
          <View style={styles.separatorDot} />
          <Text numberOfLines={1} style={styles.islandTaskText}>
            {activeTask.label}
          </Text>
        </View>

        <View style={styles.islandHeaderRight}>
          <Text style={styles.islandCountBadge}>{tasks.length} Feeds</Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={13}
            color="rgba(255, 255, 255, 0.65)"
          />
        </View>
      </Pressable>

      {/* Expanded Drawer Content (Meteo-GIS Live Feed Constellation) */}
      {expanded ? (
        <View style={styles.islandDrawer}>
          <View style={styles.islandDivider} />
          <Text style={styles.islandDrawerTitle}>ACTIVE METEOROLOGICAL TELEMETRY</Text>

          <View style={styles.taskList}>
            {tasks.map((task) => {
              const statusColor =
                task.status === "synced"
                  ? "#30D158"
                  : task.status === "warning"
                  ? "#F59E0B"
                  : "#38BDF8";

              return (
                <View key={task.id} style={styles.taskRow}>
                  <View style={[styles.taskStatusDot, { backgroundColor: statusColor }]} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={styles.taskLabel}>
                      {task.label}
                    </Text>
                    <Text numberOfLines={1} style={styles.taskDetail}>
                      {task.detail} · <Text style={{ color: "rgba(255, 255, 255, 0.4)" }}>{task.source}</Text>
                    </Text>
                  </View>
                  <View style={[styles.taskPill, { borderColor: `${statusColor}40`, backgroundColor: `${statusColor}15` }]}>
                    <Text style={[styles.taskPillText, { color: statusColor }]}>
                      {task.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {onRefresh ? (
            <Pressable onPress={onRefresh} style={styles.islandRefreshBtn}>
              <Ionicons name="refresh" size={13} color="#38BDF8" />
              <Text style={styles.islandRefreshText}>Sync All Weather Feeds</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Animated.View>
  );
}

/**
 * Kokonut UI: Bento Metric Card
 * Features specular top line, rolling value, subtext, and SVG mini sparkline.
 * Inspired by https://kokonutui.com/docs/cards/metric-card
 */
export function KokonutBentoMetricCard({
  label,
  value,
  unit,
  subtext,
  icon,
  accentColor = "#38BDF8",
  sparklineData = [12, 18, 14, 25, 22, 30, 28, 35],
  style,
  onPress,
}: {
  label: string;
  value: string | number;
  unit?: string;
  subtext: string;
  icon: keyof typeof Ionicons.glyphMap;
  accentColor?: string;
  sparklineData?: number[];
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.975,
      friction: 8,
      tension: 120,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 6,
      tension: 140,
      useNativeDriver: true,
    }).start();
  };

  // Generate SVG path for sparkline
  const width = 80;
  const height = 28;
  const minVal = Math.min(...sparklineData);
  const maxVal = Math.max(...sparklineData);
  const range = maxVal - minVal || 1;

  const points = sparklineData.map((d, i) => {
    const x = (i / (sparklineData.length - 1)) * width;
    const y = height - ((d - minVal) / range) * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const pathD = `M ${points.join(" L ")}`;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[{ flex: 1 }, style]}
    >
      <Animated.View
        style={[
          styles.bentoCard,
          {
            borderColor: `${accentColor}35`,
            transform: [{ scale }],
          },
        ]}
      >
        {/* Specular hairline top reflection */}
        <View style={styles.bentoSpecularLine} />

        <View style={styles.bentoHeaderRow}>
          <View style={styles.bentoLabelRow}>
            <Ionicons name={icon} size={13} color={accentColor} />
            <Text style={styles.bentoLabel}>{label}</Text>
          </View>

          {/* Mini Sparkline */}
          <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <Path
              d={pathD}
              fill="none"
              stroke={accentColor}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>

        <View style={styles.bentoValueRow}>
          <Text style={styles.bentoValue}>{value}</Text>
          {unit ? <Text style={styles.bentoUnit}>{unit}</Text> : null}
        </View>

        <Text numberOfLines={1} style={styles.bentoSubtext}>
          {subtext}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Kokonut UI: Morphic Floating Dock
 * Inspired by https://kokonutui.com/docs/navigation/toolbar
 */
export function KokonutToolbarDock({
  items,
  activeId,
  onSelect,
}: {
  items: { id: string; label: string; icon: keyof typeof Ionicons.glyphMap }[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={styles.toolbarDock}>
      <View style={styles.islandSpecularLine} />
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            onPress={() => onSelect(item.id)}
            style={[styles.dockItem, isActive && styles.dockItemActive]}
          >
            <Ionicons
              name={item.icon}
              size={15}
              color={isActive ? "#0A84FF" : "rgba(255, 255, 255, 0.6)"}
            />
            <Text style={[styles.dockLabel, isActive && styles.dockLabelActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  islandCapsule: {
    backgroundColor: "rgba(18, 18, 20, 0.94)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    backdropFilter: "blur(24px) saturate(180%)",
  },
  islandSpecularLine: {
    position: "absolute",
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  islandHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 10,
  },
  islandHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  beaconDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  islandBrandText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0A84FF",
    letterSpacing: 0.4,
    fontFamily: SF_PRO,
  },
  separatorDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  islandTaskText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#F8FAFC",
    flex: 1,
    fontFamily: SF_PRO,
  },
  islandHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  islandCountBadge: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.6)",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 99,
    fontFamily: SF_PRO,
  },
  islandDrawer: {
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  islandDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 10,
  },
  islandDrawerTitle: {
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "rgba(255, 255, 255, 0.45)",
    marginBottom: 8,
    fontFamily: SF_PRO,
  },
  taskList: {
    gap: 8,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingVertical: 4,
  },
  taskStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  taskLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: SF_PRO,
  },
  taskDetail: {
    fontSize: 10.5,
    color: "rgba(255, 255, 255, 0.65)",
    fontFamily: SF_PRO,
  },
  taskPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 99,
    borderWidth: 1,
  },
  taskPillText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
    fontFamily: SF_PRO,
  },
  islandRefreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
  },
  islandRefreshText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#38BDF8",
    fontFamily: SF_PRO,
  },
  bentoCard: {
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    borderRadius: 18,
    borderWidth: 1,
    padding: 13,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  bentoSpecularLine: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  bentoHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  bentoLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  bentoLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(255, 255, 255, 0.55)",
    fontFamily: SF_PRO,
  },
  bentoValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginBottom: 2,
  },
  bentoValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    fontFamily: SF_PRO,
  },
  bentoUnit: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.65)",
    fontFamily: SF_PRO,
  },
  bentoSubtext: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.45)",
    fontFamily: SF_PRO,
  },
  toolbarDock: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(10, 16, 32, 0.85)",
    borderRadius: 99,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    position: "relative",
    overflow: "hidden",
  },
  dockItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
  },
  dockItemActive: {
    backgroundColor: "rgba(10, 132, 255, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(10, 132, 255, 0.35)",
  },
  dockLabel: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.6)",
    fontFamily: SF_PRO,
  },
  dockLabelActive: {
    color: "#38BDF8",
    fontWeight: "700",
  },
});
