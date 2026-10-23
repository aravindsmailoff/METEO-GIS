import React, { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SF_PRO } from "../flood/ui";
import { getCountdownTime } from "@/lib/meteo/meteoGisData";
import type { SevereWeatherAlert } from "@/lib/flood/types";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  alert: SevereWeatherAlert | null;
  onOpenSOS: () => void;
  onInspectLocation?: (lat: number, lng: number, name: string) => void;
}

export function AppleDynamicIslandAlert({ alert, onOpenSOS, onInspectLocation }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [countdown, setCountdown] = useState(getCountdownTime(6, 120000));
  const pulseAnim = useState(new Animated.Value(1))[0];

  // Pulsing animation for red beacon dot
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.25,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // Live ticking countdown timer updating every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdownTime(6, 120000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const isExtreme = (alert?.severity as any) === "EXTREME" || (alert?.severity as any) === "RED" || !alert;
  const severityText = isExtreme ? "IMD RED ALERT" : "IMD ORANGE ALERT";
  const themeColor = isExtreme ? "#EF4444" : "#F97316";

  const district = alert?.district || "East Sikkim (Singtam)";
  const headline = alert?.headline || "Extremely Heavy Cloudburst (92.4 mm/h) & Flash Flood Warning";
  const rainRate = alert?.rainfallMmH ?? 92.4;

  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${severityText}. ${district}. Tap to toggle alert details.`}
        onPress={toggleExpand}
        style={[
          styles.container,
          expanded && styles.containerExpanded,
          { borderColor: isExtreme ? "rgba(239, 68, 68, 0.45)" : "rgba(249, 115, 22, 0.45)" },
        ]}
      >
        {!expanded ? (
          /* ── COMPACT TOP PILL: APPEARS FIRST WITH LIVE TICKING TIMER ── */
          <View style={styles.compactRow}>
            {/* Blinking Live Beacon */}
            <View style={styles.beaconWrap}>
              <Animated.View style={[styles.beaconPulse, { backgroundColor: themeColor, opacity: pulseAnim }]} />
              <View style={[styles.beaconDot, { backgroundColor: themeColor }]} />
            </View>

            <Text style={[styles.alertTitle, { color: themeColor }]}>{severityText}</Text>

            <View style={styles.divider} />

            {/* Live Countdown Timer */}
            <View style={styles.timerChip}>
              <Ionicons name="time-outline" size={12} color="#38BDF8" />
              <Text style={styles.timerText}>{countdown.clockStr}</Text>
            </View>

            <View style={styles.divider} />

            {/* Location & Rain rate badge */}
            <View style={styles.locationBadge}>
              <Text numberOfLines={1} style={styles.locationText}>
                {district.split("(")[0].trim()}
              </Text>
              <Text style={[styles.rainText, { color: themeColor }]}>{rainRate} mm/h</Text>
            </View>

            {/* Expand arrow */}
            <Ionicons name="chevron-down" size={13} color="rgba(255, 255, 255, 0.6)" />
          </View>
        ) : (
          /* ── EXPANDED EMERGENCY ADVISORY (METEO-GIS IDENTICAL) ── */
          <View style={styles.expandedContent}>
            {/* Header */}
            <View style={styles.expandedHeader}>
              <View style={styles.titleWithIcon}>
                <View style={[styles.shieldBadge, { backgroundColor: isExtreme ? "rgba(239, 68, 68, 0.2)" : "rgba(249, 115, 22, 0.2)" }]}>
                  <Ionicons name="warning" size={16} color={themeColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.hazardBadgeRow}>
                    <Text style={styles.expandedTitle}>Severe Weather Warning</Text>
                    <View style={[styles.catBadge, { backgroundColor: isExtreme ? "rgba(239, 68, 68, 0.25)" : "rgba(249, 115, 22, 0.25)" }]}>
                      <Text style={[styles.catText, { color: themeColor }]}>CAT 4</Text>
                    </View>
                  </View>
                  <Text style={styles.expandedSubtitle}>{district} · Official IMD Dispatch</Text>
                </View>
              </View>

              <Pressable onPress={toggleExpand} style={styles.closeBtn}>
                <Ionicons name="chevron-up" size={16} color="#FFFFFF" />
              </Pressable>
            </View>

            {/* Key Metrics: Spillway & Rain Rate */}
            <View style={styles.metricGrid}>
              <Pressable
                onPress={() => {
                  if (alert?.latitude && alert?.longitude) {
                    onInspectLocation?.(alert.latitude, alert.longitude, district);
                  }
                  setExpanded(false);
                }}
                style={styles.metricCard}
              >
                <View style={styles.metricCardTop}>
                  <Text style={styles.metricLabel}>Teesta-V Spillway</Text>
                  <Ionicons name="water" size={13} color="#38BDF8" />
                </View>
                <Text style={styles.metricVal}>3 Gates Open</Text>
                <Text style={styles.metricSub}>Surge wave: ~1.5h arrival</Text>
              </Pressable>

              <View style={styles.metricCard}>
                <View style={styles.metricCardTop}>
                  <Text style={styles.metricLabel}>Peak Precipitation</Text>
                  <Ionicons name="rainy" size={13} color="#EF4444" />
                </View>
                <Text style={[styles.metricVal, { color: themeColor }]}>{rainRate} mm/h</Text>
                <Text style={[styles.metricSub, { color: themeColor }]}>Flash flood imminent</Text>
              </View>
            </View>

            {/* Evacuation Advisory */}
            <View style={[styles.advisoryBox, { borderColor: isExtreme ? "rgba(239, 68, 68, 0.35)" : "rgba(249, 115, 22, 0.35)" }]}>
              <Ionicons name="alert-circle" size={16} color={themeColor} style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.advisoryTitle}>Evacuation Advisory Active</Text>
                <Text style={styles.advisoryDesc}>{headline}</Text>
              </View>
            </View>

            {/* Action Bar */}
            <View style={styles.actionRow}>
              <Pressable
                onPress={() => {
                  setExpanded(false);
                  onOpenSOS();
                }}
                style={styles.sosActionBtn}
              >
                <Ionicons name="call" size={14} color="#FFFFFF" />
                <Text style={styles.sosActionText}>Emergency SOS (112)</Text>
              </Pressable>

              <Pressable onPress={toggleExpand} style={styles.dismissBtn}>
                <Text style={styles.dismissText}>Collapse</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 4,
    zIndex: 50,
  },
  container: {
    backgroundColor: "rgba(10, 15, 26, 0.94)",
    borderRadius: 24,
    borderWidth: 1.2,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 15,
  },
  containerExpanded: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  compactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  beaconWrap: {
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  beaconPulse: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  beaconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertTitle: {
    fontSize: 11,
    fontWeight: "900",
    fontFamily: SF_PRO,
    letterSpacing: 0.4,
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  timerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
  },
  timerText: {
    color: "#38BDF8",
    fontSize: 11,
    fontWeight: "800",
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 1,
  },
  locationText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    fontFamily: SF_PRO,
    maxWidth: 90,
  },
  rainText: {
    fontSize: 10.5,
    fontWeight: "800",
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  expandedContent: {
    flexDirection: "column",
    gap: 12,
  },
  expandedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  shieldBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  hazardBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  expandedTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    fontFamily: SF_PRO,
  },
  catBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 5,
  },
  catText: {
    fontSize: 9.5,
    fontWeight: "900",
    fontFamily: SF_PRO,
  },
  expandedSubtitle: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 10.5,
    marginTop: 2,
    fontFamily: SF_PRO,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  metricGrid: {
    flexDirection: "row",
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 14,
    padding: 10,
  },
  metricCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  metricLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 10,
    fontWeight: "600",
    fontFamily: SF_PRO,
  },
  metricVal: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    fontFamily: SF_PRO,
  },
  metricSub: {
    color: "#FBBF24",
    fontSize: 9.5,
    fontWeight: "700",
    marginTop: 2,
    fontFamily: SF_PRO,
  },
  advisoryBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
  },
  advisoryTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    fontFamily: SF_PRO,
    marginBottom: 2,
  },
  advisoryDesc: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 10,
    lineHeight: 14,
    fontFamily: SF_PRO,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  sosActionBtn: {
    flex: 1,
    backgroundColor: "#EF4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  sosActionText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "800",
    fontFamily: SF_PRO,
  },
  dismissBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dismissText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 11,
    fontWeight: "700",
    fontFamily: SF_PRO,
  },
});
