import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Animated,
  Linking,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface AppleDynamicIslandProps {
  onOpenSOS?: () => void;
  onOpenDams?: () => void;
}

export function AppleDynamicIsland({ onOpenSOS, onOpenDams }: AppleDynamicIslandProps) {
  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(false);
  const animProgress = useRef(new Animated.Value(0)).current;
  const pingAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for the red alert dot
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pingAnim, {
          toValue: 1.4,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pingAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pingAnim]);

  const toggleExpand = () => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);
    Animated.spring(animProgress, {
      toValue: nextState ? 1 : 0,
      friction: 8,
      tension: 60,
      useNativeDriver: false,
    }).start();
  };

  const handleSOSCall = () => {
    Linking.openURL("tel:112").catch(() => {});
    onOpenSOS?.();
    if (isExpanded) toggleExpand();
  };

  const topOffset = Platform.OS === "web" ? 14 : Math.max(insets.top + 6, 16);

  return (
    <View style={[styles.outerAnchor, { top: topOffset }]} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.islandContainer,
          {
            width: animProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [270, 360],
            }),
            borderRadius: animProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [999, 28],
            }),
            paddingVertical: animProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [8, 16],
            }),
            paddingHorizontal: animProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [14, 18],
            }),
          },
        ]}
      >
        {/* Specular hairline border */}
        <View style={styles.specularBorder} pointerEvents="none" />

        {!isExpanded ? (
          /* ── Compact Dynamic Island ── */
          <Pressable
            onPress={toggleExpand}
            style={styles.compactRow}
            accessibilityRole="button"
            accessibilityLabel="Expand Severe Flood Warning"
          >
            {/* Pulsing IMD Red Alert */}
            <View style={styles.compactGroup}>
              <Animated.View
                style={[styles.pingCircle, { transform: [{ scale: pingAnim }] }]}
              />
              <View style={styles.solidDot} />
              <Text style={styles.compactRedAlert}>IMD RED ALERT</Text>
            </View>

            <View style={styles.compactDivider} />

            {/* Teesta-V Dam Info */}
            <View style={styles.compactGroup}>
              <MaterialCommunityIcons name="waves" size={13} color="#38bdf8" />
              <Text style={styles.compactDamText}>Teesta-V 91%</Text>
            </View>

            <View style={styles.compactDivider} />

            {/* LIVE Tag */}
            <View style={styles.liveTag}>
              <Text style={styles.liveTagText}>LIVE</Text>
            </View>
          </Pressable>
        ) : (
          /* ── Expanded Island Card ── */
          <View style={styles.expandedContent}>
            {/* Header */}
            <View style={styles.expandedHeader}>
              <View style={styles.expandedTitleRow}>
                <View style={styles.shieldIconBadge}>
                  <MaterialCommunityIcons name="shield-alert" size={18} color="#ef4444" />
                </View>
                <View>
                  <View style={styles.titleBadgeRow}>
                    <Text style={styles.expandedTitle}>Severe Flood Warning</Text>
                    <View style={styles.catBadge}>
                      <Text style={styles.catBadgeText}>CAT 4</Text>
                    </View>
                  </View>
                  <Text style={styles.expandedSubtitle}>
                    Teesta River Basin • East Sikkim
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={toggleExpand}
                style={styles.closeChevron}
                hitSlop={8}
              >
                <Ionicons name="chevron-up" size={16} color="rgba(255, 255, 255, 0.7)" />
              </Pressable>
            </View>

            {/* Metric Dual Cards */}
            <View style={styles.metricsRow}>
              {/* Teesta-V Spillway Card */}
              <Pressable
                onPress={() => {
                  toggleExpand();
                  onOpenDams?.();
                }}
                style={({ pressed }) => [
                  styles.metricCard,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <View style={styles.metricCardHeader}>
                  <Text style={styles.metricLabel}>Teesta-V Spillway</Text>
                  <MaterialCommunityIcons name="waves" size={14} color="#38bdf8" />
                </View>
                <Text style={styles.metricValue}>3 Gates Discharging</Text>
                <Text style={styles.metricSubAmber}>Flood wave: 1.5h to Singtam</Text>
              </Pressable>

              {/* Rain Rate Peak Card */}
              <View style={styles.metricCard}>
                <View style={styles.metricCardHeader}>
                  <Text style={styles.metricLabel}>Rain Rate Peak</Text>
                  <Ionicons name="radio" size={13} color="#ef4444" />
                </View>
                <Text style={styles.metricValue}>92.4 mm/h</Text>
                <Text style={styles.metricSubRed}>Flash flood imminent</Text>
              </View>
            </View>

            {/* Evacuation Order Strip */}
            <View style={styles.advisoryStrip}>
              <Ionicons
                name="warning"
                size={16}
                color="#ef4444"
                style={{ marginTop: 2, marginRight: 8 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.advisoryTitle}>Evacuation Order Active</Text>
                <Text style={styles.advisoryBody}>
                  Residents in Singtam low-lying banks: Move immediately to designated high-ground shelters.
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <Pressable
                onPress={handleSOSCall}
                style={({ pressed }) => [
                  styles.sosButton,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                ]}
              >
                <Ionicons name="call" size={14} color="#ffffff" />
                <Text style={styles.sosButtonText}>Emergency SOS (112)</Text>
              </Pressable>

              <Pressable
                onPress={toggleExpand}
                style={({ pressed }) => [
                  styles.dismissButton,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.dismissButtonText}>Dismiss</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerAnchor: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 300,
  },
  islandContainer: {
    backgroundColor: "rgba(10, 10, 14, 0.92)",
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.18)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.75,
    shadowRadius: 36,
    elevation: 20,
    overflow: "hidden",
  },
  specularBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  compactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  compactGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pingCircle: {
    position: "absolute",
    left: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(239, 68, 68, 0.5)",
  },
  solidDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  compactRedAlert: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fca5a5",
    letterSpacing: 0.4,
  },
  compactDivider: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: 8,
  },
  compactDamText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#38bdf8",
  },
  liveTag: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  liveTagText: {
    fontSize: 9,
    fontFamily: "monospace",
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.85)",
  },
  expandedContent: {
    gap: 12,
  },
  expandedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  expandedTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  shieldIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  expandedTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.2,
  },
  catBadge: {
    backgroundColor: "rgba(153, 27, 27, 0.8)",
    borderWidth: 1,
    borderColor: "#991b1b",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  catBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    fontFamily: "monospace",
    color: "#f87171",
  },
  expandedSubtitle: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 1,
  },
  closeChevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 10,
  },
  metricCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.6)",
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  metricSubAmber: {
    fontSize: 9,
    fontWeight: "600",
    color: "#fcd34d",
    marginTop: 2,
  },
  metricSubRed: {
    fontSize: 9,
    fontWeight: "600",
    color: "#f87171",
    marginTop: 2,
  },
  advisoryStrip: {
    flexDirection: "row",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
    borderRadius: 14,
    padding: 10,
  },
  advisoryTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
  advisoryBody: {
    fontSize: 10,
    color: "#fecaca",
    marginTop: 2,
    lineHeight: 14,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  sosButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#dc2626",
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
  sosButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  dismissButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dismissButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
  },
});
