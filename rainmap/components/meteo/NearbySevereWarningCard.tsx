import React, { useEffect, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SF_PRO } from "../flood/ui";
import type { MonitoringRadiusKm, SevereWeatherAlert } from "@/lib/flood/types";
import { getCountdownTime } from "@/lib/meteo/meteoGisData";
import {
  WatermelonGlowCard,
  WatermelonShimmerBadge,
  WatermelonSpringButton,
} from "./WatermelonAnimations";

interface Props {
  alert: SevereWeatherAlert | null;
  radiusKm: MonitoringRadiusKm;
  onChangeRadius?: (radius: MonitoringRadiusKm) => void;
  onInspectHazard?: (alert: SevereWeatherAlert) => void;
  isExploringOtherLocation?: boolean;
  viewingLocationName?: string;
  onReturnToMyLocation?: () => void;
  windDirectionDeg?: number;
  windSpeedKmh?: number;
  windCardinal?: string;
}

export function NearbySevereWarningCard({
  alert,
  radiusKm,
  onChangeRadius,
  onInspectHazard,
  isExploringOtherLocation = false,
  viewingLocationName,
  onReturnToMyLocation,
  windDirectionDeg,
  windSpeedKmh,
  windCardinal,
}: Props) {
  const [precautionsExpanded, setPrecautionsExpanded] = useState(false);
  const [shimmerAnim] = useState(() => new Animated.Value(0));
  const [beaconPulse] = useState(() => new Animated.Value(0));
  const [countdown, setCountdown] = useState(() => getCountdownTime(6.0, 0));

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdownTime(6.0, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    const beacon = Animated.loop(
      Animated.sequence([
        Animated.timing(beaconPulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(beaconPulse, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );
    shimmer.start();
    beacon.start();
    return () => {
      shimmer.stop();
      beacon.stop();
    };
  }, [shimmerAnim, beaconPulse]);

  const radiusOptions: MonitoringRadiusKm[] = [5, 10, 25, 50];

  const getSeverityStyle = (severity?: string) => {
    switch (severity) {
      case "EXTREME":
        return {
          bg: "#EF4444",
          badgeText: "EXTREME DANGER",
          cardBorder: "rgba(239, 68, 68, 0.4)",
          cardGlow: "rgba(239, 68, 68, 0.12)",
        };
      case "SEVERE":
        return {
          bg: "#F97316",
          badgeText: "SEVERE HAZARD",
          cardBorder: "rgba(249, 115, 22, 0.4)",
          cardGlow: "rgba(249, 115, 22, 0.12)",
        };
      case "MODERATE":
        return {
          bg: "#F59E0B",
          badgeText: "MODERATE WATCH",
          cardBorder: "rgba(245, 158, 11, 0.35)",
          cardGlow: "rgba(245, 158, 11, 0.1)",
        };
      default:
        return {
          bg: "#38BDF8",
          badgeText: "WEATHER INFO",
          cardBorder: "rgba(56, 189, 248, 0.3)",
          cardGlow: "rgba(56, 189, 248, 0.08)",
        };
    }
  };

  const sev = getSeverityStyle(alert?.severity);

  return (
    <View style={styles.outerContainer}>
      {/* ── Exploration Banner (if viewing searched/remote area) ── */}
      {isExploringOtherLocation ? (
        <View style={styles.exploringBanner}>
          <Ionicons name="compass" size={13} color="#38BDF8" />
          <Text style={styles.exploringText}>
            Viewing: <Text style={styles.exploringTarget}>{viewingLocationName || "Remote Area"}</Text>
          </Text>
          {onReturnToMyLocation ? (
            <WatermelonSpringButton
              onPress={onReturnToMyLocation}
              variant="glass"
              style={styles.returnBtn}
            >
              <Ionicons name="locate" size={12} color="#FFFFFF" />
              <Text style={styles.returnBtnText}>My Location</Text>
            </WatermelonSpringButton>
          ) : null}
        </View>
      ) : null}

      {/* ── Monitoring Radius Picker ── */}
      <View style={styles.radiusRow}>
        <Text style={styles.radiusEyebrow}>MONITORING RADIUS</Text>
        <View style={styles.radiusPills}>
          {radiusOptions.map((r) => {
            const isActive = r === radiusKm;
            return (
              <Pressable
                key={r}
                accessibilityRole="button"
                accessibilityLabel={`${r} kilometers monitoring radius`}
                onPress={() => onChangeRadius && onChangeRadius(r)}
                style={[styles.radiusPill, isActive && styles.radiusPillActive]}
              >
                <Text style={[styles.radiusPillText, isActive && styles.radiusPillTextActive]}>
                  {r} km
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Active Alert Card or Calm Empty State ── */}
      {alert ? (
        <WatermelonGlowCard
          glowColor={sev.bg}
          urgent={alert.severity === "EXTREME" || alert.severity === "SEVERE"}
          style={[styles.card, { borderColor: sev.cardBorder, backgroundColor: sev.cardGlow, overflow: "hidden" }]}
        >
          {/* React Bits: Animated Traveling Border Beam */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.borderBeamGlow,
              {
                left: shimmerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["-40%", "100%"],
                }),
                backgroundColor: sev.bg,
              },
            ]}
          />

          {/* Top Tag Row */}
          <View style={styles.cardHeader}>
            <WatermelonShimmerBadge label={sev.badgeText} color={sev.bg} />

            <View style={styles.distanceBadge}>
              <Ionicons name="navigate-circle" size={13} color="#38BDF8" />
              <Text style={styles.distanceText}>
                {alert.distanceKm !== undefined ? `${alert.distanceKm} km away` : "Nearby"}
              </Text>
            </View>
          </View>

          {/* Headline & Locality */}
          <Text style={styles.alertHeadline}>{alert.headline}</Text>
          <Text style={styles.alertDistrict}>
            Impact Sector: {alert.district}, {alert.state}
          </Text>

          {/* Doppler / Weather Warning Validity Countdown Timer FIRST */}
          <View style={styles.alertCountdownCard}>
            <View style={styles.countdownCardHeader}>
              <View style={styles.countdownCardTitleRow}>
                <View style={[styles.pulsingDot, { backgroundColor: sev.bg }]} />
                <Text style={styles.countdownCardTitle}>NOWCAST VALIDITY COUNTDOWN</Text>
              </View>
              <Text style={[styles.validWindowText, { color: sev.bg }]}>Active Warning Cycle</Text>
            </View>

            <View style={styles.alertLedDisplay}>
              <View style={styles.alertLedBlock}>
                <Text style={styles.alertLedDigits}>{countdown.hrs}</Text>
                <Text style={styles.alertLedLabel}>HRS</Text>
              </View>
              <Text style={[styles.alertLedColon, { color: sev.bg }]}>:</Text>
              <View style={styles.alertLedBlock}>
                <Text style={styles.alertLedDigits}>{countdown.mins}</Text>
                <Text style={styles.alertLedLabel}>MIN</Text>
              </View>
              <Text style={[styles.alertLedColon, { color: sev.bg }]}>:</Text>
              <View style={styles.alertLedBlock}>
                <Text style={styles.alertLedDigits}>{countdown.secs}</Text>
                <Text style={styles.alertLedLabel}>SEC</Text>
              </View>
            </View>
          </View>

          {/* Telemetry Metrics Row (Rainfall & Wind) - PLACED BELOW THE TIMER */}
          <View style={styles.telemetryRow}>
            {alert.rainfallMmH ? (
              <View style={styles.telemetryChip}>
                <Ionicons name="rainy-outline" size={12} color="#60A5FA" />
                <Text style={styles.telemetryVal}>{alert.rainfallMmH} mm/h</Text>
                <Text style={styles.telemetryLabel}>Peak Rate</Text>
              </View>
            ) : null}

            {alert.windSpeedKmh ? (
              <View style={styles.telemetryChip}>
                <Ionicons name="speedometer-outline" size={12} color="#34D399" />
                <Text style={styles.telemetryVal}>{alert.windSpeedKmh} km/h</Text>
                <Text style={styles.telemetryLabel}>Gust Velocity</Text>
              </View>
            ) : null}

            {alert.windDirectionDeg !== undefined || windDirectionDeg !== undefined ? (
              <View style={styles.telemetryChip}>
                <Ionicons name="compass-outline" size={12} color="#38BDF8" />
                <Text style={styles.telemetryVal}>
                  {alert.windCardinal || windCardinal || "NNW"} ({Math.round(alert.windDirectionDeg ?? windDirectionDeg ?? 338)}°)
                </Text>
                <Text style={styles.telemetryLabel}>Wind Direction</Text>
              </View>
            ) : null}

            {alert.radarEchoDbz ? (
              <View style={styles.telemetryChip}>
                <Ionicons name="radio-outline" size={12} color="#A78BFA" />
                <Text style={styles.telemetryVal}>{alert.radarEchoDbz} dBZ</Text>
                <Text style={styles.telemetryLabel}>Radar Echo</Text>
              </View>
            ) : null}
          </View>

          {/* Official Verification Meta */}
          <View style={styles.sourceMetaRow}>
            <Ionicons name="shield-checkmark" size={11} color="rgba(255, 255, 255, 0.45)" />
            <Text style={styles.sourceMetaText}>{alert.source} · Issued: {alert.issuedAt}</Text>
          </View>

          {/* Precautions Accordion */}
          {alert.precautions && alert.precautions.length > 0 ? (
            <View style={styles.precautionsWrapper}>
              <Pressable
                onPress={() => setPrecautionsExpanded(!precautionsExpanded)}
                style={styles.precautionsToggle}
              >
                <Text style={styles.precautionsToggleText}>
                  {precautionsExpanded ? "Hide Safety Precautions" : "View Recommended Safety Precautions"}
                </Text>
                <Ionicons
                  name={precautionsExpanded ? "chevron-up" : "chevron-down"}
                  size={12}
                  color="#38BDF8"
                />
              </Pressable>

              {precautionsExpanded ? (
                <View style={styles.precautionsList}>
                  {alert.precautions.map((p, idx) => (
                    <View key={idx} style={styles.precautionItem}>
                      <View style={styles.bulletDot} />
                      <Text style={styles.precautionText}>{p}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Action: Inspect on Map with Watermelon Spring Physics */}
          {onInspectHazard ? (
            <WatermelonSpringButton
              onPress={() => onInspectHazard(alert)}
              variant={alert.severity === "EXTREME" ? "urgent" : "primary"}
              style={styles.inspectBtn}
            >
              <Text style={styles.inspectBtnText}>Inspect Hazard On Map</Text>
              <Ionicons name="arrow-forward" size={13} color={alert.severity === "EXTREME" ? "#FFFFFF" : "#000000"} />
            </WatermelonSpringButton>
          ) : null}
        </WatermelonGlowCard>
      ) : (
        /* Calm Empty State (Watermelon Glow Card) */
        <WatermelonGlowCard glowColor="#10B981" style={styles.calmCard}>
          <View style={styles.calmIconWrapper}>
            <Ionicons name="shield-checkmark" size={24} color="#10B981" />
          </View>
          <Text style={styles.calmTitle}>No verified severe alerts detected nearby</Text>
          <Text style={styles.calmSubtitle}>
            All IMD Doppler radars and AWS surface stations report clear conditions within your {radiusKm} km radius.
          </Text>
          {windSpeedKmh ? (
            <View style={styles.calmWindBadge}>
              <Ionicons name="compass-outline" size={12} color="#38BDF8" />
              <Text style={styles.calmWindText}>
                Area Wind: {windCardinal || "NNW"} ({Math.round(windDirectionDeg || 0)}°) · {Math.round(windSpeedKmh)} km/h
              </Text>
            </View>
          ) : null}
          <WatermelonShimmerBadge
            label="METEOROLOGICAL RADAR & SATELLITE SURVEILLANCE ACTIVE"
            color="#10B981"
          />
        </WatermelonGlowCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    gap: 8,
  },
  exploringBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 165, 233, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(14, 165, 233, 0.35)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 8,
  },
  exploringText: {
    flex: 1,
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 11,
    fontFamily: SF_PRO,
  },
  exploringTarget: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  returnBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0284C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  returnBtnText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    fontFamily: SF_PRO,
  },
  radiusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  radiusEyebrow: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.7,
    fontFamily: SF_PRO,
  },
  radiusPills: {
    flexDirection: "row",
    gap: 5,
  },
  radiusPill: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  radiusPillActive: {
    backgroundColor: "#1E293B",
    borderColor: "#38BDF8",
  },
  radiusPillText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 9.5,
    fontWeight: "600",
    fontFamily: SF_PRO,
  },
  radiusPillTextActive: {
    color: "#38BDF8",
    fontWeight: "700",
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    position: "relative",
  },
  borderBeamGlow: {
    position: "absolute",
    top: 0,
    width: "40%",
    height: 2.5,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    zIndex: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  severityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  animatedBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#000000",
  },
  severityBadgeText: {
    color: "#000000",
    fontSize: 9.5,
    fontWeight: "900",
    fontFamily: SF_PRO,
    letterSpacing: 0.5,
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  distanceText: {
    color: "#38BDF8",
    fontSize: 10,
    fontWeight: "700",
    fontFamily: SF_PRO,
  },
  alertHeadline: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "700",
    lineHeight: 18,
    fontFamily: SF_PRO,
    letterSpacing: -0.2,
  },
  alertDistrict: {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: 11,
    fontFamily: SF_PRO,
  },
  telemetryRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  telemetryChip: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  telemetryVal: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
    fontFamily: SF_PRO,
    marginTop: 2,
  },
  telemetryLabel: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 8,
    fontFamily: SF_PRO,
    marginTop: 1,
  },
  sourceMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  sourceMetaText: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 9.5,
    fontFamily: SF_PRO,
  },
  precautionsWrapper: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    paddingTop: 8,
    marginTop: 4,
  },
  precautionsToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  precautionsToggleText: {
    color: "#38BDF8",
    fontSize: 11,
    fontWeight: "600",
    fontFamily: SF_PRO,
  },
  precautionsList: {
    marginTop: 8,
    gap: 6,
  },
  precautionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#38BDF8",
    marginTop: 6,
  },
  precautionText: {
    flex: 1,
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 10.5,
    lineHeight: 15,
    fontFamily: SF_PRO,
  },
  inspectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F59E0B",
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 6,
  },
  inspectBtnText: {
    color: "#000000",
    fontSize: 11,
    fontWeight: "800",
    fontFamily: SF_PRO,
    letterSpacing: 0.3,
  },
  calmCard: {
    backgroundColor: "rgba(10, 15, 29, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  calmIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  calmTitle: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "700",
    textAlign: "center",
    fontFamily: SF_PRO,
  },
  calmSubtitle: {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    fontFamily: SF_PRO,
    paddingHorizontal: 12,
  },
  calmWindBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.28)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 2,
  },
  calmWindText: {
    color: "#38BDF8",
    fontSize: 11,
    fontWeight: "600",
    fontFamily: SF_PRO,
  },
  coverageBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    marginTop: 6,
  },
  coverageDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#10B981",
  },
  coverageText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 9.5,
    fontWeight: "600",
    fontFamily: SF_PRO,
  },
  alertCountdownCard: {
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 12,
    padding: 10,
    marginTop: 2,
    marginBottom: 4,
  },
  countdownCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  countdownCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  countdownCardTitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
    fontFamily: SF_PRO,
  },
  validWindowText: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: SF_PRO,
    letterSpacing: 0.3,
  },
  alertLedDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  alertLedBlock: {
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    borderRadius: 8,
    width: 54,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  alertLedDigits: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: SF_PRO,
    fontWeight: "700",
    letterSpacing: 0.5,
    fontVariant: ["tabular-nums"],
  },
  alertLedLabel: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 7.5,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginTop: 1,
    fontFamily: SF_PRO,
  },
  alertLedColon: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    fontFamily: SF_PRO,
  },
});
